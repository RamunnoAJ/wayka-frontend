import {
  MUTACIONES_POR_LOTE,
  bajarCambios,
  subirMutaciones,
  type Mutacion,
} from '../../api/sincronizacion';
import { hayCopiaLocal } from '../../lib/base-local';

import {
  aplicarDelta,
  confirmarSincronizacion,
  descartar,
  hayPacientesSinNivel,
  leerMarca,
  listarPendientes,
  marcarRechazada,
  vaciarCopia,
} from './almacen';

/**
 * Motor de sincronización: sube lo que el tutor escribió sin conexión y baja lo
 * que cambió del otro lado.
 *
 * El orden no es indistinto: **primero sube y después baja**. Al revés, la
 * bajada traería el estado anterior a las escrituras propias y las pisaría en la
 * copia local hasta la sincronización siguiente. Subiendo primero, el delta que
 * llega después ya incluye lo que se acaba de aceptar, con su versión nueva.
 */
export interface ResumenDeSincronizacion {
  subidas: number;
  rechazadas: number;
  cambiosAplicados: number;
  rehizoLaCopia: boolean;
}

let enCurso: Promise<ResumenDeSincronizacion> | null = null;

/**
 * Una sola corrida a la vez. Dos en paralelo se pisarían la marca y podrían
 * mandar la misma mutación dos veces — el backend la deduplica por
 * `id_mutacion`, pero gastar el viaje para que lo haga es trabajo al pedo.
 */
export function sincronizar(): Promise<ResumenDeSincronizacion> {
  if (!hayCopiaLocal) return Promise.resolve(resumenVacio());
  if (enCurso) return enCurso;

  enCurso = correr().finally(() => {
    enCurso = null;
  });
  return enCurso;
}

function resumenVacio(): ResumenDeSincronizacion {
  return { subidas: 0, rechazadas: 0, cambiosAplicados: 0, rehizoLaCopia: false };
}

async function correr(): Promise<ResumenDeSincronizacion> {
  const resumen = resumenVacio();
  await subir(resumen);
  await bajar(resumen);
  // Recién acá: es una corrida que terminó bien, así que la copia quedó
  // confirmada contra el servidor y el reloj de la caducidad vuelve a cero. Si
  // la bajada falla, la excepción sale antes y la marca vieja queda en pie —
  // que es lo correcto, porque no se confirmó nada.
  await confirmarSincronizacion();
  return resumen;
}

async function subir(resumen: ResumenDeSincronizacion): Promise<void> {
  const pendientes = await listarPendientes();
  if (pendientes.length === 0) return;

  // La cola se manda en lotes sucesivos y en orden: es el orden en que el tutor
  // hizo las escrituras, y una reagenda antes que su retiro no significa lo
  // mismo al revés.
  for (let desde = 0; desde < pendientes.length; desde += MUTACIONES_POR_LOTE) {
    const lote = pendientes.slice(desde, desde + MUTACIONES_POR_LOTE);
    const { resultados } = await subirMutaciones(lote.map(comoMutacion));

    for (const resultado of resultados) {
      if (resultado.resultado === 'aceptada') {
        await descartar(resultado.id_mutacion);
        resumen.subidas += 1;
        continue;
      }
      await marcarRechazada(
        resultado.id_mutacion,
        resultado.motivo ?? { codigo: 'rechazada', mensaje: 'El cambio no se pudo aplicar.' },
      );
      resumen.rechazadas += 1;
    }
  }
}

function comoMutacion(mutacion: Mutacion): Mutacion {
  return {
    id_mutacion: mutacion.id_mutacion,
    tipo: mutacion.tipo,
    entidad_id: mutacion.entidad_id,
    version_base: mutacion.version_base,
    ocurrido_en_cliente: mutacion.ocurrido_en_cliente,
    paciente: mutacion.paciente,
    tutor: mutacion.tutor,
    cita: mutacion.cita,
  };
}

/**
 * Baja tramo por tramo hasta que no queden cambios. Si la marca guardada quedó
 * fuera de la retención de la bitácora, no hay forma de saber qué se perdió: se
 * descarta la copia y se rehace desde cero (doc 11, sección 4).
 */
async function bajar(resumen: ResumenDeSincronizacion): Promise<void> {
  let desde = await leerMarca();

  // Una copia anterior a que el delta trajera el nivel de acceso se rehace una
  // sola vez: esperar a la próxima bajada no sirve, porque una mascota que no
  // cambió no vuelve a viajar y el nivel le faltaría para siempre.
  if (await hayPacientesSinNivel()) {
    await vaciarCopia();
    resumen.rehizoLaCopia = true;
    desde = 0;
  }

  for (;;) {
    const delta = await bajarCambios(desde);

    if (delta.requiere_carga_inicial) {
      await vaciarCopia();
      resumen.rehizoLaCopia = true;
      desde = 0;
      continue;
    }

    await aplicarDelta(delta);
    resumen.cambiosAplicados += contarRegistros(delta);
    desde = delta.hasta;

    if (!delta.hay_mas) return;
  }
}

function contarRegistros(delta: Awaited<ReturnType<typeof bajarCambios>>): number {
  return (
    (delta.tutor ? 1 : 0) +
    (delta.pacientes?.length ?? 0) +
    (delta.eventos_clinicos?.length ?? 0) +
    (delta.medicaciones?.length ?? 0) +
    (delta.citas?.length ?? 0) +
    (delta.adjuntos?.length ?? 0) +
    (delta.bajas?.length ?? 0)
  );
}
