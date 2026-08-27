import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  esReagendable,
  type Cita,
  type CrearCitaEntrada,
  type EstadoDeCita,
  type TipoDeCita,
} from '../../api/cita';
import type { Clinica } from '../../api/clinica';
import type { Veterinario } from '../../api/veterinario';
import { Button, EmptyState, Icon, IconButton, InlineError } from '../../components';
import { useTheme, type Tokens } from '../../theme';

import { aIso, desdeIso, diaDeInstante, horaCorta, hoyEnLaClinica, momentoCorto } from './formato';
import { FormularioDeCita } from './FormularioDeCita';
import { Seccion } from './Seccion';

/**
 * Zona 3.3: el calendario del paciente.
 *
 * `estado` no se edita nunca desde acá: nace pendiente, lo mueve a cumplido el
 * Evento clínico que referencia la cita, y a vencido un job del backend (Modelo
 * de Datos, 4.7). Por eso no hay control que lo cambie — solo se muestra.
 *
 * La grilla es mensual y cada celda lista los turnos del día con su hora.
 * `fecha_programada` es un instante ISO con zona, así que agrupar por día pasa
 * por `diaDeInstante`: cortar el string por los primeros diez caracteres correría
 * un turno de la mañana al día anterior según la zona.
 */
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const ETIQUETA_DE_TIPO: Record<TipoDeCita, string> = {
  vacuna: 'Próxima vacuna',
  control: 'Control',
  cirugia: 'Cirugía programada',
};

const ETIQUETA_DE_ESTADO: Record<EstadoDeCita, string> = {
  pendiente: 'Pendiente',
  cumplido: 'Cumplido',
  vencido: 'Vencido',
};

function tono(t: Tokens, estado: EstadoDeCita): { fondo: string; texto: string } {
  const tabla: Record<EstadoDeCita, { fondo: string; texto: string }> = {
    pendiente: { fondo: t['--appt-pending-surface'], texto: t['--appt-pending'] },
    cumplido: { fondo: t['--appt-done-surface'], texto: t['--appt-done'] },
    vencido: { fondo: t['--appt-overdue-surface'], texto: t['--appt-overdue'] },
  };
  return tabla[estado];
}

interface CalendarioProps {
  citas: Cita[] | undefined;
  /** Define la grilla de horas ofrecidas. Es la clínica que atiende a la mascota. */
  clinica: Clinica | undefined;
  /** Plantel de esa clínica, para poder asignar profesional. */
  plantel: Veterinario[] | undefined;
  error: boolean;
  onReintentar: () => void;
  esMovil: boolean;
  bloqueado: boolean;
  motivoBloqueo: string;
  onAgendar: (entrada: CrearCitaEntrada) => void;
  onReagendar: (cita: Cita, entrada: CrearCitaEntrada) => void;
  guardando: boolean;
  errorAlGuardar?: string;
}

