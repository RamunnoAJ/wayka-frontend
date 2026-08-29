import { useMutation } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Icon, InlineError, Input, EntradaDePantalla } from '../../src/components';
import { validarEmail } from '../../src/features/auth/validaciones';
import { canjearRecuperacion, pedirRecuperacion } from '../../src/api/recuperacion';
import { CamposDeContrasena } from '../../src/features/cuenta';
import { mensajeDeError } from '../../src/lib/errores';
import { esWeb } from '../../src/lib/plataforma';
import { ThemeProvider, useTheme } from '../../src/theme';

/**
 * Recuperar la contraseña (Alcance de Plataformas, 5.1).
 *
 * Es la tercera pantalla alcanzable sin sesión, junto al login y al registro de
 * tutor. Hace dos cosas según cómo se llegue:
 *
 * - **Sin `token`**: pide el correo y manda el enlace.
 * - **Con `token`**, que es como la abre el enlace del correo: define la
 *   contraseña nueva.
 *
 * Al canjear **no se entra**: el backend no emite sesión, porque es en el login
 * donde vive el bloqueo de canal. La pantalla lleva ahí.
 */
export default function Recuperar() {
  const { token } = useLocalSearchParams<{ token?: string }>();

  // Mismo criterio que el login: en nativo el ingreso arranca en tema tutor, que
  // es el rol mayoritario de esa plataforma.
  return (
    <ThemeProvider nombre={esWeb ? 'default' : 'tutor'}>
      <EntradaDePantalla>
        {token ? <DefinirNueva token={token} /> : <PedirElEnlace />}
      </EntradaDePantalla>
    </ThemeProvider>
  );
}

function PedirElEnlace() {
  const { t, px, texto } = useTheme();
  const [email, setEmail] = useState('');
  const [tocado, setTocado] = useState(false);

  const pedir = useMutation({ mutationFn: () => pedirRecuperacion(email.trim().toLowerCase()) });

  const errorDeEmail = validarEmail(email);

  return (
    <Pantalla titulo="Recuperar tu contraseña">
      {/*
        El mensaje es el mismo exista o no la cuenta: el backend responde igual a
        propósito, y decir "no encontramos ese correo" acá delataría lo que el
        endpoint se cuida de no delatar.
      */}
      {pedir.isSuccess ? (
        <View style={estilos.exito}>
          <Icon name="mail" size={20} color={t['--text-success']} />
          <Text style={[texto('body'), { color: t['--text-body'] }]}>
            Si ese correo tiene una cuenta, te va a llegar un enlace en unos minutos. Revisá también
            el correo no deseado.
          </Text>
        </View>
      ) : (
        <>
          <Text style={[texto('body'), { color: t['--text-muted'] }]}>
            Poné tu correo y te mandamos un enlace para definir una contraseña nueva.
          </Text>

          <Input
            label="Correo"
            value={email}
            onChangeText={(valor) => {
              setEmail(valor);
              // El error del correo aparece recién al intentar mandarlo: marcarlo
              // mientras se escribe lo señala como inválido en la primera letra.
              setTocado(false);
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
            error={tocado ? errorDeEmail : undefined}
          />

          {pedir.isError ? (
            <InlineError
              compact
              title="No se pudo pedir el enlace"
              description={mensajeDeError(pedir.error)}
            />
          ) : null}

          <Button
            block
            size="touch"
            disabled={Boolean(errorDeEmail)}
            loading={pedir.isPending}
            onPress={() => {
              setTocado(true);
              if (!errorDeEmail) pedir.mutate();
            }}
          >
            Mandame el enlace
          </Button>
        </>
      )}

      <Button variant="ghost" onPress={() => router.replace('/(auth)/login')}>
        Volver al ingreso
      </Button>

      <Text
        style={[
          texto('caption'),
          { color: t['--text-subtle'], paddingHorizontal: px('--space-2') },
        ]}
      >
        Si sos parte de una veterinaria, tu clínica también puede restablecerte la contraseña.
      </Text>
    </Pantalla>
  );
}

function DefinirNueva({ token }: { token: string }) {
  const { t, texto } = useTheme();
  const [listo, setListo] = useState(false);

  // No pasa por `FormularioDeContrasena` porque acá no hay sesión ni cuenta
  // conocida: la credencial es el token del correo. Lo que se comparte son los
  // campos y la política, que es la misma regla 2.1.
  const canjear = useMutation({
    mutationFn: (contrasena: string) => canjearRecuperacion(token, contrasena),
    onSuccess: () => setListo(true),
  });

  if (listo) {
    return (
      <Pantalla titulo="Contraseña actualizada">
        <View style={estilos.exito}>
          <Icon name="check" size={20} color={t['--text-success']} />
          <Text style={[texto('body'), { color: t['--text-body'] }]}>
            Ya podés entrar con la contraseña nueva. Cerramos las sesiones que estaban abiertas, así
            que vas a tener que volver a entrar en tus otros dispositivos.
          </Text>
        </View>
        <Button block size="touch" onPress={() => router.replace('/(auth)/login')}>
          Ir al ingreso
        </Button>
      </Pantalla>
    );
  }

  return (
    <Pantalla titulo="Elegí una contraseña nueva">
      <CamposDeContrasena
        etiquetaDeGuardar="Definir contraseña"
        enviando={canjear.isPending}
        error={canjear.isError ? mensajeDeError(canjear.error) : undefined}
        onEnviar={({ nueva }) => canjear.mutate(nueva)}
      />
      <Button variant="ghost" onPress={() => router.replace('/(auth)/login')}>
        Volver al ingreso
      </Button>
    </Pantalla>
  );
}

function Pantalla({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  const { t, px, texto } = useTheme();
  return (
    <View style={[estilos.raiz, { backgroundColor: t['--surface-page'] }]}>
      <ScrollView contentContainerStyle={estilos.centrado}>
        <View
          style={[
            estilos.tarjeta,
            {
              padding: px('--gutter-card'),
              borderRadius: px('--radius-card'),
              backgroundColor: t['--surface-card'],
              borderColor: t['--border-default'],
            },
          ]}
        >
          <Text style={[texto('h2'), { color: t['--text-strong'] }]}>{titulo}</Text>
          {children}
        </View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  centrado: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  tarjeta: { width: '100%', maxWidth: 420, borderWidth: 1, gap: 14 },
  exito: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
});
