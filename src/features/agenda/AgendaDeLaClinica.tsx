import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  ESTADO_DE_CITA,
  SIN_ASIGNAR,
  type CitaConPaciente,
  type EstadoDeCita,
  type TipoDeCita,
} from '../../api/cita';
import {
  Avatar,
  Input,
  InlineError,
  Presionable,
  Select,
  Tabs,
  type ItemDeTab,
  type OpcionDeSelect,
} from '../../components';
import { useSesion } from '../../hooks/useSesion';
import { sombra, useTheme, type Tokens } from '../../theme';
import {
  CalendarioDeCitas,
  filtrarPorMascota,
  MODO_DE_CALENDARIO,
  rangoDelPeriodo,
  type ModoDeCalendario,
} from '../citas';
import { horaCorta, hoyEnLaClinica } from '../paciente/formato';
import { usePlantel } from '../veterinario/queries';

import { useAgenda } from './queries';

/**
 * Agenda de la clínica (Alcance de Plataformas, 3.6).
 *
 * Se mira en el calendario, por semana o por mes, con las citas del período
 * debajo de la grilla agrupadas por día. El período **es** la consulta: lo que se
 * le pide a la API son las citas entre la primera y la última casilla de la
 * grilla, así que moverse de semana no filtra en el cliente, vuelve a preguntar.
 *
 * Reemplazó al selector de ventana ("próximos 7 / 30 / 90 días"): con la grilla,
 * el rango es el que se está mirando, y dos maneras de decir *cuándo* se
 * contradicen apenas alguien mueve una. Lo que se perdió con el cambio es ver
 * las vencidas de meses atrás sin navegar hasta ellas; el filtro de estado
 * sigue, pero acota dentro del período.
 *
 * Abre en las citas de quien mira y en el período de hoy; el selector de
 * profesional lleva a toda la clínica o a lo que falta repartir, y la búsqueda
 * acota por mascota dentro de lo que ya vino.
 *
 * No se dibuja como grilla horaria: sin agenda por profesional, dos citas de la
 * misma hora no colisionan y una franja sugeriría que sí (Modelo de Datos, 4.7).
 * Cuando la Cita lleve horario propio por profesional, ese es el momento de
 * cambiarla.
 */
const ETIQUETA_DE_TIPO: Record<TipoDeCita, string> = {
  vacuna: 'Vacuna',
  control: 'Control',
  cirugia: 'Cirugía',
};

/**
 * En versalitas gritadas se leía como una alarma; lo que dice es en qué quedó la
 * cita, y para eso alcanza con el color y la negrita.
 */
const ETIQUETA_DE_ESTADO: Record<EstadoDeCita, string> = {
  pendiente: 'Pendiente',
  cumplido: 'Cumplida',
  vencido: 'Vencida',
};

const VISTAS: ItemDeTab<ModoDeCalendario>[] = [
  { value: MODO_DE_CALENDARIO.SEMANA, label: 'Semana' },
  { value: MODO_DE_CALENDARIO.MES, label: 'Mes' },
];

/** Valor del filtro cuando no se acota a nadie. Vacío para que la API no lo reciba. */
const TODOS_LOS_PROFESIONALES = '';

/** Valor del filtro de estado que no acota. No viaja: es la ausencia del parámetro. */
const TODOS_LOS_ESTADOS = 'todas';

const ESTADOS: OpcionDeSelect[] = [
  { value: TODOS_LOS_ESTADOS, label: 'Todas' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'vencido', label: 'Vencidas' },
  { value: 'cumplido', label: 'Cumplidas' },
];

function tono(t: Tokens, estado: EstadoDeCita): { fondo: string; texto: string } {
  const tabla: Record<EstadoDeCita, { fondo: string; texto: string }> = {
    pendiente: { fondo: t['--appt-pending-surface'], texto: t['--appt-pending'] },
    cumplido: { fondo: t['--appt-done-surface'], texto: t['--appt-done'] },
    vencido: { fondo: t['--appt-overdue-surface'], texto: t['--appt-overdue'] },
  };
  return tabla[estado];
}

