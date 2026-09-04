import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Adjunto } from '../../api/adjunto';
import {
  Badge,
  EmptyState,
  Icon,
  InlineError,
  MenuDeAcciones,
  MiniaturaDeArchivo,
  Presionable,
  type AccionDeMenu,
  type RectanguloEnPantalla,
} from '../../components';
import { mensajeDeError } from '../../lib/errores';
import { useTheme } from '../../theme';

import { DialogoDeRenombre } from './DialogoDeRenombre';
import { capitalizar, fechaCorta, tamanoDeArchivo } from './formato';
import { iconoDeArchivo } from './HistorialClinico';
import { useDescargarAdjunto, useRenombrarAdjunto } from './queries';
import { Seccion } from './Seccion';
import { VisorDeAdjunto } from './VisorDeAdjunto';
import { SubidaDeAdjunto } from './SubidaDeAdjunto';

/**
 * Zona 4: los adjuntos que **no** cuelgan de un evento (la ficha histórica en
 * papel, el carnet de vacunación). Los del historial se ven en su evento.
 *
 * **Son filas y no tarjetas**: una grilla de tarjetas grandes dedica media
 * pantalla a tres archivos, y lo que se busca acá es reconocer uno entre varios.
 * La miniatura chica alcanza para eso; el archivo se abre al tocarlo.
 *
 * Las acciones van detrás del botón de tres puntos y no en la fila: puestas a la
 * vista compiten con el nombre, que es lo único que identifica al archivo, y
 * dejan "Retirar" al lado de "Abrir" — se apunta a una y se toca la otra.
 */
interface AdjuntosProps {
  pacienteId: string;
  adjuntos: Adjunto[];
  /** Cuenta autenticada, para saber qué adjuntos puede retirar y renombrar. */
  usuarioId: string | undefined;
  error: boolean;
  onReintentar: () => void;
  esMovil: boolean;
  bloqueado: boolean;
  motivoBloqueo: string;
  /**
   * La lista salió de la copia local del dispositivo: están los metadatos y no
   * la URL prefirmada, que vence en minutos y por eso no se replica. Los
   * archivos se listan y no se abren ni se bajan, y subir, renombrar o retirar
   * tampoco entran — no están en la superficie de escritura sin conexión del
   * tutor.
   */
  soloMetadatos?: boolean;
  /**
   * Si se ofrece bajar el archivo al dispositivo. **Falso en las pantallas del
   * tutor**: «El archivo no se descarga al dispositivo […] Una copia local sería
   * historial clínico fuera del alcance del motor de permisos» y «No hay acción
   * de descarga ni de compartir» (Alcance de Plataformas, 5.6). Para el
   * veterinario sí está permitido (Reglas de Negocio, 3.2), y ahí es el valor
   * por defecto.
   */
  permiteDescarga?: boolean;
  /**
   * Quien mira puede subir, renombrar y retirar. Falso para el co-tutor de solo
   * lectura, que lista y mira y no escribe nada (Reglas de Negocio, 3.2):
   * ofrecerle una zona de carga —o un "Retirar" sobre un archivo que subió antes
   * de que le bajaran el nivel— que el backend va a rechazar es un error que la
   * interfaz puede evitar. El backend sigue siendo el que decide.
   */
  puedeEscribir?: boolean;
  onRetirar: (adjunto: Adjunto) => void;
}

export function SeccionAdjuntos({
  pacienteId,
  adjuntos,
  usuarioId,
  error,
  onReintentar,
  esMovil,
  bloqueado,
  motivoBloqueo,
  soloMetadatos = false,
  permiteDescarga = true,
  puedeEscribir = true,
  onRetirar,
}: AdjuntosProps) {
  const { t, px, texto } = useTheme();

  // Cuál se está mirando, y desde qué fila se abrió. Se guarda el adjunto
  // entero y no solo su id: el visor muestra nombre y peso desde el primer
  // cuadro, mientras la URL fresca viaja. El rectángulo es de dónde sale.
  const [mirando, setMirando] = useState<{
    adjunto: Adjunto;
    origen?: RectanguloEnPantalla;
  } | null>(null);
  const [renombrando, setRenombrando] = useState<Adjunto | null>(null);

  const renombrar = useRenombrarAdjunto(pacienteId);
  const descargar = useDescargarAdjunto();

  return (
    <Seccion
      titulo="Adjuntos generales"
      nota={
        puedeEscribir
          ? 'Se les cambia el nombre; el archivo no se edita'
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
        <View style={{ paddingVertical: 6 }}>
          {/* La descarga se pide de nuevo antes de abrirse y puede fallar: el
              aviso va arriba de la lista y no en la fila, que ya está llena. */}
          {descargar.isError ? (
            <View style={{ paddingHorizontal: px('--gutter-card'), paddingVertical: 8 }}>
              <InlineError
                compact
                title="No se pudo bajar el archivo"
                description={mensajeDeError(descargar.error)}
              />
            </View>
          ) : null}

          {adjuntos.map((adjunto) => (
            <FilaDeAdjunto
              key={adjunto.id}
              adjunto={adjunto}
              propio={adjunto.subido_por_usuario_id === usuarioId}
              esMovil={esMovil}
              bloqueado={bloqueado}
              motivoBloqueo={motivoBloqueo}
              soloMetadatos={soloMetadatos}
              permiteDescarga={permiteDescarga}
              puedeEscribir={puedeEscribir}
              onAbrir={(origen) => setMirando({ adjunto, origen })}
              onDescargar={() => descargar.mutate(adjunto.id)}
              onRenombrar={() => setRenombrando(adjunto)}
              onRetirar={() => onRetirar(adjunto)}
            />
          ))}
        </View>
      )}

      {mirando ? (
        <VisorDeAdjunto
          adjunto={mirando.adjunto}
          origen={mirando.origen}
          onCerrar={() => setMirando(null)}
        />
      ) : null}

      {renombrando ? (
        <DialogoDeRenombre
          nombre={renombrando.nombre_archivo}
          enviando={renombrar.isPending}
          error={renombrar.isError ? mensajeDeError(renombrar.error) : undefined}
          onGuardar={(nombre) =>
            renombrar.mutate(
              { adjuntoId: renombrando.id, nombre },
              // Se cierra al terminar bien y no antes: cerrarlo al tocar
              // "Guardar" se llevaría el error si el backend lo rechaza.
              { onSuccess: () => setRenombrando(null) },
            )
          }
          onCancelar={() => {
            renombrar.reset();
            setRenombrando(null);
          }}
        />
      ) : null}
    </Seccion>
  );
}

