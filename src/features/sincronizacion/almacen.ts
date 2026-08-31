import type { Adjunto } from '../../api/adjunto';
import type { Cita, CitaConPaciente } from '../../api/cita';
import type { EventoClinico } from '../../api/evento-clinico';
import type { Medicacion } from '../../api/medicacion';
import type { Paciente } from '../../api/paciente';
import type {
  AdjuntoDeSincronizacion,
  CambiosDeSincronizacion,
  MotivoDeRechazo,
  Mutacion,
} from '../../api/sincronizacion';
import type { Tutor } from '../../api/tutor';
import { abrirBaseLocal } from '../../lib/base-local';
import { ZONA_POR_DEFECTO } from '../../lib/zona';

/**
 * Lectura y escritura de la copia local. Es la única capa que conoce el SQL del
 * dispositivo: el motor de sincronización y las pantallas hablan con esto.
 *
 * Los registros se guardan como JSON en una sola tabla, con la entidad y el id
 * como clave. La alternativa era una tabla por entidad con una columna por
 * campo, y no la paga: el cliente nunca consulta por campo —lista por mascota y
 * lee por id—, y cada campo nuevo del contrato sería una migración de la base
 * del dispositivo. El testigo de versión (`updated_at`) sí sale a su columna,
 * porque de ese sí depende la concurrencia optimista.
 */
export type EntidadLocal =
  'tutor' | 'paciente' | 'evento_clinico' | 'medicacion' | 'cita' | 'adjunto';

const CLAVE_DE_MARCA = 'sincronizacion.hasta';

export interface MutacionEnCola extends Mutacion {
  estado: 'pendiente' | 'rechazada';
  motivo?: MotivoDeRechazo;
}

interface FilaDeRegistro {
  datos: string;
}

async function base() {
  const abierta = await abrirBaseLocal();
  if (!abierta) throw new Error('la copia local no existe en esta plataforma');
  return abierta;
}

export async function leerMarca(): Promise<number> {
  const db = await base();
  const fila = await db.getFirstAsync<{ valor: string }>(
    'SELECT valor FROM marca WHERE clave = ?',
    CLAVE_DE_MARCA,
  );
  return fila ? Number(fila.valor) : 0;
}

/**
 * Aplica un tramo entero en una sola transacción y recién ahí avanza la marca.
 * Avanzarla por adelantado deja huecos permanentes si la app se interrumpe en el
 * medio (doc 11, sección 4).
 */
export async function aplicarDelta(delta: CambiosDeSincronizacion): Promise<void> {
  const db = await base();

  await db.withTransactionAsync(async () => {
    if (delta.tutor) await guardar(db, 'tutor', delta.tutor.id, null, delta.tutor);
    for (const paciente of delta.pacientes ?? []) {
      await guardar(db, 'paciente', paciente.id, null, paciente);
    }
    for (const evento of delta.eventos_clinicos ?? []) {
      await guardar(db, 'evento_clinico', evento.id, evento.paciente_id, evento);
    }
    for (const medicacion of delta.medicaciones ?? []) {
      await guardar(db, 'medicacion', medicacion.id, medicacion.paciente_id, medicacion);
    }
    for (const cita of delta.citas ?? []) {
      await guardar(db, 'cita', cita.id, cita.paciente_id, cita);
    }
    for (const adjunto of delta.adjuntos ?? []) {
      await guardar(db, 'adjunto', adjunto.id, adjunto.paciente_id, adjunto);
    }
    for (const lapida of delta.bajas ?? []) {
      await db.runAsync(
        'DELETE FROM registro WHERE entidad = ? AND id = ?',
        lapida.entidad,
        lapida.id,
      );
    }

    await db.runAsync(
      'INSERT INTO marca (clave, valor) VALUES (?, ?) ON CONFLICT (clave) DO UPDATE SET valor = excluded.valor',
      CLAVE_DE_MARCA,
      String(delta.hasta),
    );
  });
}

async function guardar(
  db: Awaited<ReturnType<typeof base>>,
  entidad: EntidadLocal,
  id: string,
  pacienteId: string | null,
  registro: { updated_at: string },
): Promise<void> {
  await db.runAsync(
    `INSERT INTO registro (entidad, id, paciente_id, actualizado_en, datos)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (entidad, id) DO UPDATE SET
       paciente_id = excluded.paciente_id,
       actualizado_en = excluded.actualizado_en,
       datos = excluded.datos`,
    entidad,
    id,
    pacienteId,
    registro.updated_at,
    JSON.stringify(registro),
  );
}

/**
 * Vacía la copia sin tocar la cola: es lo que hace una carga inicial cuando la
 * marca quedó fuera de la retención. Las mutaciones pendientes son escrituras
 * del tutor que todavía nadie vio, y perderlas por rehacer la copia sería
 * perder trabajo suyo.
 */
