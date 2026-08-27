import { StyleSheet, Text, View } from 'react-native';

import { Button, Icon } from '../../components';
import { useTheme } from '../../theme';

/**
 * Los dos motivos por los que la ficha queda en solo lectura, cada uno con su
 * aviso arriba de todo. La regla la aplica el backend; esto existe para que el
 * veterinario sepa **por qué** los botones están deshabilitados, en vez de
 * tocarlos y comerse un 403.
 */

/** Regla 4.5: la baja del paciente es lógica y el historial sigue consultable. */
export function AvisoDePacienteDeBaja() {
  const { t, px, texto } = useTheme();
  return (
    <View
      accessibilityRole="alert"
      style={[
        estilos.base,
        {
          borderRadius: px('--radius-md'),
          backgroundColor: t['--alert-allergy-surface'],
          borderColor: t['--alert-allergy-border'],
        },
      ]}
    >
      <Icon name="lock" size={18} color={t['--danger-600']} />
      <View style={estilos.cuerpo}>
        <Text style={[texto('body-strong'), { color: t['--danger-600'] }]}>
          Paciente dado de baja
        </Text>
        <Text style={[texto('body-sm'), { color: t['--text-muted'], marginTop: 2 }]}>
          El historial queda consultable y no se borra nada. No se pueden cargar eventos,
          medicación, citas ni adjuntos nuevos.
        </Text>
      </View>
    </View>
  );
}

/** Regla 2.1: sin matrícula la ficha existe, pero en modo restringido. */
export function AvisoSinMatricula({ onCompletarPerfil }: { onCompletarPerfil?: () => void }) {
  const { t, px, texto } = useTheme();
  return (
    <View
      accessibilityRole="alert"
      style={[
        estilos.base,
        estilos.enLinea,
        {
          borderRadius: px('--radius-md'),
          backgroundColor: t['--warning-50'],
          borderColor: t['--warning-100'],
        },
      ]}
    >
      <Icon name="alert-triangle" size={18} color={t['--warning-600']} />
      <View style={[estilos.cuerpo, estilos.flexible]}>
        <Text style={[texto('body-strong'), { color: t['--warning-600'] }]}>
          No tenés la matrícula cargada
        </Text>
        <Text style={[texto('body-sm'), { color: t['--text-muted'], marginTop: 2 }]}>
          Podés consultar toda la ficha. Para cargar o editar eventos clínicos y medicación, agregá
          tu matrícula en tu perfil.
        </Text>
      </View>
      <Button variant="secondary" size="sm" iconLeft="user-round" onPress={onCompletarPerfil}>
        Completar mi perfil
      </Button>
    </View>
  );
}

/** Línea que acompaña a los CTA deshabilitados, con el motivo a la vista. */
export function MotivoDeBloqueo({ motivo }: { motivo: string }) {
  const { t, texto } = useTheme();
  return (
    <View style={estilos.motivo}>
      <Icon name="lock" size={13} color={t['--text-subtle']} />
      <Text style={[texto('body-sm'), { color: t['--text-subtle'] }]}>{motivo}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  enLinea: { alignItems: 'center', flexWrap: 'wrap' },
  cuerpo: { minWidth: 0 },
  flexible: { flex: 1, minWidth: 220 },
  motivo: { flexDirection: 'row', alignItems: 'center', gap: 7 },
});
