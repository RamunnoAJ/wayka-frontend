import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Ausencia, CrearAusenciaEntrada } from '../../api/ausencia';
import {
  Button,
  InlineError,
  Input,
  Select,
  Skeleton,
  type OpcionDeSelect,
} from '../../components';
import { mensajeDeError } from '../../lib/errores';
import { instanteEnLaClinica, hoyEnLaClinica } from '../../lib/zona';
import { sombra, useTheme } from '../../theme';
import { usePlantel } from '../veterinario/queries';

import { minutosDeHora } from '../clinica/grilla';
import {
  useAusencias,
  useCrearAusencia,
  useDarDeBajaAusencia,
  usePrevisualizarAusencia,
} from './queries';

/**
 * Ausencias del plantel (Alcance de Plataformas, 3.2.4).
 *
 * No se pide un motivo y la pantalla no tiene dónde escribirlo: el motivo de la
 * ausencia de un empleado puede ser un dato de salud, y para que la agenda
 * funcione alcanza con el rango.
 *
 * Antes de guardar se puede ver cuántas citas asignadas caen adentro. Al
 * guardar, esas citas quedan **sin profesional** —no se cancelan ni se mueven de
 * hora— y pasan a la cola de sin asignar. La ausencia se guarda siempre: el
 * diálogo informa el efecto, no pide permiso para dejar de bloquear.
 */
const HORAS: OpcionDeSelect[] = Array.from({ length: 24 }, (_, i) => {
  const hora = `${String(i).padStart(2, '0')}:00`;
  return { value: hora, label: hora };
});

interface Props {
  zonaHoraria: string | undefined;
}

