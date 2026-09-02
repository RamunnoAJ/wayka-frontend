import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';

import {
  actualizarClinica,
  escribirGrilla,
  obtenerClinica,
  obtenerGrilla,
  previsualizarGrilla,
  type ActualizarClinicaEntrada,
  type Clinica,
  type EscribirGrillaEntrada,
  type Grilla,
  type PrevisualizacionDeGrilla,
} from '../../api/clinica';
import { useSesion } from '../../hooks/useSesion';

export const CLAVES = {
  clinica: (id: string) => ['clinica', id] as const,
  grilla: (id: string) => ['clinica', id, 'grilla'] as const,
};

export function useClinica(clinicaId: string | undefined): UseQueryResult<Clinica> {
  return useQuery({
    queryKey: CLAVES.clinica(clinicaId ?? ''),
    queryFn: () => obtenerClinica(clinicaId as string),
    enabled: Boolean(clinicaId),
    // El horario cambia rara vez y lo consulta cada pantalla que agenda: no vale
    // un viaje por navegación.
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * La clínica del clínica_admin sale de su propia cuenta (`clinica_id` es su FK
 * de rol). El veterinario no la tiene en la sesión: la suya la resuelve por el
 * paciente, que además es la clínica correcta — la grilla la manda quien atiende
 * a la mascota (Reglas de Negocio, 2.2).
 */
export function useMiClinica(): UseQueryResult<Clinica> {
  const { sesion } = useSesion();
  return useClinica(sesion?.usuario.clinica_id ?? undefined);
}

export function useActualizarClinica(clinicaId: string) {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (entrada: ActualizarClinicaEntrada) => actualizarClinica(clinicaId, entrada),
    onSuccess: (clinica) => {
      cliente.setQueryData(CLAVES.clinica(clinicaId), clinica);
    },
  });
}

/**
 * El horario de atención va por su propia consulta y no adentro de la clínica:
 * lo lee el veterinario en cada pantalla que agenda, y el clinica_admin cuando
 * lo edita, que son dos momentos distintos.
 */
export function useGrilla(clinicaId: string | undefined): UseQueryResult<Grilla> {
  return useQuery({
    queryKey: CLAVES.grilla(clinicaId ?? ''),
    queryFn: () => obtenerGrilla(clinicaId as string),
    enabled: Boolean(clinicaId),
    // Cambia rara vez y lo consulta cada pantalla que agenda: no vale un viaje
    // por navegación.
    staleTime: 5 * 60 * 1000,
  });
}

export function useEscribirGrilla(clinicaId: string) {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (entrada: EscribirGrillaEntrada) => escribirGrilla(clinicaId, entrada),
    onSuccess: (grilla) => {
      cliente.setQueryData(CLAVES.grilla(clinicaId), grilla);
      // La agenda del veterinario se arma con esta grilla: si cambió, lo que ya
      // esté en pantalla quedó viejo.
      void cliente.invalidateQueries({ queryKey: ['citas'] });
    },
  });
}

/**
 * La previsualización no escribe nada, así que es una mutación por su forma —se
 * dispara a mano y manda un cuerpo— y no una consulta que se cachea.
 */
export function usePrevisualizarGrilla(clinicaId: string) {
  return useMutation<PrevisualizacionDeGrilla, Error, EscribirGrillaEntrada>({
    mutationFn: (entrada) => previsualizarGrilla(clinicaId, entrada),
  });
}
