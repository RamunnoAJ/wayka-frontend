import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Icon } from '../../components';
import {
  elegirArchivo,
  motivoDeRechazo,
  preguntarComoSacarLaFoto,
  type ArchivoElegido,
} from '../../lib/archivos';
import { mensajeDeError } from '../../lib/errores';
import { useTheme } from '../../theme';
import { CamaraDeAdjunto } from '../paciente/CamaraDeAdjunto';

import { useSubirFotoDePerfil } from './queries';

/**
 * La foto que encabeza la ficha, y el único lugar desde donde se cambia
 * (Alcance de Plataformas, 5.3).
 *
 * **Se toca el avatar, no se elige un adjunto.** La foto de perfil es un adjunto
 * marcado (Modelo de Datos, 4.8), pero eso es cómo se guarda y no cómo se
 * piensa: cambiarla desde la lista de archivos obligaba al tutor a saber que la
 * foto vive ahí. Acá se toca lo que se está mirando.
 *
 * La foto nueva sube marcada como foto de perfil y el backend desmarca la
 * anterior en el mismo pedido (Reglas de Negocio, 4.14): no se borra, queda como
 * un adjunto más.
 */
const LADO_DEL_DISTINTIVO = 28;

interface FotoDeMiMascotaProps {
  pacienteId: string;
  nombre: string;
  especie: string;
  /** URL prefirmada de la foto vigente. Sin ella, el ícono de la especie. */
  fotoUrl?: string;
  /**
   * El nivel de acceso deja escribir y hay conexión. Sin esto el avatar es una
   * imagen y nada más: sin la URL prefirmada tampoco habría nada que reemplazar.
   */
  editable: boolean;
}

export function FotoDeMiMascota({
  pacienteId,
  nombre,
  especie,
  fotoUrl,
  editable,
}: FotoDeMiMascotaProps) {
  const { t, px } = useTheme();
  const subir = useSubirFotoDePerfil();
  const [camaraAbierta, setCamaraAbierta] = useState(false);

  async function elegirDeLaGaleria() {
    let archivo: ArchivoElegido | null;
    try {
      // En el teléfono la foto sale de la galería y no de la app Archivos, donde
      // las fotos no están (mismo criterio que la subida de adjuntos).
      archivo = await elegirArchivo('foto', Platform.OS === 'web' ? 'archivos' : 'galeria');
    } catch (error) {
      avisar('No se pudo abrir el selector', mensajeDeError(error));
      return;
    }
    if (archivo) cargar(archivo);
  }

  async function abrirElegidor() {
    // En web no hay cámara ni galería: el `input file` del navegador es uno solo
    // y preguntar entre dos caminos que llevan al mismo diálogo sería un paso de
    // más. El tutor igual no entra por web, pero este árbol compila para los dos.
    if (Platform.OS === 'web') {
      await elegirDeLaGaleria();
      return;
    }

    const fuente = await preguntarComoSacarLaFoto();
    if (fuente === 'camara') setCamaraAbierta(true);
    else if (fuente === 'galeria') await elegirDeLaGaleria();
  }

  function cargar(archivo: ArchivoElegido) {
    // El techo y el formato se verifican antes de subir, no con el 413 del
    // backend después de mandar la foto entera por red móvil.
    const motivo = motivoDeRechazo(archivo, 'foto');
    if (motivo) {
      avisar('Esa foto no se puede usar', motivo);
      return;
    }

    subir.mutate(
      { pacienteId, archivo },
      {
        // El fallo va a un diálogo del sistema y no a un `InlineError`: al lado
        // del avatar no hay ancho para una línea de texto sin apretar el nombre,
        // y el camino entero —elegir la fuente, la galería— ya son diálogos.
        onError: (error) => avisar('No se pudo cambiar la foto', mensajeDeError(error)),
      },
    );
  }

  const avatar = <Avatar name={nombre} species={especie} size="xl" src={fotoUrl || undefined} />;

  if (!editable) return avatar;

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={fotoUrl ? `Cambiar la foto de ${nombre}` : `Poner la foto de ${nombre}`}
        accessibilityState={{ busy: subir.isPending }}
        disabled={subir.isPending}
        onPress={() => void abrirElegidor()}
      >
        {avatar}

        {subir.isPending ? (
          <View style={[estilos.velo, { borderRadius: px('--radius-md') }]}>
            <ActivityIndicator size="small" color={t['--wayka-blanco']} />
          </View>
        ) : null}

        {/* Sin el distintivo el avatar no se lee como algo que se toca: una foto
            grande en el encabezado parece decoración. */}
        <View
          style={[
            estilos.distintivo,
            {
              borderRadius: px('--radius-pill'),
              // Lo que se pinta lleno va con el par de relleno del sistema, no
              // con --color-primary: en el tutor ese acento no tiene contraste
              // suficiente para un ícono encima.
              backgroundColor: t['--color-primary-fill'],
              borderColor: t['--surface-card'],
            },
          ]}
        >
          <Icon name="camera" size={14} color={t['--color-primary-fill-fg']} />
        </View>
      </Pressable>

      {camaraAbierta ? (
        <CamaraDeAdjunto
          onCerrar={() => setCamaraAbierta(false)}
          onTomada={cargar}
          onAbrirGaleria={() => {
            setCamaraAbierta(false);
            void elegirDeLaGaleria();
          }}
        />
      ) : null}
    </View>
  );
}

function avisar(titulo: string, detalle: string) {
  Alert.alert(titulo, detalle, [{ text: 'Entendido' }]);
}

const estilos = StyleSheet.create({
  velo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,.45)',
  },
  distintivo: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: LADO_DEL_DISTINTIVO,
    height: LADO_DEL_DISTINTIVO,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
});
