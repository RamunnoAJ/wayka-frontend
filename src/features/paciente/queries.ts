import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import { Linking } from 'react-native';

import {
  listarAdjuntos,
  obtenerAdjunto,
  partirPorPertenencia,
  renombrarAdjunto,
  retirarAdjunto,
  subirAdjunto,
  type Adjunto,
  type SubirAdjuntoEntrada,
} from '../../api/adjunto';
import {
  actualizarCita,
  crearCita,
  darDeBajaCita,
  listarCitas,
  type ActualizarCitaEntrada,
  type Cita,
  type CrearCitaEntrada,
} from '../../api/cita';
import {
  camposDeAlergia,
  camposDeVacuna,
  actualizarEventoClinico,
  crearEventoClinico,
  darDeBajaEventoClinico,
  type ActualizarEventoEntrada,
  listarEventosClinicos,
  TIPO_DE_EVENTO,
  type CrearEventoEntrada,
  type EventoClinico,
} from '../../api/evento-clinico';
import {
  cerrarMedicacion,
  crearMedicacion,
  listarMedicaciones,
  partirPorVigencia,
  type CrearMedicacionEntrada,
  type Medicacion,
} from '../../api/medicacion';
import {
  actualizarPaciente,
  crearPaciente,
  darDeBajaPaciente,
  listarPacientes,
  obtenerPaciente,
  type CrearPacienteEntrada,
  type FiltrosDePacientes,
  type Paciente,
} from '../../api/paciente';
import { obtenerTutor, type Tutor } from '../../api/tutor';
import {
  indexarPorAutor,
  obtenerVeterinario,
  puedeEscribirClinico,
  type Veterinario,
} from '../../api/veterinario';
import { useSesion } from '../../hooks/useSesion';
import { hayCopiaLocal } from '../../lib/base-local';
import { CONSULTA_DEL_PLANTEL } from '../veterinario/queries';
import { hoyEnLaClinica } from './formato';

/**
 * Datos de la ficha de paciente.
 *
 * Son seis recursos distintos y cada uno falla por su cuenta a propósito: el
 * diseño pide que un error de red viva **dentro del bloque que falló** y que el
 * resto de la pantalla siga usable. Una sola query combinada haría que la caída
 * del historial se llevara puesta la identidad del paciente.
 */
export const CLAVES = {
  paciente: (id: string) => ['paciente', id] as const,
  cartera: (filtros: FiltrosDePacientes) => ['pacientes', filtros] as const,
  tutor: (id: string) => ['tutor', id] as const,
  eventos: (id: string) => ['paciente', id, 'eventos-clinicos'] as const,
  medicaciones: (id: string) => ['paciente', id, 'medicaciones'] as const,
  citas: (id: string) => ['paciente', id, 'citas'] as const,
  adjuntos: (id: string) => ['paciente', id, 'adjuntos'] as const,
  /**
   * La ficha del tutor lee los mismos adjuntos por otra clave: en el
   * dispositivo cuelgan del namespace de la copia local, que es lo que hace que
   * la pantalla abra sin conexión (`useAdjuntosDeMiMascota`).
   *
   * Vive acá, al lado de la del veterinario, porque las mutaciones de adjuntos
   * están todas en este módulo y tienen que alcanzar a las dos: con una sola, el
   * tutor sube una foto y no la ve hasta volver a entrar a la mascota.
   */
  adjuntosDelTutor: (id: string) =>
    (hayCopiaLocal
      ? ['sincronizacion', 'copia', 'adjuntos', id]
      : ['adjuntos', id]) as readonly unknown[],
  adjunto: (id: string) => ['adjunto', id] as const,
  plantel: () => ['veterinarios'] as const,
  veterinario: (id: string) => ['veterinario', id] as const,
};

/**
 * Cartera de la clínica. El endpoint tiene dos alcances y lo decide el rol del
 * token, nunca un parámetro: el veterinario ve su clínica, el tutor sus
 * mascotas.
 */
export function usePacientes(filtros: FiltrosDePacientes): UseQueryResult<Paciente[]> {
  return useQuery({
    queryKey: CLAVES.cartera(filtros),
    queryFn: () => listarPacientes(filtros),
  });
}

export function useCrearPaciente() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (entrada: CrearPacienteEntrada) => crearPaciente(entrada),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: ['pacientes'] });
    },
  });
}

export function usePaciente(pacienteId: string): UseQueryResult<Paciente> {
  return useQuery({
    queryKey: CLAVES.paciente(pacienteId),
    queryFn: () => obtenerPaciente(pacienteId),
  });
}

