import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Adjunto } from '../../api/adjunto';
import {
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
  onRetirar: (adjunto: Adjunto) => void;
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
  onRetirar,
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
    <Seccion titulo="Adjuntos generales" nota="No se editan: se retiran y se sube otro">
      <View
        style={{
          padding: px('--gutter-card'),
          borderBottomWidth: 1,
          borderBottomColor: t['--border-subtle'],
        }}
      >
        <SubidaDeAdjunto
          pacienteId={pacienteId}
          tituloDeCamara={nombreDePaciente}
          bloqueado={bloqueado}
          motivoBloqueo={motivoBloqueo}
        />
      </View>

      {error ? (
        <View style={{ padding: px('--gutter-card') }}>
          <InlineError title="No se pudieron cargar los adjuntos" onRetry={onReintentar} />
        </View>
      ) : adjuntos.length === 0 ? (
        <View style={{ padding: px('--gutter-card') }}>
          <EmptyState
            icon="paperclip"
            title="Sin adjuntos generales"
            description="Acá va lo que no cuelga de un evento: la ficha histórica en papel, el carnet de vacunación."
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
                  url={adjunto.archivo_url}
                  icono={iconoDeArchivo(adjunto)}
                  alto={ALTO_DE_MINIATURA}
                  onAbrir={(origen) => setMirando({ adjunto, origen })}
                  accessibilityLabel={`Ver ${adjunto.nombre_archivo}`}
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
                  {propio ? (
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
                        Solo lo retira quien lo subió
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

/** Alto de la banda de la miniatura dentro de la tarjeta. */
const ALTO_DE_MINIATURA = 88;

const estilos = StyleSheet.create({
  grilla: { flexWrap: 'wrap', gap: 14 },
  tarjeta: { flexGrow: 1, flexBasis: 220, minWidth: 220, borderWidth: 1, overflow: 'hidden' },
  cuerpo: { padding: 14, gap: 6 },
  ajeno: { flexDirection: 'row', alignItems: 'center', gap: 5 },
});
