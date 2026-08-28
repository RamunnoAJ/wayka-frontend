import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Icon } from '../../../../../src/components';
import { FormularioDeEvento } from '../../../../../src/features/paciente/FormularioDeEvento';
import { useCrearEvento, usePaciente } from '../../../../../src/features/paciente/queries';
import { SubidaDeAdjunto } from '../../../../../src/features/paciente/SubidaDeAdjunto';
import { mensajeDeError } from '../../../../../src/lib/errores';
import { sombra, useTheme } from '../../../../../src/theme';

/**
 * Carga de evento clínico (Alcance de Plataformas, 3.4).
 *
 * **Los adjuntos van después de guardar, no dentro del formulario.** El kit del
 * design system los dibuja adentro, pero `evento_id` tiene que referenciar un
 * evento que ya existe (contrato, `subirAdjunto`): no hay a qué colgarlos
 * mientras el formulario está abierto. La alternativa sería guardarlos en el
 * dispositivo y subirlos al guardar, y ahí el usuario ve "adjunto" un archivo
 * que todavía no salió del teléfono — si la subida falla después, el evento ya
 * quedó cargado y el archivo no.
 *
 * Así el evento queda firmado primero y cada archivo sube contra un id real,
 * con su propio estado. Está señalado para revisar con Claude Design.
 */
export default function NuevoEventoClinico() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, px, texto } = useTheme();
  const paciente = usePaciente(id);
  const crear = useCrearEvento(id);

  const [eventoCargado, setEventoCargado] = useState<string | null>(null);

  function volver() {
    router.back();
  }

  return (
    <View style={[estilos.raiz, { backgroundColor: t['--surface-page'] }]}>
      <ScrollView>
        <View
          style={[
            estilos.contenido,
            { maxWidth: px('--content-max'), paddingHorizontal: px('--gutter-page') },
          ]}
        >
          <View style={estilos.titulo}>
            <Text style={[texto('h1'), { color: t['--text-strong'] }]}>
              {eventoCargado ? 'Evento cargado' : 'Cargar evento clínico'}
            </Text>
            <Text style={[texto('body-lg'), { color: t['--text-muted'] }]}>
              {eventoCargado
                ? 'Ya quedó firmado en el historial. Si tenés estudios o fotos, adjuntalos acá.'
                : paciente.data
                  ? `En el historial de ${paciente.data.nombre}.`
                  : 'En el historial del paciente.'}
            </Text>
          </View>

          {eventoCargado ? (
            <View
              style={[
                estilos.tarjeta,
                sombra('--shadow-sm'),
                {
                  padding: px('--gutter-card'),
                  borderRadius: px('--radius-card'),
                  backgroundColor: t['--surface-card'],
                  borderColor: t['--border-default'],
                },
              ]}
            >
              <View style={estilos.confirmacion}>
                <Icon name="check" size={18} color={t['--text-success']} />
                <Text style={[texto('body-strong'), { color: t['--text-success'] }]}>
                  El evento ya está en el historial
                </Text>
              </View>

              <SubidaDeAdjunto pacienteId={id} eventoId={eventoCargado} />

              <Text style={[texto('caption'), { color: t['--text-subtle'] }]}>
                Los adjuntos son opcionales: podés salir sin subir ninguno.
              </Text>

              <View style={estilos.acciones}>
                <Button onPress={volver}>Terminar</Button>
              </View>
            </View>
          ) : (
            <FormularioDeEvento
              enviando={crear.isPending}
              error={crear.error ? mensajeDeError(crear.error) : undefined}
              onGuardar={(entrada) =>
                crear.mutate(entrada, { onSuccess: (evento) => setEventoCargado(evento.id) })
              }
              onCancelar={volver}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  contenido: { width: '100%', alignSelf: 'center', paddingVertical: 32, gap: 20 },
  titulo: { gap: 6, maxWidth: 640 },
  tarjeta: { borderWidth: 1, gap: 16, maxWidth: 640 },
  confirmacion: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  acciones: { flexDirection: 'row', gap: 12 },
});
