import * as Crypto from 'expo-crypto';

import type { Cita } from '../../api/cita';
import type { Paciente } from '../../api/paciente';
import type { Mutacion } from '../../api/sincronizacion';
import type { ActualizarTutorEntrada, Tutor } from '../../api/tutor';

import { encolar } from './almacen';

/**
 * Las cuatro escrituras que el tutor puede hacer sin conexión (regla 3.2). No
 * hay una por endpoint de la API: lo que no está acá no se escribe offline.
 *
 * Cada una viaja como **intención** y no como el registro completo. Mandar el
 * objeto entero pisaría con valores viejos los campos que el tutor no tocó
 * (doc 11, sección 5).
 *
 * `version_base` es el `updated_at` que la copia local tenía. Si el del servidor
 * es otro, alguien lo modificó mientras tanto y el backend rechaza la mutación
 * por desactualizada, en vez de perder una de las dos escrituras en silencio.
 */
function nueva(tipo: Mutacion['tipo'], entidadId: string, versionBase: string): Mutacion {
  return {
    id_mutacion: Crypto.randomUUID(),
    tipo,
    entidad_id: entidadId,
    version_base: versionBase,
    ocurrido_en_cliente: new Date().toISOString(),
  };
}

export function encolarPeso(paciente: Paciente, pesoActual: number): Promise<void> {
  const mutacion: Mutacion = {
    ...nueva('actualizar_peso_de_paciente', paciente.id, paciente.updated_at),
    paciente: { peso_actual: pesoActual },
  };
  return encolar(mutacion, 'paciente', (registro) => ({ ...registro, peso_actual: pesoActual }));
}

/**
 * Aplica el cambio sobre la copia local igual que lo va a aplicar el servidor.
 *
 * La parte que no es un merge plano es la dirección: un cambio que trae el texto
 * **sin** los tres campos del punto lo limpia (regla 2.6). Fundirlo con `...`
 * dejaría el place_id y las coordenadas viejas al lado del texto nuevo, y la
 * pantalla mostraría el mapa de la casa anterior hasta la próxima sincronización
 * —momento en el que el pin desaparecería solo, sin que nada lo explique.
 */
export function copiaLocalDeTutor<T extends object>(
  registro: T,
  cambios: ActualizarTutorEntrada,
): T {
  const fundido = { ...registro, ...cambios };
  if (cambios.direccion === undefined || cambios.direccion_place_id !== undefined) {
    return fundido;
  }
  return { ...fundido, direccion_place_id: null, direccion_lat: null, direccion_lng: null };
}

export function encolarFichaDeTutor(tutor: Tutor, cambios: ActualizarTutorEntrada): Promise<void> {
  const mutacion: Mutacion = {
    ...nueva('actualizar_ficha_de_tutor', tutor.id, tutor.updated_at),
    tutor: cambios,
  };
  return encolar(mutacion, 'tutor', (registro) => copiaLocalDeTutor(registro, cambios));
}

export interface CambioDeCitaDelTutor {
  fecha_programada?: string;
  notificar_tutor?: boolean;
}

export function encolarCambioDeCita(cita: Cita, cambios: CambioDeCitaDelTutor): Promise<void> {
  const mutacion: Mutacion = {
    ...nueva('actualizar_cita', cita.id, cita.updated_at),
    cita: cambios,
  };
  return encolar(mutacion, 'cita', (registro) => ({ ...registro, ...cambios }));
}

/**
 * Retirar del calendario es una baja lógica y no lleva `version_base` que
 * importe: una cita que cambió mientras tanto sigue significando lo mismo, que
 * el tutor no va a llevar a su mascota. Lo que sí la rechaza es que ya no esté
 * pendiente, y eso lo decide el backend.
 */
export function encolarRetiroDeCita(cita: Cita): Promise<void> {
  // No toca el registro local: la cita sigue en la lista, marcada como "retiro
  // pendiente" a partir de la cola. Borrarla de la copia la haría desaparecer de
  // la pantalla antes de que el backend acepte el retiro, y si lo rechazara
  // —porque ya no está pendiente— no habría de dónde traerla de vuelta hasta el
  // delta siguiente.
  return encolar(nueva('retirar_cita', cita.id, cita.updated_at), 'cita');
}
