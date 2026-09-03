import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  TIPO_DE_EVENTO,
  type CrearEventoEntrada,
  type SeveridadDeAlergia,
  type TipoDeEvento,
} from '../../api/evento-clinico';
import { PRECISION_DE_FECHA } from '../../api/historial';
import type { CrearMedicacionEntrada } from '../../api/medicacion';
import { Button, InlineError, Input, Select, type OpcionDeSelect } from '../../components';
import { useTheme } from '../../theme';

import { CampoDeFechaAproximada, type FechaDeclarada } from './CampoDeFechaAproximada';

/**
 * Carga de un antecedente por el tutor (Alcance de Plataformas, 5.12; Reglas de
 * Negocio, 4.23).
 *
 * **No es el formulario del veterinario con menos campos**: es otro formulario.
 * Lo único obligatorio es qué es —el nombre de la vacuna, el alérgeno, la
 * droga— y la fecha. Todo lo demás se puede dejar vacío, y la pantalla lo dice
 * así en vez de marcar en rojo lo que el tutor no tiene cómo saber.
 */

export const CLASE_DE_ANTECEDENTE = {
  VACUNA: 'vacuna',
  ALERGIA: 'alergia',
  MEDICACION: 'medicacion',
  OTRO: 'otro',
} as const;

export type ClaseDeAntecedente = (typeof CLASE_DE_ANTECEDENTE)[keyof typeof CLASE_DE_ANTECEDENTE];

/**
 * Qué se va a escribir. Las tres primeras clases son un Evento clínico; la
 * medicación en curso es la entidad Medicación, que lleva el ciclo de vida del
 * tratamiento vigente (Modelo de Datos, 4.6).
 */
export type AntecedenteACargar =
  | { clase: 'evento'; entrada: CrearEventoEntrada }
  | { clase: 'medicacion'; entrada: CrearMedicacionEntrada };

/**
 * "Otra cosa que pasó" no es un tipo nuevo del historial: son los cuatro que ya
 * existen y no llevan campo estructurado. Se le pregunta al tutor con las
 * palabras con las que él lo nombraría.
 */
const TIPOS_DE_OTRO: OpcionDeSelect<TipoDeEvento>[] = [
  { value: TIPO_DE_EVENTO.CONSULTA, label: 'Una consulta en otra veterinaria' },
  { value: TIPO_DE_EVENTO.CIRUGIA, label: 'Una cirugía' },
  { value: TIPO_DE_EVENTO.CONTROL, label: 'Un control' },
  { value: TIPO_DE_EVENTO.URGENCIA, label: 'Una urgencia' },
];

const SEVERIDADES: OpcionDeSelect<SeveridadDeAlergia | ''>[] = [
  { value: '', label: 'No sé qué tan grave es' },
  { value: 'leve', label: 'Leve' },
  { value: 'moderada', label: 'Moderada' },
  { value: 'severa', label: 'Severa' },
];

const TITULOS: Record<ClaseDeAntecedente, string> = {
  vacuna: 'Una vacuna que ya tiene',
  alergia: 'Una alergia que le conocés',
  medicacion: 'Algo que está tomando ahora',
  otro: 'Otra cosa que le pasó',
};

interface FormularioProps {
  clase: ClaseDeAntecedente;
  enviando: boolean;
  error?: string;
  onGuardar: (antecedente: AntecedenteACargar) => void;
  onCancelar: () => void;
}

