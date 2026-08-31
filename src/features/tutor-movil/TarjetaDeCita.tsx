import { StyleSheet, Text, View } from 'react-native';

import {
  esReagendable,
  type CitaConPaciente,
  type EstadoDeCita,
  type TipoDeCita,
} from '../../api/cita';
import { Badge, StatusDot } from '../../components';
import { sombra, useTheme, type Tokens } from '../../theme';
import { horaCorta } from '../paciente/formato';

/**
 * La cita de un día del calendario.
 *
 * No lleva la fecha: va siempre debajo del encabezado del día que la contiene, y
 * repetirla en cada tarjeta convertiría el dato que ordena la pantalla en ruido.
 * Lo que sí lleva es la hora, que es lo único que distingue dos citas del mismo
 * día.
 *
 * La forma la decide el estado y no quien la usa: una cita pendiente dice cómo
 * prepararse —el aviso, a quién pedirle que la mueva—; una que ya pasó solo
 * necesita reconocerse.
 */
export const ETIQUETA_DE_TIPO: Record<TipoDeCita, string> = {
  vacuna: 'Vacuna',
  control: 'Control',
  cirugia: 'Cirugía',
};

export const ETIQUETA_DE_ESTADO: Record<EstadoDeCita, string> = {
  pendiente: 'Pendiente',
  cumplido: 'Cumplido',
  vencido: 'Vencido',
};

export function tono(t: Tokens, estado: EstadoDeCita): { fondo: string; texto: string } {
  const tabla: Record<EstadoDeCita, { fondo: string; texto: string }> = {
    pendiente: { fondo: t['--appt-pending-surface'], texto: t['--appt-pending'] },
    cumplido: { fondo: t['--appt-done-surface'], texto: t['--appt-done'] },
    vencido: { fondo: t['--appt-overdue-surface'], texto: t['--appt-overdue'] },
  };
  return tabla[estado];
}

export type EstadoLocalDeCita = 'pendiente' | 'rechazada';

interface TarjetaProps {
  fila: CitaConPaciente;
  estadoLocal?: EstadoLocalDeCita;
}

export function TarjetaDeCita({ fila, estadoLocal }: TarjetaProps) {
  const { t, px, texto } = useTheme();
  const { cita, paciente_nombre, zona_horaria } = fila;
  const colores = tono(t, cita.estado);
  const hora = horaCorta(cita.fecha_programada, zona_horaria);
  const pendiente = esReagendable(cita);

  if (!pendiente) {
    return (
      <View
        style={[
          estilos.tarjeta,
          { borderRadius: px('--radius-card'), backgroundColor: colores.fondo },
        ]}
      >
        <Text style={[texto('body-strong'), { color: colores.texto }]}>
          {`${ETIQUETA_DE_TIPO[cita.tipo]} · ${paciente_nombre}`}
        </Text>
        <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
          {`${hora} · ${ETIQUETA_DE_ESTADO[cita.estado]}`}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        estilos.tarjeta,
        sombra('--shadow-sm'),
        { borderRadius: px('--radius-card'), backgroundColor: colores.fondo },
      ]}
    >
      <Text style={[texto('h4'), { color: colores.texto }]}>
        {`${ETIQUETA_DE_TIPO[cita.tipo]} · ${paciente_nombre}`}
      </Text>
      <Text style={[texto('body-strong'), { color: t['--text-strong'] }]}>{`a las ${hora}`}</Text>
      <StatusDot status={cita.estado} label={ETIQUETA_DE_ESTADO[cita.estado]} />
      <Text style={[texto('caption'), { color: t['--text-muted'] }]}>
        {cita.notificar_tutor
          ? 'Te avisamos el día anterior y un rato antes.'
          : 'No vas a recibir aviso de esta cita.'}
      </Text>
      <EstadoLocal estado={estadoLocal} />
      <Text style={[texto('caption'), { color: t['--text-subtle'] }]}>
        Si no podés llegar, pedile a la veterinaria que la mueva.
      </Text>
    </View>
  );
}

/**
 * Lo que la cola dice de esta cita. Un cambio pendiente se muestra aplicado y
 * marcado como no confirmado; ocultarlo haría que la app pareciera haber perdido
 * lo que el tutor acaba de hacer (doc 11, sección 7).
 */
function EstadoLocal({ estado }: { estado?: EstadoLocalDeCita }) {
  if (!estado) return null;
  return estado === 'rechazada' ? (
    <Badge tone="danger" icon="alert-triangle">
      El cambio no se aplicó
    </Badge>
  ) : (
    <Badge tone="warning" icon="refresh-cw">
      Cambio sin enviar
    </Badge>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { padding: 16, gap: 6 },
});
