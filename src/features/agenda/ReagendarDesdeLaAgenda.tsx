import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import type { Cita } from '../../api/cita';
import { useEntrada } from '../../hooks';
import { mensajeDeError } from '../../lib/errores';
import { duracion, sombra, useTheme } from '../../theme';
import { useGrilla, useMiClinica } from '../clinica';
import { FormularioDeCita } from '../paciente/FormularioDeCita';
import { usePlantel } from '../veterinario/queries';

import { useReagendarDesdeLaAgenda } from './queries';

/**
 * Mueve un turno desde la agenda de la clínica.
 *
 * Solo la fecha y el aviso al tutor: **el tipo no se toca acá**. Qué control
 * corresponde es criterio de quien atiende, y cambiarlo mientras se mueve una
 * hora es otra decisión metida en la misma pantalla (Reglas de Negocio, 3.2).
 *
 * Antes esto obligaba a entrar a la ficha del paciente, que el clínica_admin no
 * alcanza — y al veterinario le costaba salir de la agenda y volver.
 */
interface Props {
  cita: Cita;
  nombreDelPaciente: string;
  onCerrar: () => void;
}

export function ReagendarDesdeLaAgenda({ cita, nombreDelPaciente, onCerrar }: Props) {
  const { t, px, texto } = useTheme();
  const entrada = useEntrada();

  const clinica = useMiClinica();
  const grilla = useGrilla(clinica.data?.id);
  const plantel = usePlantel();
  const reagendar = useReagendarDesdeLaAgenda();

  return (
    <Modal transparent visible animationType="none" onRequestClose={onCerrar}>
      <Animated.View
        entering={FadeIn.duration(duracion.normal.duration)}
        exiting={FadeOut.duration(duracion.fast.duration)}
        style={estilos.telon}
      >
        <Animated.View
          entering={entrada}
          accessibilityViewIsModal
          style={[
            estilos.panel,
            sombra('--shadow-lg'),
            {
              borderRadius: px('--radius-card'),
              backgroundColor: t['--surface-card'],
              borderColor: t['--border-default'],
              padding: px('--gutter-card'),
            },
          ]}
        >
          <View style={estilos.titulo}>
            <Text style={[texto('h4'), { color: t['--text-strong'] }]}>
              {`Mover el turno de ${nombreDelPaciente}`}
            </Text>
            <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
              Solo la hora y el aviso al tutor. Qué control corresponde lo decide quien atiende.
            </Text>
          </View>

          <ScrollView style={estilos.scroll}>
            <FormularioDeCita
              grilla={grilla.data}
              plantel={plantel.data}
              soloFechaYAviso
              valorInicial={{
                id: cita.id,
                tipo: cita.tipo,
                fecha_programada: cita.fecha_programada,
                notificar_tutor: cita.notificar_tutor,
                veterinario_id: cita.veterinario_id ?? undefined,
              }}
              enviando={reagendar.isPending}
              error={reagendar.error ? mensajeDeError(reagendar.error) : undefined}
              etiquetaGuardar="Mover el turno"
              onGuardar={(cambios) =>
                reagendar.mutate(
                  {
                    citaId: cita.id,
                    cambios: {
                      fecha_programada: cambios.fecha_programada,
                      notificar_tutor: cambios.notificar_tutor,
                      ...(cambios.veterinario_id !== undefined
                        ? { veterinario_id: cambios.veterinario_id }
                        : {}),
                    },
                  },
                  { onSuccess: onCerrar },
                )
              }
              onCancelar={onCerrar}
            />
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  telon: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  panel: { borderWidth: 1, gap: 12, width: '100%', maxWidth: 520 },
  titulo: { gap: 2 },
  scroll: { maxHeight: 460 },
});
