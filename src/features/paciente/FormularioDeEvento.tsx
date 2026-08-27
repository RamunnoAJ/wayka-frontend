import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  TIPO_DE_EVENTO,
  type CampoEstructurado,
  type CrearEventoEntrada,
  type SeveridadDeAlergia,
  type TipoDeEvento,
} from '../../api/evento-clinico';
import { Button, InlineError, Input, Select, type OpcionDeSelect } from '../../components';
import { useTheme } from '../../theme';

import { aIso } from './formato';

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

const SEVERIDADES: OpcionDeSelect<SeveridadDeAlergia>[] = [
  { value: 'leve', label: 'Leve' },
  { value: 'moderada', label: 'Moderada' },
  { value: 'severa', label: 'Severa' },
];

interface FormularioDeEventoProps {
  enviando: boolean;
  error?: string;
  onGuardar: (entrada: CrearEventoEntrada) => void;
  onCancelar: () => void;
}

export function FormularioDeEvento({
  enviando,
  error,
  onGuardar,
  onCancelar,
}: FormularioDeEventoProps) {
  const { t, texto } = useTheme();

  const [tipo, setTipo] = useState<TipoDeEvento>(TIPO_DE_EVENTO.CONSULTA);
  const [fecha, setFecha] = useState(aIso(new Date()));
  const [descripcion, setDescripcion] = useState('');
  const [diagnostico, setDiagnostico] = useState('');

  // Un estado por esquema, no uno compartido: cambiar de tipo no debería
  // arrastrar el lote de una vacuna al alérgeno de una alergia.
  const [vacuna, setVacuna] = useState({ nombre_vacuna: '', lote: '', fecha_proxima_dosis: '' });
  const [medicacion, setMedicacion] = useState({ nombre_droga: '', dosis: '', frecuencia: '' });
  const [alergia, setAlergia] = useState<{
    alergeno: string;
    severidad: SeveridadDeAlergia;
    reaccion: string;
  }>({ alergeno: '', severidad: 'moderada', reaccion: '' });

  const fechaValida = /^\d{4}-\d{2}-\d{2}$/.test(fecha) && fecha <= aIso(new Date());

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
            <Select label="Tipo de evento" options={TIPOS} value={tipo} onChange={setTipo} />
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
          <InlineError compact title="No se pudo cargar el evento" description={error} />
        ) : null}

        <View style={estilos.acciones}>
          <Button
            size="lg"
            disabled={!completo}
            loading={enviando}
            onPress={() =>
              onGuardar({
                tipo,
                fecha,
                descripcion: descripcion.trim(),
                ...(diagnostico.trim() ? { diagnostico: diagnostico.trim() } : {}),
                ...(campoEstructurado() ? { campo_estructurado: campoEstructurado() } : {}),
              })
            }
          >
            Cargar evento
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
      <Text style={[texto('overline'), { fontWeight: '700', color: t['--text-subtle'] }]}>
        {titulo}
      </Text>
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