export function useTutor(tutorId: string | undefined): UseQueryResult<Tutor> {
  return useQuery({
    queryKey: CLAVES.tutor(tutorId ?? ''),
    queryFn: () => obtenerTutor(tutorId as string),
    enabled: Boolean(tutorId),
  });
}

export function useEventosClinicos(pacienteId: string): UseQueryResult<EventoClinico[]> {
  return useQuery({
    queryKey: CLAVES.eventos(pacienteId),
    queryFn: () => listarEventosClinicos(pacienteId, { limite: 200 }),
  });
}

export function useMedicaciones(pacienteId: string): UseQueryResult<Medicacion[]> {
  return useQuery({
    queryKey: CLAVES.medicaciones(pacienteId),
    queryFn: () => listarMedicaciones(pacienteId, { limite: 200 }),
  });
}

export function useCitas(pacienteId: string): UseQueryResult<Cita[]> {
  return useQuery({
    queryKey: CLAVES.citas(pacienteId),
    queryFn: () => listarCitas(pacienteId, { limite: 200 }),
  });
}

/**
 * Un solo pedido de adjuntos para toda la ficha: el listado trae los generales y
 * los de cada evento juntos, y se parten en el cliente. Pedirlos por evento
 * dispararía un request por fila del timeline.
 */
/**
 * Refresca los adjuntos de una mascota en las dos fichas que los muestran.
 *
 * Toda mutación sobre un adjunto pasa por acá y no por una `invalidateQueries`
 * suelta: el recurso se lee por dos claves (`adjuntos` y `adjuntosDelTutor`) y
 * la que se olvide deja esa pantalla mostrando la lista vieja.
 */
export function invalidarAdjuntos(cliente: QueryClient, pacienteId: string) {
  void cliente.invalidateQueries({ queryKey: CLAVES.adjuntos(pacienteId) });
  void cliente.invalidateQueries({ queryKey: CLAVES.adjuntosDelTutor(pacienteId) });
}

export function useAdjuntos(pacienteId: string): UseQueryResult<Adjunto[]> {
  return useQuery({
    queryKey: CLAVES.adjuntos(pacienteId),
    queryFn: () => listarAdjuntos(pacienteId, { limite: 200 }),
  });
}

/**
 * Plantel de la clínica indexado por id, para resolver el nombre del autor de
 * cada registro: los Eventos clínicos y las Medicaciones traen
 * `veterinario_id` y nada más.
 *
 * El índice se arma con `select` y **no dentro de `queryFn`**. La clave
 * `['veterinarios']` es la misma que usa `usePlantel` de `../veterinario`, y
 * tiene que serlo —es el mismo recurso, pedirlo dos veces sería pedirlo de
 * más—, pero la caché de TanStack Query guarda un valor por clave: si cada
 * consulta cacheara su propia forma, la primera en resolver le dejaría la suya
 * a la otra. `select` transforma por observador y deja en la caché la lista
 * que devuelve la API, que es la forma que las dos comparten.
 *
 * Se llama distinto que el de `../veterinario` a propósito: dos hooks con el
 * mismo nombre y distinta forma es exactamente cómo se vuelve a romper.
 */
export function usePlantelPorAutor(): UseQueryResult<Map<string, Veterinario>> {
  return useQuery({ ...CONSULTA_DEL_PLANTEL, select: indexarPorAutor });
}

/**
 * Ficha del veterinario autenticado, solo para saber si tiene matrícula: sin
 * ella la ficha queda en lectura para lo clínico (regla 2.1). El backend
 * rechaza igual — esto es para no ofrecer botones que van a fallar.
 */
export function useMiFichaDeVeterinario(): UseQueryResult<Veterinario> {
  const { sesion } = useSesion();
  const veterinarioId = sesion?.usuario.veterinario_id ?? undefined;
  return useQuery({
    queryKey: CLAVES.veterinario(veterinarioId ?? ''),
    queryFn: () => obtenerVeterinario(veterinarioId as string),
    enabled: Boolean(veterinarioId),
    staleTime: 5 * 60 * 1000,
  });
}

export interface DatosCriticos {
  /** Eventos vigentes de tipo alergia (Modelo de Datos, 4.5, última nota). */
  alergias: EventoClinico[];
  haySevera: boolean;
  activas: Medicacion[];
  historicas: Medicacion[];
  ultimaVacuna: EventoClinico | null;
  proximaDosis: string | null;
}