interface AgendaProps {
  onAbrirPaciente: (pacienteId: string) => void;
}

export function AgendaDeLaClinica({ onAbrirPaciente }: AgendaProps) {
  const { t, px, texto } = useTheme();
  // La semana es lo que abre: la pregunta de todos los días es qué hay esta
  // semana, y el mes entero la contesta con más de lo que hace falta.
  const [modo, setModo] = useState<ModoDeCalendario>(MODO_DE_CALENDARIO.SEMANA);
  const [ancla, setAncla] = useState(hoyEnLaClinica());
  // El calendario abre mostrando todo lo que hay en el período: acotar de
  // entrada a las pendientes dibujaría una semana con menos citas de las que
  // tuvo, que es lo contrario de lo que un calendario tiene que decir.
  const [estado, setEstado] = useState(TODOS_LOS_ESTADOS);
  const [busqueda, setBusqueda] = useState('');
  const plantel = usePlantel();

  // La agenda abre en las citas de quien mira: es su día de trabajo, y las del
  // resto del plantel son contexto que se pide, no lo primero que se ve. Un
  // clínica_admin no tiene ficha de veterinario y abre en toda la clínica, que
  // es exactamente lo que administra.
  const miVeterinarioId = useSesion().sesion?.usuario.veterinario_id ?? null;
  const [profesional, setProfesional] = useState(miVeterinarioId ?? TODOS_LOS_PROFESIONALES);

  const filtros = useMemo(() => {
    const { desde, hasta } = rangoDelPeriodo(ancla, modo);
    return {
      desde,
      hasta,
      ...(estado === TODOS_LOS_ESTADOS ? {} : { estado: estado as EstadoDeCita }),
      ...(profesional === TODOS_LOS_PROFESIONALES ? {} : { veterinario_id: profesional }),
      limite: 200,
    };
  }, [ancla, modo, estado, profesional]);

  const agenda = useAgenda(filtros);

  // La búsqueda acota lo que ya vino del período, sin volver a la red: escribir
  // no debería esperar a nadie, y lo que se busca es lo que la grilla muestra.
  const citas = useMemo(
    () => filtrarPorMascota(agenda.data ?? [], busqueda),
    [agenda.data, busqueda],
  );

  return (
    <View style={[estilos.raiz, { backgroundColor: t['--surface-page'] }]}>
      <ScrollView>
        <View
          style={[
            estilos.contenido,
            { maxWidth: px('--content-max'), paddingHorizontal: px('--gutter-page') },
          ]}
        >
          <View style={estilos.encabezado}>
            <View style={estilos.titulo}>
              <Text style={[texto('h1'), { color: t['--text-strong'] }]}>Agenda</Text>
              <Text style={[texto('body-lg'), { color: t['--text-muted'] }]}>
                Las citas de toda la clínica. Es una agenda de la clínica, no de cada profesional:
                dos turnos de la misma hora no se pisan.
              </Text>
            </View>
          </View>

          <View style={estilos.filtros}>
            <View style={estilos.campo}>
              <Input
                label="Buscar mascota"
                value={busqueda}
                onChangeText={setBusqueda}
                placeholder="Nombre de la mascota"
                autoCapitalize="none"
              />
            </View>
            <View style={estilos.campo}>
              <Select label="Estado" options={ESTADOS} value={estado} onChange={setEstado} />
            </View>
            <View style={estilos.campo}>
              <Select
                label="Profesional"
                options={[
                  // "Mis citas" va fijo y no como el nombre propio dentro del
                  // plantel: el plantel llega por red y hasta que llega el
                  // selector mostraría vacío justo lo que viene elegido.
                  ...(miVeterinarioId ? [{ value: miVeterinarioId, label: 'Mis citas' }] : []),
                  { value: TODOS_LOS_PROFESIONALES, label: 'Toda la clínica' },
                  // Lo que todavía hay que repartir: es la lista de trabajo del
                  // admin de la agenda, no un profesional más.
                  { value: SIN_ASIGNAR, label: 'Sin asignar' },
                  // Sin el que mira: ya está arriba, y repetirlo daría dos
                  // opciones que hacen lo mismo.
                  ...(plantel.data ?? [])
                    .filter((veterinario) => veterinario.id !== miVeterinarioId)
                    .map((veterinario) => ({
                      value: veterinario.id,
                      label: veterinario.nombre,
                    })),
                ]}
                value={profesional}
                onChange={setProfesional}
              />
            </View>
            <View style={estilos.campo}>
              <Tabs items={VISTAS} value={modo} onChange={setModo} variant="pill" />
            </View>
          </View>

          {agenda.isError ? (
            <InlineError title="No se pudo cargar la agenda" onRetry={() => agenda.refetch()} />
          ) : (
            <CalendarioDeCitas
              citas={citas}
              modo={modo}
              ancla={ancla}
              onAncla={setAncla}
              cargando={agenda.isPending}
              colorDePunto={(tokens, fila) => tono(tokens, fila.cita.estado).texto}
              renderCita={(fila) => <FilaDeAgenda fila={fila} onAbrir={onAbrirPaciente} />}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

/** Una cita en la lista del día: la hora, la mascota y quién la atiende. */
function FilaDeAgenda({
  fila,
  onAbrir,
}: {
  fila: CitaConPaciente;
  onAbrir: (pacienteId: string) => void;
}) {
  const { t, px, texto } = useTheme();
  const { cita, paciente_nombre, paciente_especie, veterinario_nombre, zona_horaria } = fila;
  const colores = tono(t, cita.estado);

  return (
    <Presionable
      onPress={() => onAbrir(cita.paciente_id)}
      fondo={t['--surface-card']}
      fondoDestacado={t['--surface-hover']}
      borde={t['--border-default']}
      style={[estilos.fila, sombra('--shadow-sm'), { borderRadius: px('--radius-card') }]}
    >
      <View
        style={[estilos.hora, { backgroundColor: colores.fondo, borderRadius: px('--radius-md') }]}
      >
        <Text style={[texto('body-strong'), { color: colores.texto }]}>
          {horaCorta(cita.fecha_programada, zona_horaria)}
        </Text>
      </View>
      <Avatar name={paciente_nombre} species={paciente_especie} size="sm" />
      <View style={estilos.flexible}>
        <Text style={[texto('body-strong'), { color: t['--text-strong'] }]}>{paciente_nombre}</Text>
        <Text style={[texto('body-sm'), { color: t['--text-subtle'] }]}>
          {/* Sin profesional no es un dato faltante: es una cita de la clínica
              que todavía no se repartió. */}
          {veterinario_nombre
            ? `${ETIQUETA_DE_TIPO[cita.tipo]} · ${veterinario_nombre}`
            : `${ETIQUETA_DE_TIPO[cita.tipo]} · sin asignar`}
        </Text>
        {/* El estado va dentro de la columna de texto y no como una tercera
            columna a la derecha: en un teléfono, la hora, el avatar y el nombre
            ya se comen el ancho, y la etiqueta terminaba fuera de la pantalla. */}
        {cita.estado !== ESTADO_DE_CITA.PENDIENTE ? (
          <Text style={[texto('caption'), { fontWeight: '700', color: colores.texto }]}>
            {ETIQUETA_DE_ESTADO[cita.estado]}
          </Text>
        ) : null}
      </View>
    </Presionable>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  contenido: { width: '100%', alignSelf: 'center', paddingVertical: 32, gap: 20 },
  encabezado: { flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 },
  titulo: { flex: 1, minWidth: 260, gap: 6 },
  filtros: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', gap: 12 },
  campo: { flexGrow: 1, flexBasis: 200, minWidth: 180, maxWidth: 260 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, padding: 12 },
  hora: { paddingVertical: 8, paddingHorizontal: 12, minWidth: 68, alignItems: 'center' },
  // Sin `minWidth`, la columna de texto se encoge antes que desbordar: en un
  // teléfono angosto el nombre corta en dos líneas y nada se sale de la
  // pantalla.
  flexible: { flex: 1, minWidth: 0, gap: 2 },
});
