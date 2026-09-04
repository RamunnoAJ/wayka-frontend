import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Icon } from '../../components';
import { FormularioDeClinica } from '../clinica';
import { useSesion } from '../../hooks/useSesion';
import { useTheme } from '../../theme';

import { BarraDeActivacion } from './BarraDeActivacion';
import { PASOS, type ClaveDePaso } from './pasos';
import { PasoPrimerVeterinario } from './PasoPrimerVeterinario';
import { PasoSinContrato } from './PasoSinContrato';

/**
 * Puesta en marcha de la clínica (handoff "Onboarding Clínica"), rol
 * clínica_admin, solo web.
 *
 * De los cinco pasos del diseño, el alta del primer veterinario va contra la API
 * real y el de la cuenta quedó resuelto por el canje del token
 * (`(auth)/activacion`). Los que siguen declarando qué les falta en el contrato
 * son los de datos de la clínica y activación de la agenda. El paso de
 * demostración no toca la API y queda como recorrido guiado.
 */
export function OnboardingClinica({ onTerminar }: { onTerminar?: () => void }) {
  const { t, px, texto } = useTheme();
  const [paso, setPaso] = useState<ClaveDePaso>('cuenta');
  const [veterinarioCreado, setVeterinarioCreado] = useState<string | null>(null);
  const { sesion } = useSesion();
  const clinicaId = sesion?.usuario.clinica_id ?? undefined;

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
            <View style={estilos.demo}>
              <View style={estilos.intro}>
                <Text style={[texto('h1'), { color: t['--text-strong'] }]}>
                  Tu cuenta ya está activa
                </Text>
                <Text style={[texto('body-lg'), { color: t['--text-muted'] }]}>
                  El equipo de Wayka dio de alta tu clínica y vos estrenaste la contraseña con el
                  token de activación. Desde acá en adelante lo configurás vos.
                </Text>
              </View>
              <Button size="lg" onPress={() => avanzar('cuenta')}>
                Ver Wayka andando
              </Button>
            </View>
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
                Terminá de armar tu clínica
              </Button>
            </View>
          ) : null}

          {paso === 'clinica' ? (
            <View style={estilos.demo}>
              <View style={estilos.intro}>
                <Text style={[texto('h1'), { color: t['--text-strong'] }]}>
                  Los datos de tu clínica
                </Text>
                <Text style={[texto('body-lg'), { color: t['--text-muted'] }]}>
                  Ya está cargado lo que se sabía, y el horario quedó en valores habituales. Si te
                  sirven así, confirmá y seguimos.
                </Text>
              </View>
              {clinicaId ? (
                <FormularioDeClinica
                  clinicaId={clinicaId}
                  etiquetaGuardar="Guardar y seguir"
                  onGuardado={() => avanzar('clinica')}
                />
              ) : null}
            </View>
          ) : null}

          {paso === 'veterinario' ? (
            <PasoPrimerVeterinario
              onListo={(nombre) => {
                setVeterinarioCreado(nombre || null);
                avanzar('veterinario');
              }}
            />
          ) : null}

          {paso === 'agenda' ? (
            <PasoSinContrato
              titulo="Activá la agenda"
              descripcion={
                veterinarioCreado
                  ? `${veterinarioCreado} ya tiene cuenta y tu horario de atención ya define la grilla de turnos. Falta la agenda por profesional.`
                  : 'Tu horario de atención ya define la grilla de turnos. Falta la agenda por profesional.'
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
