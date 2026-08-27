import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Icon } from '../../components';
import { sombra, useTheme } from '../../theme';

/**
 * Notificaciones (Alcance de Plataformas, 5.5).
 *
 * **No hay listado y no es una omisión**: la matriz de permisos dice que nadie
 * lee Notificaciones por API en el MVP — llegan como push y no se listan
 * (Modelo de Datos, sección 5). Traerlas a una pantalla exigiría un endpoint que
 * el contrato descartó a propósito.
 *
 * Lo que sí corresponde acá es explicar qué avisos manda el sistema y cuándo,
 * porque es lo único que el tutor no puede deducir del resto de la app. El
 * interruptor por cita vive en la cita, que es donde el contrato lo pone
 * (`notificar_tutor`).
 */
const AVISOS = [
  {
    icono: 'calendar-days' as const,
    titulo: 'El día anterior a cada cita',
    detalle: 'Un aviso a una hora fija de la tarde, para que puedas organizarte.',
  },
  {
    icono: 'calendar-clock' as const,
    titulo: 'Un par de horas antes del turno',
    detalle: 'Un segundo recordatorio, cerca de la hora, para que no se te pase.',
  },
];

export function MisNotificaciones() {
  const { t, px, texto } = useTheme();

  const tarjeta = {
    borderRadius: px('--radius-card'),
    backgroundColor: t['--surface-card'],
    borderColor: t['--border-default'],
    borderWidth: 1,
    padding: px('--gutter-card'),
  };

  return (
    <View style={[estilos.raiz, { backgroundColor: t['--surface-page'] }]}>
      <ScrollView>
        <View style={[estilos.contenido, { paddingHorizontal: px('--gutter-mobile') }]}>
          <View style={estilos.titulo}>
            <Text style={[texto('h1'), { color: t['--text-strong'] }]}>Avisos</Text>
            <Text style={[texto('body-lg'), { color: t['--text-muted'] }]}>
              Te avisamos de las citas de tus mascotas. Nada más: no mandamos novedades ni
              promociones.
            </Text>
          </View>

          <View style={[tarjeta, sombra('--shadow-sm'), estilos.bloque]}>
            {AVISOS.map((aviso) => (
              <View key={aviso.titulo} style={estilos.aviso}>
                <View
                  style={[
                    estilos.icono,
                    { borderRadius: px('--radius-md'), backgroundColor: t['--color-primary-soft'] },
                  ]}
                >
                  <Icon name={aviso.icono} size={18} color={t['--color-primary-strong']} />
                </View>
                <View style={estilos.flexible}>
                  <Text style={[texto('body-strong'), { color: t['--text-strong'] }]}>
                    {aviso.titulo}
                  </Text>
                  <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
                    {aviso.detalle}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={[tarjeta, { backgroundColor: t['--surface-sunken'] }, estilos.bloque]}>
            <Text style={[texto('body-strong'), { color: t['--text-strong'] }]}>
              Qué dice un aviso
            </Text>
            <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
              Qué mascota, qué día y a qué hora. Nunca información clínica: una notificación se lee
              en la pantalla bloqueada del teléfono, a la vista de cualquiera.
            </Text>
          </View>

          <View style={[tarjeta, { backgroundColor: t['--surface-sunken'] }, estilos.bloque]}>
            <Text style={[texto('body-strong'), { color: t['--text-strong'] }]}>
              Si no te llegan
            </Text>
            <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
              Revisá que la app tenga permiso de notificaciones en los ajustes del teléfono. Cerrar
              sesión da de baja este aparato, así que dejamos de mandarle avisos hasta que vuelvas a
              entrar.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  contenido: { paddingVertical: 24, gap: 16 },
  titulo: { gap: 6 },
  bloque: { gap: 14 },
  aviso: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  icono: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  flexible: { flex: 1, gap: 2 },
});
