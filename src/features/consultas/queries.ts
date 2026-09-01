import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';

import {
  asentarConsulta,
  darDeBajaConsulta,
  listarConsultasDeLaClinica,
  type AsentarConsultaEntrada,
  type ConsultaAtendida,
  type ConsultaAtendidaConPaciente,
  type FiltrosDeConsultasDeLaClinica,
} from '../../api/consulta';

export const CLAVES = {
  atenciones: (filtros: FiltrosDeConsultasDeLaClinica) =>
    ['consultas', 'clinica', filtros] as const,
  deMascota: (pacienteId: string) => ['paciente', pacienteId, 'consultas'] as const,
};

export function useAtencionesDeLaClinica(
  filtros: FiltrosDeConsultasDeLaClinica,
): UseQueryResult<ConsultaAtendidaConPaciente[]> {
  return useQuery({
    queryKey: CLAVES.atenciones(filtros),
    queryFn: () => listarConsultasDeLaClinica(filtros),
  });
}

/**
 * Asentar toca tres cosas a la vez y ninguna se entera sola: la lista de
 * atenciones, la cita que queda cumplida y el calendario donde se la ve.
 */
function invalidarLoQueElAsientoMueve(
  cliente: ReturnType<typeof useQueryClient>,
  pacienteId: string,
): void {
  cliente.invalidateQueries({ queryKey: ['consultas'] });
  cliente.invalidateQueries({ queryKey: CLAVES.deMascota(pacienteId) });
  cliente.invalidateQueries({ queryKey: ['paciente', pacienteId, 'citas'] });
  cliente.invalidateQueries({ queryKey: ['citas'] });
}

export function useAsentarAtencion(pacienteId: string) {
  const cliente = useQueryClient();
  return useMutation<ConsultaAtendida, Error, AsentarConsultaEntrada>({
    mutationFn: (entrada) => asentarConsulta(pacienteId, entrada),
    onSuccess: () => invalidarLoQueElAsientoMueve(cliente, pacienteId),
  });
}

export function useDarDeBajaAtencion(pacienteId: string) {
  const cliente = useQueryClient();
  return useMutation<null, Error, string>({
    mutationFn: (consultaId) => darDeBajaConsulta(consultaId),
    onSuccess: () => invalidarLoQueElAsientoMueve(cliente, pacienteId),
  });
}
