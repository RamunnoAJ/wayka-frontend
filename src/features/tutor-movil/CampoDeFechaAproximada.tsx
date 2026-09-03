import { StyleSheet, View } from 'react-native';

import { PRECISION_DE_FECHA, type PrecisionDeFecha } from '../../api/historial';
import { Input, Select, type OpcionDeSelect } from '../../components';

/**
 * La fecha de un antecedente, con la precisión que el tutor tenga.
 *
 * Una libreta de hace cinco años dice el año, y a veces el mes. **Ese es el caso
 * normal de esta pantalla, no el degradado**: los tres niveles se ofrecen sin
 * castigar al que elige el más grueso, y en ningún momento se le pide que baje a
 * día. Obligarlo a inventar un día convierte un dato cierto en uno falso con
 * apariencia de preciso (Modelo de Datos, 4.5).
 *
 * Hacia afuera siempre sale un `YYYY-MM-DD` completo, con `01` en lo que no se
 * declaró: es lo que el contrato recibe, y la precisión que viaja al lado es la
 * que dice cuánto de esa fecha es una afirmación.
 */

const PRECISIONES: OpcionDeSelect<PrecisionDeFecha>[] = [
  { value: PRECISION_DE_FECHA.DIA, label: 'Sé el día exacto' },
  { value: PRECISION_DE_FECHA.MES, label: 'Sé el mes y el año' },
  { value: PRECISION_DE_FECHA.ANIO, label: 'Solo sé el año' },
];

const MESES: OpcionDeSelect[] = [
  { value: '01', label: 'Enero' },
  { value: '02', label: 'Febrero' },
  { value: '03', label: 'Marzo' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Mayo' },
  { value: '06', label: 'Junio' },
  { value: '07', label: 'Julio' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
];

export interface FechaDeclarada {
  /** `YYYY-MM-DD`, ya rellenado según la precisión. */
  fecha: string;
  precision: PrecisionDeFecha;
}

interface CampoProps {
  valor: FechaDeclarada;
  onChange: (valor: FechaDeclarada) => void;
  etiqueta?: string;
}

export function CampoDeFechaAproximada({ valor, onChange, etiqueta = 'Fecha' }: CampoProps) {
  const [anio = '', mes = '01', dia = '01'] = valor.fecha.split('-');

  function componer(
    partes: { anio?: string; mes?: string; dia?: string },
    precision: PrecisionDeFecha,
  ) {
    const a = partes.anio ?? anio;
    // Los componentes que la precisión declara desconocidos se rellenan acá y no
    // en el servidor: lo que se muestra y lo que se manda tienen que ser lo mismo.
    const m = precision === PRECISION_DE_FECHA.ANIO ? '01' : (partes.mes ?? mes);
    const d = precision === PRECISION_DE_FECHA.DIA ? (partes.dia ?? dia) : '01';
    onChange({ fecha: `${a}-${m}-${d}`, precision });
  }

  return (
    <View style={estilos.grupo}>
      <Select
        label={`${etiqueta}: ¿con qué precisión la sabés?`}
        options={PRECISIONES}
        value={valor.precision}
        onChange={(precision) => componer({}, precision)}
        hint="Si no te acordás del día no pasa nada: poné lo que sepas."
      />

      <View style={estilos.fila}>
        <View style={estilos.anio}>
          <Input
            label="Año"
            value={anio}
            onChangeText={(texto) =>
              componer({ anio: texto.replace(/\D/g, '').slice(0, 4) }, valor.precision)
            }
            keyboardType="number-pad"
            placeholder="2023"
          />
        </View>

        {valor.precision !== PRECISION_DE_FECHA.ANIO ? (
          <View style={estilos.mes}>
            <Select
              label="Mes"
              options={MESES}
              value={mes}
              onChange={(nuevo) => componer({ mes: nuevo }, valor.precision)}
            />
          </View>
        ) : null}

        {valor.precision === PRECISION_DE_FECHA.DIA ? (
          <View style={estilos.dia}>
            <Input
              label="Día"
              value={dia}
              onChangeText={(texto) =>
                componer(
                  { dia: texto.replace(/\D/g, '').slice(0, 2).padStart(2, '0') },
                  valor.precision,
                )
              }
              keyboardType="number-pad"
              placeholder="19"
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  grupo: { gap: 12 },
  fila: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  anio: { flex: 1, minWidth: 96 },
  mes: { flex: 1.4 },
  dia: { width: 84 },
});
