import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import * as Network from 'expo-network';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import type { Cita } from '../../api/cita';
import { crearEventoClinico, darDeBajaEventoClinico } from '../../api/evento-clinico';
import { crearMedicacion, darDeBajaMedicacion } from '../../api/medicacion';
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
import type { AntecedenteACargar } from '../tutor-movil/FormularioDeAntecedente';

import {
  encolarAntecedenteClinico,
  encolarCambioDeCita,
  encolarFichaDeTutor,
  encolarMedicacionDeclarada,
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

/**
 * Lo que quedó cargado, sin importar por qué camino. `enCola` es lo que decide
 * cómo se lo retira: una mutación encolada se descarta de la cola y una escritura
 * en línea se da de baja por la API. El `id` significa distinto en cada caso —el
 * de la mutación o el del registro— y no hace falta que signifique lo mismo:
 * nadie más lo usa.
 */
export interface AntecedenteCargado {
  id: string;
  enCola: boolean;
}

/**
 * Carga un antecedente (Reglas de Negocio, 4.23). Mismo criterio que el peso:
 * con red la corrida termina en un segundo y el antecedente pasa de pendiente a
 * sincronizado sin que el tutor haga nada; sin red queda en la cola y la ficha lo
 * muestra igual, marcado como no confirmado.
 *
 * `soloEnLinea` es para el paso del onboarding, que **exige conexión**: la
 * mascota se acaba de crear en línea y encolar ahí no tiene sentido — el alta de
 * mascota no pasa por la cola, así que sin red no hay `paciente_id` del que
 * colgar nada (Sincronización sin Conexión, 5). En web no hay copia local y todo
 * va directo, como siempre.
 */
export function useCargarAntecedenteDelTutor(
  pacienteId: string,
  { soloEnLinea = false }: { soloEnLinea?: boolean } = {},
) {
  const invalidar = useInvalidarCopia();
  const { mutate: sincronizarAhora } = useSincronizar();
  const porLaCola = hayCopiaLocal && !soloEnLinea;

  return useMutation<AntecedenteCargado, Error, AntecedenteACargar>({
    mutationFn: async (antecedente) => {
      if (!porLaCola) {
        const creado =
          antecedente.clase === 'medicacion'
            ? await crearMedicacion(pacienteId, antecedente.entrada)
            : await crearEventoClinico(pacienteId, antecedente.entrada);
        // Escribió en línea, pero en el dispositivo la ficha lee la copia local:
        // sin bajar el delta, el antecedente recién cargado no aparece en el
        // historial hasta la próxima corrida. No se espera —la pantalla ya
        // muestra lo cargado con lo que devolvió el servidor—.
        if (hayCopiaLocal) sincronizarAhora();
        return { id: creado.id, enCola: false };
      }
      const idMutacion =
        antecedente.clase === 'medicacion'
          ? await encolarMedicacionDeclarada(pacienteId, antecedente.entrada)
          : await encolarAntecedenteClinico(pacienteId, antecedente.entrada);
      sincronizarAhora();
      return { id: idMutacion, enCola: true };
    },
    onSettled: invalidar,
  });
}

/**
 * Retira un antecedente recién cargado, por el camino por el que entró. Es
 * también la única forma de corregir uno: la Medicación solo admite editar su
 * cierre (Reglas de Negocio, 4.3), así que ofrecer editar en un tipo y no en el
 * otro sería una diferencia sin causa a los ojos del tutor.
 */
export function useRetirarAntecedenteDelTutor() {
  const invalidar = useInvalidarCopia();

  return useMutation<void, Error, AntecedenteCargado & { clase: 'evento' | 'medicacion' }>({
    mutationFn: async ({ id, enCola, clase }) => {
      if (enCola) {
        // Nunca llegó al servidor: descartar la mutación es todo lo que hay que
        // hacer, y con ella se va el registro provisional de la copia local.
        await descartar(id);
        return;
      }
      if (clase === 'medicacion') await darDeBajaMedicacion(id);
      else await darDeBajaEventoClinico(id);
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
