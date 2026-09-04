import { useState } from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';

import { Button, Icon, InlineError } from '../../components';
import {
  elegirArchivo,
  motivoDeRechazo,
  TAMANO_MAXIMO_MB,
  type ArchivoElegido,
} from '../../lib/archivos';
import { mensajeDeError } from '../../lib/errores';
import { useTheme } from '../../theme';

/**
 * La foto de la mascota en el alta (Alcance de Plataformas, 5.2).
 *
 * Va **primera en la pantalla y no como un campo más abajo del peso**: elegir la
 * foto es la acción del formulario con más peso propio, y es lo que hace que lo
 * que se está cargando se parezca a la mascota en vez de a un registro.
 *
 * Es opcional y se puede quitar: el alta no se traba por una foto, y la mascota
 * queda dada de alta igual si la subida falla después.
 */
export function SelectorDeFotoDePerfil({
  nombre,
  archivo,
  onElegir,
}: {
  /** Nombre ya escrito, para que el pie diga de quién es la foto. */
  nombre?: string;
  archivo: ArchivoElegido | null;
  onElegir: (archivo: ArchivoElegido | null) => void;
}) {
  const { t, px, texto } = useTheme();
  const [error, setError] = useState<string | null>(null);

  async function elegir() {
    setError(null);
    let elegido: ArchivoElegido | null;
    try {
      // En el teléfono la foto sale de la galería y no de la app Archivos, donde
      // las fotos no están (misma decisión que la subida de adjuntos).
      elegido = await elegirArchivo('foto', Platform.OS === 'web' ? 'archivos' : 'galeria');
    } catch (falla) {
      setError(mensajeDeError(falla));
      return;
    }
    if (!elegido) return;

    // El techo se verifica antes de subir, no con el 413 del backend: acá la
    // subida ni siquiera ocurre todavía, y avisar recién al guardar dejaría el
    // rechazo lejos del momento en que se eligió.
    const motivo = motivoDeRechazo(elegido, 'foto');
    if (motivo) {
      setError(motivo);
      return;
    }
    onElegir(elegido);
  }

  return (
    <View style={estilos.raiz}>
      <View
        style={[
          estilos.marco,
          {
            borderRadius: px('--radius-card'),
            backgroundColor: t['--color-primary-soft'],
            borderColor: t['--border-default'],
          },
        ]}
      >
        {archivo ? (
          <Image
            source={{ uri: archivo.uri }}
            style={estilos.foto}
            accessibilityLabel={nombre ? `Foto de ${nombre}` : 'La foto elegida'}
          />
        ) : (
          <Icon name="camera" size={28} color={t['--color-primary-strong']} />
        )}
      </View>

      <View style={estilos.flexible}>
        <Text style={[texto('body-strong'), { color: t['--text-strong'] }]}>
          {archivo ? 'Ya tenés su foto' : 'Poné su foto'}
        </Text>
        <Text style={[texto('caption'), { color: t['--text-muted'] }]}>
          {`Es opcional y se puede cambiar después. Hasta ${TAMANO_MAXIMO_MB} MB.`}
        </Text>
        <View style={estilos.acciones}>
          <Button variant="secondary" size="sm" iconLeft="image" onPress={() => void elegir()}>
            {archivo ? 'Elegir otra' : 'Elegir una foto'}
          </Button>
          {archivo ? (
            <Button variant="ghost" size="sm" onPress={() => onElegir(null)}>
              Quitar
            </Button>
          ) : null}
        </View>
        {error ? <InlineError compact title={error} /> : null}
      </View>
    </View>
  );
}

const TAMANO_DEL_MARCO = 88;

const estilos = StyleSheet.create({
  raiz: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  marco: {
    width: TAMANO_DEL_MARCO,
    height: TAMANO_DEL_MARCO,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  foto: { width: '100%', height: '100%' },
  flexible: { flex: 1, minWidth: 0, gap: 4 },
  acciones: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
});
