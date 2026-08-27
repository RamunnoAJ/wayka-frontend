import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '../../components';
import { useTheme } from '../../theme';

import { PASOS, type ClaveDePaso, indiceDe } from './pasos';

/**
 * Encabezado de la activación: porcentaje, barra y los cinco pasos.
 *
 * Arranca en 20 % y no en 0: el alta de la cuenta ya la hizo el equipo de
 * Wayka, así que mostrarlo vacío sería mentirle al administrador sobre cuánto
 * falta.
 */
interface BarraProps {
  paso: ClaveDePaso;
  nombreDeClinica?: string;
}

export function BarraDeActivacion({ paso, nombreDeClinica }: BarraProps) {
  const { t, px, texto } = useTheme();
  const actual = indiceDe(paso);
  const porcentaje = PASOS[actual]?.porcentaje ?? 0;

  return (
    <View
      style={[
        estilos.base,
        { backgroundColor: t['--surface-card'], borderBottomColor: t['--border-default'] },
      ]}
    >
      <View style={[estilos.contenido, { maxWidth: px('--content-max') }]}>
        <View style={estilos.titulo}>
          <Text style={[texto('body-strong'), { color: t['--text-strong'] }]}>
            {nombreDeClinica ?? 'Tu clínica'}
          </Text>
          <View style={estilos.porcentaje}>
            <Text style={[texto('h3'), { color: t['--color-primary-strong'] }]}>
              {`${porcentaje} %`}
            </Text>
            <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>activada</Text>
          </View>
        </View>

        <View style={[estilos.riel, { backgroundColor: t['--neutral-100'] }]}>
          <View
            style={[
              estilos.relleno,
              { width: `${porcentaje}%`, backgroundColor: t['--color-primary-fill'] },
            ]}
          />
        </View>

        <View style={estilos.pasos}>
          {PASOS.map((definicion, i) => {
            const hecho = i < actual;
            const activo = i === actual;
            return (
              <View key={definicion.clave} style={estilos.paso}>
                <View
                  style={[
                    estilos.marca,
                    {
                      backgroundColor: hecho
                        ? t['--color-primary-fill']
                        : activo
                          ? t['--color-primary-soft']
                          : t['--surface-sunken'],
                      borderColor: activo ? t['--color-primary'] : t['--border-default'],
                    },
                  ]}
                >
                  {hecho ? (
                    <Icon name="check" size={12} color={t['--color-primary-fg']} />
                  ) : (
                    <Text
                      style={[
                        texto('overline'),
                        {
                          fontWeight: '700',
                          color: activo ? t['--color-primary-strong'] : t['--text-subtle'],
                        },
                      ]}
                    >
                      {i + 1}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    texto('body-sm'),
                    { color: activo ? t['--text-strong'] : t['--text-muted'] },
                  ]}
                >
                  {definicion.etiqueta}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  base: { borderBottomWidth: 1 },
  contenido: {
    width: '100%',
    alignSelf: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  titulo: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  porcentaje: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginLeft: 'auto' },
  riel: { height: 8, borderRadius: 999, overflow: 'hidden' },
  relleno: { height: '100%', borderRadius: 999 },
  pasos: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 16 },
  paso: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  marca: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
