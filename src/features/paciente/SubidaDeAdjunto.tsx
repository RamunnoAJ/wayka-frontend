import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { TipoDeAdjunto } from '../../api/adjunto';
import {
  FileDropzone,
  InlineError,
  Select,
  UploadItem,
  type OpcionDeSelect,
} from '../../components';
import {
  elegirArchivo,
  motivoDeRechazo,
  tamanoLegible,
  TAMANO_MAXIMO_MB,
  type ArchivoElegido,
} from '../../lib/archivos';
import { mensajeDeError } from '../../lib/errores';

import { useSubirAdjunto } from './queries';

/**
 * Carga de un archivo a la mascota (Alcance de Plataformas, 3.4 y 5.6).
 *
 * **El tipo se declara antes de elegir el archivo**, y por eso el selector va
 * arriba de la zona y no abajo: el backend contrasta el tipo declarado contra
 * el MIME real del contenido y rechaza si no coinciden, así que no hay una zona
 * genérica que adivine.
 *
 * Cada archivo sube por su cuenta: uno que falla no arrastra a los demás ni
 * bloquea la elección del siguiente.
 */
const TIPOS: OpcionDeSelect<TipoDeAdjunto>[] = [
  { value: 'foto', label: 'Foto' },
  { value: 'pdf', label: 'PDF' },
  { value: 'estudio', label: 'Estudio' },
];

interface EnCurso {
  id: string;
  archivo: ArchivoElegido;
  tipo: TipoDeAdjunto;
  estado: 'subiendo' | 'fallo';
  error?: string;
  /** Corta la subida de verdad: sin esto, "cancelar" solo escondería la fila. */
  corte: AbortController;
}

interface SubidaDeAdjuntoProps {
  pacienteId: string;
  /** Evento que el archivo documenta. Sin él, queda como adjunto general. */
  eventoId?: string;
  /** La ficha no admite escrituras (paciente dado de baja, matrícula vencida). */
  bloqueado?: boolean;
  motivoBloqueo?: string;
}

export function SubidaDeAdjunto({
  pacienteId,
  eventoId,
  bloqueado = false,
  motivoBloqueo,
}: SubidaDeAdjuntoProps) {
  const subir = useSubirAdjunto(pacienteId);

  const [tipo, setTipo] = useState<TipoDeAdjunto>('foto');
  const [rechazo, setRechazo] = useState<string | null>(null);
  const [errorAlAbrir, setErrorAlAbrir] = useState<string | null>(null);
  const [enCurso, setEnCurso] = useState<EnCurso[]>([]);

  // Un contador y no un id aleatorio: solo tiene que distinguir las filas de
  // esta pantalla, y el id real lo asigna el backend cuando el archivo llega.
  const proximoId = useRef(0);

  function reemplazar(id: string, cambio: Partial<EnCurso>) {
    setEnCurso((filas) => filas.map((f) => (f.id === id ? { ...f, ...cambio } : f)));
  }

  function cancelar(fila: EnCurso) {
    fila.corte.abort();
    setEnCurso((filas) => filas.filter((f) => f.id !== fila.id));
  }

  function quitar(id: string) {
    setEnCurso((filas) => filas.filter((f) => f.id !== id));
  }

  async function despachar(fila: EnCurso) {
    try {
      await subir.mutateAsync({
        archivo: fila.archivo,
        tipo: fila.tipo,
        evento_id: eventoId,
        signal: fila.corte.signal,
      });
      // Sale de la lista al terminar: el listado de abajo ya lo trae del
      // servidor, y mostrarlo dos veces haría creer que se subió duplicado.
      quitar(fila.id);
    } catch (error) {
      // Una subida cancelada no es un fallo que haya que mostrar: la fila ya no
      // está y el usuario sabe lo que hizo.
      if (fila.corte.signal.aborted) return;
      reemplazar(fila.id, { estado: 'fallo', error: mensajeDeError(error) });
    }
  }

  async function elegir() {
    setRechazo(null);
    setErrorAlAbrir(null);

    let archivo: ArchivoElegido | null;
    try {
      archivo = await elegirArchivo(tipo);
    } catch (error) {
      setErrorAlAbrir(mensajeDeError(error));
      return;
    }
    if (!archivo) return;

    // El límite y el formato se verifican **antes** de subir: el 413 del backend
    // no puede ser el primer aviso después de mandar 10 MB por red móvil.
    const motivo = motivoDeRechazo(archivo, tipo);
    if (motivo) {
      setRechazo(motivo);
      return;
    }

    const fila: EnCurso = {
      id: String(proximoId.current++),
      archivo,
      tipo,
      estado: 'subiendo',
      corte: new AbortController(),
    };
    setEnCurso((filas) => [...filas, fila]);
    await despachar(fila);
  }

  function reintentar(fila: EnCurso) {
    // Un `AbortController` nuevo: el anterior pudo haber quedado abortado, y
    // uno abortado rechaza el request antes de salir.
    const reintento: EnCurso = {
      ...fila,
      estado: 'subiendo',
      error: undefined,
      corte: new AbortController(),
    };
    reemplazar(fila.id, reintento);
    void despachar(reintento);
  }

  return (
    <View style={estilos.raiz}>
      <Select
        label="Tipo de archivo"
        hint="Se declara antes de elegirlo: el sistema verifica que el archivo sea de este tipo."
        options={TIPOS}
        value={tipo}
        onChange={(valor) => {
          setTipo(valor);
          setRechazo(null);
        }}
      />

      <FileDropzone
        type={tipo}
        maxSizeMB={TAMANO_MAXIMO_MB}
        state={rechazo ? 'rejected' : 'idle'}
        rejectedReason={rechazo ?? undefined}
        disabled={bloqueado}
        title={bloqueado ? motivoBloqueo : undefined}
        onPick={() => void elegir()}
      />

      {errorAlAbrir ? (
        <InlineError compact title="No se pudo abrir el selector" description={errorAlAbrir} />
      ) : null}

      {enCurso.map((fila) => (
        <UploadItem
          key={fila.id}
          name={fila.archivo.nombre}
          size={tamanoLegible(fila.archivo.tamanoBytes)}
          type={fila.tipo}
          status={fila.estado}
          // Sin porcentaje: el cliente HTTP sube con `fetch`, que no informa
          // avance. Un número inventado miente sobre cuánto falta.
          indeterminate
          errorMessage={fila.error}
          onRetry={fila.estado === 'fallo' ? () => reintentar(fila) : undefined}
          onRemove={() => (fila.estado === 'fallo' ? quitar(fila.id) : cancelar(fila))}
          removeLabel={fila.estado === 'fallo' ? 'Descartar' : 'Cancelar la subida'}
        />
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { gap: 12 },
});
