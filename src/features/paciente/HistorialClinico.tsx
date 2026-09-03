import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Adjunto } from '../../api/adjunto';
import { TIPO_DE_EVENTO, type EventoClinico, type TipoDeEvento } from '../../api/evento-clinico';
import { loDeclaroElTutor } from '../../api/historial';
import type { Veterinario } from '../../api/veterinario';
import {
  Badge,
  Button,
  EmptyState,
  Icon,
  InlineError,
  MenuDeAcciones,
  Select,
  type NombreDeIcono,
  type OpcionDeSelect,
} from '../../components';
import { useTheme, type Tokens } from '../../theme';

import { fechaConPrecision, tamanoDeArchivo } from './formato';
import { MarcaDeOrigen } from './MarcaDeOrigen';
import { Seccion } from './Seccion';
import { VisorDeAdjunto } from './VisorDeAdjunto';

/**
 * Zona 3.1: el historial, en timeline descendente.
 *
 * Cada tipo de evento se reconoce de un vistazo por su ícono y su color, y los
 * datos estructurados se muestran **tipados**, no como texto suelto: es el
 * motivo entero por el que el contrato los valida contra un esquema fijo en vez
 * de aceptar JSON libre (Modelo de Datos, 4.5).
 */
const POR_PAGINA = 6;

interface MetaDeTipo {
  icono: NombreDeIcono;
  color: (t: Tokens) => string;
  fondo: (t: Tokens) => string;
  etiqueta: string;
}

const META: Record<TipoDeEvento, MetaDeTipo> = {
  consulta: {
    icono: 'stethoscope',
    color: (t) => t['--color-primary-strong'],
    fondo: (t) => t['--color-primary-soft'],
    etiqueta: 'Consulta',
  },
  vacuna: {
    icono: 'syringe',
    color: (t) => t['--success-600'],
    fondo: (t) => t['--success-50'],
    etiqueta: 'Vacuna',
  },
  cirugia: {
    icono: 'scissors',
    color: (t) => t['--danger-600'],
    fondo: (t) => t['--danger-50'],
    etiqueta: 'Cirugía',
  },
  control: {
    icono: 'clipboard-check',
    color: (t) => t['--info-600'],
    fondo: (t) => t['--info-50'],
    etiqueta: 'Control',
  },
  urgencia: {
    icono: 'alert-triangle',
    color: (t) => t['--danger-600'],
    fondo: (t) => t['--danger-100'],
    etiqueta: 'Urgencia',
  },
  medicacion: {
    icono: 'pill',
    color: (t) => t['--wayka-violeta'],
    fondo: (t) => t['--surface-brand-soft'],
    etiqueta: 'Medicación',
  },
  alergia: {
    icono: 'shield-alert',
    color: (t) => t['--danger-600'],
    fondo: (t) => t['--alert-allergy-surface'],
    etiqueta: 'Alergia',
  },
};

/** Etiquetas legibles de `campo_estructurado`, por tipo. */
const ETIQUETAS_DE_CAMPO: Record<string, string> = {
  nombre_vacuna: 'Vacuna',
  lote: 'Lote',
  fecha_proxima_dosis: 'Próxima dosis',
  nombre_droga: 'Droga',
  dosis: 'Dosis',
  frecuencia: 'Frecuencia',
  alergeno: 'Alérgeno',
  severidad: 'Severidad',
  reaccion: 'Reacción',
};

type FiltroDeTipo = TipoDeEvento | 'todos';

interface HistorialProps {
  eventos: EventoClinico[] | undefined;
  adjuntosPorEvento: Map<string, Adjunto[]>;
  plantel: Map<string, Veterinario> | undefined;
  cargando: boolean;
  error: boolean;
  onReintentar: () => void;
  esMovil: boolean;
  bloqueado: boolean;
  motivoBloqueo: string;
  /** `true` cuando el paciente no tiene ningún evento (distinto de "sin resultados"). */
  onCargarEvento?: () => void;
  onEditarEvento?: (evento: EventoClinico) => void;
  onDarDeBajaEvento?: (evento: EventoClinico) => void;
}

