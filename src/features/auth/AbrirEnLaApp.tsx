import * as Linking from 'expo-linking';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking as LinkingRN, StyleSheet, Text, View } from 'react-native';

import { Button, Icon } from '../../components';
import { esWeb } from '../../lib/plataforma';
import { useTheme } from '../../theme';

/**
 * Tira que ofrece seguir en la aplicación, arriba de las pantallas que se abren
 * desde un enlace de correo (Arquitectura, 3.8).
 *
 * **Ofrece, no obliga, y no bloquea.** La pantalla que la contiene hace su
 * trabajo igual —confirma, o pide la contraseña nueva— para quien no tenga la
 * app o esté frente a una computadora: el correo llega a los dos lados, y un
 * enlace que exija la app deja afuera la mitad de los casos.
 *
 * **Quién la ve lo decide el backend, no esta pantalla.** El enlace trae
 * `destino=app` solo si la cuenta es de tutor o veterinario; al clínica_admin no
 * se le ofrece, porque el bloqueo de canal (regla 2.3) le impide autenticarse
 * desde móvil. El cliente no puede deducirlo: no sabe de quién es el token, y el
 * canje no lo revela a propósito.
 *
 * Es una solución de transición. Cuando `wayka.app` sirva los archivos de
 * asociación, el mismo `https` va a abrir la app sola y esta tira sobra.
 */
export function AbrirEnLaApp({ ruta }: { ruta: string }) {
  const { t, px, texto } = useTheme();
  const { destino, token } = useLocalSearchParams<{ destino?: string; token?: string }>();
  const [fallo, setFallo] = useState(false);

  // En nativo esta pantalla ya *es* la app: ofrecerla sería ofrecer lo que la
  // persona está mirando.
  if (!esWeb || destino !== 'app' || !token) return null;

  const enlace = Linking.createURL(ruta, { queryParams: { token } });

  return (
    <View
      style={[
        estilos.tira,
        {
          padding: px('--space-3'),
          borderRadius: px('--radius-card'),
          backgroundColor: t['--surface-sunken'],
          borderColor: t['--border-default'],
        },
      ]}
    >
      <View style={estilos.encabezado}>
        <Icon name="external-link" size={18} color={t['--text-muted']} />
        <Text style={[texto('body-sm'), { color: t['--text-body'] }]}>
          {fallo
            ? 'No se pudo abrir. Puede que no esté instalada en este dispositivo: seguí acá abajo.'
            : '¿Tenés la app de Wayka? Seguí ahí y quedás con la sesión iniciada en el teléfono.'}
        </Text>
      </View>

      {!fallo ? (
        <Button
          variant="secondary"
          size="sm"
          onPress={() => {
            // El navegador no avisa si el esquema no está registrado: openURL
            // rechaza y ahí se cambia el texto, en vez de dejar a alguien
            // esperando una app que no se va a abrir.
            LinkingRN.openURL(enlace).catch(() => setFallo(true));
          }}
        >
          Abrir en la app
        </Button>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  tira: { borderWidth: 1, gap: 10, alignItems: 'flex-start' },
  encabezado: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
});
