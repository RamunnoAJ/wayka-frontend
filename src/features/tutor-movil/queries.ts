import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';

import { listarAdjuntos, subirAdjunto, TIPO_DE_ADJUNTO, type Adjunto } from '../../api/adjunto';
import { listarCitasDelAlcance, type CitaConPaciente } from '../../api/cita';
import { listarEventosClinicos, type EventoClinico } from '../../api/evento-clinico';
import { listarMedicaciones, type Medicacion } from '../../api/medicacion';
import {
  crearPaciente,
  listarPacientes,
  type CrearPacienteEntrada,
  type Paciente,
} from '../../api/paciente';
import { obtenerTutor, type Tutor } from '../../api/tutor';
import { useSesion } from '../../hooks/useSesion';
import type { ArchivoElegido } from '../../lib/archivos';
import { hayCopiaLocal } from '../../lib/base-local';
import { CLAVES, invalidarAdjuntos } from '../paciente/queries';
import { sincronizar } from '../sincronizacion/motor';
import {
  hayAjenasPurgadas,
  leerAdjuntosDe,
  leerAgendaLocal,
  leerEventosDe,
  leerMedicacionesDe,
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
 * Las fotos de las mascotas del tutor, y nada más que las fotos.
 *
 * En el dispositivo el listado sale de la copia local, y la copia **no guarda la
 * URL de la foto**: es prefirmada y de vida corta, así que para cuando hiciera
 * falta ya habría vencido (Sincronización sin Conexión, 2). Entonces se pide en
 * línea, aparte, y el listado la usa si llegó — la misma degradación que los
 * adjuntos de la ficha: sin red la tarjeta muestra el ícono de la especie.
 *
 * No reintenta ni corta nada: es un adorno de una pantalla que tiene que abrir
 * sin conexión. En web no corre, porque ahí el listado ya sale del endpoint y la
 * trae en cada mascota.
 */
export function useFotosDeMisMascotas(): Record<string, string> {
  const { data } = useQuery({
    queryKey: ['pacientes', 'mios', 'fotos'],
    enabled: hayCopiaLocal,
    retry: false,
    queryFn: () => listarPacientes({ limite: 100 }),
    select: (mascotas) =>
      Object.fromEntries(
        mascotas
          .filter((mascota) => mascota.foto_perfil_url)
          .map((mascota) => [mascota.id, mascota.foto_perfil_url as string]),
      ),
  });
  return data ?? {};
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
    mutationFn: async (entrada: CrearPacienteEntrada) => {
      const creada = await crearPaciente(entrada);
      // El alta es en línea, pero en el dispositivo **las pantallas leen la
      // copia local**: sin bajar el delta, la mascota recién creada no existe
      // para la ficha ni para el listado, y abrirla daba "no se pudo abrir la
      // ficha" sobre algo que sí se había guardado. Se espera la corrida porque
      // lo que sigue es justamente abrirla.
      if (hayCopiaLocal) await sincronizar().catch(() => undefined);
      return creada;
    },
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: ['pacientes'] });
      void cliente.invalidateQueries({ queryKey: ['sincronizacion'] });
    },
  });
}

/**
 * La foto que el tutor eligió en el alta, subida con la mascota ya creada y
 * marcada como su foto de perfil (Reglas de Negocio, 4.17).
 *
 * **No es parte del alta y no puede serlo**: cuelga de un `paciente_id` que
 * hasta que el alta no termina no existe. Que falle deja a la mascota dada de
 * alta sin foto, que es un estado válido — quien llama decide qué dice la
 * pantalla, y no revierte nada.
 */
export function useSubirFotoDePerfil() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: ({ pacienteId, archivo }: { pacienteId: string; archivo: ArchivoElegido }) =>
      subirAdjunto(pacienteId, {
        archivo,
        tipo: TIPO_DE_ADJUNTO.FOTO,
        es_foto_perfil: true,
      }),
    onSuccess: (_adjunto, { pacienteId }) => {
      invalidarAdjuntos(cliente, pacienteId);
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

/**
 * El historial y la medicación de una mascota, de la copia local en el
 * dispositivo. Misma regla que el listado: la fuente es la copia, que el motor
 * mantiene al día, y por eso la ficha abre sin conexión.
 */
export function useHistorialDeMiMascota(pacienteId: string): UseQueryResult<EventoClinico[]> {
  return useQuery({
    queryKey: hayCopiaLocal
      ? ['sincronizacion', 'copia', 'eventos', pacienteId]
      : ['eventos', pacienteId],
    queryFn: () =>
      hayCopiaLocal
        ? leerEventosDe(pacienteId)
        : listarEventosClinicos(pacienteId, { limite: 200 }),
  });
}

export function useMedicacionesDeMiMascota(pacienteId: string): UseQueryResult<Medicacion[]> {
  return useQuery({
    queryKey: hayCopiaLocal
      ? ['sincronizacion', 'copia', 'medicaciones', pacienteId]
      : ['medicaciones', pacienteId],
    queryFn: () =>
      hayCopiaLocal
        ? leerMedicacionesDe(pacienteId)
        : listarMedicaciones(pacienteId, { limite: 200 }),
  });
}

/**
 * Los adjuntos son la excepción a "la fuente es la copia local", y por un motivo
 * concreto: para **mirar** un archivo hace falta la URL prefirmada, que vence en
 * minutos y por eso no se replica (Sincronización sin Conexión, 2). Lo que sí
 * está en el dispositivo son los metadatos.
 *
 * Entonces se pide en línea primero —así los archivos se abren— y se cae a los
 * metadatos locales cuando no hay red: la ficha muestra qué archivos tiene la
 * mascota aunque no pueda abrirlos, que es bastante mejor que un bloque de error
 * donde debería haber una lista.
 */
export interface AdjuntosDeLaFicha {
  adjuntos: Adjunto[];
  /** Sin la URL prefirmada no hay nada que abrir: la interfaz lo tiene que decir. */
  soloMetadatos: boolean;
}

export function useAdjuntosDeMiMascota(pacienteId: string): UseQueryResult<AdjuntosDeLaFicha> {
  return useQuery({
    // La clave la define `CLAVES` y no este módulo: las mutaciones de adjuntos
    // viven en `paciente/queries` y tienen que poder invalidarla.
    queryKey: CLAVES.adjuntosDelTutor(pacienteId),
    queryFn: async () => {
      try {
        return { adjuntos: await listarAdjuntos(pacienteId), soloMetadatos: false };
      } catch (error) {
        if (!hayCopiaLocal) throw error;
        const locales = await leerAdjuntosDe(pacienteId);
        return {
          adjuntos: locales.map((adjunto) => ({ ...adjunto, archivo_url: '' })),
          soloMetadatos: true,
        };
      }
    },
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
