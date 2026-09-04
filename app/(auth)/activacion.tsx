import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { activarCuenta } from '../../src/api/auth';
import { Button, Icon, InlineError, Input, EntradaDePantalla } from '../../src/components';
import {
  AbrirEnLaApp,
  IndicadorDeCoincidencia,
  ReglasDeContrasena,
  validarContrasenaNueva,
  validarRepetirContrasena,
} from '../../src/features/auth';
import { mensajeDeError } from '../../src/lib/errores';
import { RUTA_LOGIN } from '../../src/constants/roles';
import { ThemeProvider, useTheme } from '../../src/theme';

/**
 * Activación de la cuenta de clínica_admin (Alcance de Plataformas, 3.1.1).
 *
 * El token llega por la URL, que es el enlace que el administrador de la
 * plataforma le pasó a la clínica. Se acepta también escrito a mano: un enlace
 * que viaja por WhatsApp se corta más seguido de lo que uno quisiera.
 *
 * Al activar **no se entra**: el canje no emite sesión. La pantalla lleva al
 * login, donde se estrena la contraseña recién definida.
 */
export default function Activacion() {
  return (
    <ThemeProvider>
      <EntradaDePantalla>
        <PantallaDeActivacion />
      </EntradaDePantalla>
    </ThemeProvider>
  );
}

function PantallaDeActivacion() {
  const { t, px, texto } = useTheme();
  const { token: tokenDeLaURL } = useLocalSearchParams<{ token?: string }>();

  const [token, setToken] = useState(tokenDeLaURL ?? '');
  const [contrasena, setContrasena] = useState('');
  const [repetida, setRepetida] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(false);

  const errorDeContrasena = contrasena ? validarContrasenaNueva(contrasena) : undefined;
  const errorDeRepetida = validarRepetirContrasena(contrasena, repetida);
  const completo = token.trim() && contrasena && !errorDeContrasena && !errorDeRepetida;

  async function activar() {
    if (!completo || enviando) return;
    setEnviando(true);
    setError(null);
    try {
      await activarCuenta({ token: token.trim(), contrasena });
      setListo(true);
    } catch (causa) {
      setError(mensajeDeError(causa));
    } finally {
      setEnviando(false);
    }
  }

  if (listo) {
    return (
      <View style={[estilos.raiz, estilos.centrado, { backgroundColor: t['--surface-page'] }]}>
        <View style={[estilos.hoja, { maxWidth: 420 }]}>
          <View
            style={[
              estilos.marca,
              { borderRadius: px('--radius-lg'), backgroundColor: t['--surface-accent-soft'] },
            ]}
          >
            <Icon name="check" size={26} color={t['--color-primary-strong']} />
          </View>
          <Text style={[texto('h1'), { color: t['--text-strong'] }]}>Tu cuenta quedó lista</Text>
          <Text style={[texto('body-lg'), { color: t['--text-muted'] }]}>
            Ya podés entrar a Wayka con tu correo y la contraseña que acabás de definir.
          </Text>
          <Button block size="lg" onPress={() => router.replace(RUTA_LOGIN)}>
            Iniciar sesión
          </Button>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[estilos.raiz, { backgroundColor: t['--surface-page'] }]}
    >
      <ScrollView contentContainerStyle={estilos.centrado}>
        <View style={estilos.hoja}>
          <View style={estilos.encabezado}>
            <Text style={[texto('h1'), { color: t['--text-strong'] }]}>Definí tu contraseña</Text>
            <Text style={[texto('body-lg'), { color: t['--text-muted'] }]}>
              Tu cuenta ya está creada. Elegí una contraseña y entrás.
            </Text>
          </View>

          {/*
            La pantalla es la misma para los dos orígenes del token (regla 4.16):
            al clínica_admin se lo entregan en mano, al veterinario le llega por
            correo. La tira se muestra sola cuando el enlace vino de un correo
            dirigido a alguien que sí puede usar la app.
          */}
          <AbrirEnLaApp ruta="/activacion" />

          {/* Editable aunque venga en el enlace: un token que viaja por chat se
              corta, y reescribirlo tiene que ser posible sin pedir otro. */}
          <Input
            label="Token de activación"
            icon="lock"
            hint="Es el código que te llegó por correo, o el que te entregó el equipo de Wayka al dar de alta la clínica."
            value={token}
            onChangeText={setToken}
            autoCapitalize="none"
          />

          <Input
            label="Nueva contraseña"
            icon="lock"
            value={contrasena}
            onChangeText={setContrasena}
            secureTextEntry
            error={errorDeContrasena}
          />

          <ReglasDeContrasena valor={contrasena} disposicion="columna" tamanoDeIcono={14} />

          {/* Se repite porque acá no hay a qué volver: la contraseña recién
              definida es la única credencial de la cuenta. */}
          <Input
            label="Repetir contraseña"
            icon="lock"
            value={repetida}
            onChangeText={setRepetida}
            secureTextEntry
          />
          <IndicadorDeCoincidencia nueva={contrasena} repetida={repetida} tamanoDeIcono={14} />

          {error ? (
            <InlineError compact title="No se pudo activar la cuenta" description={error} />
          ) : null}

          <Button block size="lg" disabled={!completo} loading={enviando} onPress={activar}>
            Activar mi cuenta
          </Button>

          <Text style={[texto('caption'), { color: t['--text-subtle'] }]}>
            Al activar no entrás todavía: te llevamos al inicio de sesión para estrenar la
            contraseña.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  centrado: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  hoja: { width: '100%', maxWidth: 372, gap: 20 },
  encabezado: { gap: 6 },
  marca: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
});
