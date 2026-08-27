import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { sombra, useTheme } from '../../theme';

/** Tarjeta con encabezado: la unidad de composición del cuerpo de la ficha. */
interface SeccionProps {
  titulo: string;
  /** Texto secundario al lado del título (conteos, aclaraciones de regla). */
  nota?: string;
  /** Acción principal de la sección, alineada a la derecha. */
  accion?: ReactNode;
  /** Separa el encabezado del cuerpo con una línea. */
  conSeparador?: boolean;
  children: ReactNode;
}

export function Seccion({ titulo, nota, accion, conSeparador = true, children }: SeccionProps) {
  const { t, px, texto } = useTheme();

  return (
    <View
      style={[
        estilos.tarjeta,
        sombra('--shadow-sm'),
        {
          borderRadius: px('--radius-card'),
          backgroundColor: t['--surface-card'],
          borderColor: t['--border-default'],
        },
      ]}
    >
      <View
        style={[
          estilos.encabezado,
          conSeparador && { borderBottomWidth: 1, borderBottomColor: t['--border-subtle'] },
        ]}
      >
        <Text style={[texto('h3'), { color: t['--text-strong'] }]}>{titulo}</Text>
        {nota ? (
          <Text style={[texto('body-sm'), estilos.nota, { color: t['--text-subtle'] }]}>
            {nota}
          </Text>
        ) : null}
        {accion ? <View style={estilos.accion}>{accion}</View> : null}
      </View>
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { borderWidth: 1, overflow: 'hidden' },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  nota: { flexShrink: 1 },
  accion: { marginLeft: 'auto' },
});
