import { useMemo, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { esCerrable, type Cita } from '../../api/cita';
import type { Clinica } from '../../api/clinica';
import {
  TIPO_DE_EVENTO,
  type CampoEstructurado,
  type CrearEventoEntrada,
  type EventoClinico,
  type SeveridadDeAlergia,
  type TipoDeEvento,
} from '../../api/evento-clinico';
import { Button, InlineError, Input, Select, type OpcionDeSelect } from '../../components';
import { useTheme } from '../../theme';

import { useCargaDeEventoMedida } from './useCargaDeEventoMedida';
import { hoyEnLaClinica, momentoCorto } from './formato';

/**
 * Carga de un evento clínico (Alcance de Plataformas, 3.4).
 *
 * `campo_estructurado` **no es un JSON libre**: su forma la fija el tipo del
 * evento y la valida el backend (Modelo de Datos, 4.5). El formulario cambia de
 * campos según el tipo por eso mismo — vacuna, medicación y alergia lo exigen,
 * y los otros cuatro lo rechazan si se manda.
 *
 * El motivo entero de tenerlo tipado es la lectura en urgencia: un dato que cada
 * clínica escribe con las claves que quiera no es consultable.
 */
const TIPOS: OpcionDeSelect<TipoDeEvento>[] = [
  { value: TIPO_DE_EVENTO.CONSULTA, label: 'Consulta' },
  { value: TIPO_DE_EVENTO.VACUNA, label: 'Vacuna' },
  { value: TIPO_DE_EVENTO.CIRUGIA, label: 'Cirugía' },
  { value: TIPO_DE_EVENTO.CONTROL, label: 'Control' },
  { value: TIPO_DE_EVENTO.URGENCIA, label: 'Urgencia' },
  { value: TIPO_DE_EVENTO.MEDICACION, label: 'Medicación' },
  { value: TIPO_DE_EVENTO.ALERGIA, label: 'Alergia' },
];

/**
 * Valor del selector cuando la atención no cierra ninguna cita. Es una cadena
 * vacía y no un id inventado: `Select` compara por valor y un uuid falso sería
 * un id válido que significa otra cosa.
 */
const SIN_CITA = '';

const ETIQUETA_DE_TIPO_DE_CITA: Record<Cita['tipo'], string> = {
  vacuna: 'Vacuna',
  control: 'Control',
  cirugia: 'Cirugía',
};

const SEVERIDADES: OpcionDeSelect<SeveridadDeAlergia>[] = [
  { value: 'leve', label: 'Leve' },
  { value: 'moderada', label: 'Moderada' },
  { value: 'severa', label: 'Severa' },
];

interface FormularioDeEventoProps {
  enviando: boolean;
  error?: string;
  /**
   * Citas de la mascota que esta atención podría estar cumpliendo. Se filtran
   * acá adentro: las ya cumplidas no se ofrecen porque el backend rechaza el
   * segundo evento que las reclame.
   */
  citas?: Cita[];
  /** Solo para escribir la fecha de cada cita en la zona de la clínica. */
  clinica?: Clinica;
  /** Cita preseleccionada, cuando se llega desde el calendario. */
  citaInicial?: string;
  /**
   * El evento que se está corrigiendo. Con esto el formulario edita en vez de
   * cargar: siembra los campos y **fija el tipo**, que la API no deja cambiar
   * (`ActualizarEventoEntrada` lo omite). Cambiar el tipo de un evento ya
   * firmado sería reescribir qué se hizo, no corregir cómo se escribió.
   */
  valorInicial?: EventoClinico;
  onGuardar: (entrada: CrearEventoEntrada) => void;
  onCancelar: () => void;
}

export function FormularioDeEvento({
  enviando,
  error,
  citas,
  clinica,
  citaInicial,
  valorInicial,
  onGuardar,
  onCancelar,
}: FormularioDeEventoProps) {
  const { t, texto } = useTheme();
  const editando = Boolean(valorInicial);
  // El tiempo de carga es lo que decide si el veterinario vuelve al papel, y el
  // abandono dice si el formulario es largo o si no se entiende: con duración
  // alta es lo primero, con duración baja lo segundo (Telemetría de Producto, 5.1).
  const cargaMedida = useCargaDeEventoMedida(!editando);

  const [tipo, setTipo] = useState<TipoDeEvento>(valorInicial?.tipo ?? TIPO_DE_EVENTO.CONSULTA);
  const [fecha, setFecha] = useState(valorInicial?.fecha ?? hoyEnLaClinica());
  const [descripcion, setDescripcion] = useState(valorInicial?.descripcion ?? '');
  const [diagnostico, setDiagnostico] = useState(valorInicial?.diagnostico ?? '');
  const [citaId, setCitaId] = useState(citaInicial ?? SIN_CITA);

  // Un estado por esquema, no uno compartido: cambiar de tipo no debería
  // arrastrar el lote de una vacuna al alérgeno de una alergia.
  const estructuradoInicial = valorInicial?.campo_estructurado;
  const [vacuna, setVacuna] = useState({
    nombre_vacuna: textoDe(estructuradoInicial, 'nombre_vacuna'),
    lote: textoDe(estructuradoInicial, 'lote'),
    fecha_proxima_dosis: textoDe(estructuradoInicial, 'fecha_proxima_dosis'),
  });
  const [medicacion, setMedicacion] = useState({
    nombre_droga: textoDe(estructuradoInicial, 'nombre_droga'),
    dosis: textoDe(estructuradoInicial, 'dosis'),
    frecuencia: textoDe(estructuradoInicial, 'frecuencia'),
  });
  const [alergia, setAlergia] = useState<{
    alergeno: string;
    severidad: SeveridadDeAlergia;
    reaccion: string;
  }>({
    alergeno: textoDe(estructuradoInicial, 'alergeno'),
    severidad: (textoDe(estructuradoInicial, 'severidad') || 'moderada') as SeveridadDeAlergia,
    reaccion: textoDe(estructuradoInicial, 'reaccion'),
  });

  const fechaValida = /^\d{4}-\d{2}-\d{2}$/.test(fecha) && fecha <= hoyEnLaClinica();

  const estructuradoCompleto = (() => {
    if (tipo === TIPO_DE_EVENTO.VACUNA) return vacuna.nombre_vacuna.trim() && vacuna.lote.trim();
    if (tipo === TIPO_DE_EVENTO.MEDICACION) {
      return (
        medicacion.nombre_droga.trim() && medicacion.dosis.trim() && medicacion.frecuencia.trim()
      );
    }
    if (tipo === TIPO_DE_EVENTO.ALERGIA) return alergia.alergeno.trim();
    return true;
  })();

  const completo = descripcion.trim() && fechaValida && estructuradoCompleto;

  /**
   * Es la única forma de cerrar una cita: no hay endpoint que escriba `estado`
   * —pasa a cumplido cuando llega el evento que la referencia (Reglas de
   * Negocio, 4.4)—. Una vencida también se ofrece: la mascota llegó tarde y se
   * la atendió igual.
   */
  const cerrables = useMemo(() => (citas ?? []).filter(esCerrable), [citas]);

  const opcionesDeCita = useMemo<OpcionDeSelect[]>(
    () => [
      { value: SIN_CITA, label: 'No cierra ninguna cita' },
      ...cerrables.map((cita) => ({
        value: cita.id,
        label: `${ETIQUETA_DE_TIPO_DE_CITA[cita.tipo]} · ${momentoCorto(cita.fecha_programada, clinica?.zona_horaria)}${
          cita.estado === 'vencido' ? ' (vencida)' : ''
        }`,
      })),
    ],
    [cerrables, clinica?.zona_horaria],
  );

  function campoEstructurado(): CampoEstructurado | undefined {
    if (tipo === TIPO_DE_EVENTO.VACUNA) {
      return {
        nombre_vacuna: vacuna.nombre_vacuna.trim(),
        lote: vacuna.lote.trim(),
        ...(vacuna.fecha_proxima_dosis.trim()
          ? { fecha_proxima_dosis: vacuna.fecha_proxima_dosis.trim() }
          : {}),
      };
    }
    if (tipo === TIPO_DE_EVENTO.MEDICACION) {
      return {
        nombre_droga: medicacion.nombre_droga.trim(),
        dosis: medicacion.dosis.trim(),
        frecuencia: medicacion.frecuencia.trim(),
      };
    }
    if (tipo === TIPO_DE_EVENTO.ALERGIA) {
      return {
        alergeno: alergia.alergeno.trim(),
        severidad: alergia.severidad,
        ...(alergia.reaccion.trim() ? { reaccion: alergia.reaccion.trim() } : {}),
      };
    }
    // Consulta, cirugía, control y urgencia no lo admiten: mandarlo se rechaza.
    return undefined;
  }

  return (
    <ScrollView>
      <View style={estilos.raiz}>
        <View style={estilos.fila}>
          <View style={estilos.campoChico}>
            {/*
              Al corregir, el tipo no se toca: la API lo omite de la entrada
              (`ActualizarEventoEntrada`), y cambiarlo sería reescribir qué se
              hizo en vez de corregir cómo se escribió. Se muestra igual, porque
              es la primera pregunta que se hace quien lee la pantalla.
            */}
            {editando ? (
              <Input
                label="Tipo de evento"
                hint="No se cambia: para eso hay que dar de baja este y cargar otro."
                value={TIPOS.find((opcion) => opcion.value === tipo)?.label ?? tipo}
                editable={false}
                onChangeText={() => {}}
              />
            ) : (
              <Select label="Tipo de evento" options={TIPOS} value={tipo} onChange={setTipo} />
            )}
          </View>
          <View style={estilos.campoChico}>
            <Input
              label="Fecha"
              hint="AAAA-MM-DD. No puede ser futura: lo que va a pasar es una cita."
              value={fecha}
              onChangeText={setFecha}
              error={fecha && !fechaValida ? 'Poné una fecha válida que no sea futura.' : undefined}
            />
          </View>
        </View>

        {/*
          Cerrar la cita es un efecto del evento, no un campo más: va acá arriba,
          junto a qué atención fue y cuándo, y no perdido al final del
          formulario. Si la mascota no tenía nada agendado no se dibuja — un
          selector con una sola opción que dice "ninguna" es ruido.
        */}
        {cerrables.length > 0 ? (
          <Select
            label="¿Cierra una cita agendada?"
            hint="Al guardar, la cita elegida pasa a cumplida. Es la única forma de cerrarla."
            options={opcionesDeCita}
            value={citaId}
            onChange={setCitaId}
          />
        ) : null}

        <Input
          label="Descripción"
          hint="Lo que pasó en la atención, con tus palabras."
          value={descripcion}
          onChangeText={setDescripcion}
          autoCapitalize="sentences"
        />

        <Input
          label="Diagnóstico"
          hint="Opcional."
          value={diagnostico}
          onChangeText={setDiagnostico}
          autoCapitalize="sentences"
        />

        {tipo === TIPO_DE_EVENTO.VACUNA ? (
          <Estructurado titulo="DATOS DE LA VACUNA">
            <View style={estilos.fila}>
              <View style={estilos.campo}>
                <Input
                  label="Vacuna"
                  placeholder="Quíntuple canina"
                  value={vacuna.nombre_vacuna}
                  onChangeText={(valor) => setVacuna((v) => ({ ...v, nombre_vacuna: valor }))}
                />
              </View>
              <View style={estilos.campoChico}>
                <Input
                  label="Lote"
                  placeholder="L-22841"
                  value={vacuna.lote}
                  onChangeText={(valor) => setVacuna((v) => ({ ...v, lote: valor }))}
                />
              </View>
              <View style={estilos.campoChico}>
                <Input
                  label="Próxima dosis"
                  hint="Opcional. AAAA-MM-DD."
                  value={vacuna.fecha_proxima_dosis}
                  onChangeText={(valor) => setVacuna((v) => ({ ...v, fecha_proxima_dosis: valor }))}
                />
              </View>
            </View>
          </Estructurado>
        ) : null}

        {tipo === TIPO_DE_EVENTO.MEDICACION ? (
          <Estructurado
            titulo="DATOS DE LA MEDICACIÓN"
            nota="Esto registra que se indicó una medicación en esta fecha. Para que quede como tratamiento vigente, cargala además en la pestaña de Medicación."
          >
            <View style={estilos.fila}>
              <View style={estilos.campo}>
                <Input
                  label="Droga"
                  placeholder="Meloxicam"
                  value={medicacion.nombre_droga}
                  onChangeText={(valor) => setMedicacion((m) => ({ ...m, nombre_droga: valor }))}
                />
              </View>
              <View style={estilos.campoChico}>
                <Input
                  label="Dosis"
                  placeholder="0,1 mg/kg"
                  value={medicacion.dosis}
                  onChangeText={(valor) => setMedicacion((m) => ({ ...m, dosis: valor }))}
                />
              </View>
              <View style={estilos.campoChico}>
                <Input
                  label="Frecuencia"
                  placeholder="cada 24 h"
                  value={medicacion.frecuencia}
                  onChangeText={(valor) => setMedicacion((m) => ({ ...m, frecuencia: valor }))}
                />
              </View>
            </View>
          </Estructurado>
        ) : null}

        {tipo === TIPO_DE_EVENTO.ALERGIA ? (
          <Estructurado
            titulo="DATOS DE LA ALERGIA"
            nota="Va a aparecer arriba de todo en la ficha, en la banda de datos críticos. La fecha del evento es la de detección."
          >
            <View style={estilos.fila}>
              <View style={estilos.campo}>
                <Input
                  label="Alérgeno"
                  placeholder="Penicilina"
                  value={alergia.alergeno}
                  onChangeText={(valor) => setAlergia((a) => ({ ...a, alergeno: valor }))}
                />
              </View>
              <View style={estilos.campoChico}>
                <Select
                  label="Severidad"
                  options={SEVERIDADES}
                  value={alergia.severidad}
                  onChange={(valor) => setAlergia((a) => ({ ...a, severidad: valor }))}
                />
              </View>
              <View style={estilos.campo}>
                <Input
                  label="Reacción"
                  hint="Opcional."
                  placeholder="Edema facial y vómitos"
                  value={alergia.reaccion}
                  onChangeText={(valor) => setAlergia((a) => ({ ...a, reaccion: valor }))}
                />
              </View>
            </View>
          </Estructurado>
        ) : null}

        {error ? (
          <InlineError
            compact
            title={editando ? 'No se pudo guardar' : 'No se pudo cargar el evento'}
            description={error}
          />
        ) : null}

        <View style={estilos.acciones}>
          <Button
            size="lg"
            disabled={!completo}
            loading={enviando}
            onPress={() => {
              cargaMedida.guardada();
              onGuardar({
                tipo,
                fecha,
                descripcion: descripcion.trim(),
                ...(diagnostico.trim() ? { diagnostico: diagnostico.trim() } : {}),
                ...(campoEstructurado() ? { campo_estructurado: campoEstructurado() } : {}),
                ...(citaId !== SIN_CITA ? { cita_id: citaId } : {}),
              });
            }}
          >
            {editando ? 'Guardar los cambios' : 'Cargar evento'}
          </Button>
          <Button variant="ghost" onPress={onCancelar}>
            Cancelar
          </Button>
        </View>

        <Text style={[texto('caption'), { color: t['--text-subtle'] }]}>
          Queda firmado con tu nombre y no se puede borrar: si algo sale mal, se corrige o se da de
          baja, y la autoría no cambia.
        </Text>
      </View>
    </ScrollView>
  );
}

function Estructurado({
  titulo,
  nota,
  children,
}: {
  titulo: string;
  nota?: string;
  children: ReactNode;
}) {
  const { t, px, texto } = useTheme();
  return (
    <View
      style={[
        estilos.estructurado,
        {
          borderRadius: px('--radius-md'),
          backgroundColor: t['--surface-sunken'],
          borderColor: t['--border-subtle'],
        },
      ]}
    >
      <Text style={[texto('overline'), { color: t['--text-subtle'] }]}>{titulo}</Text>
      {nota ? <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>{nota}</Text> : null}
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { gap: 14 },
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  campo: { flexGrow: 2, flexBasis: 200, minWidth: 180 },
  campoChico: { flexGrow: 1, flexBasis: 160, minWidth: 150 },
  estructurado: { borderWidth: 1, padding: 16, gap: 12 },
  acciones: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
});

/**
 * Lee un campo del `campo_estructurado`, que viaja como JSON sin forma fija: el
 * esquema lo decide el tipo del evento, y acá alcanza con el texto.
 */
function textoDe(estructurado: CampoEstructurado | null | undefined, clave: string): string {
  const valor = (estructurado as Record<string, unknown> | null | undefined)?.[clave];
  return typeof valor === 'string' ? valor : '';
}
