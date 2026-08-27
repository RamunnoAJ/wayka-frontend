import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Icon } from '../../components';
import { useTheme } from '../../theme';

import { BarraDeActivacion } from './BarraDeActivacion';
import { PASOS, type ClaveDePaso } from './pasos';
import { PasoPrimerVeterinario } from './PasoPrimerVeterinario';
import { PasoSinContrato } from './PasoSinContrato';

/**
 * Activación de la clínica (handoff "Onboarding Clínica"), rol clínica_admin,
 * solo web.
 *
 * De los cinco pasos del diseño, uno está implementado contra la API real —el
 * alta del primer veterinario, que es el único con endpoint— y tres declaran
 * qué les falta en el contrato. El paso de demostración con datos de ejemplo no
 * toca la API y queda como recorrido guiado.
 */
export function OnboardingClinica({ onTerminar }: { onTerminar?: () => void }) {
  const { t, px, texto } = useTheme();
  const [paso, setPaso] = useState<ClaveDePaso>('cuenta');
  const [veterinarioCreado, setVeterinarioCreado] = useState<string | null>(null);

  function avanzar(desde: ClaveDePaso) {
    const i = PASOS.findIndex((p) => p.clave === desde);
    const siguiente = PASOS[i + 1];
    if (siguiente) setPaso(siguiente.clave);
    else onTerminar?.();
  }

  return (
    <View style={[estilos.raiz, { backgroundColor: t['--surface-page'] }]}>
      <BarraDeActivacion paso={paso} />

      <ScrollView>
        <View
          style={[
            estilos.contenido,
            { maxWidth: px('--content-max'), paddingHorizontal: px('--gutter-page') },
          ]}
        >
          {paso === 'cuenta' ? (
            <PasoSinContrato
              titulo="Tu cuenta ya está creada"
              descripcion="El alta de la clínica y de su cuenta de administración las hace el equipo de Wayka por fuera de la aplicación."
              motivo={PASOS[0].bloqueadoPor ?? ''}
              onSaltear={() => avanzar('cuenta')}
              etiquetaSaltear="Ver Wayka andando"
            />
          ) : null}

          {paso === 'demo' ? (
            <View style={estilos.demo}>
              <View style={estilos.intro}>
                <Text style={[texto('h1'), { color: t['--text-strong'] }]}>
                  Esto es Wayka andando
                </Text>
                <Text style={[texto('body-lg'), { color: t['--text-muted'] }]}>
                  Antes de configurar nada, mirá cómo se ve una historia clínica completa y una
                  agenda cargada. Son datos de ejemplo: no se guardan ni se comparten.
                </Text>
              </View>
              <View
                style={[
                  estilos.recorrido,
                  {
                    borderRadius: px('--radius-card'),
                    backgroundColor: t['--surface-sunken'],
                    borderColor: t['--border-default'],
                    padding: px('--gutter-card'),
                  },
                ]}
              >
                <Text style={[texto('body-strong'), { color: t['--text-strong'] }]}>
                  Qué vas a encontrar
                </Text>
                {[
                  'Ficha de paciente con alergias y medicación activa siempre arriba.',
                  'Historial clínico en línea de tiempo, con el autor de cada registro.',
                  'Calendario del paciente con las citas pendientes, cumplidas y vencidas.',
                ].map((linea) => (
                  <View key={linea} style={estilos.item}>
                    <Icon name="check" size={16} color={t['--color-primary-strong']} />
                    <Text style={[texto('body'), estilos.itemTexto, { color: t['--text-body'] }]}>
                      {linea}
                    </Text>
                  </View>
                ))}
              </View>
              <Button size="lg" onPress={() => avanzar('demo')}>
                Armemos tu clínica
              </Button>
            </View>
          ) : null}

          {paso === 'clinica' ? (
            <PasoSinContrato
              titulo="Los datos de tu clínica"
              descripcion="Nombre, dirección, contacto, horarios de atención y especialidades."
              motivo={PASOS[2].bloqueadoPor ?? ''}
              onSaltear={() => avanzar('clinica')}
              etiquetaSaltear="Cargar el primer veterinario"
            />
          ) : null}

          {paso === 'veterinario' ? (
            <PasoPrimerVeterinario
              onListo={(nombre) => {
                setVeterinarioCreado(nombre);
                avanzar('veterinario');
              }}
            />
          ) : null}

          {paso === 'agenda' ? (
            <PasoSinContrato
              titulo="Activá la agenda"
              descripcion={
                veterinarioCreado
                  ? `${veterinarioCreado} ya tiene cuenta. Falta definir sus días y horarios y hacer visible la agenda para los tutores.`
                  : 'Falta definir días, horarios y la visibilidad de la agenda para los tutores.'
              }
              motivo={PASOS[4].bloqueadoPor ?? ''}
              onSaltear={() => onTerminar?.()}
              etiquetaSaltear="Entrar a Wayka"
            />
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  contenido: { width: '100%', alignSelf: 'center', paddingTop: 36, paddingBottom: 64 },
  intro: { gap: 6, maxWidth: 640 },
  demo: { gap: 24 },
  recorrido: { borderWidth: 1, gap: 12 },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  itemTexto: { flex: 1 },
});
