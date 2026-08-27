import { useQueries, useQuery, type UseQueryResult } from '@tanstack/react-query';

import { listarCitas, type Cita } from '../../api/cita';
import { listarPacientes, type Paciente } from '../../api/paciente';
import { useSesion } from '../../hooks/useSesion';

/**
 * Datos del tutor en la app.
 *
 * El listado de pacientes es el mismo endpoint que usa el veterinario: cuál de
 * los dos alcances aplica lo decide el rol del token, nunca un parámetro
 * (Reglas de Negocio, 3.2). Acá devuelve sus mascotas, estén atendidas donde
 * estén.
 */
export function useMisMascotas(): UseQueryResult<Paciente[]> {
  return useQuery({
    queryKey: ['pacientes', 'mios'],
    queryFn: () => listarPacientes({ limite: 100 }),
  });
}

export interface CitaDeMiMascota {
  cita: Cita;
  mascota: Paciente;
}

/**
 * Citas de todas mis mascotas, en un pedido por mascota.
 *
 * No hay endpoint que las liste juntas: el calendario cuelga del Paciente. Acá
 * es aceptable porque un tutor tiene dos o tres mascotas, no una cartera — la
 * misma cuenta no cierra para la agenda de una clínica, que por eso sigue sin
 * pantalla.
 */
export function useMisCitas(mascotas: Paciente[] | undefined) {
  const lista = mascotas ?? [];

  const consultas = useQueries({
    queries: lista.map((mascota) => ({
      queryKey: ['paciente', mascota.id, 'citas'] as const,
      queryFn: () => listarCitas(mascota.id, { limite: 100 }),
    })),
  });

  const cargando = consultas.some((consulta) => consulta.isPending);
  const error = consultas.some((consulta) => consulta.isError);

  const citas: CitaDeMiMascota[] = [];
  consultas.forEach((consulta, i) => {
    const mascota = lista[i];
    if (!mascota) return;
    for (const cita of consulta.data ?? []) citas.push({ cita, mascota });
  });
  citas.sort((a, b) => a.cita.fecha_programada.localeCompare(b.cita.fecha_programada));

  return {
    citas,
    cargando,
    error,
    reintentar: () => consultas.forEach((consulta) => consulta.refetch()),
  };
}

export function useMiTutorID(): string | undefined {
  const { sesion } = useSesion();
  return sesion?.usuario.tutor_id ?? undefined;
}
