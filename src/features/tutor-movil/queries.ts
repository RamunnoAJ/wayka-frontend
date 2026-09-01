import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';

import { listarCitasDelAlcance, type CitaConPaciente } from '../../api/cita';
import {
  crearPaciente,
  listarPacientes,
  type CrearPacienteEntrada,
  type Paciente,
} from '../../api/paciente';
import { obtenerTutor, type Tutor } from '../../api/tutor';
import { useSesion } from '../../hooks/useSesion';
import { hayCopiaLocal } from '../../lib/base-local';
import {
  hayAjenasPurgadas,
  leerAgendaLocal,
  leerMiFicha,
  leerMisMascotas,
  purgarAjenasVencidas,
} from '../sincronizacion/almacen';

/**
 * Datos del tutor en la app.
 *
 * El listado de pacientes es el mismo endpoint que usa el veterinario: cuál de
 * los dos alcances aplica lo decide el rol del token, nunca un parámetro
 * (Reglas de Negocio, 3.2). Acá devuelve sus mascotas, estén atendidas donde
 * estén.
 */
/**
 * En el dispositivo la fuente es la **copia local**, no la red: es lo que hace
 * que la pantalla abra igual sin conexión. La copia la mantiene al día el motor
 * de sincronización, así que esto no es un caché de la respuesta HTTP — es el
 * estado que el dispositivo tiene, que puede estar unos minutos atrás y lo dice
 * con el indicador de sincronización.
 *
 * En web no hay copia local y el listado sale del endpoint, como siempre.
 */
export function useMisMascotas(): UseQueryResult<Paciente[]> {
  const tutorId = useMiTutorID();
  return useQuery({
    queryKey: hayCopiaLocal ? ['sincronizacion', 'copia', 'pacientes'] : ['pacientes', 'mios'],
    // La caducidad corre acá y no solo al sincronizar: si dependiera de la red
    // no cubriría el caso que existe para cubrir, que es el teléfono que no se
    // conecta. Este es el camino por el que pasa toda apertura del listado.
    queryFn: async () => {
      if (!hayCopiaLocal) return listarPacientes({ limite: 100 });
      if (tutorId) await purgarAjenasVencidas(tutorId);
      return leerMisMascotas();
    },
  });
}

/**
 * Si la caducidad se llevó alguna mascota compartida. El listado lo dice: una
 * mascota que desaparece sin explicación se lee como un error de la aplicación,
 * y no lo es.
 */
export function useAjenasPurgadas(): boolean {
  const { data } = useQuery({
    queryKey: ['sincronizacion', 'copia', 'purgadas'],
    queryFn: () => hayAjenasPurgadas(),
    enabled: hayCopiaLocal,
  });
  return data ?? false;
}

/**
 * El alta del tutor no pasa por la cola de cambios sin conexión, a diferencia de
 * sus otras escrituras: encolarla obligaría a inventar identificadores locales y
 * a reconciliarlos después, que es un mecanismo entero para una pantalla que se
 * usa dos veces en la vida.
 *
 * La mascota nueva baja en la próxima sincronización, así que además de los
 * listados se invalida la copia local.
 */
export function useAgregarMiMascota() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (entrada: CrearPacienteEntrada) => crearPaciente(entrada),
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: ['pacientes'] });
      void cliente.invalidateQueries({ queryKey: ['sincronizacion'] });
    },
  });
}

/**
 * Una mascota del tutor. Sale del listado que ya está en memoria —o en la copia
 * local— en vez de pedir la ficha de nuevo: es el mismo dato, y así la pantalla
 * abre sin conexión igual que el listado del que se llegó.
 */
export function useMiMascota(pacienteId: string): UseQueryResult<Paciente | undefined> {
  const mascotas = useMisMascotas();
  return {
    ...mascotas,
    data: mascotas.data?.find((mascota) => mascota.id === pacienteId),
  } as UseQueryResult<Paciente | undefined>;
}

export function useMiTutorID(): string | undefined {
  const { sesion } = useSesion();
  return sesion?.usuario.tutor_id ?? undefined;
}

/**
 * Las citas del tutor, con la misma regla que sus mascotas: en el dispositivo
 * salen de la copia local y en web del endpoint de alcance.
 */
export function useMiAgenda(): UseQueryResult<CitaConPaciente[]> {
  return useQuery({
    queryKey: hayCopiaLocal ? ['sincronizacion', 'copia', 'agenda'] : ['citas', 'alcance', 'mias'],
    queryFn: () => (hayCopiaLocal ? leerAgendaLocal() : listarCitasDelAlcance({ limite: 200 })),
  });
}

/** La ficha propia del tutor, de la copia local en el dispositivo. */
export function useMiFicha(tutorId: string | undefined): UseQueryResult<Tutor | undefined> {
  return useQuery({
    queryKey: hayCopiaLocal ? ['sincronizacion', 'copia', 'tutor'] : ['tutores', tutorId],
    enabled: hayCopiaLocal || Boolean(tutorId),
    queryFn: async () =>
      hayCopiaLocal ? ((await leerMiFicha())[0] ?? undefined) : obtenerTutor(tutorId as string),
  });
}
