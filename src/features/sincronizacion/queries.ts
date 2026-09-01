import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import * as Network from 'expo-network';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import type { Cita } from '../../api/cita';
import { actualizarPaciente, type Paciente } from '../../api/paciente';
import { actualizarTutor, type ActualizarTutorEntrada, type Tutor } from '../../api/tutor';
import { actualizarCita, darDeBajaCita } from '../../api/cita';
import { EVENTO_DE_USO } from '../../api/telemetria';
import { hayCopiaLocal } from '../../lib/base-local';
import { emitir } from '../../lib/telemetria';

import {
  contarPendientes,
  contarRechazadas,
  descartar,
  estadosPorRegistro,
  hayAjenasPurgadas,
  leerMisMascotas,
  leerRegistro,
  leerTodasLasCitas,
  listarRechazadas,
  type MutacionEnCola,
} from './almacen';
import {
  encolarCambioDeCita,
  encolarFichaDeTutor,
  encolarPeso,
  encolarRetiroDeCita,
  type CambioDeCitaDelTutor,
} from './mutaciones';
import { sincronizar, type ResumenDeSincronizacion } from './motor';

/**
 * Claves de cache de la sincronización. La copia local es server state igual que
 * una respuesta HTTP —solo que el "servidor" es el dispositivo—, así que pasa
 * por TanStack Query como todo lo demás y no por un store aparte.
 */
export const CLAVES = {
  copia: ['sincronizacion', 'copia'] as const,
  estado: ['sincronizacion', 'estado'] as const,
  rechazos: ['sincronizacion', 'rechazos'] as const,
};

export interface EstadoDeSincronizacion {
  pendientes: number;
  rechazadas: number;
}

export function useEstadoDeSincronizacion(): UseQueryResult<EstadoDeSincronizacion> {
  return useQuery({
    queryKey: CLAVES.estado,
    enabled: hayCopiaLocal,
    queryFn: async () => ({
      pendientes: await contarPendientes(),
      rechazadas: await contarRechazadas(),
    }),
  });
}

export function useRechazos(): UseQueryResult<MutacionEnCola[]> {
  return useQuery({
    queryKey: CLAVES.rechazos,
    enabled: hayCopiaLocal,
    queryFn: listarRechazadas,
  });
}

export function useEstadosPorRegistro() {
  return useQuery({
    queryKey: [...CLAVES.estado, 'por-registro'],
    enabled: hayCopiaLocal,
    queryFn: estadosPorRegistro,
  });
}

/** Mascotas del tutor leídas de la copia local, que es lo que funciona sin red. */
export function useMisMascotasLocales(): UseQueryResult<Paciente[]> {
  return useQuery({
    queryKey: [...CLAVES.copia, 'pacientes'],
    enabled: hayCopiaLocal,
    queryFn: leerMisMascotas,
  });
}

export function useMisCitasLocales(): UseQueryResult<Cita[]> {
  return useQuery({
    queryKey: [...CLAVES.copia, 'citas'],
    enabled: hayCopiaLocal,
    queryFn: leerTodasLasCitas,
  });
}

function useInvalidarCopia() {
  const cliente = useQueryClient();
  return () => {
    void cliente.invalidateQueries({ queryKey: CLAVES.copia });
    void cliente.invalidateQueries({ queryKey: CLAVES.estado });
    void cliente.invalidateQueries({ queryKey: CLAVES.rechazos });
  };
}

/**
 * Dispara una corrida. Un fallo de red no es un error de la app: la cola queda
 * como está y la corrida siguiente la vuelve a intentar sobre el mismo backlog,
 * que no se pierde.
 */
export function useSincronizar() {
  const invalidar = useInvalidarCopia();
  return useMutation<ResumenDeSincronizacion>({
    mutationFn: sincronizar,
    onSettled: invalidar,
  });
}

/**
 * Sincroniza al arrancar y cada vez que vuelve la conexión. No hay reintento con
 * espera creciente: la señal de que conviene reintentar es que haya red otra
 * vez, y eso el sistema lo avisa.
 */
/**
 * Sincroniza en los tres momentos en que puede haber red y algo que traer: al
 * arrancar, cuando vuelve la conexión, y cuando la app vuelve del fondo.
 *
 * El tercero es el que más ocurre en la práctica: el teléfono pasa la mayor
 * parte del tiempo con la app suspendida, y volver a abrirla es cuando el tutor
 * quiere ver lo que la clínica escribió. Sin eso, la copia solo se pone al día
 * si el proceso se reinició o si la red cambió de estado justo ahí.
 *
 * No hay reintento periódico ni backoff: una corrida que falla por falta de red
 * la vuelve a disparar el listener de conexión, y una que falla por otra cosa
 * volvería a fallar igual. Un temporizador solo agregaría viajes.
 */
export function useSincronizacionAutomatica(habilitada: boolean): void {
  const { mutate } = useSincronizar();

  useEffect(() => {
    if (!hayCopiaLocal || !habilitada) return;

    void anotarSiLaSesionSaleDeLaCopia();
    mutate();
    const red = Network.addNetworkStateListener((estado) => {
      if (estado.isInternetReachable) mutate();
    });
    const app = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') mutate();
    });
    return () => {
      red.remove();
      app.remove();
    };
  }, [habilitada, mutate]);
}

/**
 * Deja registrado que esta sesión se está sirviendo de la copia local: la app
 * abrió sin llegar al servidor, y lo que el tutor está viendo salió del
 * dispositivo. Es lo que dice si el modo sin conexión resuelve algo real o si
 * solo agrega complejidad (Telemetría de Producto, 5.4).
 *
 * Se anota una vez por arranque y no en cada lectura: lo que se cuenta son
 * sesiones, no consultas a la base local.
 */
