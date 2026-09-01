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
  aceptarInvitacion,
  anularInvitacion,
  canjearInvitacion,
  invitarCoTutor,
  listarInvitaciones,
  listarInvitacionesRecibidas,
  rechazarInvitacion,
  verInvitacion,
  type Invitacion,
  type InvitacionRecibida,
  type InvitacionVistaPrevia,
  type InvitarCoTutorEntrada,
  type NivelInvitado,
} from '../../api/invitacion';
import { TIPO_USUARIO } from '../../constants/roles';
import { useSesion } from '../../hooks/useSesion';
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
  recibidas: ['invitaciones', 'recibidas'] as const,
};

/**
 * Las invitaciones que le llegaron al tutor. No pasa por la copia local: una
 * invitación no es de una mascota que ya alcance —justamente, todavía no la
 * alcanza—, así que no hay nada que replicar. Sin conexión no se ven, y aceptar
 * necesita red igual.
 *
 * Solo corre para el tutor: a un veterinario no lo invita nadie, y pedirlo
 * devolvería 403 en cada montaje de la barra de navegación.
 */
export function useInvitacionesRecibidas(): UseQueryResult<InvitacionRecibida[]> {
  const { sesion } = useSesion();
  return useQuery({
    queryKey: CLAVES.recibidas,
    queryFn: () => listarInvitacionesRecibidas(),
    enabled: sesion?.usuario.tipo_usuario === TIPO_USUARIO.TUTOR,
  });
}

/** Cuántas esperan una respuesta, para el contador de la barra. */
export function useCuantasInvitacionesEsperan(): number {
  return useInvitacionesRecibidas().data?.length ?? 0;
}

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
  return useMutacionQueIncorporaLaMascota((token: string) => canjearInvitacion(token));
}

/** Aceptar desde la bandeja, por identificador y no por el token del correo. */
export function useAceptarInvitacionRecibida() {
  return useMutacionQueIncorporaLaMascota((invitacionId: string) =>
    aceptarInvitacion(invitacionId),
  );
}

export function useRechazarInvitacion() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (invitacionId: string) => rechazarInvitacion(invitacionId),
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: CLAVES.recibidas });
    },
  });
}

function useMutacionQueIncorporaLaMascota(aceptar: (valor: string) => Promise<null>) {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: aceptar,
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
