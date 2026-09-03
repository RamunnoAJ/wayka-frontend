import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Adjunto } from '../../api/adjunto';
import {
  Badge,
  Button,
  EmptyState,
  Icon,
  InlineError,
  MiniaturaDeArchivo,
  type RectanguloEnPantalla,
} from '../../components';
import { useTheme } from '../../theme';

import { fechaCorta, tamanoDeArchivo } from './formato';
import { iconoDeArchivo } from './HistorialClinico';
import { Seccion } from './Seccion';
import { VisorDeAdjunto } from './VisorDeAdjunto';
import { SubidaDeAdjunto } from './SubidaDeAdjunto';

/**
 * Zona 4: los adjuntos que **no** cuelgan de un evento (la ficha histórica en
 * papel, el carnet de vacunación). Los del historial se ven en su evento.
 *
 * Un adjunto no se edita: se retira y se sube otro. Y cada rol retira solo los
 * que subió (regla 2.4) — por eso la acción depende de quién es el dueño.
 */
interface AdjuntosProps {
  pacienteId: string;
  /** Nombre de la mascota, para que la cámara diga de quién es la foto. */
  nombreDePaciente?: string;
  adjuntos: Adjunto[];
  /** Cuenta autenticada, para saber qué adjuntos puede retirar. */
  usuarioId: string | undefined;
  error: boolean;
  onReintentar: () => void;
  esMovil: boolean;
  bloqueado: boolean;
  motivoBloqueo: string;
  /**
   * La lista salió de la copia local del dispositivo: están los metadatos y no
   * la URL prefirmada, que vence en minutos y por eso no se replica. Los
   * archivos se listan y no se abren, y subir o retirar tampoco entran — no
   * están en la superficie de escritura sin conexión del tutor.
   */
  soloMetadatos?: boolean;
  /**
   * Quien mira puede subir y retirar. Falso para el co-tutor de solo lectura,
   * que lista y mira y no escribe nada (Reglas de Negocio, 3.2): ofrecerle una
   * zona de carga —o un "Retirar" sobre un archivo que subió antes de que le
   * bajaran el nivel— que el backend va a rechazar es un error que la interfaz
   * puede evitar. El backend sigue siendo el que decide.
   */
  puedeEscribir?: boolean;
  onRetirar: (adjunto: Adjunto) => void;
  /**
   * Deja este archivo como foto de la mascota. Sin la función, la acción no se
   * ofrece: la ficha del veterinario lista los mismos adjuntos y ahí elegir la
   * foto de la mascota no es una decisión suya.
   *
   * Solo sobre imágenes, y sobre cualquiera de las que estén — no solo las
   * propias, al revés que retirar: marcar no toca el archivo de nadie, decide
   * qué muestra la ficha de una mascota que el tutor sí alcanza.
   */
  onUsarComoFoto?: (adjunto: Adjunto) => void;
}

