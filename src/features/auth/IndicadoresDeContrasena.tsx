import { StyleSheet, Text, View } from 'react-native';

import { Icon, type NombreDeIcono } from '../../components';
import { useTheme } from '../../theme';

import { REGLAS_CONTRASENA } from './validaciones';

/**
 * Los indicadores de una contraseña que se está eligiendo: la política de la
 * regla 2.1, tildándose sola mientras se escribe, y —cuando hay campo de
 * repetición— si las dos coinciden.
 *
 * Estaba copiado en cada pantalla que pide una contraseña nueva (alta de tutor,
 * activación de clínica_admin, cambio con sesión y recuperación). Vive acá una
 * sola vez porque la política es una: si cambia, cambia en un lugar.
 *
 * **La restricción se muestra desde el principio, no al fallar** — mismo
 * criterio que el límite de tamaño en los adjuntos.
 */
interface ReglasDeContrasenaProps {
  valor: string;
  /** `columna` cuando el ancho no da para envolver sin quedar dentado. */
  disposicion?: 'fila' | 'columna';
  tamanoDeIcono?: number;
}

export function ReglasDeContrasena({
  valor,
  disposicion = 'fila',
  tamanoDeIcono = 13,
}: ReglasDeContrasenaProps) {
  return (
    <View style={disposicion === 'fila' ? estilos.fila : estilos.columna}>
      {REGLAS_CONTRASENA.map((regla) => (
        <Indicador
          key={regla.texto}
          cumple={regla.prueba(valor)}
          texto={regla.texto}
          tamanoDeIcono={tamanoDeIcono}
        />
      ))}
    </View>
  );
}

/**
 * Si la repetición coincide. Callado mientras el campo está vacío: todavía no
 * hay nada que contradecir, y un rojo antes de escribir la primera letra es
 * ruido.
 */
interface IndicadorDeCoincidenciaProps {
  nueva: string;
  repetida: string;
  tamanoDeIcono?: number;
}

export function IndicadorDeCoincidencia({
  nueva,
  repetida,
  tamanoDeIcono = 13,
}: IndicadorDeCoincidenciaProps) {
  if (!repetida) return null;

  const coinciden = repetida === nueva;

  return (
    <Indicador
      cumple={coinciden}
      texto={coinciden ? 'Las dos coinciden' : 'Las dos no coinciden'}
      icono={coinciden ? 'check' : 'x'}
      colorAlNoCumplir="--text-danger"
      tamanoDeIcono={tamanoDeIcono}
    />
  );
}

function Indicador({
  cumple,
  texto: leyenda,
  icono,
  colorAlNoCumplir = '--text-subtle',
  tamanoDeIcono,
}: {
  cumple: boolean;
  texto: string;
  icono?: NombreDeIcono;
  colorAlNoCumplir?: '--text-subtle' | '--text-danger';
  tamanoDeIcono: number;
}) {
  const { t, texto } = useTheme();
  const color = cumple ? t['--text-success'] : t[colorAlNoCumplir];

  return (
    <View style={estilos.indicador} accessibilityRole="text">
      <Icon name={icono ?? (cumple ? 'check' : 'circle-dot')} size={tamanoDeIcono} color={color} />
      <Text style={[texto('caption'), { color }]}>{leyenda}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  columna: { gap: 6 },
  indicador: { flexDirection: 'row', alignItems: 'center', gap: 5 },
});
