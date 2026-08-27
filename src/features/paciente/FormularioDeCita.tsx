import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Clinica } from '../../api/clinica';
import { turnosDelDia } from '../clinica/grilla';
import { TIPO_DE_CITA, type CrearCitaEntrada, type TipoDeCita } from '../../api/cita';
import { Button, Checkbox, InlineError, Select, type OpcionDeSelect } from '../../components';
import { useTheme } from '../../theme';

import { aIso, fechaConDiaDeSemana } from './formato';

/**
 * Alta y reagenda de una cita.
 *
 * Solo ofrece horas de la grilla de la clínica que atiende a la mascota: el
 * backend las rechaza igual, pero ofrecer una hora y después fallar es un error
 * que la interfaz puede evitar. Un turno que ya pasó se muestra deshabilitado en
 * vez de desaparecer — el hueco confunde más que el gris.
 */
const DIAS_OFRECIDOS = 60;

const TIPOS: OpcionDeSelect<TipoDeCita>[] = [
  { value: TIPO_DE_CITA.VACUNA, label: 'Próxima vacuna' },
  { value: TIPO_DE_CITA.CONTROL, label: 'Control' },
  { value: TIPO_DE_CITA.CIRUGIA, label: 'Cirugía programada' },
];

interface FormularioDeCitaProps {
  clinica: Clinica | undefined;
  /** En la reagenda el tipo no se toca: qué control corresponde es criterio clínico. */
  soloFechaYAviso?: boolean;
  valorInicial?: Partial<CrearCitaEntrada>;
  enviando: boolean;
  error?: string;
  etiquetaGuardar: string;
  onGuardar: (entrada: CrearCitaEntrada) => void;
  onCancelar: () => void;
}

export function FormularioDeCita({
  clinica,
  soloFechaYAviso = false,
  valorInicial,
  enviando,
  error,
  etiquetaGuardar,
  onGuardar,
  onCancelar,
}: FormularioDeCitaProps) {
  const { t, px, texto } = useTheme();

  const [tipo, setTipo] = useState<TipoDeCita>(valorInicial?.tipo ?? TIPO_DE_CITA.CONTROL);
  const [dia, setDia] = useState(() =>
    valorInicial?.fecha_programada
      ? aIso(new Date(valorInicial.fecha_programada))
      : aIso(new Date()),
  );
  const [turno, setTurno] = useState<string | null>(valorInicial?.fecha_programada ?? null);
  const [notificar, setNotificar] = useState(valorInicial?.notificar_tutor ?? true);

  const dias: OpcionDeSelect[] = useMemo(() => {
    const hoy = new Date();
    return Array.from({ length: DIAS_OFRECIDOS }, (_, i) => {
      const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + i);
      const iso = aIso(d);
      const conDia = fechaConDiaDeSemana(iso);
      if (i === 0) return { value: iso, label: `Hoy · ${conDia}` };
      if (i === 1) return { value: iso, label: `Mañana · ${conDia}` };
      return { value: iso, label: conDia };
    });
  }, []);

  const turnos = useMemo(() => (clinica ? turnosDelDia(clinica, dia) : []), [clinica, dia]);
  const disponibles = turnos.filter((t) => t.disponible);

  if (!clinica) {
    return (
      <View style={{ padding: px('--gutter-card') }}>
        <InlineError
          compact
          title="Falta el horario de la clínica"
          description="Sin el horario de atención no se puede saber qué horas son válidas. Pedile al administrador que lo complete en el panel."
        />
      </View>
    );
  }

  return (
    <View
      style={[
        estilos.form,
        { backgroundColor: t['--surface-sunken'], borderBottomColor: t['--border-subtle'] },
      ]}
    >
      <View style={estilos.fila}>
        {!soloFechaYAviso ? (
          <View style={estilos.campo}>
            <Select label="Tipo" options={TIPOS} value={tipo} onChange={setTipo} />
          </View>
        ) : null}
        <View style={estilos.campo}>
          <Select
            label="Día"
            options={dias}
            value={dia}
            onChange={(valor) => {
              setDia(valor);
              setTurno(null);
            }}
          />
        </View>
      </View>

      <View style={estilos.turnos}>
        <Text style={[texto('caption'), { color: t['--text-muted'] }]}>
          {`Turnos de ${clinica.duracion_turno_minutos} min · ${clinica.hora_apertura} a ${clinica.hora_cierre}`}
        </Text>
        {turnos.length === 0 ? (
          <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
            La clínica no tiene turnos configurados para este día.
          </Text>
        ) : disponibles.length === 0 ? (
          <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
            No quedan turnos libres hoy. Probá con otro día.
          </Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={estilos.grillaDeTurnos}>
              {turnos.map((opcion) => {
                const elegido = turno === opcion.valor;
                return (
                  <Pressable
                    key={opcion.valor}
                    accessibilityRole="button"
                    accessibilityState={{ selected: elegido, disabled: !opcion.disponible }}
                    accessibilityLabel={
                      opcion.disponible ? opcion.etiqueta : `${opcion.etiqueta}, ya pasó`
                    }
                    disabled={!opcion.disponible}
                    onPress={() => setTurno(opcion.valor)}
                    style={[
                      estilos.turno,
                      {
                        borderRadius: px('--radius-control'),
                        backgroundColor: elegido
                          ? t['--color-primary-fill']
                          : opcion.disponible
                            ? t['--surface-card']
                            : t['--surface-disabled'],
                        borderColor: elegido ? t['--color-primary-fill'] : t['--border-default'],
                      },
                    ]}
                  >
                    <Text
                      style={[
                        texto('body-sm'),
                        {
                          fontWeight: '600',
                          color: elegido
                            ? t['--color-primary-fg']
                            : opcion.disponible
                              ? t['--text-strong']
                              : t['--text-subtle'],
                        },
                      ]}
                    >
                      {opcion.etiqueta}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        )}
      </View>

      <Checkbox label="Avisarle al tutor por la app" checked={notificar} onChange={setNotificar} />

      {error ? <InlineError compact title="No se pudo agendar" description={error} /> : null}

      <View style={estilos.acciones}>
        <Button
          size="sm"
          disabled={!turno}
          loading={enviando}
          onPress={() =>
            turno && onGuardar({ tipo, fecha_programada: turno, notificar_tutor: notificar })
          }
        >
          {etiquetaGuardar}
        </Button>
        <Button variant="ghost" size="sm" onPress={onCancelar}>
          Cancelar
        </Button>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  form: { paddingVertical: 16, paddingHorizontal: 20, gap: 14, borderBottomWidth: 1 },
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  campo: { flexGrow: 1, flexBasis: 200, minWidth: 180 },
  turnos: { gap: 8 },
  grillaDeTurnos: { flexDirection: 'row', gap: 8 },
  turno: { paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1 },
  acciones: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
});