let yaSeAnotoLaSesionOffline = false;

async function anotarSiLaSesionSaleDeLaCopia(): Promise<void> {
  if (yaSeAnotoLaSesionOffline) return;

  try {
    const red = await Network.getNetworkStateAsync();
    if (red.isInternetReachable) return;

    yaSeAnotoLaSesionOffline = true;
    // La copia caducada es el caso que más interesa: el tutor está mirando datos
    // que ya no se pueden refrescar (Sincronización Offline, 8).
    emitir(EVENTO_DE_USO.SESION_SERVIDA_OFFLINE, { copia_caducada: await hayAjenasPurgadas() });
  } catch {
    // Sin poder consultar el estado de la red no se inventa una respuesta.
  }
}

export function useEncolarPeso() {
  const invalidar = useInvalidarCopia();
  return useMutation({
    mutationFn: ({ paciente, peso }: { paciente: Paciente; peso: number }) =>
      encolarPeso(paciente, peso),
    onSettled: invalidar,
  });
}

export function useEncolarFichaDeTutor() {
  const invalidar = useInvalidarCopia();
  return useMutation({
    mutationFn: ({ tutor, cambios }: { tutor: Tutor; cambios: ActualizarTutorEntrada }) =>
      encolarFichaDeTutor(tutor, cambios),
    onSettled: invalidar,
  });
}

export function useEncolarCambioDeCita() {
  const invalidar = useInvalidarCopia();
  return useMutation({
    mutationFn: ({ cita, cambios }: { cita: Cita; cambios: CambioDeCitaDelTutor }) =>
      encolarCambioDeCita(cita, cambios),
    onSettled: invalidar,
  });
}

export function useEncolarRetiroDeCita() {
  const invalidar = useInvalidarCopia();
  return useMutation({
    mutationFn: (cita: Cita) => encolarRetiroDeCita(cita),
    onSettled: invalidar,
  });
}

/**
 * Saca un rechazo de la cola. Una cola que acumula rechazos indefinidamente
 * reenvía basura en cada sincronización (doc 11, sección 7).
 */
export function useDescartarRechazo() {
  const invalidar = useInvalidarCopia();
  return useMutation({
    mutationFn: (idMutacion: string) => descartar(idMutacion),
    onSettled: invalidar,
  });
}

/** Lee de la copia local el registro sobre el que se rechazó una mutación. */
export function useRegistroLocal<T>(entidad: 'paciente' | 'cita' | 'tutor', id?: string) {
  return useQuery({
    queryKey: [...CLAVES.copia, entidad, id],
    enabled: hayCopiaLocal && Boolean(id),
    queryFn: () => leerRegistro<T>(entidad, id as string),
  });
}

/**
 * Escrituras del tutor con copia local.
 *
 * **No preguntan si hay conexión.** La respuesta ya está vieja para cuando se
 * actúa sobre ella —el estado de la red cambia entre que se lee y que sale el
 * request—, así que en el dispositivo toda escritura entra a la cola y después
 * se dispara una corrida. Con red, la corrida termina en un segundo y el cambio
 * pasa de pendiente a sincronizado sin que el tutor haga nada; sin red, queda en
 * la cola. Es el mismo camino en los dos casos, que es lo que lo hace confiable.
 *
 * En web no hay copia local ni cola: la escritura va directo, como siempre.
 */
export function useGuardarPesoDelTutor(paciente: Paciente | undefined) {
  const invalidar = useInvalidarCopia();
  const { mutate: sincronizarAhora } = useSincronizar();

  return useMutation({
    mutationFn: async (pesoActual: number) => {
      if (!hayCopiaLocal || !paciente) {
        await actualizarPaciente(paciente?.id ?? '', { peso_actual: pesoActual });
        return;
      }
      await encolarPeso(paciente, pesoActual);
      sincronizarAhora();
    },
    onSettled: invalidar,
  });
}

export function useGuardarFichaDelTutor(tutor: Tutor | undefined) {
  const invalidar = useInvalidarCopia();
  const { mutate: sincronizarAhora } = useSincronizar();

  return useMutation({
    mutationFn: async (cambios: ActualizarTutorEntrada) => {
      if (!hayCopiaLocal || !tutor) {
        await actualizarTutor(tutor?.id ?? '', cambios);
        return;
      }
      await encolarFichaDeTutor(tutor, cambios);
      sincronizarAhora();
    },
    onSettled: invalidar,
  });
}

export function useReagendarDelTutor() {
  const invalidar = useInvalidarCopia();
  const { mutate: sincronizarAhora } = useSincronizar();

  return useMutation({
    mutationFn: async ({ cita, cambios }: { cita: Cita; cambios: CambioDeCitaDelTutor }) => {
      if (!hayCopiaLocal) {
        await actualizarCita(cita.id, cambios);
        return;
      }
      await encolarCambioDeCita(cita, cambios);
      sincronizarAhora();
    },
    onSettled: invalidar,
  });
}

export function useRetirarCitaDelTutor() {
  const invalidar = useInvalidarCopia();
  const { mutate: sincronizarAhora } = useSincronizar();

  return useMutation({
    mutationFn: async (cita: Cita) => {
      if (!hayCopiaLocal) {
        await darDeBajaCita(cita.id);
        return;
      }
      await encolarRetiroDeCita(cita);
      sincronizarAhora();
    },
    onSettled: invalidar,
  });
}
