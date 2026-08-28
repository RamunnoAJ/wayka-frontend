import { useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Icon, PermissionCard } from '../../components';
import { sombra, useTheme } from '../../theme';
import {
  HAY_PUSH,
  leerEstadoDelPermiso,
  pedirPermiso,
  registrarEsteDispositivo,
  type EstadoDelPermiso,
} from '../notificaciones';

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
 *
 * Y es **el único lugar donde se pide el permiso de notificaciones**: pedirlo al
 * arrancar la app sería pedirlo en el momento en que menos se entiende para qué
 * es. Acá el tutor ya está leyendo qué avisos manda el sistema.
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
  const [permiso, setPermiso] = useState<EstadoDelPermiso | null>(null);

  useEffect(() => {
    let vigente = true;
    void leerEstadoDelPermiso().then((estado) => {
      if (vigente) setPermiso(estado);
    });
    return () => {
      vigente = false;
    };
  }, []);

  async function permitir() {
    const estado = await pedirPermiso();
    setPermiso(estado);
    // Recién con el permiso concedido hay token que registrar: el login lo
    // intentó y se fue sin nada.
    if (estado === 'concedido') await registrarEsteDispositivo();
  }

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

          {/*
            En web no hay push: el del navegador es otro mecanismo y el backend
            solo habla Expo (Alcance de Plataformas, 5.5). Se lo decimos en vez
            de ofrecer un botón que no hace nada.
          */}
          {!HAY_PUSH ? (
            <View style={[tarjeta, { backgroundColor: t['--surface-sunken'] }, estilos.bloque]}>
              <Text style={[texto('body-strong'), { color: t['--text-strong'] }]}>
                Los avisos llegan a la app del teléfono
              </Text>
              <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
                Desde el navegador podés ver todo lo de tus mascotas, pero los recordatorios de
                turno se mandan al teléfono. Entrá una vez desde la app para empezar a recibirlos.
              </Text>
            </View>
          ) : permiso ? (
            <PermissionCard
              status={permiso}
              onAsk={permiso === 'sin-preguntar' ? () => void permitir() : undefined}
              onOpenSettings={
                permiso === 'denegado' ? () => void Linking.openSettings() : undefined
              }
            />
          ) : null}

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
