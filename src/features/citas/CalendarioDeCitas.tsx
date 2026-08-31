import { useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { CitaConPaciente } from '../../api/cita';
import { IconButton, Presionable, SkeletonText } from '../../components';
import { useTheme, type Tokens } from '../../theme';
import { fechaConDiaDeSemana, hoyEnLaClinica } from '../paciente/formato';

import {
  agruparPorDia,
  celdasDelPeriodo,
  desplazarPeriodo,
  esDelMes,
  INICIALES_DE_SEMANA,
  MODO_DE_CALENDARIO,
  tituloDePeriodo,
  type ModoDeCalendario,
} from './calendario';

/**
 * Las citas en la grilla de la semana o del mes, con las del período debajo
 * agrupadas por día.
 *
 * Es la misma pieza para el tutor y para la clínica porque la pregunta es la
 * misma —cómo cae esto en el calendario— y solo cambia qué se muestra de cada
 * cita: el tutor ve la suya con el aviso, la clínica ve la fila con la mascota y
 * el profesional. Eso entra por `renderCita` y no por una bandera de rol: quién
 * mira lo sabe la pantalla, no la grilla.
 *
 * La grilla dice cuándo caen y la lista de abajo dice qué son, sin que haya que
 * tocar día por día para enterarse. Tocar un día acota esa lista a ese día, y
 * volver a tocarlo la devuelve al período entero — es un filtro, no una pantalla
 * nueva.
 *
 * **Un casillero no es un horario**: se dibuja el día con un punto por cita y no
 * una grilla de horas. Sin agenda por profesional, dos citas de la misma hora no
 * colisionan y una franja sugeriría que sí (Modelo de Datos, 4.7).
 *
 * El período que se mira lo maneja quien la usa (`ancla` + `onAncla`): en la
 * clínica es lo que decide qué se le pide a la API, y un estado interno obligaría
 * a espiarlo desde afuera.
 */
interface CalendarioProps {
  citas: CitaConPaciente[];
  modo: ModoDeCalendario;
  /** Cualquier día del período que se está mirando. */
  ancla: string;
  onAncla: (iso: string) => void;
  renderCita: (fila: CitaConPaciente) => ReactNode;
  /** Color del punto de cada cita, para que el casillero hable el mismo idioma que la lista. */
  colorDePunto: (t: Tokens, fila: CitaConPaciente) => string;
  /** Mientras la consulta del período viaja: la grilla queda, el detalle espera. */
  cargando?: boolean;
  /** Zona con la que se lee "hoy". La de la clínica que mira, no la del aparato. */
  zona?: string;
}

/**
 * Cuántos puntos entran en un casillero de mes sin que se toquen. A partir del
 * cuarto no se cuentan de un vistazo igual: el número exacto lo da la lista de
 * abajo, que es adonde va quien quiere saberlo.
 */
const PUNTOS_VISIBLES = 3;

export function CalendarioDeCitas({
  citas,
  modo,
  ancla,
  onAncla,
  renderCita,
  colorDePunto,
  cargando,
  zona,
}: CalendarioProps) {
  const { t, px, texto } = useTheme();
  const hoy = hoyEnLaClinica(zona);
  const [filtrado, setFiltrado] = useState<string | null>(null);

  const celdas = useMemo(() => celdasDelPeriodo(ancla, modo), [ancla, modo]);
  const porDia = useMemo(() => agruparPorDia(citas), [citas]);

  // El día filtrado se deriva y no se corrige con un efecto: al cambiar de
  // período o de modo, el que estaba puede quedar fuera de la grilla, y lo que
  // corresponde entonces es volver al período entero y no mostrar un día que ya
  // no se ve.
  const dia = filtrado && celdas.includes(filtrado) ? filtrado : null;
  const semana = modo === MODO_DE_CALENDARIO.SEMANA;

  const conCitas = (dia ? [dia] : celdas).filter((fecha) => porDia.has(fecha));

  return (
    <View style={estilos.raiz}>
      <View style={estilos.encabezado}>
        <IconButton
          icon="chevron-left"
          label={semana ? 'Semana anterior' : 'Mes anterior'}
          onPress={() => onAncla(desplazarPeriodo(ancla, modo, -1))}
        />
        <Text style={[texto('h4'), estilos.titulo, { color: t['--text-strong'] }]}>
          {tituloDePeriodo(ancla, modo)}
        </Text>
        <IconButton
          icon="chevron-right"
          label={semana ? 'Semana siguiente' : 'Mes siguiente'}
          onPress={() => onAncla(desplazarPeriodo(ancla, modo, 1))}
        />
      </View>

      <View style={estilos.fila}>
        {INICIALES_DE_SEMANA.map((inicial, posicion) => (
          <View key={posicion} style={estilos.celda}>
            <Text style={[texto('caption'), estilos.centrado, { color: t['--text-subtle'] }]}>
              {inicial}
            </Text>
          </View>
        ))}
      </View>

      <View style={estilos.fila}>
        {celdas.map((fecha) => {
          const delCasillero = porDia.get(fecha) ?? [];
          const activo = fecha === dia;
          // En semana no hay mes vecino que apagar: las siete casillas son la
          // semana entera.
          const apagado = !semana && !esDelMes(fecha, ancla);

          return (
            <View key={fecha} style={estilos.celda}>
              <Presionable
                // Tocar el día que ya filtra lo saca: sin esto, volver a ver el
                // período entero obligaría a cambiar de vista y venir de nuevo.
                onPress={() => setFiltrado(activo ? null : fecha)}
                fondo={activo ? t['--surface-selected'] : 'transparent'}
                fondoDestacado={activo ? t['--surface-selected'] : t['--surface-hover']}
                borde={fecha === hoy ? t['--color-primary-strong'] : 'transparent'}
                accessibilityState={{ selected: activo }}
                accessibilityLabel={`${fechaConDiaDeSemana(fecha)}, ${
                  delCasillero.length === 0
                    ? 'sin citas'
                    : `${delCasillero.length} cita${delCasillero.length === 1 ? '' : 's'}`
                }`}
                style={[estilos.dia, { borderRadius: px('--radius-md') }]}
              >
                <Text
                  style={[
                    texto('body-sm'),
                    estilos.centrado,
                    {
                      fontWeight: activo || fecha === hoy ? '700' : '400',
                      color: apagado ? t['--text-subtle'] : t['--text-strong'],
                    },
                  ]}
                >
                  {Number(fecha.slice(8))}
                </Text>
                <View style={estilos.puntos}>
                  {delCasillero.slice(0, PUNTOS_VISIBLES).map((fila) => (
                    <View
                      key={fila.cita.id}
                      style={[estilos.punto, { backgroundColor: colorDePunto(t, fila) }]}
                    />
                  ))}
                </View>
              </Presionable>
            </View>
          );
        })}
      </View>

      <View style={estilos.detalle}>
        {cargando ? (
          <SkeletonText lines={4} />
        ) : conCitas.length === 0 ? (
          <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
            {dia
              ? 'No hay citas este día.'
              : semana
                ? 'No hay citas esta semana.'
                : 'No hay citas este mes.'}
          </Text>
        ) : (
          conCitas.map((fecha) => {
            const delDia = porDia.get(fecha) ?? [];
            return (
              <View key={fecha} style={estilos.grupo}>
                <View style={estilos.diaTitulo}>
                  <Text style={[texto('body-strong'), { color: t['--text-strong'] }]}>
                    {fechaConDiaDeSemana(fecha)}
                  </Text>
                  {fecha === hoy ? (
                    <Text
                      style={[
                        texto('caption'),
                        { fontWeight: '700', color: t['--color-primary-strong'] },
                      ]}
                    >
                      HOY
                    </Text>
                  ) : null}
                  {/* El conteo aparece cuando hay más de una: "1 cita" arriba de
                      una sola tarjeta no agrega nada. */}
                  {delDia.length > 1 ? (
                    <Text style={[texto('body-sm'), { color: t['--text-subtle'] }]}>
                      {`${delDia.length} citas`}
                    </Text>
                  ) : null}
                </View>
                {delDia.map((fila) => (
                  <View key={fila.cita.id}>{renderCita(fila)}</View>
                ))}
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { gap: 12 },
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titulo: { flex: 1, textAlign: 'center' },
  fila: { flexDirection: 'row', flexWrap: 'wrap' },
  // Un séptimo exacto: con `flex: 1` por casilla, la última fila de un mes
  // incompleto estiraría sus días y las columnas dejarían de alinearse.
  celda: { width: `${100 / 7}%`, padding: 2 },
  centrado: { textAlign: 'center' },
  dia: { borderWidth: 1, paddingVertical: 6, gap: 3, minHeight: 44, justifyContent: 'center' },
  puntos: { flexDirection: 'row', justifyContent: 'center', gap: 3, height: 5 },
  punto: { width: 5, height: 5, borderRadius: 3 },
  detalle: { gap: 14, paddingTop: 4 },
  grupo: { gap: 8 },
  diaTitulo: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
});