/**
 * Una fila: la miniatura, el nombre con sus datos, y el menú.
 *
 * Todo el bloque de texto abre el archivo, no solo la miniatura: es el objetivo
 * más grande de la fila y en un teléfono apuntarle a una miniatura de 48 puntos
 * es pedir puntería para la acción más común.
 */
function FilaDeAdjunto({
  adjunto,
  propio,
  esMovil,
  bloqueado,
  motivoBloqueo,
  soloMetadatos,
  permiteDescarga,
  puedeEscribir,
  onAbrir,
  onDescargar,
  onRenombrar,
  onRetirar,
}: {
  adjunto: Adjunto;
  propio: boolean;
  esMovil: boolean;
  bloqueado: boolean;
  motivoBloqueo: string;
  soloMetadatos: boolean;
  permiteDescarga: boolean;
  puedeEscribir: boolean;
  onAbrir: (origen?: RectanguloEnPantalla) => void;
  onDescargar: () => void;
  onRenombrar: () => void;
  onRetirar: () => void;
}) {
  const { t, px, texto } = useTheme();

  const enLinea = !soloMetadatos;
  const escribe = puedeEscribir && enLinea && !bloqueado;

  const acciones: AccionDeMenu[] = [];
  if (enLinea && permiteDescarga) {
    acciones.push({ label: 'Descargar', icono: 'download', onPress: onDescargar });
  }
  if (propio && escribe) {
    acciones.push({ label: 'Cambiar el nombre', icono: 'pencil', onPress: onRenombrar });
  }
  if (propio && escribe) {
    acciones.push({ label: 'Retirar', icono: 'trash-2', peligro: true, onPress: onRetirar });
  }

  return (
    <View
      style={[estilos.fila, { paddingHorizontal: px('--gutter-card'), gap: esMovil ? 10 : 14 }]}
    >
      <MiniaturaDeArchivo
        contentType={adjunto.content_type}
        url={enLinea ? adjunto.archivo_url : undefined}
        icono={iconoDeArchivo(adjunto)}
        alto={LADO_DE_MINIATURA}
        ancho={LADO_DE_MINIATURA}
        radio={px('--radius-md')}
        onAbrir={enLinea ? onAbrir : undefined}
        accessibilityLabel={
          soloMetadatos
            ? `${adjunto.nombre_archivo}, necesitás conexión para verlo`
            : `Ver ${adjunto.nombre_archivo}`
        }
      />

      <Presionable
        onPress={enLinea ? () => onAbrir(undefined) : undefined}
        fondo="transparent"
        fondoDestacado={t['--surface-hover']}
        style={[estilos.cuerpo, { borderRadius: px('--radius-md') }]}
        accessibilityLabel={enLinea ? `Ver ${adjunto.nombre_archivo}` : undefined}
      >
        <Text numberOfLines={1} style={[texto('body-strong'), { color: t['--text-strong'] }]}>
          {adjunto.nombre_archivo}
        </Text>
        <Text style={[texto('caption'), { color: t['--text-subtle'] }]}>
          {/* Mayúscula solo inicial: la versalita del sistema es el overline, no esto. */}
          {`${adjunto.tipo === 'pdf' ? 'PDF' : capitalizar(adjunto.tipo)} · ${tamanoDeArchivo(adjunto.tamano_bytes)} · ${fechaCorta(
            adjunto.created_at.slice(0, 10),
          )}`}
        </Text>
        {adjunto.es_foto_perfil ? (
          <Badge tone="success" icon="check" size="sm">
            Foto de la mascota
          </Badge>
        ) : null}
        {/* Sin acciones propias, la fila dice por qué: un menú que solo tiene
            "Descargar" no explica dónde se fue "Retirar". */}
        {!propio && puedeEscribir && enLinea ? (
          <View style={estilos.ajeno}>
            <Icon name="lock" size={12} color={t['--text-subtle']} />
            <Text style={[texto('caption'), { fontWeight: '500', color: t['--text-subtle'] }]}>
              Solo lo cambia quien lo subió
            </Text>
          </View>
        ) : null}
      </Presionable>

      {acciones.length > 0 ? (
        <MenuDeAcciones
          acciones={acciones}
          accessibilityLabel={`Acciones de ${adjunto.nombre_archivo}`}
        />
      ) : bloqueado && puedeEscribir && enLinea ? (
        <View accessibilityLabel={motivoBloqueo}>
          <Icon name="lock" size={16} color={t['--text-subtle']} />
        </View>
      ) : null}
    </View>
  );
}

/** Lado de la miniatura de la fila: reconocer el archivo, no mirarlo. */
const LADO_DE_MINIATURA = 48;

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  cuerpo: { flex: 1, minWidth: 0, gap: 2, paddingVertical: 4, paddingHorizontal: 6 },
  ajeno: { flexDirection: 'row', alignItems: 'center', gap: 5 },
});