export function Ausencias({ zonaHoraria }: Props) {
  const { t, px, texto } = useTheme();
  const consulta = useAusencias();
  const plantel = usePlantel();
  const crear = useCrearAusencia();
  const previsualizar = usePrevisualizarAusencia();
  const baja = useDarDeBajaAusencia();

  const hoy = hoyEnLaClinica(zonaHoraria);
  const [veterinarioId, setVeterinarioId] = useState('');
  const [desdeDia, setDesdeDia] = useState(hoy);
  const [desdeHora, setDesdeHora] = useState('09:00');
  const [hastaDia, setHastaDia] = useState(hoy);
  const [hastaHora, setHastaHora] = useState('20:00');

  const nombrePorId = new Map((plantel.data ?? []).map((ficha) => [ficha.id, ficha.nombre]));
  const opcionesDePlantel: OpcionDeSelect[] = (plantel.data ?? []).map((ficha) => ({
    value: ficha.id,
    label: ficha.nombre,
  }));

  const entrada: CrearAusenciaEntrada | null = veterinarioId
    ? {
        veterinario_id: veterinarioId,
        desde: instanteEnLaClinica(desdeDia, minutosDeHora(desdeHora), zonaHoraria).toISOString(),
        hasta: instanteEnLaClinica(hastaDia, minutosDeHora(hastaHora), zonaHoraria).toISOString(),
      }
    : null;

  const rangoInvalido = Boolean(entrada) && !(entrada!.hasta > entrada!.desde);

  const tarjeta = {
    borderRadius: px('--radius-card'),
    backgroundColor: t['--surface-card'],
    borderColor: t['--border-default'],
    borderWidth: 1,
    padding: px('--gutter-card'),
  };

  function limpiar() {
    setVeterinarioId('');
    previsualizar.reset();
  }

  return (
    <View style={estilos.raiz}>
      <View style={[tarjeta, sombra('--shadow-sm'), estilos.bloque]}>
        <Text style={[texto('overline'), { fontWeight: '700', color: t['--text-subtle'] }]}>
          AUSENCIAS DEL PLANTEL
        </Text>
        <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
          Para que la grilla no le ofrezca turnos a quien no va a estar. No se pide un motivo: para
          que la agenda funcione alcanza con las fechas.
        </Text>

        <View style={estilos.fila}>
          <View style={estilos.campoAncho}>
            <Select
              label="Profesional"
              options={opcionesDePlantel}
              value={veterinarioId}
              onChange={(valor) => {
                setVeterinarioId(valor);
                previsualizar.reset();
              }}
            />
          </View>
        </View>

        <View style={estilos.fila}>
          <View style={estilos.campo}>
            <Input
              label="Desde"
              value={desdeDia}
              onChangeText={setDesdeDia}
              placeholder="AAAA-MM-DD"
            />
          </View>
          <View style={estilos.campo}>
            <Select label="Hora" options={HORAS} value={desdeHora} onChange={setDesdeHora} />
          </View>
          <View style={estilos.campo}>
            <Input
              label="Hasta"
              value={hastaDia}
              onChangeText={setHastaDia}
              placeholder="AAAA-MM-DD"
            />
          </View>
          <View style={estilos.campo}>
            <Select label="Hora" options={HORAS} value={hastaHora} onChange={setHastaHora} />
          </View>
        </View>

        {rangoInvalido ? (
          <InlineError
            compact
            title="El rango no cierra"
            description="El fin de la ausencia tiene que ser posterior a su comienzo."
          />
        ) : null}

        {previsualizar.data ? (
          <View
            style={[
              estilos.efecto,
              {
                backgroundColor: t['--surface-hover'],
                padding: px('--gutter-card'),
                borderRadius: px('--radius-card'),
              },
            ]}
          >
            {previsualizar.data.citas_afectadas === 0 ? (
              <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
                No hay ninguna cita asignada adentro de ese rango.
              </Text>
            ) : (
              <>
                <Text style={[texto('body'), { color: t['--text-strong'] }]}>
                  {`${previsualizar.data.citas_afectadas} cita(s) van a quedar sin profesional.`}
                </Text>
                <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
                  No se cancelan ni se mueven de hora: pasan a la cola de sin asignar, para que
                  alguien las reparta.
                </Text>
              </>
            )}
          </View>
        ) : null}

        {crear.isError ? (
          <InlineError
            compact
            title="No se pudo cargar la ausencia"
            description={mensajeDeError(crear.error)}
          />
        ) : null}

        <View style={estilos.acciones}>
          <Button
            variant="secondary"
            disabled={!entrada || rangoInvalido}
            loading={previsualizar.isPending}
            onPress={() => entrada && previsualizar.mutate(entrada)}
          >
            Ver qué citas afecta
          </Button>
          <Button
            disabled={!entrada || rangoInvalido}
            loading={crear.isPending}
            onPress={() => entrada && crear.mutate(entrada, { onSuccess: limpiar })}
          >
            Cargar la ausencia
          </Button>
        </View>

        {crear.data ? (
          <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
            {crear.data.citas_desasignadas === 0
              ? 'Ausencia cargada. No había ninguna cita asignada adentro del rango.'
              : `Ausencia cargada. ${crear.data.citas_desasignadas} cita(s) quedaron sin profesional.`}
          </Text>
        ) : null}
      </View>

      <View style={[tarjeta, sombra('--shadow-sm'), estilos.bloque]}>
        <Text style={[texto('overline'), { fontWeight: '700', color: t['--text-subtle'] }]}>
          CARGADAS
        </Text>
        {consulta.isPending ? (
          <Skeleton height={56} />
        ) : consulta.isError ? (
          <InlineError
            title="No se pudieron cargar las ausencias"
            onRetry={() => consulta.refetch()}
          />
        ) : consulta.data.length === 0 ? (
          <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
            No hay ninguna ausencia cargada.
          </Text>
        ) : (
          consulta.data.map((ausencia) => (
            <FilaDeAusencia
              key={ausencia.id}
              ausencia={ausencia}
              nombre={nombrePorId.get(ausencia.veterinario_id) ?? 'Del plantel'}
              zonaHoraria={zonaHoraria}
              dandoDeBaja={baja.isPending}
              onDarDeBaja={() => baja.mutate(ausencia.id)}
            />
          ))
        )}
        {baja.isError ? (
          <InlineError
            compact
            title="No se pudo dar de baja"
            description={mensajeDeError(baja.error)}
          />
        ) : null}
      </View>
    </View>
  );
}

interface FilaProps {
  ausencia: Ausencia;
  nombre: string;
  zonaHoraria: string | undefined;
  dandoDeBaja: boolean;
  onDarDeBaja: () => void;
}

function FilaDeAusencia({ ausencia, nombre, zonaHoraria, dandoDeBaja, onDarDeBaja }: FilaProps) {
  const { t, texto } = useTheme();
  const formato = new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: zonaHoraria,
  });

  return (
    <View style={[estilos.filaDeLista, { borderTopColor: t['--border-subtle'] }]}>
      <View style={estilos.datos}>
        <Text style={[texto('body'), { fontWeight: '600', color: t['--text-strong'] }]}>
          {nombre}
        </Text>
        <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
          {`${formato.format(new Date(ausencia.desde))} → ${formato.format(new Date(ausencia.hasta))}`}
        </Text>
      </View>
      {/*
        Dar de baja no devuelve las citas a quien las tenía: siguen sin
        profesional. Se dice acá porque es lo contrario de lo que cualquiera
        esperaría.
      */}
      <Button variant="ghost" size="sm" loading={dandoDeBaja} onPress={onDarDeBaja}>
        Dar de baja
      </Button>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { gap: 16 },
  bloque: { gap: 12 },
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' },
  campo: { flex: 1, minWidth: 130 },
  campoAncho: { flex: 1, minWidth: 260 },
  acciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center' },
  efecto: { gap: 4 },
  filaDeLista: {
    borderTopWidth: 1,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  datos: { flex: 1, gap: 2 },
});
