import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme';

/**
 * Port a React Native de `design-system/components/clinical/AllergyChip.jsx`.
 *
 * El design system distingue dos severidades visuales (`alta` / `baja`); el
 * contrato tiene tres (`leve` / `moderada` / `severa`). El mapeo vive acá, en un
 * solo lugar: `severa` es alta, el resto es baja. La palabra completa se
 * escribe al lado del chip, en la banda de urgencia.
 */
interface AllergyChipProps {
  label: string;
  severity?: 'alta' | 'baja';
}

export function AllergyChip({ label, severity = 'alta' }: AllergyChipProps) {
  const { t, px, texto } = useTheme();
  const alta = severity === 'alta';

  return (
    <View
      style={[
        estilos.base,
        {
          borderRadius: px('--radius-pill'),
          backgroundColor: t['--alert-allergy-surface'],
          borderColor: t['--alert-allergy-border'],
        },
      ]}
    >
      <View
        style={[estilos.punto, { backgroundColor: alta ? t['--danger-500'] : t['--danger-100'] }]}
      />
      <Text
        style={[
          texto('body-sm'),
          { fontWeight: alta ? '600' : '500', color: t['--alert-allergy-text'] },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 7,
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderWidth: 1,
  },
  punto: { width: 6, height: 6, borderRadius: 3, flexGrow: 0, flexShrink: 0 },
});