export function SeccionAdjuntos({
  pacienteId,
  nombreDePaciente,
  adjuntos,
  usuarioId,
  error,
  onReintentar,
  esMovil,
  bloqueado,
  motivoBloqueo,
  soloMetadatos = false,
  puedeEscribir = true,
  onRetirar,
  onUsarComoFoto,
}: AdjuntosProps) {
  const { t, px, texto } = useTheme();

  // Cuál se está mirando, y desde qué tarjeta se abrió. Se guarda el adjunto
  // entero y no solo su id: el visor muestra nombre y peso desde el primer
  // cuadro, mientras la URL fresca viaja. El rectángulo es de dónde sale.
  const [mirando, setMirando] = useState<{
    adjunto: Adjunto;
    origen?: RectanguloEnPantalla;
  } | null>(null);

  return (
    <Seccion
      titulo="Adjuntos generales"
      nota={
        puedeEscribir
          ? 'No se editan: se retiran y se sube otro'
          : 'Solo lectura: los mirás, no subís'
      }
    >
      {puedeEscribir || soloMetadatos ? (
        <View
          style={{
            padding: px('--gutter-card'),
            borderBottomWidth: 1,
            borderBottomColor: t['--border-subtle'],
          }}
        >
          {soloMetadatos ? (
            <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
              {puedeEscribir
                ? 'Necesitás conexión para ver estos archivos o subir uno nuevo.'
                : 'Necesitás conexión para ver estos archivos.'}
            </Text>
          ) : (
            <SubidaDeAdjunto
              pacienteId={pacienteId}
              tituloDeCamara={nombreDePaciente}
              bloqueado={bloqueado}
              motivoBloqueo={motivoBloqueo}
            />
          )}
        </View>
      ) : null}

      {error ? (
        <View style={{ padding: px('--gutter-card') }}>
          <InlineError title="No se pudieron cargar los adjuntos" onRetry={onReintentar} />
        </View>
      ) : adjuntos.length === 0 ? (
        <View style={{ padding: px('--gutter-card') }}>
          <EmptyState
            icon="paperclip"
            title="Sin adjuntos generales"
            description={
              puedeEscribir
                ? 'Acá va lo que no cuelga de un evento: la ficha histórica en papel, el carnet de vacunación.'
                : 'Todavía nadie subió la ficha histórica en papel ni el carnet de vacunación.'
            }
          />
        </View>
      ) : (
        <View
          style={[
            estilos.grilla,
            { padding: px('--gutter-card'), flexDirection: esMovil ? 'column' : 'row' },
          ]}
        >
          {adjuntos.map((adjunto) => {
            const propio = adjunto.subido_por_usuario_id === usuarioId;
            return (
              <View
                key={adjunto.id}
                style={[
                  estilos.tarjeta,
                  { borderRadius: px('--radius-md'), borderColor: t['--border-default'] },
                ]}
              >
                <MiniaturaDeArchivo
                  contentType={adjunto.content_type}
                  url={soloMetadatos ? undefined : adjunto.archivo_url}
                  icono={iconoDeArchivo(adjunto)}
                  alto={ALTO_DE_MINIATURA}
                  onAbrir={soloMetadatos ? undefined : (origen) => setMirando({ adjunto, origen })}
                  accessibilityLabel={
                    soloMetadatos
                      ? `${adjunto.nombre_archivo}, necesitás conexión para verlo`
                      : `Ver ${adjunto.nombre_archivo}`
                  }
                />
                <View style={estilos.cuerpo}>
                  <Text
                    style={[texto('overline'), { fontWeight: '700', color: t['--text-subtle'] }]}
                  >
                    {adjunto.tipo.toUpperCase()}
                  </Text>
                  <Text style={[texto('body-strong'), { color: t['--text-strong'] }]}>
                    {adjunto.nombre_archivo}
                  </Text>
                  <Text style={[texto('caption'), { color: t['--text-subtle'] }]}>
                    {`${tamanoDeArchivo(adjunto.tamano_bytes)} · ${fechaCorta(adjunto.created_at.slice(0, 10))}`}
                  </Text>
                  {adjunto.es_foto_perfil ? (
                    <Badge tone="success" icon="check" size="sm">
                      Foto de la mascota
                    </Badge>
                  ) : onUsarComoFoto && esImagen(adjunto) && puedeEscribir && !soloMetadatos ? (
                    /* Marcar una desmarca la anterior sin preguntar: hay una
                       sola, y la anterior no se borra — deja de ser la que se
                       muestra (Reglas de Negocio, 4.14). */
                    <Button
                      variant="ghost"
                      size="sm"
                      iconLeft="image"
                      disabled={bloqueado}
                      accessibilityLabel={bloqueado ? motivoBloqueo : undefined}
                      onPress={() => onUsarComoFoto(adjunto)}
                    >
                      Usar como foto
                    </Button>
                  ) : null}
                  {propio && puedeEscribir && !soloMetadatos ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      iconLeft="trash-2"
                      disabled={bloqueado}
                      accessibilityLabel={bloqueado ? motivoBloqueo : undefined}
                      onPress={() => onRetirar(adjunto)}
                    >
                      Retirar
                    </Button>
                  ) : (
                    <View style={estilos.ajeno}>
                      <Icon name="lock" size={12} color={t['--text-subtle']} />
                      <Text
                        style={[texto('caption'), { fontWeight: '500', color: t['--text-subtle'] }]}
                      >
                        {puedeEscribir ? 'Solo lo retira quien lo subió' : 'Solo lectura'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {mirando ? (
        <VisorDeAdjunto
          adjunto={mirando.adjunto}
          origen={mirando.origen}
          onCerrar={() => setMirando(null)}
        />
      ) : null}
    </Seccion>
  );
}

/**
 * Solo una imagen puede ser la foto de la mascota: marcar un PDF dejaría a la
 * ficha sin nada que mostrar, y el backend lo rechaza igual.
 */
function esImagen(adjunto: Adjunto): boolean {
  return adjunto.content_type.startsWith('image/');
}

/** Alto de la banda de la miniatura dentro de la tarjeta. */
const ALTO_DE_MINIATURA = 88;

const estilos = StyleSheet.create({
  grilla: { flexWrap: 'wrap', gap: 14 },
  tarjeta: { flexGrow: 1, flexBasis: 220, minWidth: 220, borderWidth: 1, overflow: 'hidden' },
  cuerpo: { padding: 14, gap: 6 },
  ajeno: { flexDirection: 'row', alignItems: 'center', gap: 5 },
});
