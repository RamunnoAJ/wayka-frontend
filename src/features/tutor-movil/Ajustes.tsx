import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Icon, Presionable } from '../../components';
import { useSesion } from '../../hooks/useSesion';
import { sombra, useTheme } from '../../theme';
import { BotonCerrarSesion } from '../auth';
import { AvisoDeCorreoSinConfirmar, FormularioDeContrasena } from '../cuenta';

import { MisDatos } from './MisDatos';
import { MisNotificaciones } from './MisNotificaciones';

/**
 * Ajustes del tutor (Alcance de Plataformas, 5.8): la tercera y última pestaña
 * de su barra, junto a Mascotas y Citas.
 *
 * Junta lo que es del tutor y no de una mascota — su ficha, sus avisos y su
 * cuenta. Antes eran dos pestañas, "Mis datos" y "Avisos", y no lo justificaban:
 * la de avisos era un único interruptor, y una barra de cinco convierte cada
 * pestaña en un renglón ilegible en un teléfono angosto.
 *
 * El **scroll y el padding viven acá y no en cada bloque**: son tres secciones
 * de una misma página, y un `ScrollView` por bloque las dejaría desplazándose
 * cada una por su cuenta.
 *
 * **Cerrar sesión va último y siempre se dibuja**, incluso cuando la ficha no
 * carga: es la única salida que el tutor tiene a mano, y esconderla detrás de un
 * estado de error deja la cuenta encerrada en el aparato.
 */
export function Ajustes() {
  const { t, px, texto } = useTheme();
  const { sesion } = useSesion();
  const [cambiandoContrasena, setCambiandoContrasena] = useState(false);

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
          <Text style={[texto('h1'), { color: t['--text-strong'] }]}>Ajustes</Text>

          <MisDatos />
          <MisNotificaciones />

          <View style={estilos.seccion}>
            <Text style={[texto('h2'), { color: t['--text-strong'] }]}>Cuenta</Text>

            {/*
              La contraseña es un dato de la cuenta como el teléfono, pero en su
              propia tarjeta y no entre los campos de la ficha: se guardan por
              separado y con otro botón.
            */}
            {sesion?.usuario ? (
              <AvisoDeCorreoSinConfirmar
                email={sesion.usuario.email}
                confirmado={sesion.usuario.email_confirmado}
              />
            ) : null}

            {sesion?.usuario ? (
              <View style={[tarjeta, sombra('--shadow-sm'), estilos.tarjeta]}>
                <Text style={[texto('h3'), { color: t['--text-strong'] }]}>Contraseña</Text>
                {!cambiandoContrasena ? (
                  <View style={estilos.fila}>
                    <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
                      {sesion.usuario.tiene_contrasena
                        ? 'Definida. Cambiala cuando quieras.'
                        : 'Todavía no tenés una: entrás con Google.'}
                    </Text>
                    <Button
                      variant="secondary"
                      size="sm"
                      onPress={() => setCambiandoContrasena(true)}
                    >
                      {sesion.usuario.tiene_contrasena ? 'Cambiar' : 'Definir una'}
                    </Button>
                  </View>
                ) : (
                  <FormularioDeContrasena
                    usuarioId={sesion.usuario.id}
                    tieneContrasena={sesion.usuario.tiene_contrasena}
                    onListo={() => setCambiandoContrasena(false)}
                    onCancelar={() => setCambiandoContrasena(false)}
                  />
                )}
              </View>
            ) : null}

            {/*
              El tablero de propuestas cuelga de acá y no de una cuarta pestaña
              (Alcance de Plataformas, 5.13): es una pantalla que se abre cada
              varias semanas, y una pestaña le cobraría ancho permanente a las
              tres que el tutor abre todos los días.
            */}
            <Presionable
              onPress={() => router.push('/ajustes/propuestas')}
              fondo={t['--surface-card']}
              borde={t['--border-default']}
              accessibilityLabel="Propuestas"
              style={[tarjeta, sombra('--shadow-sm'), estilos.entrada]}
            >
              <Icon name="lightbulb" size={20} color={t['--text-muted']} />
              <View style={estilos.flexible}>
                <Text style={[texto('body-strong'), { color: t['--text-strong'] }]}>
                  Propuestas
                </Text>
                <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
                  Qué le pide la gente al producto, y qué está pasando con eso.
                </Text>
              </View>
              <Icon name="chevron-right" size={18} color={t['--text-subtle']} />
            </Presionable>

            <View style={estilos.salida}>
              <BotonCerrarSesion />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  contenido: { paddingVertical: 24, gap: 28, paddingBottom: 48 },
  seccion: { gap: 16 },
  tarjeta: { gap: 14 },
  entrada: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flexible: { flex: 1, gap: 2 },
  fila: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  salida: { alignItems: 'flex-start' },
});
