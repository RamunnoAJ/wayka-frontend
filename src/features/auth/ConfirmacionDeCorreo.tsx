import { useMutation } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { confirmarCorreo } from '../../api/confirmacion';
import { Button, Icon, InlineError, SkeletonText } from '../../components';
import { CODIGO_ERROR, ErrorApi, mensajeDeError } from '../../lib/errores';
import { useTheme } from '../../theme';

import { AbrirEnLaApp } from './AbrirEnLaApp';

/**
 * Confirmar la direccion de correo (Alcance de Plataformas, 5.1).
 *
 * Se abre desde el enlace del correo, **con o sin sesión**: la credencial es el
 * token. No pide nada — no hay formulario, porque no hay nada que la persona
 * tenga que decidir acá.
 *
 * **Confirmar no habilita nada.** La cuenta ya funcionaba sin esto; lo que se
 * gana es que el sistema pueda escribirle a esa dirección el día que olvide su
 * contraseña. El copy lo dice para que nadie crea que estaba trabado.
 *
 * Vive acá y no en `app/` porque ahí todo archivo es una ruta, tests incluidos:
 * la pantalla que se puede probar es la que no cuelga del árbol del router.
 */
export function ConfirmacionDeCorreo() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  return <Confirmacion token={token} />;
}

function Confirmacion({ token }: { token?: string }) {
  const { t, texto } = useTheme();

  const confirmar = useMutation({ mutationFn: (valor: string) => confirmarCorreo(valor) });

  // El canje se dispara solo: la pantalla llega desde un enlace que ya es la
  // acción, y pedir un clic más sería un paso sin decisión. El ref evita que el
  // doble render de desarrollo lo mande dos veces.
  const yaSeDisparo = useRef(false);
  const { mutate } = confirmar;
  useEffect(() => {
    if (!token || yaSeDisparo.current) return;
    yaSeDisparo.current = true;
    mutate(token);
  }, [token, mutate]);

  if (!token) {
    return (
      <Pantalla titulo="Falta el enlace">
        <Text style={[texto('body'), { color: t['--text-muted'] }]}>
          Esta pantalla se abre desde el enlace que te llegó por correo. Si llegaste hasta acá de
          otra forma, buscá ese mensaje y entrá desde ahí.
        </Text>
        <Button block size="touch" onPress={() => router.replace('/(auth)/login')}>
          Ir al ingreso
        </Button>
      </Pantalla>
    );
  }

  if (confirmar.isPending) {
    return (
      <Pantalla titulo="Confirmando tu correo">
        <SkeletonText lines={2} />
      </Pantalla>
    );
  }

  if (confirmar.isError) {
    // Un enlace rechazado y una caída de red no son lo mismo: al primero hay que
    // pedirle otro, y el segundo se resuelve reintentando. Decirle "tu enlace
    // venció" a alguien que se quedó sin conexión lo manda a rehacer algo que
    // estaba bien.
    const enlaceRechazado =
      confirmar.error instanceof ErrorApi && confirmar.error.esCodigo(CODIGO_ERROR.DATOS_INVALIDOS);

    if (!enlaceRechazado) {
      return (
        <Pantalla titulo="No se pudo confirmar tu correo">
          <InlineError
            compact
            title="Algo falló en el camino"
            description={mensajeDeError(confirmar.error)}
            onRetry={() => {
              yaSeDisparo.current = true;
              mutate(token);
            }}
          />
        </Pantalla>
      );
    }

    return (
      <Pantalla titulo="Este enlace ya no sirve">
        {/*
          El backend no distingue entre inexistente, vencido y ya usado, y la
          pantalla tampoco: decir cuál fue le diría a quien prueba tokens al azar
          cuál acertó a medias. Su mensaje genérico tampoco se muestra — repetiría
          el título con otras palabras. Lo que la pantalla sí dice es cómo salir.
        */}
        <Text style={[texto('body'), { color: t['--text-muted'] }]}>
          Puede haber vencido, o haber quedado reemplazado por uno más nuevo si pediste que te lo
          mandáramos de nuevo. Buscá el último correo que te llegó, o entrá a tu cuenta y pedí otro
          desde Ajustes.
        </Text>
        <Text style={[texto('body-sm'), { color: t['--text-subtle'] }]}>
          Tu cuenta funciona igual: confirmar el correo no te bloquea nada.
        </Text>
        <Button block size="touch" onPress={() => router.replace('/(auth)/login')}>
          Ir al ingreso
        </Button>
      </Pantalla>
    );
  }

  return (
    <Pantalla titulo="Listo, tu correo quedó confirmado">
      <AbrirEnLaApp ruta="/confirmar-correo" />
      <View style={estilos.exito}>
        <Icon name="check" size={20} color={t['--text-success']} />
        <Text style={[texto('body'), { color: t['--text-body'] }]}>
          Tu cuenta ya funcionaba sin esto. Lo que cambia es que ahora podemos escribirte a esta
          dirección si alguna vez olvidás tu contraseña.
        </Text>
      </View>
      <Button block size="touch" onPress={() => router.replace('/')}>
        Seguir
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