export function FormularioDeAntecedente({
  clase,
  enviando,
  error,
  onGuardar,
  onCancelar,
}: FormularioProps) {
  const { t, texto } = useTheme();

  const [nombre, setNombre] = useState('');
  const [detalle, setDetalle] = useState('');
  const [dosis, setDosis] = useState('');
  const [frecuencia, setFrecuencia] = useState('');
  const [severidad, setSeveridad] = useState<SeveridadDeAlergia | ''>('');
  const [proximaDosis, setProximaDosis] = useState('');
  const [tipoDeOtro, setTipoDeOtro] = useState<TipoDeEvento>(TIPO_DE_EVENTO.CONSULTA);
  const [cuando, setCuando] = useState<FechaDeclarada>({
    fecha: `${new Date().getFullYear()}-01-01`,
    precision: PRECISION_DE_FECHA.ANIO,
  });

  const identificado = clase === CLASE_DE_ANTECEDENTE.OTRO ? detalle.trim() : nombre.trim();
  const anioCompleto = /^\d{4}-\d{2}-\d{2}$/.test(cuando.fecha);
  const completo = Boolean(identificado) && anioCompleto;

  function guardar() {
    if (!completo || enviando) return;
    onGuardar(armar());
  }

  function armar(): AntecedenteACargar {
    const fecha = { fecha: cuando.fecha, fecha_precision: cuando.precision };

    if (clase === CLASE_DE_ANTECEDENTE.MEDICACION) {
      return {
        clase: 'medicacion',
        entrada: {
          nombre_droga: nombre.trim(),
          // Vacías salen sin la clave: el contrato las admite ausentes con este
          // origen, y mandar una cadena vacía sería declarar que no hay dosis.
          ...(dosis.trim() ? { dosis: dosis.trim() } : {}),
          ...(frecuencia.trim() ? { frecuencia: frecuencia.trim() } : {}),
          fecha_inicio: cuando.fecha,
          fecha_precision: cuando.precision,
        },
      };
    }

    if (clase === CLASE_DE_ANTECEDENTE.VACUNA) {
      return {
        clase: 'evento',
        entrada: {
          tipo: TIPO_DE_EVENTO.VACUNA,
          ...fecha,
          descripcion: detalle.trim() || `${nombre.trim()}, según la libreta`,
          campo_estructurado: {
            nombre_vacuna: nombre.trim(),
            ...(proximaDosis.trim() ? { fecha_proxima_dosis: proximaDosis.trim() } : {}),
          },
        },
      };
    }

    if (clase === CLASE_DE_ANTECEDENTE.ALERGIA) {
      return {
        clase: 'evento',
        entrada: {
          tipo: TIPO_DE_EVENTO.ALERGIA,
          ...fecha,
          descripcion: detalle.trim() || `Alergia a ${nombre.trim()}`,
          campo_estructurado: {
            alergeno: nombre.trim(),
            ...(severidad ? { severidad } : {}),
            ...(detalle.trim() ? { reaccion: detalle.trim() } : {}),
          },
        },
      };
    }

    return {
      clase: 'evento',
      entrada: { tipo: tipoDeOtro, ...fecha, descripcion: detalle.trim() },
    };
  }

  return (
    <View style={estilos.formulario}>
      <Text style={[texto('h4'), { color: t['--text-strong'] }]}>{TITULOS[clase]}</Text>

      {clase === CLASE_DE_ANTECEDENTE.OTRO ? (
        <Select
          label="¿Qué fue?"
          options={TIPOS_DE_OTRO}
          value={tipoDeOtro}
          onChange={setTipoDeOtro}
        />
      ) : (
        <Input
          label={ETIQUETA_DE_NOMBRE[clase]}
          value={nombre}
          onChangeText={setNombre}
          placeholder={PLACEHOLDER_DE_NOMBRE[clase]}
          hint="Es lo único que no podemos deducir: sin esto no sabemos de qué se trata."
        />
      )}

      {clase === CLASE_DE_ANTECEDENTE.ALERGIA ? (
        <Select
          label="Gravedad (si la sabés)"
          options={SEVERIDADES}
          value={severidad}
          onChange={setSeveridad}
          hint="Si no estás seguro, dejalo así: lo gradúa el veterinario cuando la vea."
        />
      ) : null}

      {clase === CLASE_DE_ANTECEDENTE.MEDICACION ? (
        <>
          <Input
            label="Dosis (si la sabés)"
            value={dosis}
            onChangeText={setDosis}
            placeholder="media pastilla"
          />
          <Input
            label="Cada cuánto (si lo sabés)"
            value={frecuencia}
            onChangeText={setFrecuencia}
            placeholder="a la mañana"
          />
        </>
      ) : null}

      <CampoDeFechaAproximada
        valor={cuando}
        onChange={setCuando}
        etiqueta={clase === CLASE_DE_ANTECEDENTE.MEDICACION ? 'Desde cuándo la toma' : 'Cuándo fue'}
      />

      {clase === CLASE_DE_ANTECEDENTE.VACUNA ? (
        <Input
          label="Próxima dosis (si figura en la libreta)"
          value={proximaDosis}
          onChangeText={setProximaDosis}
          placeholder="2027-04-29"
          hint="Con esto te podemos avisar cuando se acerque."
        />
      ) : null}

      <Input
        label={clase === CLASE_DE_ANTECEDENTE.OTRO ? 'Contanos qué pasó' : 'Algo más para agregar'}
        value={detalle}
        onChangeText={setDetalle}
        placeholder={
          clase === CLASE_DE_ANTECEDENTE.OTRO ? 'Se operó de la rodilla izquierda' : 'Opcional'
        }
      />

      {error ? <InlineError title={error} compact /> : null}

      <View style={estilos.acciones}>
        <Button variant="secondary" onPress={onCancelar} disabled={enviando}>
          Volver
        </Button>
        <Button onPress={guardar} disabled={!completo} loading={enviando}>
          Guardar
        </Button>
      </View>
    </View>
  );
}

const ETIQUETA_DE_NOMBRE: Record<ClaseDeAntecedente, string> = {
  vacuna: '¿Qué vacuna?',
  alergia: '¿A qué es alérgica?',
  medicacion: '¿Qué le estás dando?',
  otro: '',
};

const PLACEHOLDER_DE_NOMBRE: Record<ClaseDeAntecedente, string> = {
  vacuna: 'Antirrábica',
  alergia: 'Polen',
  medicacion: 'Meloxicam',
  otro: '',
};

const estilos = StyleSheet.create({
  formulario: { gap: 16 },
  acciones: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end' },
});