/**
 * La vista de urgencia del contrato: alergias vigentes + medicación activa +
 * vacunas. Se arma en el cliente porque el backend no expone un endpoint que la
 * devuelva junta.
 */
export function derivarDatosCriticos(
  eventos: EventoClinico[] | undefined,
  medicaciones: Medicacion[] | undefined,
): DatosCriticos {
  const lista = eventos ?? [];
  const alergias = lista.filter((e) => e.tipo === TIPO_DE_EVENTO.ALERGIA);
  const vacunas = lista.filter((e) => e.tipo === TIPO_DE_EVENTO.VACUNA);
  const { activas, historicas } = partirPorVigencia(medicaciones ?? []);

  // El listado ya viene de lo más reciente hacia atrás, pero no se asume: una
  // vacuna vieja mostrada como "última aplicada" es un error clínico.
  const ordenadas = [...vacunas].sort((a, b) => b.fecha.localeCompare(a.fecha));
  const ultimaVacuna = ordenadas[0] ?? null;

  const proximas = vacunas
    .map((v) => camposDeVacuna(v)?.fecha_proxima_dosis)
    .filter((f): f is string => Boolean(f))
    .sort();
  const hoy = hoyEnLaClinica();
  const proximaDosis = proximas.find((f) => f >= hoy) ?? null;

  return {
    alergias,
    haySevera: alergias.some((a) => camposDeAlergia(a)?.severidad === 'severa'),
    activas,
    historicas,
    ultimaVacuna,
    proximaDosis,
  };
}

/**
 * Un adjunto solo, para abrirlo.
 *
 * `archivo_url` es una URL prefirmada que vence en minutos y se recalcula en
 * cada lectura (regla 4.14.4), así que **no se cachea**: `staleTime: 0` y
 * `gcTime: 0` hacen que abrir el visor dos veces pida dos URLs en vez de
 * reusar una muerta. Es el único lugar de la ficha que necesita esa garantía;
 * el listado se conforma con la que trajo.
 */
export function useAdjunto(adjuntoId: string | undefined): UseQueryResult<Adjunto> {
  return useQuery({
    queryKey: CLAVES.adjunto(adjuntoId ?? ''),
    queryFn: () => obtenerAdjunto(adjuntoId as string),
    enabled: Boolean(adjuntoId),
    staleTime: 0,
    gcTime: 0,
  });
}

/** Adjuntos partidos como los consume la pantalla. */
export function derivarAdjuntos(adjuntos: Adjunto[] | undefined) {
  return partirPorPertenencia(adjuntos ?? []);
}

export function useCerrarMedicacion(pacienteId: string) {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (medicacionId: string) => cerrarMedicacion(medicacionId, hoyEnLaClinica()),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: CLAVES.medicaciones(pacienteId) });
    },
  });
}

export function useCrearMedicacion(pacienteId: string) {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (entrada: CrearMedicacionEntrada) => crearMedicacion(pacienteId, entrada),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: CLAVES.medicaciones(pacienteId) });
    },
  });
}

export function useCrearEvento(pacienteId: string) {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (entrada: CrearEventoEntrada) => crearEventoClinico(pacienteId, entrada),
    onSuccess: (_evento, entrada) => {
      cliente.invalidateQueries({ queryKey: CLAVES.eventos(pacienteId) });
      // Una alergia o una vacuna cambian la banda de datos críticos, que se
      // deriva de los mismos eventos: no hay una segunda query que invalidar.

      // El evento que referencia una cita la pasa a cumplida del lado del
      // backend (Reglas de Negocio, 4.4). El calendario no se entera solo: sin
      // esto, la cita sigue mostrándose pendiente hasta el próximo refetch.
      if (entrada.cita_id) {
        cliente.invalidateQueries({ queryKey: CLAVES.citas(pacienteId) });
        cliente.invalidateQueries({ queryKey: ['citas'] });
      }
    },
  });
}

/**
 * Corrige un evento ya firmado. **El tipo no viaja**: la API lo omite de la
 * entrada, y cambiarlo sería reescribir qué se hizo en vez de corregir cómo se
 * escribió.
 *
 * Cualquier veterinario de la clínica edita el evento de un colega; el autor no
 * cambia nunca (Reglas de Negocio, 3.2).
 */
export function useActualizarEvento(pacienteId: string) {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: ({ eventoId, entrada }: { eventoId: string; entrada: ActualizarEventoEntrada }) =>
      actualizarEventoClinico(eventoId, entrada),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: CLAVES.eventos(pacienteId) });
    },
  });
}

