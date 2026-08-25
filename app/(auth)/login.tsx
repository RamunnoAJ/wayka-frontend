import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Isotipo from '../../design-system/assets/wayka-isotipo.svg';
import Logo from '../../design-system/assets/wayka-logo.svg';
import { Button, Checkbox, Input, InlineError } from '../../src/components';
import { useLogin, validarContrasenaDeIngreso, validarEmail } from '../../src/features/auth';
import { persisteEntreSesiones } from '../../src/lib/almacenamiento-refresh';
import { CODIGO_ERROR, ErrorApi, mensajeDeError } from '../../src/lib/errores';
import { esWeb } from '../../src/lib/plataforma';
import { useAnchoDeVentana } from '../../src/hooks';
import { ThemeProvider, useTheme } from '../../src/theme';

/**
 * Ingreso. Una sola implementación para los dos targets, con dos
 * composiciones según el ancho disponible:
 *
 * - Ancho (web de clínica): panel partido de `ui_kits/clinica-web/Login.jsx`.
 * - Angosto (móvil, y web en ventana chica): hero oscuro + hoja blanca, de
 *   `ui_kits/tutor-movil` (`TutorLogin`).
 *
 * El bloqueo de canal lo aplica el backend al emitir el token: acá el `canal`
 * ya viaja fijo por plataforma (`src/api/auth.ts`) y lo único que hace la
 * pantalla es explicar el rechazo cuando llega.
 */
const ANCHO_PANEL_PARTIDO = 900;

export default function Login() {
  const ancho = useAnchoDeVentana();

  // En nativo el ingreso arranca en tema tutor (naranja): es el rol mayoritario
  // de esa plataforma y es el único que puede crear su cuenta desde acá. El
  // veterinario que entra por móvil ve naranja solo en esta pantalla — apenas
  // hay sesión, el tema del rol lo resuelve el layout raíz.
  // En web el tutor no existe (Alcance de Plataformas, 1), así que va el default.
  return (
    <ThemeProvider nombre={esWeb ? 'default' : 'tutor'}>
      {ancho >= ANCHO_PANEL_PARTIDO ? <LoginAncho /> : <LoginAngosto />}
    </ThemeProvider>
  );
}

/** Estado y validación del formulario, compartidos por las dos composiciones. */
function useFormularioDeLogin() {
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [tocado, setTocado] = useState(false);
  const { mutate, isPending, error, reset } = useLogin();

  const errorEmail = tocado ? validarEmail(email) : undefined;
  const errorContrasena = tocado ? validarContrasenaDeIngreso(contrasena) : undefined;

  const enviar = () => {
    setTocado(true);
    if (validarEmail(email) || validarContrasenaDeIngreso(contrasena)) return;
    reset();
    mutate({ email: email.trim(), contrasena });
  };

  return {
    email,
    setEmail,
    contrasena,
    setContrasena,
    errorEmail,
    errorContrasena,
    enviar,
    isPending,
    error,
  };
}

/**
 * El backend distingue las dos fallas del ingreso con códigos estables:
 * `credenciales_invalidas` (email o contraseña) y `permiso_denegado`, que en
 * este endpoint es el bloqueo de canal — credenciales correctas, plataforma
 * equivocada. Sin eso habría que adivinar cuál de las dos fue.
 */
function mensajeDeFalla(error: unknown): { titulo: string; detalle: string } {
  if (error instanceof ErrorApi) {
    if (error.esCodigo(CODIGO_ERROR.CREDENCIALES_INVALIDAS)) {
      return { titulo: 'No pudimos entrar', detalle: 'Revisá el correo y la contraseña.' };
    }
    if (error.esCodigo(CODIGO_ERROR.PERMISO_DENEGADO)) {
      return {
        titulo: 'Esta cuenta no entra por acá',
        detalle: esWeb
          ? 'Wayka para tutores está disponible solo en la app móvil.'
          : 'Las cuentas de administración de la clínica entran desde la web.',
      };
    }
  }
  return { titulo: 'No pudimos entrar', detalle: mensajeDeError(error) };
}

interface CamposProps {
  formulario: ReturnType<typeof useFormularioDeLogin>;
  etiquetaEmail: string;
  tamanoBoton: 'lg' | 'touch';
  textoBoton: string;
}

