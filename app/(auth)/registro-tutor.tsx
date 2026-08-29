import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Button,
  Checkbox,
  Icon,
  Input,
  InlineError,
  EntradaDePantalla,
} from '../../src/components';
import {
  REGLAS_CONTRASENA,
  RegistroSinSesion,
  useRegistroTutor,
  validarConsentimiento,
  validarEmail,
  validarNombre,
  validarContrasenaNueva,
} from '../../src/features/auth';
import { CODIGO_ERROR, ErrorApi, mensajeDeError } from '../../src/lib/errores';
import { ThemeProvider, useTheme } from '../../src/theme';

/**
 * Alta pública de Tutor: la única del sistema que no requiere sesión previa
 * (Arquitectura, 4.5; regla 4.9). Crea ficha y cuenta en una sola operación del
 * backend, y deja al tutor adentro de inmediato.
 *
 * No hay pantalla de alta en los kits entregados — el `TutorLogin` ofrece
 * "Crear una cuenta" pero no muestra el destino. La composición de acá sigue
 * los patrones de ese kit (hoja sobre superficie de navegación, controles
 * `touch`), no una interpretación visual nueva.
 *
 * Va siempre en tema tutor: acá sí sabemos quién es quien está del otro lado.
 */
export default function RegistroTutor() {
  return (
    <ThemeProvider nombre="tutor">
      <EntradaDePantalla>
        <FormularioDeRegistro />
      </EntradaDePantalla>
    </ThemeProvider>
  );
}

/**
 * El tutor no tiene acceso a la web bajo ninguna circunstancia (Alcance de
 * Plataformas, sección 1): el backend rechazaría el alta por canal, así que
 * mostrar el formulario sería llevar a alguien a un rechazo evitable.
 */

function FormularioDeRegistro() {
  const { t, px, texto } = useTheme();
  const insets = useSafeAreaInsets();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [consentimiento, setConsentimiento] = useState(false);
  const [tocado, setTocado] = useState(false);

  const { mutate, isPending, error, reset } = useRegistroTutor();

  const errores = {
    nombre: validarNombre(nombre),
    email: validarEmail(email),
    contrasena: validarContrasenaNueva(contrasena),
    consentimiento: validarConsentimiento(consentimiento),
  };
  const hayErrores = Object.values(errores).some(Boolean);

  const enviar = () => {
    setTocado(true);
    if (hayErrores) return;
    reset();
    mutate({
      nombre: nombre.trim(),
      email: email.trim(),
      contrasena,
      consentimiento_datos: consentimiento,
    });
  };

  return (
    <KeyboardAvoidingView
      style={[estilos.pantalla, { backgroundColor: t['--surface-nav'] }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={estilos.scroll} keyboardShouldPersistTaps="handled">
        <View style={[estilos.encabezado, { paddingTop: insets.top + 12 }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            onPress={() => router.back()}
            hitSlop={12}
          >
            <Icon name="arrow-left" size={22} color={t['--text-on-nav']} />
          </Pressable>
          <Text style={[texto('h3'), { color: t['--text-on-nav'] }]}>Crear tu cuenta</Text>
        </View>

        <View
          style={{
            flexGrow: 1,
            backgroundColor: t['--surface-card'],
            borderTopLeftRadius: 26,
            borderTopRightRadius: 26,
            padding: px('--gutter-mobile'),
            paddingTop: 26,
            paddingBottom: 30 + insets.bottom,
            gap: px('--space-5'),
          }}
        >
          <Text style={[texto('body'), { color: t['--text-muted'] }]}>
            Con tu cuenta vas a ver la historia clínica y las citas de tus mascotas. Las carga tu
            veterinaria: hasta que te vinculen una, vas a ver tus secciones vacías.
          </Text>

          {error ? (
            <InlineError
              compact
              title="No pudimos crear la cuenta"
              description={mensajeDeFalla(error)}
            />
          ) : null}

          <Input
            label="Nombre y apellido"
            value={nombre}
            onChangeText={setNombre}
            error={tocado ? errores.nombre : undefined}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
          />

          <Input
            label="Correo"
            icon="mail"
            value={email}
            onChangeText={setEmail}
            error={tocado ? errores.email : undefined}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            placeholder="nombre@mail.com"
          />

          <View style={{ gap: 6 }}>
            <Input
              label="Contraseña"
              icon="lock"
              value={contrasena}
              onChangeText={setContrasena}
              error={tocado ? errores.contrasena : undefined}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
            />
            <RequisitosDeContrasena valor={contrasena} />
          </View>

          <Checkbox
            label="Acepto el uso de mis datos"
            description="Wayka guarda tus datos y los de tus mascotas para que tu veterinaria pueda atenderlas. Sin esto no podemos crear la cuenta."
            checked={consentimiento}
            onChange={setConsentimiento}
          />
          {tocado && errores.consentimiento ? (
            <Text style={[texto('caption'), { color: t['--text-danger'] }]}>
              {errores.consentimiento}
            </Text>
          ) : null}

          <Button block size="touch" loading={isPending} onPress={enviar}>
            Crear cuenta
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/**
 * Los requisitos se muestran siempre, tildándose a medida que se cumplen: es
 * más útil que un error después de enviar, que es cuando ya se eligió mal.
 */
function RequisitosDeContrasena({ valor }: { valor: string }) {
  const { t, texto } = useTheme();

  return (
    <View style={estilos.requisitos}>
      {REGLAS_CONTRASENA.map((regla) => {
        const cumple = regla.prueba(valor);
        return (
          <View key={regla.texto} style={estilos.requisito}>
            <Icon
              name="check"
              size={12}
              color={cumple ? t['--text-success'] : t['--text-subtle']}
            />
            <Text
              style={[
                texto('caption'),
                { color: cumple ? t['--text-success'] : t['--text-subtle'] },
              ]}
            >
              {regla.texto}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/**
 * `conflicto` en este endpoint es el email ya en uso (regla 4.9, paso 3).
 * `RegistroSinSesion` es el caso raro en que la cuenta se creó pero el login
 * encadenado falló: ahí el mensaje no puede decir que el alta no salió.
 */
function mensajeDeFalla(error: unknown): string {
  if (error instanceof RegistroSinSesion) return error.message;
  if (error instanceof ErrorApi && error.esCodigo(CODIGO_ERROR.CONFLICTO)) {
    return 'Ya hay una cuenta con ese correo. Probá ingresar en vez de crear una nueva.';
  }
  return mensajeDeError(error);
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1 },
  centrado: { alignItems: 'center', justifyContent: 'center', padding: 32 },
  scroll: { flexGrow: 1 },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingBottom: 22,
  },
  requisitos: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 2 },
  requisito: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
