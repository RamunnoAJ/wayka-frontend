import { StyleSheet, Text, View } from 'react-native';

import { Button, Icon } from '../../components';
import { useTheme } from '../../theme';

/**
 * Un paso diseñado que todavía no tiene contrato detrás.
 *
 * Se muestra en vez de construir el formulario porque los documentos de `docs/`
 * son el contrato del proyecto y no una sugerencia (CLAUDE.md): una pantalla
 * que pide datos que la API no guarda le miente al usuario sobre lo que quedó
 * registrado. El paso queda visible, con el motivo escrito, y se puede saltear.
 */
interface PasoSinContratoProps {
  titulo: string;
  descripcion: string;
  motivo: string;
  onSaltear: () => void;
  etiquetaSaltear?: string;
}

export function PasoSinContrato({
  titulo,
  descripcion,
  motivo,
  onSaltear,
  etiquetaSaltear = 'Continuar',
}: PasoSinContratoProps) {
  const { t, px, texto } = useTheme();

  return (
    <View style={estilos.raiz}>
      <View style={estilos.intro}>
        <Text style={[texto('h1'), { color: t['--text-strong'] }]}>{titulo}</Text>
        <Text style={[texto('body-lg'), { color: t['--text-muted'] }]}>{descripcion}</Text>
      </View>

      <View
        style={[
          estilos.aviso,
          {
            borderRadius: px('--radius-card'),
            backgroundColor: t['--warning-50'],
            borderColor: t['--warning-100'],
            padding: px('--gutter-card'),
          },
        ]}
      >
        <View style={estilos.avisoTitulo}>
          <Icon name="alert-triangle" size={18} color={t['--warning-600']} />
          <Text style={[texto('body-strong'), { color: t['--warning-600'] }]}>
            Falta el contrato para este paso
          </Text>
        </View>
        <Text style={[texto('body'), { color: t['--text-body'] }]}>{motivo}</Text>
        <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
          Antes de construirlo hay que definirlo en `docs/` y exponerlo en
          `backend/openapi/openapi.yaml`: primero el contrato, después la pantalla.
        </Text>
      </View>

      <Button variant="secondary" onPress={onSaltear}>
        {etiquetaSaltear}
      </Button>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { gap: 24, maxWidth: 720 },
  intro: { gap: 6 },
  aviso: { borderWidth: 1, gap: 10 },
  avisoTitulo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