export function HistorialClinico({
  eventos,
  adjuntosPorEvento,
  plantel,
  error,
  onReintentar,
  esMovil,
  bloqueado,
  motivoBloqueo,
  onCargarEvento,
  onEditarEvento,
  onDarDeBajaEvento,
}: HistorialProps) {
  const { t, px, texto } = useTheme();
  const [filtro, setFiltro] = useState<FiltroDeTipo>('todos');
  const [pagina, setPagina] = useState(1);

  const todos = useMemo(() => eventos ?? [], [eventos]);
  const filtrados = useMemo(
    () => (filtro === 'todos' ? todos : todos.filter((e) => e.tipo === filtro)),
    [todos, filtro],
  );
  const visibles = filtrados.slice(0, pagina * POR_PAGINA);

  const opciones: OpcionDeSelect<FiltroDeTipo>[] = useMemo(() => {
    const tipos = Object.values(TIPO_DE_EVENTO);
    return [
      { value: 'todos' as const, label: `Todos los tipos (${todos.length})` },
      ...tipos.map((tipo) => ({
        value: tipo,
        label: `${META[tipo].etiqueta} (${todos.filter((e) => e.tipo === tipo).length})`,
      })),
    ];
  }, [todos]);

  return (
    <Seccion
      titulo="Historial clínico"
      nota={`${filtrados.length} de ${todos.length} eventos`}
      conSeparador={false}
    >
      {todos.length > 0 && !error ? (
        <View
          style={[
            estilos.filtros,
            {
              backgroundColor: t['--surface-sunken'],
              borderTopColor: t['--border-subtle'],
              borderBottomColor: t['--border-subtle'],
            },
          ]}
        >
          <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>Tipo</Text>
          <View style={{ minWidth: 200, maxWidth: 260 }}>
            <Select
              accessibilityLabel="Filtrar el historial por tipo de evento"
              options={opciones}
              value={filtro}
              onChange={(valor) => {
                setFiltro(valor);
                setPagina(1);
              }}
            />
          </View>
        </View>
      ) : null}

      {error ? (
        <View style={{ padding: px('--gutter-card') }}>
          <InlineError
            title="No se pudo cargar el historial"
            description="Revisá la conexión e intentá de nuevo. El resto de la ficha sigue disponible."
            onRetry={onReintentar}
          />
        </View>
      ) : filtrados.length === 0 ? (
        <View style={{ padding: px('--gutter-card') }}>
          <EmptyState
            icon="notebook-pen"
            title={todos.length === 0 ? 'Todavía no hay eventos' : 'Ningún evento coincide'}
            description={
              todos.length === 0
                ? 'Paciente nuevo: todavía no se cargó ninguna consulta, vacuna ni cirugía.'
                : 'Probá con otro tipo de evento.'
            }
            action={
              todos.length === 0 ? (
                <Button
                  iconLeft="plus"
                  disabled={bloqueado}
                  accessibilityLabel={bloqueado ? motivoBloqueo : undefined}
                  onPress={onCargarEvento}
                >
                  Cargar evento clínico
                </Button>
              ) : undefined
            }
          />
        </View>
      ) : (
        <>
          <View style={[estilos.timeline, { paddingHorizontal: px('--gutter-card') }]}>
            {visibles.map((evento, i) => (
              <FilaDeEvento
                key={evento.id}
                evento={evento}
                autor={plantel?.get(evento.usuario_id)}
                adjuntos={adjuntosPorEvento.get(evento.id) ?? []}
                ultimo={i === visibles.length - 1}
                esMovil={esMovil}
                bloqueado={bloqueado}
                motivoBloqueo={motivoBloqueo}
                onEditar={onEditarEvento}
                onDarDeBaja={onDarDeBajaEvento}
              />
            ))}
          </View>

          {visibles.length < filtrados.length ? (
            <View style={[estilos.paginado, { borderTopColor: t['--border-subtle'] }]}>
              <Button
                variant="secondary"
                size="sm"
                iconLeft="chevron-down"
                onPress={() => setPagina((p) => p + 1)}
              >
                {`Ver más eventos (${Math.min(POR_PAGINA, filtrados.length - visibles.length)})`}
              </Button>
              <Text style={[texto('caption'), { color: t['--text-subtle'] }]}>
                {`Mostrando ${visibles.length} de ${filtrados.length}`}
              </Text>
            </View>
          ) : null}
        </>
      )}
    </Seccion>
  );
}

