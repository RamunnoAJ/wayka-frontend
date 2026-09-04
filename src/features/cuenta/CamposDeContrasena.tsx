import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, InlineError, Input } from '../../components';
import { useTheme } from '../../theme';
import { IndicadorDeCoincidencia, ReglasDeContrasena } from '../auth/IndicadoresDeContrasena';
import { validarContrasenaNueva, validarRepetirContrasena } from '../auth/validaciones';

/**
 * Los campos de elegir una contraseña, sin saber para qué.
 *
 * No habla con la API: quien lo usa decide qué hacer con lo que se escribió. Eso
 * es lo que le permite servir a los dos casos, que se parecen en todo salvo en
 * la credencial con la que se autoriza el cambio — la sesión en `FormularioDeContrasena`,
 * el token del correo en la pantalla de recuperación, donde no hay sesión.
 *
 * **La política se muestra desde el principio, no al fallar.** Mismo criterio
 * que el límite de tamaño en los adjuntos: la restricción del backend se
 * muestra, no se descubre. Cada regla se tilda sola mientras se escribe.
 */
interface CamposDeContrasenaProps {
  /** Muestra el campo de contraseña actual y lo exige. */
  pedirActual?: boolean;
  /** Texto explicativo arriba de los campos. */
  nota?: string;
  etiquetaDeGuardar?: string;
  enviando?: boolean;
  /** Error del servidor: el único que no se puede adelantar. */
  error?: string;
  onEnviar: (valores: { nueva: string; actual?: string }) => void;
  onCancelar?: () => void;
}

export function CamposDeContrasena({
  pedirActual = false,
  nota,
  etiquetaDeGuardar = 'Guardar contraseña',
  enviando = false,
  error,
  onEnviar,
  onCancelar,
}: CamposDeContrasenaProps) {
  const { t, texto } = useTheme();

  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [repetida, setRepetida] = useState('');
  const [tocado, setTocado] = useState(false);

  const errorDeNueva = validarContrasenaNueva(nueva);
  const errorDeRepetida = validarRepetirContrasena(nueva, repetida);
  const completo = (!pedirActual || actual.length > 0) && !errorDeNueva && !errorDeRepetida;

  return (
    <View style={estilos.raiz}>
      {nota ? <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>{nota}</Text> : null}

      {pedirActual ? (
        <Input
          label="Contraseña actual"
          secureTextEntry
          value={actual}
          onChangeText={setActual}
          textContentType="password"
        />
      ) : null}

      <Input
        label="Contraseña nueva"
        secureTextEntry
        value={nueva}
        onChangeText={setNueva}
        textContentType="newPassword"
        error={tocado ? errorDeNueva : undefined}
      />

      <ReglasDeContrasena valor={nueva} />

      <Input
        label="Repetir la nueva"
        secureTextEntry
        value={repetida}
        onChangeText={setRepetida}
        textContentType="newPassword"
        error={tocado ? errorDeRepetida : undefined}
      />

      <IndicadorDeCoincidencia nueva={nueva} repetida={repetida} />

      {error ? <InlineError compact title="No se pudo cambiar" description={error} /> : null}

      <View style={estilos.acciones}>
        <Button
          disabled={!completo}
          loading={enviando}
          onPress={() => {
            setTocado(true);
            if (completo) onEnviar({ nueva, ...(pedirActual ? { actual } : {}) });
          }}
        >
          {etiquetaDeGuardar}
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
  acciones: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
});
