import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';

import {
  cambiarNivelDeAcceso,
  compartirConClinica,
  listarAccesos,
  renunciarAlAcceso,
  revocarClinica,
  revocarCoTutor,
  type AccesosDelPaciente,
} from '../../api/acceso-a-paciente';
import { buscarClinicas, type ClinicaPublica } from '../../api/clinica';
import {
  anularInvitacion,
  canjearInvitacion,
  invitarCoTutor,
  listarInvitaciones,
  verInvitacion,
  type Invitacion,
  type InvitacionVistaPrevia,
  type InvitarCoTutorEntrada,
  type NivelInvitado,
} from '../../api/invitacion';
import { sincronizar } from '../sincronizacion/motor';

/**
 * Con quién se comparte una mascota, y las invitaciones.
 *
 * **Ninguna de estas mutaciones pasa por la cola de cambios sin conexión**, y es
 * deliberado: compartir y revocar son escrituras de seguridad, y encolarlas es
 * revocar en diferido — la peor versión del problema que describe Sincronización
 * sin Conexión, 8. Sin red la pantalla lo dice y no ofrece la acción.
 */
export const CLAVES = {
  accesos: (pacienteId: string) => ['accesos', pacienteId] as const,
  invitaciones: (pacienteId: string) => ['invitaciones', pacienteId] as const,
  directorio: (busqueda: string) => ['clinicas', 'directorio', busqueda] as const,
};

export function useAccesosDeMascota(pacienteId: string): UseQueryResult<AccesosDelPaciente> {
  return useQuery({
    queryKey: CLAVES.accesos(pacienteId),
    queryFn: () => listarAccesos(pacienteId),
  });
}

/**
 * El directorio se pide solo cuando hay algo escrito: una lista de todas las
 * clínicas del país no ayuda a elegir, y el buscador es lo que la acota.
 */
export function useBuscarClinicas(busqueda: string): UseQueryResult<ClinicaPublica[]> {
  return useQuery({
    queryKey: CLAVES.directorio(busqueda),
    queryFn: () => buscarClinicas({ busqueda, limite: 20 }),
    enabled: busqueda.trim().length >= 2,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCompartirConClinica(pacienteId: string) {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (clinicaId: string) => compartirConClinica(pacienteId, clinicaId),
    onSuccess: () => invalidarAccesos(cliente, pacienteId),
  });
}

export function useRevocarClinica(pacienteId: string) {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (clinicaId: string) => revocarClinica(pacienteId, clinicaId),
    onSuccess: () => invalidarAccesos(cliente, pacienteId),
  });
}

export function useCambiarNivelDeAcceso(pacienteId: string) {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: ({ tutorId, nivel }: { tutorId: string; nivel: NivelInvitado }) =>
      cambiarNivelDeAcceso(pacienteId, tutorId, nivel),
    onSuccess: () => invalidarAccesos(cliente, pacienteId),
  });
}

export function useRevocarCoTutor(pacienteId: string) {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (tutorId: string) => revocarCoTutor(pacienteId, tutorId),
    onSuccess: () => invalidarAccesos(cliente, pacienteId),
  });
}

/**
 * Renunciar saca la mascota del alcance de quien lo hace, así que además de los
 * accesos hay que invalidar su listado: si no, la sigue viendo hasta el próximo
 * refresco.
 */
export function useRenunciarAlAcceso(pacienteId: string) {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: () => renunciarAlAcceso(pacienteId),
    onSuccess: () => invalidarAccesos(cliente, pacienteId),
  });
}

export function useInvitacionesDeMascota(pacienteId: string): UseQueryResult<Invitacion[]> {
  return useQuery({
    queryKey: CLAVES.invitaciones(pacienteId),
    queryFn: () => listarInvitaciones(pacienteId),
  });
}

export function useInvitarCoTutor(pacienteId: string) {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (entrada: InvitarCoTutorEntrada) => invitarCoTutor(pacienteId, entrada),
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: CLAVES.invitaciones(pacienteId) });
    },
  });
}

export function useAnularInvitacion(pacienteId: string) {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (invitacionId: string) => anularInvitacion(pacienteId, invitacionId),
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: CLAVES.invitaciones(pacienteId) });
    },
  });
}

/**
 * La vista previa no necesita sesión: quien recibe el enlace puede no tener
 * cuenta todavía.
 */
export function useVistaPreviaDeInvitacion(token: string): UseQueryResult<InvitacionVistaPrevia> {
  return useQuery({
    queryKey: ['invitaciones', 'vista-previa', token],
    queryFn: () => verInvitacion(token),
    enabled: token.length > 0,
    retry: false,
  });
}

/**
 * Aceptar incorpora una mascota entera al alcance, y en el dispositivo eso se
 * resuelve rehaciendo la copia local: el backend manda la señal en la próxima
 * bajada. Disparar la sincronización acá evita que el tutor tenga que esperar al
 * ciclo automático para ver la mascota que acaba de aceptar.
 */
export function useAceptarInvitacion() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => canjearInvitacion(token),
    onSuccess: async () => {
      await sincronizar().catch(() => undefined);
      await cliente.invalidateQueries();
    },
  });
}

function invalidarAccesos(cliente: ReturnType<typeof useQueryClient>, pacienteId: string) {
  void cliente.invalidateQueries({ queryKey: CLAVES.accesos(pacienteId) });
  void cliente.invalidateQueries({ queryKey: ['pacientes'] });
  void cliente.invalidateQueries({ queryKey: ['sincronizacion'] });
}