interface FilaProps {
  evento: EventoClinico;
  autor: Veterinario | undefined;
  adjuntos: Adjunto[];
  ultimo: boolean;
  esMovil: boolean;
  bloqueado: boolean;
  motivoBloqueo: string;
  onEditar?: (evento: EventoClinico) => void;
  onDarDeBaja?: (evento: EventoClinico) => void;
}

function FilaDeEvento({
  evento,
  autor,
  adjuntos,
  ultimo,
  esMovil,
  bloqueado,
  motivoBloqueo,
  onEditar,
  onDarDeBaja,
}: FilaProps) {
  const { t, px, texto } = useTheme();
  // Cuál de los adjuntos de este evento se está mirando. Es estado de la fila y
  // no del historial: dos eventos no se abren a la vez.
  const [mirando, setMirando] = useState<Adjunto | null>(null);
  const meta = META[evento.tipo];
  const datos = Object.entries(evento.campo_estructurado ?? {}).filter(
    ([, valor]) => valor != null && valor !== '',
  );

  return (
    <View style={estilos.fila}>
      <View style={estilos.rielIzquierdo}>
        <View style={[estilos.circulo, { backgroundColor: meta.fondo(t) }]}>
          <Icon name={meta.icono} size={16} color={meta.color(t)} />
        </View>
        {!ultimo ? (
          <View style={[estilos.riel, { backgroundColor: t['--border-default'] }]} />
        ) : null}
      </View>

      <View style={[estilos.cuerpo, { paddingBottom: ultimo ? 8 : 24 }]}>
        <View style={estilos.tituloFila}>
          <Text style={[texto('h4'), { color: t['--text-strong'] }]}>{meta.etiqueta}</Text>
          <Text style={[texto('caption'), { color: t['--text-subtle'] }]}>
            {fechaConPrecision(evento.fecha, evento.fecha_precision)}
          </Text>
          <MarcaDeOrigen registro={evento} />
          {evento.cita_id ? (
            <Badge tone="primary" icon="calendar-check" size="sm">
              Cumplió cita agendada
            </Badge>
          ) : null}
          {/* Cualquier veterinario de la clínica corrige o da de baja el evento
              de un colega; `veterinario_id` conserva la autoría (RN 3.2). Las dos
              van al menú: eran dos íconos sin texto, y uno de ellos saca el
              evento del historial. */}
          {onEditar || onDarDeBaja ? (
            <MenuDeAcciones
              accessibilityLabel={
                bloqueado ? motivoBloqueo : `Acciones del evento del ${evento.fecha}`
              }
              acciones={[
                ...(onEditar
                  ? [
                      {
                        label: 'Corregir',
                        icono: 'pencil' as const,
                        deshabilitada: bloqueado,
                        onPress: () => onEditar(evento),
                      },
                    ]
                  : []),
                ...(onDarDeBaja
                  ? [
                      {
                        label: 'Dar de baja',
                        icono: 'archive' as const,
                        peligro: true,
                        deshabilitada: bloqueado,
                        onPress: () => onDarDeBaja(evento),
                      },
                    ]
                  : []),
              ]}
            />
          ) : null}
        </View>

        {/* Al tutor lo nombra la marca de origen, que ya está arriba y se lee
            antes. Repetirlo acá con la misma tipografía que a un profesional
            borraría justamente la diferencia que la marca viene a hacer. */}
        {!loDeclaroElTutor(evento) ? (
          <View style={estilos.autor}>
            <View style={[estilos.punto, { backgroundColor: t['--clinical-accent'] }]} />
            <Text style={[texto('caption'), { color: t['--text-subtle'] }]}>
              {autor ? `Cargado por ${autor.nombre}` : 'Autor fuera del plantel actual'}
            </Text>
          </View>
        ) : null}

        <Text style={[texto('body'), { color: t['--text-body'], marginTop: 8, maxWidth: 720 }]}>
          {evento.descripcion}
        </Text>

        {evento.diagnostico ? (
          <Text style={[texto('body-sm'), { marginTop: 6, color: t['--text-body'] }]}>
            <Text style={{ color: t['--text-subtle'] }}>Diagnóstico: </Text>
            <Text style={{ fontWeight: '600' }}>{evento.diagnostico}</Text>
          </Text>
        ) : null}

        {datos.length > 0 ? (
          <View
            style={[
              estilos.datos,
              {
                borderRadius: px('--radius-sm'),
                backgroundColor: t['--surface-sunken'],
                borderColor: t['--border-subtle'],
                flexDirection: esMovil ? 'column' : 'row',
              },
            ]}
          >
            {datos.map(([clave, valor]) => (
              <View key={clave} style={estilos.dato}>
                <Text style={[texto('overline'), { fontWeight: '700', color: t['--text-subtle'] }]}>
                  {(ETIQUETAS_DE_CAMPO[clave] ?? clave).toUpperCase()}
                </Text>
                <Text style={[texto('body-strong'), { color: t['--text-strong'] }]}>
                  {String(valor)}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {adjuntos.length > 0 ? (
          <View style={estilos.adjuntos}>
            {adjuntos.map((adjunto) => (
              // El chip no tiene miniatura —es una línea de texto dentro del
              // timeline—, así que el visor abre con fundido y no saliendo de
              // acá: no hay imagen de la que crecer.
              <Pressable
                key={adjunto.id}
                accessibilityRole="button"
                accessibilityLabel={`Ver ${adjunto.nombre_archivo}`}
                accessibilityHint="Abre el archivo"
                onPress={() => setMirando(adjunto)}
                onLongPress={() => setMirando(adjunto)}
                style={[
                  estilos.chipAdjunto,
                  {
                    borderRadius: px('--radius-sm'),
                    backgroundColor: t['--surface-sunken'],
                    borderColor: t['--border-default'],
                  },
                ]}
              >
                <Icon name={iconoDeArchivo(adjunto)} size={13} color={t['--text-body']} />
                <Text style={[texto('caption'), { color: t['--text-body'] }]}>
                  {`${adjunto.nombre_archivo} · ${tamanoDeArchivo(adjunto.tamano_bytes)}`}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {mirando ? <VisorDeAdjunto adjunto={mirando} onCerrar={() => setMirando(null)} /> : null}
      </View>
    </View>
  );
}

export function iconoDeArchivo(adjunto: Adjunto): NombreDeIcono {
  if (adjunto.tipo === 'foto' || adjunto.content_type.startsWith('image/')) return 'image';
  if (adjunto.tipo === 'estudio') return 'microscope';
  return 'file-text';
}

const estilos = StyleSheet.create({
  filtros: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  timeline: { paddingTop: 20, paddingBottom: 8 },
  fila: { flexDirection: 'row', gap: 14 },
  rielIzquierdo: { alignItems: 'center', gap: 4 },
  circulo: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riel: { width: 1, flex: 1, minHeight: 16 },
  cuerpo: { flex: 1, minWidth: 0 },
  tituloFila: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  accionesFila: { flexDirection: 'row', gap: 2, marginLeft: 'auto' },
  autor: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  punto: { width: 6, height: 6, borderRadius: 3 },
  datos: {
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  dato: { gap: 1, minWidth: 120, flex: 1 },
  adjuntos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chipAdjunto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  paginado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderTopWidth: 1,
  },
});
