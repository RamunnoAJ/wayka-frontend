import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { listarCitasDelAlcance, type CitaConPaciente } from '../../api/cita';
import { listarPacientes, type Paciente } from '../../api/paciente';
import { obtenerTutor, type Tutor } from '../../api/tutor';
import { useSesion } from '../../hooks/useSesion';
import { hayCopiaLocal } from '../../lib/base-local';
import { leerAgendaLocal, leerMiFicha, leerMisMascotas } from '../sincronizacion/almacen';

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
  return useQuery({
    queryKey: hayCopiaLocal ? ['sincronizacion', 'copia', 'pacientes'] : ['pacientes', 'mios'],
    queryFn: () => (hayCopiaLocal ? leerMisMascotas() : listarPacientes({ limite: 100 })),
  });
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