function CamposDeLogin({ formulario, etiquetaEmail, tamanoBoton, textoBoton }: CamposProps) {
  const { px } = useTheme();
  const [mantenerSesion, setMantenerSesion] = useState(true);

  const falla = formulario.error ? mensajeDeFalla(formulario.error) : null;

  return (
    <View style={{ gap: px('--space-5') }}>
      {falla ? <InlineError compact title={falla.titulo} description={falla.detalle} /> : null}

      <Input
        label={etiquetaEmail}
        icon="mail"
        value={formulario.email}
        onChangeText={formulario.setEmail}
        error={formulario.errorEmail}
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        placeholder="nombre@clinica.vet"
        returnKeyType="next"
      />

      <Input
        label="Contraseña"
        icon="lock"
        value={formulario.contrasena}
        onChangeText={formulario.setContrasena}
        error={formulario.errorContrasena}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={formulario.enviar}
      />

      {/* Solo donde la sesión efectivamente sobrevive al cierre: en web el token
          de refresco vive en memoria mientras siga abierta esa decisión, y
          ofrecer "mantener sesión" ahí sería prometer algo que no pasa. */}
      {persisteEntreSesiones ? (
        <Checkbox label="Mantener sesión" checked={mantenerSesion} onChange={setMantenerSesion} />
      ) : null}

      <Button block size={tamanoBoton} loading={formulario.isPending} onPress={formulario.enviar}>
        {textoBoton}
      </Button>
    </View>
  );
}

/** Web de clínica: formulario a la izquierda, panel de marca a la derecha. */
function LoginAncho() {
  const { t, px, texto } = useTheme();
  const formulario = useFormularioDeLogin();

  return (
    <View
      style={[estilos.pantalla, { flexDirection: 'row', backgroundColor: t['--surface-card'] }]}
    >
      <View style={estilos.columnaCentrada}>
        <View style={{ width: '100%', maxWidth: 360, gap: px('--space-7') }}>
          <Logo width={140} height={40} color={t['--wayka-violeta-oscuro']} />

          <View style={{ gap: 6 }}>
            <Text style={[texto('h1'), { color: t['--text-strong'] }]}>Entrá a tu clínica</Text>
            <Text style={[texto('body-lg'), { color: t['--text-muted'] }]}>
              Historial clínico y agenda, en un solo lugar.
            </Text>
          </View>

          <CamposDeLogin
            formulario={formulario}
            etiquetaEmail="Correo profesional"
            tamanoBoton="lg"
            textoBoton="Ingresar"
          />

          <Text style={[texto('caption'), { color: t['--text-subtle'] }]}>
            ¿Sos tutor de una mascota? Wayka para tutores está disponible solo en la app móvil.
          </Text>
        </View>
      </View>

      <View style={[estilos.columnaCentrada, { backgroundColor: t['--wayka-lila'] }]}>
        <Isotipo
          width={620}
          height={443}
          color="#FFFFFF"
          style={{ position: 'absolute', opacity: 0.14, right: -160, bottom: -120 }}
        />
        <View style={{ maxWidth: 380, gap: 16 }}>
          <Text style={[texto('display-md'), { color: '#fff' }]}>
            La historia clínica completa, en el momento en que hace falta.
          </Text>
          <Text style={[texto('body'), { color: 'rgba(255,255,255,.78)' }]}>
            Alergias y medicación activa, siempre primero.
          </Text>
        </View>
      </View>
    </View>
  );
}

/** Móvil: hero sobre superficie de navegación y hoja blanca con el formulario. */
function LoginAngosto() {
  const { t, px, texto } = useTheme();
  const insets = useSafeAreaInsets();
  const formulario = useFormularioDeLogin();

  return (
    <KeyboardAvoidingView
      style={[estilos.pantalla, { backgroundColor: t['--surface-nav'] }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={estilos.scrollAngosto}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <View style={[estilos.hero, { paddingTop: insets.top + 32 }]}>
          <Isotipo
            width={420}
            height={300}
            color="#FFFFFF"
            style={{ position: 'absolute', opacity: 0.14, bottom: -60, right: -120 }}
          />
          <Logo width={150} height={43} color="#FFFFFF" />
          <Text
            style={[
              texto('body-lg'),
              { color: 'rgba(255,255,255,.85)', maxWidth: 250, textAlign: 'center' },
            ]}
          >
            La salud de tus mascotas, siempre a mano.
          </Text>
        </View>

        <View
          style={{
            backgroundColor: t['--surface-card'],
            borderTopLeftRadius: 26,
            borderTopRightRadius: 26,
            padding: px('--gutter-mobile'),
            paddingTop: 26,
            paddingBottom: 30 + insets.bottom,
            gap: px('--space-5'),
          }}
        >
          <Text style={[texto('h3'), { color: t['--text-strong'] }]}>Ingresá a tu cuenta</Text>

          <CamposDeLogin
            formulario={formulario}
            etiquetaEmail="Correo"
            tamanoBoton="touch"
            textoBoton="Entrar"
          />

          {/* El alta abierta es solo del tutor, y el tutor solo existe en móvil
              (Alcance de Plataformas, 5.1). */}
          {!esWeb ? (
            <Button
              block
              size="touch"
              variant="ghost"
              onPress={() => router.push('/(auth)/registro-tutor')}
            >
              Crear una cuenta
            </Button>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1 },
  columnaCentrada: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    overflow: 'hidden',
  },
  scrollAngosto: { flexGrow: 1, justifyContent: 'flex-end' },
  hero: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: 32,
    overflow: 'hidden',
  },
});