/**
 * Baja lógica de un evento. Nunca borra: deja de listarse y queda auditado, con
 * su autoría intacta.
 */
export function useDarDeBajaEvento(pacienteId: string) {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (eventoId: string) => darDeBajaEventoClinico(eventoId),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: CLAVES.eventos(pacienteId) });
      // La baja de un evento que cumplía una cita puede devolverla a pendiente
      // (Reglas de Negocio, 4.21): el calendario no se entera solo.
      cliente.invalidateQueries({ queryKey: CLAVES.citas(pacienteId) });
      cliente.invalidateQueries({ queryKey: ['citas'] });
    },
  });
}

/**
 * Retira una cita del calendario. Es una baja lógica: la cita no se borra, deja
 * de aparecer (regla 4.4, punto 6).
 */
export function useRetirarCita(pacienteId: string) {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (citaId: string) => darDeBajaCita(citaId),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: CLAVES.citas(pacienteId) });
      cliente.invalidateQueries({ queryKey: ['citas'] });
    },
  });
}

export function useCrearCita(pacienteId: string) {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (entrada: CrearCitaEntrada) => crearCita(pacienteId, entrada),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: CLAVES.citas(pacienteId) });
    },
  });
}

export function useReagendarCita(pacienteId: string) {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: ({ citaId, cambios }: { citaId: string; cambios: ActualizarCitaEntrada }) =>
      actualizarCita(citaId, cambios),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: CLAVES.citas(pacienteId) });
    },
  });
}

/**
 * Sube un archivo a la mascota. Se usa con `mutateAsync` y **una llamada por
 * archivo**: cada subida vive y falla sola, así que el estado de cada una lo
 * lleva la pantalla y no el `isPending` compartido de la mutación.
 */
export function useSubirAdjunto(pacienteId: string) {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (entrada: SubirAdjuntoEntrada) => subirAdjunto(pacienteId, entrada),
    onSuccess: () => {
      invalidarAdjuntos(cliente, pacienteId);
    },
  });
}

/**
 * Baja el archivo al dispositivo.
 *
 * Pide la URL de nuevo antes de abrirla: la que trajo el listado vence en
 * minutos (regla 4.14.4), y una ficha abierta hace rato ya la tiene vencida.
 *
 * **Abrirla es bajarla**: el backend firma la descarga con `Content-Disposition:
 * attachment`, así que el navegador —el de la web y el del teléfono— la guarda
 * en vez de mostrarla. Guardarla desde la app sin salir exigiría una dependencia
 * nativa nueva y otro build del cliente para llegar al mismo archivo en la misma
 * carpeta.
 */
export function useDescargarAdjunto() {
  return useMutation({
    mutationFn: async (adjuntoId: string) => {
      const fresco = await obtenerAdjunto(adjuntoId);
      await Linking.openURL(fresco.archivo_url);
      return fresco;
    },
  });
}

/**
 * Renombra un adjunto. Refresca el listado y también la copia local: el nombre
 * viaja en el metadato que el dispositivo replica, y es lo que la ficha muestra
 * sin conexión.
 */
export function useRenombrarAdjunto(pacienteId: string) {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: ({ adjuntoId, nombre }: { adjuntoId: string; nombre: string }) =>
      renombrarAdjunto(adjuntoId, nombre),
    onSuccess: () => {
      invalidarAdjuntos(cliente, pacienteId);
      void cliente.invalidateQueries({ queryKey: ['sincronizacion'] });
    },
  });
}

export function useRetirarAdjunto(pacienteId: string) {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (adjuntoId: string) => retirarAdjunto(adjuntoId),
    onSuccess: () => {
      invalidarAdjuntos(cliente, pacienteId);
    },
  });
}

/**
 * El peso es el único campo que el tutor puede editar (Reglas de Negocio, 3.2):
 * es lo que puede medir en su casa. El veterinario usa la misma mutación.
 */
export function useActualizarPeso(pacienteId: string) {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (pesoActual: number) => actualizarPaciente(pacienteId, { peso_actual: pesoActual }),
    onSuccess: (paciente) => {
      cliente.setQueryData(CLAVES.paciente(pacienteId), paciente);
    },
  });
}

export function useDarDeBajaPaciente(pacienteId: string) {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: () => darDeBajaPaciente(pacienteId),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: CLAVES.paciente(pacienteId) });
    },
  });
}

export { puedeEscribirClinico };
