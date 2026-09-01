import { useEffect, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { Button, Icon, InlineError, PermissionCard, Switch } from '../../components';
import { sombra, useTheme } from '../../theme';
import {
  activarAvisos,
  avisosActivados,
  DEMORA_DE_SIMULACION,
  desactivarAvisos,
  HAY_PUSH,
  leerEstadoDelPermiso,
  pedirPermiso,
  PUEDE_SIMULAR,
  simularAviso,
  type EstadoDelPermiso,
} from '../notificaciones';

/**
 * Avisos, bloque de Ajustes (Alcance de Plataformas, 5.5 y 5.8).
 *
 * **No es una pantalla de la barra y no lo fue por poco**: todo lo que el tutor
 * toca acá es un interruptor, y un control solo no sostiene una pestaña. El
 * resto del bloque explica qué manda el sistema, que es lo único que no se
 * deduce del resto de la app.
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
 *
 * **El interruptor y el permiso del teléfono son dos cosas distintas.** El
 * permiso lo da el sistema operativo y solo se puede volver atrás desde sus
 * ajustes; el interruptor es de la app y da de baja este aparato en el backend
 * (Alcance de Plataformas, 5.5). Por eso no se muestran los dos a la vez: sin
 * permiso concedido el interruptor no tendría nada que apagar, y mostrarlo
 * prometería un control que el sistema ya bloqueó.
 *
 * Es **por teléfono y no por cuenta**: el modelo registra Dispositivos, no una
 * preferencia del Usuario. Apagarlos acá no apaga los del otro aparato del
 * mismo tutor, que es lo que corresponde — el que molesta es este.
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
  const [activados, setActivados] = useState(false);
  const [aplicando, setAplicando] = useState(false);
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    let vigente = true;
    void Promise.all([leerEstadoDelPermiso(), avisosActivados()]).then(([estado, quiere]) => {
      if (!vigente) return;
      setPermiso(estado);
      setActivados(quiere);
    });
    return () => {
      vigente = false;
    };
  }, []);

  async function permitir() {
    const estado = await pedirPermiso();
    setPermiso(estado);
    // Recién con el permiso concedido hay token que registrar: el login lo
    // intentó y se fue sin nada. Conceder el permiso es prenderlos.
    if (estado !== 'concedido') return;
    await cambiar(true);
  }

  /**
   * Aplica el cambio contra el backend y solo entonces lo da por hecho. Un
   * interruptor que se mueve primero y se arregla después le dice al tutor que
   * los avisos están apagados cuando siguen llegando.
   */
  async function cambiar(destino: boolean) {
    setAplicando(true);
    setFallo(false);
    try {
      if (destino) await activarAvisos();
      else await desactivarAvisos();
      setActivados(destino);
    } catch {
      setFallo(true);
    } finally {
      setAplicando(false);
    }
  }

  const tarjeta = {
    borderRadius: px('--radius-card'),
    backgroundColor: t['--surface-card'],
    borderColor: t['--border-default'],
    borderWidth: 1,
    padding: px('--gutter-card'),
  };

  return (
    <View style={estilos.raiz}>
      <View style={estilos.titulo}>
        <Text style={[texto('h2'), { color: t['--text-strong'] }]}>Avisos</Text>
        <Text style={[texto('body-lg'), { color: t['--text-muted'] }]}>
          Te avisamos de las citas de tus mascotas. Nada más: no mandamos novedades ni promociones.
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
            Desde el navegador podés ver todo lo de tus mascotas, pero los recordatorios de turno se
            mandan al teléfono. Entrá una vez desde la app para empezar a recibirlos.
          </Text>
        </View>
      ) : permiso === 'concedido' ? (
        <View style={[tarjeta, estilos.bloque]}>
          <Switch
            label="Recibir avisos en este teléfono"
            description={
              activados
                ? 'Te llegan los recordatorios de los turnos de tus mascotas.'
                : 'Están apagados en este aparato. Tus turnos siguen igual.'
            }
            checked={activados}
            disabled={aplicando}
            onChange={(destino) => void cambiar(destino)}
          />
          {fallo ? (
            <InlineError title="No se pudo cambiar" onRetry={() => void cambiar(!activados)} />
          ) : null}
        </View>
      ) : permiso ? (
        <PermissionCard
          status={permiso}
          onAsk={permiso === 'sin-preguntar' ? () => void permitir() : undefined}
          onOpenSettings={permiso === 'denegado' ? () => void Linking.openSettings() : undefined}
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
              <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>{aviso.detalle}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={[tarjeta, { backgroundColor: t['--surface-sunken'] }, estilos.bloque]}>
        <Text style={[texto('body-strong'), { color: t['--text-strong'] }]}>Qué dice un aviso</Text>
        <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
          Qué mascota, qué día y a qué hora. Nunca información clínica: una notificación se lee en
          la pantalla bloqueada del teléfono, a la vista de cualquiera.
        </Text>
      </View>

      {/*
            Solo en desarrollo: manda el mismo texto que el backend como aviso
            local, para poder mirar cómo lo dibuja el teléfono sin fabricar una
            cita a la hora justa. `PUEDE_SIMULAR` es false en cualquier release.
            No mira el permiso ni el interruptor de arriba: se muestra también
            en el emulador, donde no hay push remoto pero sí aviso local.
          */}
      {PUEDE_SIMULAR ? (
        <View style={[tarjeta, { borderColor: t['--color-primary'] }, estilos.bloque]}>
          <Text style={[texto('body-strong'), { color: t['--text-strong'] }]}>
            Probar un aviso (solo en desarrollo)
          </Text>
          <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
            Llega en {DEMORA_DE_SIMULACION} segundos: cerrá la app para verlo como lo ve el tutor.
          </Text>
          <View style={estilos.pruebas}>
            <Button variant="secondary" size="sm" onPress={() => void simularAviso('dia-anterior')}>
              El día anterior
            </Button>
            <Button variant="secondary" size="sm" onPress={() => void simularAviso('mismo-dia')}>
              El mismo día
            </Button>
          </View>
        </View>
      ) : null}

      <View style={[tarjeta, { backgroundColor: t['--surface-sunken'] }, estilos.bloque]}>
        <Text style={[texto('body-strong'), { color: t['--text-strong'] }]}>Si no te llegan</Text>
        <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
          Revisá que el interruptor de arriba esté prendido y que la app tenga permiso de
          notificaciones en los ajustes del teléfono. Cerrar sesión también da de baja este aparato,
          y vuelve a darlo de alta cuando entrás de nuevo.
        </Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { gap: 16 },
  titulo: { gap: 6 },
  bloque: { gap: 14 },
  aviso: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  icono: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  flexible: { flex: 1, gap: 2 },
  pruebas: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
});
