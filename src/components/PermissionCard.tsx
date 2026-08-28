import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme';

import { Button } from './Button';
import { Icon } from './Icon';

/**
 * Port a React Native de `design-system/components/core/PermissionCard.jsx`.
 *
 * Pide el permiso de push y muestra el estado ya resuelto (Alcance de
 * Plataformas, 5.5). Los tres estados pesan distinto a propósito: sin preguntar
 * es la única acción principal de la pantalla, concedido es una línea y
 * denegado es un bloque discreto.
 *
 * **Denegado no es rojo y no insiste**: el sistema operativo no vuelve a
 * preguntar, así que el único camino es los ajustes del teléfono. El usuario no
 * cometió un error, no hay nada que corregir — hay una consecuencia que nombrar.
 */
type EstadoDePermiso = 'sin-preguntar' | 'concedido' | 'denegado';

const TEXTOS: Record<EstadoDePermiso, { titulo: string; cuerpo: string }> = {
  'sin-preguntar': {
    titulo: 'Activá los avisos',
    cuerpo:
      'Te avisamos el día anterior a cada turno y cuando tu veterinaria carga algo nuevo en la ficha.',
  },
  concedido: {
    titulo: 'Avisos activados',
    cuerpo: 'Recibís el recordatorio del día anterior a cada turno.',
  },
  denegado: {
    titulo: 'Los avisos están desactivados',
    cuerpo:
      'Mientras estén desactivados en tu teléfono no vas a recibir el recordatorio del día anterior a cada turno.',
  },
};

interface PermissionCardProps {
  /** Estado del permiso resuelto por el sistema operativo. */
  status?: EstadoDePermiso;
  title?: string;
  /** En `denegado` tiene que nombrar la consecuencia concreta. */
  body?: string;
  /** Solo en `sin-preguntar`: dispara el prompt del sistema. */
  onAsk?: () => void;
  /** Solo en `denegado`: abre los ajustes del teléfono. */
  onOpenSettings?: () => void;
  onDismiss?: () => void;
  askLabel?: string;
  dismissLabel?: string;
  settingsLabel?: string;
}

export function PermissionCard({
  status = 'sin-preguntar',
  title,
  body,
  onAsk,
  onOpenSettings,
  onDismiss,
  askLabel = 'Permitir avisos',
  dismissLabel = 'Más tarde',
  settingsLabel = 'Abrir ajustes del teléfono',
}: PermissionCardProps) {
  const { t, px, texto } = useTheme();

  const porDefecto = TEXTOS[status];
  const titulo = title ?? porDefecto.titulo;
  const cuerpo = body ?? porDefecto.cuerpo;

  // Concedido: una línea, sin acción. Nada que decidir, nada que ocupar.
  if (status === 'concedido') {
    return (
      <View
        style={[
          estilos.linea,
          {
            borderRadius: px('--radius-md'),
            backgroundColor: t['--success-50'],
            borderColor: t['--success-100'],
          },
        ]}
      >
        <Icon name="bell" size={15} color={t['--text-success']} />
        <Text style={[texto('body-strong'), { color: t['--text-success'] }]}>{titulo}</Text>
      </View>
    );
  }

  // Denegado: a la altura de un dato, no de un banner. Neutro, no rojo.
  if (status === 'denegado') {
    return (
      <View
        style={[
          estilos.bloque,
          {
            borderRadius: px('--radius-md'),
            backgroundColor: t['--surface-sunken'],
            borderColor: t['--border-subtle'],
          },
        ]}
      >
        <View style={[estilos.fila, estilos.filaAjustada]}>
          <View style={estilos.glifoAlineado}>
            <Icon name="bell-off" size={15} color={t['--text-subtle']} />
          </View>
          <View style={estilos.cuerpo}>
            <Text style={[texto('body-strong'), { color: t['--text-body'] }]}>{titulo}</Text>
            <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>{cuerpo}</Text>
          </View>
        </View>
        {onOpenSettings ? (
          <View style={estilos.sangria}>
            <Button size="sm" variant="ghost" iconRight="external-link" onPress={onOpenSettings}>
              {settingsLabel}
            </Button>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View
      style={[
        estilos.tarjeta,
        {
          borderRadius: px('--radius-card'),
          backgroundColor: t['--surface-card'],
          borderColor: t['--border-default'],
        },
      ]}
    >
      <View style={estilos.fila}>
        <View
          style={[
            estilos.icono,
            { borderRadius: px('--radius-md'), backgroundColor: t['--color-primary-soft'] },
          ]}
        >
          <Icon name="bell" size={18} color={t['--color-primary-strong']} />
        </View>
        <View style={estilos.cuerpo}>
          <Text style={[texto('h4'), { color: t['--text-strong'] }]}>{titulo}</Text>
          <Text style={[texto('body'), { color: t['--text-muted'] }]}>{cuerpo}</Text>
        </View>
      </View>

      <View style={estilos.acciones}>
        {onAsk ? (
          <Button block size="touch" onPress={onAsk}>
            {askLabel}
          </Button>
        ) : null}
        {onDismiss ? (
          <Button block size="sm" variant="ghost" onPress={onDismiss}>
            {dismissLabel}
          </Button>
        ) : null}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  linea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  bloque: { gap: 8, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1 },
  tarjeta: { gap: 14, padding: 16, borderWidth: 1 },
  fila: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  filaAjustada: { gap: 9 },
  glifoAlineado: { paddingTop: 2 },
  cuerpo: { flex: 1, gap: 4 },
  icono: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  sangria: { paddingLeft: 24, alignItems: 'flex-start' },
  acciones: { gap: 8 },
});