export async function vaciarCopia(): Promise<void> {
  const db = await base();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM registro');
    await db.runAsync('DELETE FROM marca');
  });
}

async function leerTodos<T>(entidad: EntidadLocal, pacienteId?: string): Promise<T[]> {
  const db = await base();
  const filas = pacienteId
    ? await db.getAllAsync<FilaDeRegistro>(
        'SELECT datos FROM registro WHERE entidad = ? AND paciente_id = ?',
        entidad,
        pacienteId,
      )
    : await db.getAllAsync<FilaDeRegistro>('SELECT datos FROM registro WHERE entidad = ?', entidad);
  return filas.map((fila) => JSON.parse(fila.datos) as T);
}

export async function leerRegistro<T>(entidad: EntidadLocal, id: string): Promise<T | null> {
  const db = await base();
  const fila = await db.getFirstAsync<FilaDeRegistro>(
    'SELECT datos FROM registro WHERE entidad = ? AND id = ?',
    entidad,
    id,
  );
  return fila ? (JSON.parse(fila.datos) as T) : null;
}

export function leerMisMascotas(): Promise<Paciente[]> {
  return leerTodos<Paciente>('paciente');
}

export function leerMiFicha(): Promise<Tutor[]> {
  return leerTodos<Tutor>('tutor');
}

export function leerEventosDe(pacienteId: string): Promise<EventoClinico[]> {
  return leerTodos<EventoClinico>('evento_clinico', pacienteId);
}

export function leerMedicacionesDe(pacienteId: string): Promise<Medicacion[]> {
  return leerTodos<Medicacion>('medicacion', pacienteId);
}

export function leerCitasDe(pacienteId: string): Promise<Cita[]> {
  return leerTodos<Cita>('cita', pacienteId);
}

export function leerTodasLasCitas(): Promise<Cita[]> {
  return leerTodos<Cita>('cita');
}

export function leerAdjuntosDe(pacienteId: string): Promise<AdjuntoDeSincronizacion[]> {
  return leerTodos<Omit<Adjunto, 'archivo_url'>>('adjunto', pacienteId);
}

/**
 * Encola una escritura y la aplica de una vez sobre la copia local, para que la
 * pantalla muestre lo que el tutor acaba de escribir. Ocultarlo hasta que
 * sincronice haría que la app pareciera haber perdido su cambio (doc 11, 7).
 */
