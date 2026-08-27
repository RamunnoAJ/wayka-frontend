import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';

import {
  actualizarClinica,
  obtenerClinica,
  type ActualizarClinicaEntrada,
  type Clinica,
} from '../../api/clinica';
import { useSesion } from '../../hooks/useSesion';

export const CLAVES = {
  clinica: (id: string) => ['clinica', id] as const,
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