export function SeccionCalendario({
  citas,
  clinica,
  plantel,
  error,
  onReintentar,
  esMovil,
  bloqueado,
  motivoBloqueo,
  onAgendar,
  onReagendar,
  guardando,
  errorAlGuardar,
}: CalendarioProps) {
  const { t, px, texto } = useTheme();
  const [foco, setFoco] = useState(() => new Date());
  // null = cerrado; "nueva" = alta; un id = reagenda de esa cita.
  const [formulario, setFormulario] = useState<string | null>(null);

  const lista = useMemo(() => citas ?? [], [citas]);
  const porDia = useMemo(() => {
    const mapa = new Map<string, Cita[]>();
    for (const cita of lista) {
      const clave = diaDeInstante(cita.fecha_programada, clinica?.zona_horaria);
      const dia = mapa.get(clave);
      if (dia) dia.push(cita);
      else mapa.set(clave, [cita]);
    }
    return mapa;
  }, [lista, clinica?.zona_horaria]);

  const celdas = useMemo(() => construirMes(foco), [foco]);
  const hoy = hoyEnLaClinica(clinica?.zona_horaria);

  const accion = (
    <Button
      size="sm"
      iconLeft="calendar-plus"
      disabled={bloqueado}
      accessibilityLabel={bloqueado ? motivoBloqueo : undefined}
      onPress={() => setFormulario((abierto) => (abierto === 'nueva' ? null : 'nueva'))}
    >
      Agendar cita
    </Button>
  );

  const formularioDeAlta =
    formulario === 'nueva' && !bloqueado ? (
      <FormularioDeCita
        clinica={clinica}
        plantel={plantel}
        enviando={guardando}
        error={errorAlGuardar}
        etiquetaGuardar="Agendar"
        onGuardar={(entrada) => {
          onAgendar(entrada);
          setFormulario(null);
        }}
        onCancelar={() => setFormulario(null)}
      />
    ) : null;

  if (error) {
    return (
      <Seccion titulo="Calendario del paciente" accion={accion}>
        <View style={{ padding: px('--gutter-card') }}>
          <InlineError title="No se pudo cargar el calendario" onRetry={onReintentar} />
        </View>
      </Seccion>
    );
  }

  if (lista.length === 0) {
    return (
      <Seccion titulo="Calendario del paciente" accion={accion}>
        {formularioDeAlta}
        <View style={{ padding: px('--gutter-card') }}>
          <EmptyState
            icon="calendar-days"
            title="No hay citas agendadas"
            description="Agendá la próxima vacuna o el control posquirúrgico y el tutor recibe el aviso."
            action={
              <Button
                iconLeft="calendar-plus"
                disabled={bloqueado}
                accessibilityLabel={bloqueado ? motivoBloqueo : undefined}
                onPress={() => setFormulario('nueva')}
              >
                Agendar cita
              </Button>
            }
          />
        </View>
      </Seccion>
    );
  }

  return (
    <Seccion titulo="Calendario del paciente" nota="El estado lo mueve el sistema" accion={accion}>
      {formularioDeAlta}
      <View style={[estilos.navegacion, { borderBottomColor: t['--border-subtle'] }]}>
        <Text style={[texto('h3'), { color: t['--text-strong'] }]}>
          {`${MESES[foco.getMonth()]} ${foco.getFullYear()}`}
        </Text>
        <IconButton
          icon="chevron-left"
          label="Mes anterior"
          size="sm"
          onPress={() => setFoco(new Date(foco.getFullYear(), foco.getMonth() - 1, 1))}
        />
        <IconButton
          icon="chevron-right"
          label="Mes siguiente"
          size="sm"
          onPress={() => setFoco(new Date(foco.getFullYear(), foco.getMonth() + 1, 1))}
        />
      </View>

      <ScrollView horizontal={esMovil} showsHorizontalScrollIndicator={false}>
        <View
          style={[
            estilos.grilla,
            {
              minWidth: esMovil ? 620 : undefined,
              backgroundColor: t['--border-subtle'],
              borderColor: t['--border-subtle'],
              borderRadius: px('--radius-md'),
              marginHorizontal: px('--gutter-card'),
            },
          ]}
        >
          <View style={[estilos.semana, { backgroundColor: t['--surface-sunken'] }]}>
            {DIAS.map((dia) => (
              <Text
                key={dia}
                style={[texto('caption'), estilos.encabezadoDia, { color: t['--text-muted'] }]}
              >
                {dia}
              </Text>
            ))}
          </View>

          {celdas.map((semana, i) => (
            <View key={i} style={estilos.semana}>
              {semana.map((dia) => {
                const iso = aIso(dia);
                const delMes = dia.getMonth() === foco.getMonth();
                const delDia = porDia.get(iso) ?? [];
                return (
                  <View
                    key={iso}
                    style={[
                      estilos.celda,
                      { backgroundColor: delMes ? t['--surface-card'] : t['--surface-sunken'] },
                    ]}
                  >
                    <View
                      style={[
                        estilos.numero,
                        iso === hoy && { backgroundColor: t['--color-primary-fill'] },
                      ]}
                    >
                      <Text
                        style={[
                          texto('body-sm'),
                          {
                            fontWeight: '600',
                            color:
                              iso === hoy
                                ? t['--color-primary-fg']
                                : delMes
                                  ? t['--text-strong']
                                  : t['--text-subtle'],
                          },
                        ]}
                      >
                        {dia.getDate()}
                      </Text>
                    </View>
                    {delDia.map((cita) => {
                      const colores = tono(t, cita.estado);
                      return (
                        <View
                          key={cita.id}
                          style={[
                            estilos.pastilla,
                            { borderRadius: px('--radius-sm'), backgroundColor: colores.fondo },
                          ]}
                        >
                          <Text
                            numberOfLines={2}
                            style={[texto('caption'), { fontWeight: '600', color: colores.texto }]}
                          >
                            {ETIQUETA_DE_TIPO[cita.tipo]}
                          </Text>
                          <Text style={[texto('caption'), { color: colores.texto, opacity: 0.8 }]}>
                            {horaCorta(cita.fecha_programada)}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={{ padding: px('--gutter-card'), gap: 10 }}>
        <Text style={[texto('overline'), { fontWeight: '700', color: t['--text-subtle'] }]}>
          TODAS LAS CITAS
        </Text>
        {lista.map((cita) => {
          const colores = tono(t, cita.estado);
          return (
            <View key={cita.id} style={estilos.filaCita}>
              <View
                style={[
                  estilos.bloqueCita,
                  { borderRadius: px('--radius-md'), backgroundColor: colores.fondo },
                ]}
              >
                <View style={estilos.cabeceraCita}>
                  <Text
                    style={[texto('body-sm'), { fontWeight: '700', color: t['--text-strong'] }]}
                  >
                    {momentoCorto(cita.fecha_programada, clinica?.zona_horaria)}
                  </Text>
                  <View style={estilos.estado}>
                    <View style={[estilos.punto, { backgroundColor: colores.texto }]} />
                    <Text style={[texto('overline'), { fontWeight: '600', color: colores.texto }]}>
                      {ETIQUETA_DE_ESTADO[cita.estado].toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={[texto('body-strong'), { color: colores.texto }]}>
                  {ETIQUETA_DE_TIPO[cita.tipo]}
                </Text>
                <Text style={[texto('caption'), { color: t['--text-muted'] }]}>
                  {cita.notificar_tutor ? 'Se notifica al tutor' : 'Sin aviso al tutor'}
                </Text>
              </View>

              {/* Solo lo pendiente se reagenda: mover una cita es mover algo que
                  todavía va a pasar (regla 2.2). */}
              {esReagendable(cita) ? (
                <Button
                  variant="secondary"
                  size="sm"
                  iconLeft="calendar-clock"
                  disabled={bloqueado}
                  accessibilityLabel={bloqueado ? motivoBloqueo : undefined}
                  onPress={() => setFormulario((abierto) => (abierto === cita.id ? null : cita.id))}
                >
                  Reagendar
                </Button>
              ) : (
                <View style={estilos.fija}>
                  <Icon name="lock" size={13} color={t['--text-subtle']} />
                  <Text style={[texto('caption'), { color: t['--text-subtle'] }]}>
                    {cita.estado === 'cumplido'
                      ? 'Cumplida: no se reagenda'
                      : 'Vencida: no se reagenda'}
                  </Text>
                </View>
              )}

              {formulario === cita.id && !bloqueado ? (
                <View style={estilos.reagenda}>
                  {/* La reagenda no cambia el tipo: qué control corresponde es
                      criterio clínico, no del calendario (Reglas de Negocio, 3.2). */}
                  <FormularioDeCita
                    clinica={clinica}
                    plantel={plantel}
                    soloFechaYAviso
                    valorInicial={{
                      id: cita.id,
                      tipo: cita.tipo,
                      fecha_programada: cita.fecha_programada,
                      notificar_tutor: cita.notificar_tutor,
                      veterinario_id: cita.veterinario_id ?? undefined,
                    }}
                    enviando={guardando}
                    error={errorAlGuardar}
                    etiquetaGuardar="Reagendar"
                    onGuardar={(entrada) => {
                      onReagendar(cita, entrada);
                      setFormulario(null);
                    }}
                    onCancelar={() => setFormulario(null)}
                  />
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </Seccion>
  );
}

/** Semanas del mes que contiene `foco`, completadas con los días vecinos. */
function construirMes(foco: Date): Date[][] {
  const primero = new Date(foco.getFullYear(), foco.getMonth(), 1);
  const inicio = new Date(
    primero.getFullYear(),
    primero.getMonth(),
    primero.getDate() - primero.getDay(),
  );
  const ultimoDia = new Date(foco.getFullYear(), foco.getMonth() + 1, 0).getDate();
  const semanas = Math.ceil((primero.getDay() + ultimoDia) / 7);

  return Array.from({ length: semanas }, (_, s) =>
    Array.from(
      { length: 7 },
      (_, d) => new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + s * 7 + d),
    ),
  );
}

export { desdeIso };

const estilos = StyleSheet.create({
  navegacion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  grilla: { borderWidth: 1, overflow: 'hidden', gap: 1 },
  semana: { flexDirection: 'row', gap: 1 },
  encabezadoDia: { flex: 1, textAlign: 'center', paddingVertical: 8 },
  celda: { flex: 1, minHeight: 88, padding: 8, gap: 6 },
  numero: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pastilla: { paddingVertical: 3, paddingHorizontal: 8 },
  filaCita: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  bloqueCita: { flex: 1, minWidth: 240, paddingVertical: 12, paddingHorizontal: 14, gap: 3 },
  cabeceraCita: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  estado: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  punto: { width: 6, height: 6, borderRadius: 3 },
  fija: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 150 },
  reagenda: { width: '100%' },
});