export async function encolar(
  mutacion: Mutacion,
  entidad: EntidadLocal,
  aplicarEnLaCopia?: (registro: Record<string, unknown>) => Record<string, unknown>,
): Promise<void> {
  const db = await base();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO mutacion (id, orden, tipo, entidad, entidad_id, version_base,
                             ocurrido_en_cliente, cuerpo, estado)
       VALUES (?, (SELECT COALESCE(MAX(orden), 0) + 1 FROM mutacion), ?, ?, ?, ?, ?, ?, 'pendiente')`,
      mutacion.id_mutacion,
      mutacion.tipo,
      entidad,
      mutacion.entidad_id,
      mutacion.version_base,
      mutacion.ocurrido_en_cliente ?? new Date().toISOString(),
      JSON.stringify(cuerpoDe(mutacion)),
    );

    if (!aplicarEnLaCopia) return;

    const fila = await db.getFirstAsync<FilaDeRegistro>(
      'SELECT datos FROM registro WHERE entidad = ? AND id = ?',
      entidad,
      mutacion.entidad_id,
    );
    if (!fila) return;

    const actualizado = aplicarEnLaCopia(JSON.parse(fila.datos) as Record<string, unknown>);
    await db.runAsync(
      'UPDATE registro SET datos = ? WHERE entidad = ? AND id = ?',
      JSON.stringify(actualizado),
      entidad,
      mutacion.entidad_id,
    );
  });
}

function cuerpoDe(mutacion: Mutacion): Record<string, unknown> {
  return { paciente: mutacion.paciente, tutor: mutacion.tutor, cita: mutacion.cita };
}

interface FilaDeMutacion {
  id: string;
  tipo: string;
  entidad: string;
  entidad_id: string;
  version_base: string;
  ocurrido_en_cliente: string;
  cuerpo: string;
  estado: string;
  motivo_codigo: string | null;
  motivo_mensaje: string | null;
  alternativas: string | null;
}

function desdeFila(fila: FilaDeMutacion): MutacionEnCola {
  const cuerpo = JSON.parse(fila.cuerpo) as Partial<Mutacion>;
  return {
    id_mutacion: fila.id,
    tipo: fila.tipo as Mutacion['tipo'],
    entidad_id: fila.entidad_id,
    version_base: fila.version_base,
    ocurrido_en_cliente: fila.ocurrido_en_cliente,
    paciente: cuerpo.paciente,
    tutor: cuerpo.tutor,
    cita: cuerpo.cita,
    estado: fila.estado === 'rechazada' ? 'rechazada' : 'pendiente',
    motivo: fila.motivo_codigo
      ? {
          codigo: fila.motivo_codigo,
          mensaje: fila.motivo_mensaje ?? '',
          alternativas: fila.alternativas ? (JSON.parse(fila.alternativas) as string[]) : undefined,
        }
      : undefined,
  };
}

export async function listarPendientes(): Promise<MutacionEnCola[]> {
  const db = await base();
  const filas = await db.getAllAsync<FilaDeMutacion>(
    "SELECT * FROM mutacion WHERE estado = 'pendiente' ORDER BY orden",
  );
  return filas.map(desdeFila);
}

export async function listarRechazadas(): Promise<MutacionEnCola[]> {
  const db = await base();
  const filas = await db.getAllAsync<FilaDeMutacion>(
    "SELECT * FROM mutacion WHERE estado = 'rechazada' ORDER BY orden",
  );
  return filas.map(desdeFila);
}

export async function contarPendientes(): Promise<number> {
  const db = await base();
  const fila = await db.getFirstAsync<{ total: number }>(
    "SELECT count(*) AS total FROM mutacion WHERE estado = 'pendiente'",
  );
  return fila?.total ?? 0;
}

export async function contarRechazadas(): Promise<number> {
  const db = await base();
  const fila = await db.getFirstAsync<{ total: number }>(
    "SELECT count(*) AS total FROM mutacion WHERE estado = 'rechazada'",
  );
  return fila?.total ?? 0;
}

/** Una mutación aceptada sale de la cola: ya está del otro lado. */
export async function descartar(idMutacion: string): Promise<void> {
  const db = await base();
  await db.runAsync('DELETE FROM mutacion WHERE id = ?', idMutacion);
}

/**
 * Marca la mutación como rechazada con su motivo. **No se reintenta sola**: el
 * rechazo significa que las condiciones cambiaron, y mandarla de nuevo pide la
 * misma respuesta otra vez (doc 11, sección 7).
 */
export async function marcarRechazada(idMutacion: string, motivo: MotivoDeRechazo): Promise<void> {
  const db = await base();
  await db.runAsync(
    `UPDATE mutacion SET estado = 'rechazada', motivo_codigo = ?, motivo_mensaje = ?, alternativas = ?
     WHERE id = ?`,
    motivo.codigo,
    motivo.mensaje,
    motivo.alternativas ? JSON.stringify(motivo.alternativas) : null,
    idMutacion,
  );
}

/**
 * Estado de sincronización por registro, derivado de la cola. Es lo que permite
 * marcar una fila como no confirmada sin ensuciar el registro con campos que el
 * contrato no tiene: el estado vive en la cola, que es donde ocurre.
 */
export async function estadosPorRegistro(): Promise<
  Map<string, { estado: 'pendiente' | 'rechazada'; tipo: Mutacion['tipo'] }>
> {
  const db = await base();
  const filas = await db.getAllAsync<{ entidad_id: string; estado: string; tipo: string }>(
    'SELECT entidad_id, estado, tipo FROM mutacion ORDER BY orden',
  );

  const estados = new Map<string, { estado: 'pendiente' | 'rechazada'; tipo: Mutacion['tipo'] }>();
  for (const fila of filas) {
    // Un rechazo pesa más que un pendiente sobre el mismo registro: es lo que el
    // tutor tiene que resolver, y esconderlo detrás de otra escritura en cola
    // lo dejaria sin enterarse.
    const previo = estados.get(fila.entidad_id);
    if (previo?.estado === 'rechazada') continue;
    estados.set(fila.entidad_id, {
      estado: fila.estado === 'rechazada' ? 'rechazada' : 'pendiente',
      tipo: fila.tipo as Mutacion['tipo'],
    });
  }
  return estados;
}

/**
 * La agenda del tutor armada desde la copia local: las citas unidas a la mascota
 * a la que pertenecen.
 *
 * La zona horaria cae al valor por defecto y **eso es una limitación conocida**:
 * `CitaConPaciente` la trae por fila porque el tutor puede tener mascotas en
 * clínicas de husos distintos, pero el delta de sincronización no replica la
 * Clínica, así que sin conexión no hay de dónde sacarla. Con una clínica piloto
 * el valor por defecto es el correcto; si el delta llegara a incluir la clínica,
 * esto sale.
 */
export async function leerAgendaLocal(): Promise<CitaConPaciente[]> {
  const [citas, mascotas] = await Promise.all([leerTodasLasCitas(), leerMisMascotas()]);
  const porId = new Map(mascotas.map((mascota) => [mascota.id, mascota]));

  return citas
    .map((cita) => ({
      cita,
      paciente_nombre: porId.get(cita.paciente_id)?.nombre ?? '',
      paciente_especie: porId.get(cita.paciente_id)?.especie,
      zona_horaria: ZONA_POR_DEFECTO,
    }))
    .sort((una, otra) => una.cita.fecha_programada.localeCompare(otra.cita.fecha_programada));
}
