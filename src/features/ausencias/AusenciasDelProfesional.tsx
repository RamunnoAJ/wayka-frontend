import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Ausencia } from '../../api/ausencia';
import { Button, DialogoDeConfirmacion, InlineError, Skeleton } from '../../components';
import { mensajeDeError } from '../../lib/errores';
import { useTheme } from '../../theme';

import { FormularioDeAusencia } from './FormularioDeAusencia';
import { useAusencias, useDarDeBajaAusencia } from './queries';

/**
 * Las ausencias de una persona, en su ficha (Alcance de Plataformas, 3.2.3).
 *
 * Viven acá y no en una sección aparte porque una ausencia es de alguien: la
 * pregunta "¿cuándo no está Lucía?" se hace mirando a Lucía. La mirada
 * transversal —quién falta hoy— la da la etiqueta del listado del plantel.
 */
interface Props {
  veterinarioId: string;
  nombre: string;
  zonaHoraria: string | undefined;
}

export function AusenciasDelProfesional({ veterinarioId, nombre, zonaHoraria }: Props) {
  const { t, px, texto } = useTheme();
  const consulta = useAusencias({ veterinarioId });
  const baja = useDarDeBajaAusencia();
  const [cargando, setCargando] = useState(false);
  const [aDarDeBaja, setADarDeBaja] = useState<Ausencia | null>(null);

  const formato = new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: zonaHoraria,
  });

  return (
    <View style={estilos.raiz}>
      <View style={estilos.encabezado}>
        <View style={estilos.titulo}>
          <Text style={[texto('h3'), { color: t['--text-strong'] }]}>Ausencias</Text>
          <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
            Cuándo no va a estar, para que la agenda no le ofrezca turnos. No se pide el motivo.
          </Text>
        </View>
        <Button variant="secondary" size="sm" iconLeft="plus" onPress={() => setCargando(true)}>
          Cargar ausencia
        </Button>
      </View>

      {consulta.isPending ? (
        <Skeleton height={48} />
      ) : consulta.isError ? (
        <InlineError
          title="No se pudieron cargar las ausencias"
          onRetry={() => consulta.refetch()}
        />
      ) : consulta.data.length === 0 ? (
        <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
          No tiene ninguna ausencia cargada.
        </Text>
      ) : (
        consulta.data.map((ausencia) => (
          <View key={ausencia.id} style={[estilos.fila, { borderTopColor: t['--border-subtle'] }]}>
            <Text style={[texto('body'), { color: t['--text-body'], flex: 1 }]}>
              {`${formato.format(new Date(ausencia.desde))} → ${formato.format(new Date(ausencia.hasta))}`}
            </Text>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => {
                baja.reset();
                setADarDeBaja(ausencia);
              }}
            >
              Dar de baja
            </Button>
          </View>
        ))
      )}

      {cargando ? (
        <FormularioDeAusencia
          veterinarioId={veterinarioId}
          nombre={nombre}
          zonaHoraria={zonaHoraria}
          onCerrar={() => setCargando(false)}
        />
      ) : null}

      {/*
        Dar de baja la ausencia no devuelve las citas que desasignó: siguen sin
        profesional. Es lo contrario de lo que cualquiera esperaría, así que el
        diálogo lo dice antes y no después.
      */}
      {aDarDeBaja ? (
        <DialogoDeConfirmacion
          titulo="¿Dar de baja esta ausencia?"
          descripcion={`${nombre} vuelve a estar disponible para turnos nuevos. Las citas que se desasignaron al cargarla no vuelven solas: siguen sin profesional, para repartir.`}
          etiquetaConfirmar="Dar de baja"
          enviando={baja.isPending}
          error={baja.isError ? mensajeDeError(baja.error) : undefined}
          onCancelar={() => setADarDeBaja(null)}
          onConfirmar={() => baja.mutate(aDarDeBaja.id, { onSuccess: () => setADarDeBaja(null) })}
        />
      ) : null}

      <View style={{ height: px('--space-1') }} />
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { gap: 10 },
  encabezado: { flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 },
  titulo: { flex: 1, minWidth: 220, gap: 2 },
  fila: {
    borderTopWidth: 1,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
