import { StyleSheet, Text, View } from 'react-native';

import { Presionable } from '../../components';
import { useTheme } from '../../theme';
import type { NivelInvitado } from '../../api/invitacion';

/**
 * La diferencia entre los dos niveles es la decisión entera de la pantalla de
 * invitar, así que cada opción explica qué habilita **abajo de su nombre** y no
 * en un globo de ayuda: nadie abre un tooltip para tomar una decisión que ya
 * cree entendida.
 */
const OPCIONES: { nivel: NivelInvitado; titulo: string; detalle: string }[] = [
  {
    nivel: 'edicion',
    titulo: 'Puede editar',
    detalle:
      'Ve el historial completo, edita los datos de la mascota, gestiona los turnos y sube archivos. No puede compartirla con nadie más ni darla de baja.',
  },
  {
    nivel: 'lectura',
    titulo: 'Solo mira',
    detalle: 'Ve el historial, los turnos y los archivos, sin poder cambiar nada.',
  },
];

export function SelectorDeNivel({
  valor,
  onCambiar,
}: {
  valor: NivelInvitado;
  onCambiar: (nivel: NivelInvitado) => void;
}) {
  const { t, px, texto } = useTheme();

  return (
    <View style={estilos.lista}>
      {OPCIONES.map((opcion) => {
        const elegida = opcion.nivel === valor;
        return (
          <Presionable
            key={opcion.nivel}
            onPress={() => onCambiar(opcion.nivel)}
            fondo={elegida ? t['--surface-accent-soft'] : t['--surface-card']}
            fondoDestacado={t['--surface-hover']}
            borde={elegida ? t['--color-primary-strong'] : t['--border-default']}
            accessibilityLabel={opcion.titulo}
            accessibilityState={{ selected: elegida }}
            style={[estilos.opcion, { borderRadius: px('--radius-card') }]}
          >
            <Text style={[texto('body-strong'), { color: t['--text-strong'] }]}>
              {opcion.titulo}
            </Text>
            <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>{opcion.detalle}</Text>
          </Presionable>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  lista: { gap: 10 },
  opcion: { borderWidth: 1, padding: 14, gap: 4 },
});
