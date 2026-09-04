import { useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import type { TipoDeAdjunto } from '../../api/adjunto';
import {
  Button,
  FileDropzone,
  InlineError,
  Input,
  Select,
  UploadItem,
  type OpcionDeSelect,
} from '../../components';
import {
  elegirArchivo,
  motivoDeRechazo,
  preguntarFuente,
  tamanoLegible,
  TAMANO_MAXIMO_MB,
  type ArchivoElegido,
  type FuenteDeArchivo,
} from '../../lib/archivos';
import { mensajeDeError } from '../../lib/errores';

import { CamaraDeAdjunto } from './CamaraDeAdjunto';
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
  /** Nombre elegido para la lista. Vacío: vale el del archivo. */
  nombre: string;
  estado: 'subiendo' | 'fallo';
  error?: string;
  /** Corta la subida de verdad: sin esto, "cancelar" solo escondería la fila. */
  corte: AbortController;
}

/**
 * La cámara solo tiene sentido donde hay una: en la web de la clínica el
 * archivo llega del disco, y `expo-camera` ahí pediría `getUserMedia` con su
 * propio permiso del navegador.
 */
const HAY_CAMARA = Platform.OS !== 'web';

interface SubidaDeAdjuntoProps {
  pacienteId: string;
  /** Para qué se saca la foto, si se abre la cámara: "Herida · Mora". */
  tituloDeCamara?: string;
  /** Evento que el archivo documenta. Sin él, queda como adjunto general. */
  eventoId?: string;
  /** La ficha no admite escrituras (paciente dado de baja, matrícula vencida). */
  bloqueado?: boolean;
  motivoBloqueo?: string;
}

export function SubidaDeAdjunto({
  pacienteId,
  tituloDeCamara,
  eventoId,
  bloqueado = false,
  motivoBloqueo,
}: SubidaDeAdjuntoProps) {
  const subir = useSubirAdjunto(pacienteId);

  const [tipo, setTipo] = useState<TipoDeAdjunto>('foto');
  const [nombre, setNombre] = useState('');
  const [rechazo, setRechazo] = useState<string | null>(null);
  const [errorAlAbrir, setErrorAlAbrir] = useState<string | null>(null);
  const [enCurso, setEnCurso] = useState<EnCurso[]>([]);
  const [camaraAbierta, setCamaraAbierta] = useState(false);

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
        nombre_archivo: fila.nombre || undefined,
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

  /** Punto de entrada común del archivo elegido del disco y del sacado con la cámara. */
  async function encolar(archivo: ArchivoElegido) {
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
      nombre: nombre.trim(),
      estado: 'subiendo',
      corte: new AbortController(),
    };
    setEnCurso((filas) => [...filas, fila]);
    // El nombre elegido vale para este archivo y no para el siguiente: dejarlo
    // puesto haría que dos fotos seguidas se llamaran igual.
    setNombre('');
    await despachar(fila);
  }

  /**
   * De dónde sale el archivo del tipo declarado. En iOS son dos selectores
   * distintos y el de documentos **no muestra el carrete**: pedir una foto y
   * caer en la app Archivos es el camino equivocado.
   *
   * En web no hay tal cosa: el `input file` del navegador es uno solo.
   */
  async function fuenteDe(tipo: TipoDeAdjunto): Promise<FuenteDeArchivo | null> {
    if (Platform.OS === 'web' || tipo === 'pdf') return 'archivos';
    if (tipo === 'foto') return 'carrete';
    // El estudio vive en los dos lados: la placa en el carrete, el informe
    // escaneado entre los archivos. Solo acá se pregunta.
    return preguntarFuente();
  }

  async function elegir(fuenteFijada?: FuenteDeArchivo) {
    setRechazo(null);
    setErrorAlAbrir(null);

    const fuente = fuenteFijada ?? (await fuenteDe(tipo));
    if (!fuente) return;

    let archivo: ArchivoElegido | null;
    try {
      archivo = await elegirArchivo(tipo, fuente);
    } catch (error) {
      setErrorAlAbrir(mensajeDeError(error));
      return;
    }
    if (!archivo) return;

    await encolar(archivo);
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

      {/* El nombre se elige antes de tocar el archivo, con el mismo criterio
          que el tipo: en el teléfono el selector se abre y sube de una, y
          después ya no hay dónde escribirlo. Igual se puede cambiar más tarde
          desde la lista. */}
      <Input
        label="Nombre del archivo"
        hint="Opcional: si lo dejás vacío queda el nombre con el que viene el archivo."
        placeholder="Carnet de vacunación"
        value={nombre}
        onChangeText={setNombre}
        editable={!bloqueado}
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

      {/*
        La cámara no reemplaza al selector: es el camino corto para la foto que
        todavía no existe. Un PDF no se saca con la cámara — para eso está el
        modo documento, que igual produce una imagen.
      */}
      {HAY_CAMARA && tipo !== 'pdf' ? (
        <Button
          block
          size="touch"
          variant="secondary"
          iconLeft="camera"
          disabled={bloqueado}
          accessibilityLabel={bloqueado ? motivoBloqueo : undefined}
          onPress={() => {
            setRechazo(null);
            setCamaraAbierta(true);
          }}
        >
          Sacar una foto
        </Button>
      ) : null}

      {errorAlAbrir ? (
        <InlineError compact title="No se pudo abrir el selector" description={errorAlAbrir} />
      ) : null}

      {enCurso.map((fila) => (
        <UploadItem
          key={fila.id}
          name={fila.nombre || fila.archivo.nombre}
          // La foto recién sacada no trae peso: leerlo exigiría cargar el
          // archivo entero, que es lo que la subida evita.
          size={fila.archivo.tamanoBytes > 0 ? tamanoLegible(fila.archivo.tamanoBytes) : undefined}
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

      {HAY_CAMARA && camaraAbierta ? (
        <CamaraDeAdjunto
          titulo={tituloDeCamara}
          onCerrar={() => setCamaraAbierta(false)}
          onTomada={(archivo) => void encolar(archivo)}
          onAbrirCarrete={() => {
            setCamaraAbierta(false);
            // El botón dice "carrete" y va al carrete, sin preguntar: quien
            // está en la cámara ya dijo que la foto es una foto.
            void elegir('carrete');
          }}
        />
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { gap: 12 },
});
