import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Icon, InlineError, Input } from '../../components';
import { mensajeDeError } from '../../lib/errores';
import { useTheme } from '../../theme';
import { REGLAS_CONTRASENA, validarContrasenaNueva } from '../auth/validaciones';

import { useCambiarContrasena } from './queries';

/**
 * Cambio de contraseña de la cuenta autenticada.
 *
 * Es el mismo formulario para los tres roles: lo que cambia es dónde se monta
 * —una pantalla propia en el veterinario, una sección en el tutor y en el
 * clínica_admin—, no qué pide ni qué valida.
 *
 * **La política se muestra desde el principio, no al fallar.** Mismo criterio
 * que el límite de tamaño en los adjuntos: la restricción del backend se
 * muestra, no se descubre. Cada regla se tilda sola mientras se escribe.
 */
interface FormularioDeContrasenaProps {
  usuarioId: string;
  /**
   * `false` en una cuenta creada con Google que todavía no tiene contraseña: ahí
   * la establece por primera vez y no hay una anterior que acreditar (contrato,
   * `cambiarContrasena`).
   */
  tieneContrasena: boolean;
  onListo?: () => void;
  onCancelar?: () => void;
}

export function FormularioDeContrasena({
  usuarioId,
  tieneContrasena,
  onListo,
  onCancelar,
}: FormularioDeContrasenaProps) {
  const { t, texto } = useTheme();
  const cambiar = useCambiarContrasena(usuarioId);

  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [repetida, setRepetida] = useState('');
  const [tocado, setTocado] = useState(false);

  const errorDeNueva = validarContrasenaNueva(nueva);
  const noCoinciden = repetida.length > 0 && repetida !== nueva;
  const completo = (!tieneContrasena || actual.length > 0) && !errorDeNueva && repetida === nueva;

  function guardar() {
    setTocado(true);
    if (!completo) return;
    cambiar.mutate(
      {
        ...(tieneContrasena ? { contrasena_actual: actual } : {}),
        contrasena_nueva: nueva,
      },
      {
        onSuccess: () => {
          // Los campos no quedan cargados: es una credencial, y dejarla escrita
          // en pantalla después de guardar no tiene motivo.
          setActual('');
          setNueva('');
          setRepetida('');
          setTocado(false);
          onListo?.();
        },
      },
    );
  }

  return (
    <View style={estilos.raiz}>
      {!tieneContrasena ? (
        <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
          Tu cuenta entra con Google y todavía no tiene contraseña. Si la definís, vas a poder usar
          las dos formas.
        </Text>
      ) : (
        <Input
          label="Contraseña actual"
          secureTextEntry
          value={actual}
          onChangeText={setActual}
          textContentType="password"
        />
      )}

      <Input
        label="Contraseña nueva"
        secureTextEntry
        value={nueva}
        onChangeText={setNueva}
        textContentType="newPassword"
        error={tocado ? errorDeNueva : undefined}
      />

      <View style={estilos.reglas}>
        {REGLAS_CONTRASENA.map((regla) => {
          const cumple = regla.prueba(nueva);
          return (
            <View key={regla.texto} style={estilos.regla}>
              <Icon
                name={cumple ? 'check' : 'circle-dot'}
                size={13}
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

      <Input
        label="Repetir la nueva"
        secureTextEntry
        value={repetida}
        onChangeText={setRepetida}
        textContentType="newPassword"
        error={noCoinciden ? 'Las dos no coinciden' : undefined}
      />

      {/*
        El error del servidor es el que no se puede adelantar: la contraseña
        actual incorrecta. El backend responde datos_invalidos y el mensaje que
        trae ya lo dice.
      */}
      {cambiar.isError ? (
        <InlineError
          compact
          title="No se pudo cambiar"
          description={mensajeDeError(cambiar.error)}
        />
      ) : null}

      <View style={estilos.acciones}>
        <Button disabled={!completo} loading={cambiar.isPending} onPress={guardar}>
          Guardar contraseña
        </Button>
        {onCancelar ? (
          <Button variant="ghost" onPress={onCancelar}>
            Cancelar
          </Button>
        ) : null}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { gap: 12 },
  reglas: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  regla: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  acciones: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
});
