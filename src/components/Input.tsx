import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type TextInputProps,
} from 'react-native';
import Animated from 'react-native-reanimated';

import { useTransicionDeControl } from '../hooks';
import { ANCHO_BORDE_FOCO, colorDeFoco, useTheme } from '../theme';

import { Icon, type NombreDeIcono } from './Icon';

/**
 * Campo de texto. Port a React Native de `design-system/components/core/Input.jsx`
 * — mismos tokens y misma API (`label`, `hint`, `error`, `icon`, `suffix`,
 * `readOnly`).
 *
 * `error` pinta el borde en danger y reemplaza al `hint`, igual que en el
 * original. Un campo de contraseña puede mostrar el ojo para revelar el texto:
 * eso no está en el componente web, se agrega acá porque en un teclado táctil
 * escribir a ciegas es peor (ver `secureTextEntry`).
 */
interface InputProps {
  label?: string;
  hint?: string;
  error?: string;
  icon?: NombreDeIcono;
  /** Unidad o sufijo corto a la derecha (ej. `kg`). */
  suffix?: string;
  readOnly?: boolean;
  value: string;
  onChangeText: (valor: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
  editable?: boolean;
  /** Techo de caracteres, para no descubrir el límite recién en el rechazo. */
  maxLength?: number;
  /**
   * Campo de varias líneas. Cambia la altura fija del control por una mínima:
   * un texto largo dentro de una línea de 40px se lee por una rendija.
   */
  multiline?: boolean;
  /** Líneas visibles cuando es `multiline`. */
  lineas?: number;
  onSubmitEditing?: () => void;
  returnKeyType?: TextInputProps['returnKeyType'];
}

export function Input({
  label,
  hint,
  error,
  icon,
  suffix,
  readOnly,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'none',
  autoComplete,
  textContentType,
  editable = true,
  maxLength,
  multiline,
  lineas = 4,
  onSubmitEditing,
  returnKeyType,
}: InputProps) {
  const { t, px, texto } = useTheme();
  const [enfocado, setEnfocado] = useState(false);
  const [revelado, setRevelado] = useState(false);

  const bordeNormal = error ? t['--border-danger'] : t['--border-default'];
  const bordeFoco = colorDeFoco(error ? t['--border-danger'] : t['--border-focus']);
  const ayuda = error ?? hint;

  // El campo no se hunde al tocarlo: lo que responde al dedo es el teclado que
  // se abre, no el control. Lo único que se anima es el cruce de color del
  // borde al enfocar y al aparecer un error, que es `--transition-control`.
  const colores = useTransicionDeControl({
    backgroundColor: readOnly ? t['--surface-sunken'] : t['--surface-card'],
    borderColor: enfocado ? bordeFoco : bordeNormal,
  });

  return (
    <View style={estilos.contenedor}>
      {label ? <Text style={[texto('caption'), { color: t['--text-muted'] }]}>{label}</Text> : null}

      <Animated.View
        style={[
          {
            flexDirection: 'row',
            alignItems: multiline ? 'flex-start' : 'center',
            gap: 8,
            ...(multiline
              ? { minHeight: px('--control-h-md') * lineas, paddingVertical: 10 }
              : { height: px('--control-h-md') }),
            paddingHorizontal: 12,
            borderRadius: px('--radius-control'),
            borderWidth: enfocado ? ANCHO_BORDE_FOCO : 1,
          },
          colores,
        ]}
      >
        {icon ? <Icon name={icon} size={16} color={t['--text-subtle']} /> : null}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={t['--text-subtle']}
          secureTextEntry={secureTextEntry && !revelado}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          textContentType={textContentType}
          editable={editable && !readOnly}
          maxLength={maxLength}
          multiline={multiline}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType}
          onFocus={() => setEnfocado(true)}
          onBlur={() => setEnfocado(false)}
          accessibilityLabel={label}
          style={[
            texto('body'),
            estilos.campo,
            multiline ? { textAlignVertical: 'top', height: '100%' } : null,
            // RN Web dibuja su propio contorno de foco encima del borde del token.
            { color: t['--text-strong'], outlineStyle: 'none' } as object,
          ]}
        />

        {secureTextEntry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revelado ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            onPress={() => setRevelado((previo) => !previo)}
            hitSlop={8}
          >
            <Icon name={revelado ? 'eye-off' : 'eye'} size={16} color={t['--text-subtle']} />
          </Pressable>
        ) : null}

        {suffix ? (
          <Text style={[texto('caption'), { color: t['--text-subtle'] }]}>{suffix}</Text>
        ) : null}
      </Animated.View>

      {ayuda ? (
        <Text
          style={[texto('caption'), { color: error ? t['--text-danger'] : t['--text-subtle'] }]}
        >
          {ayuda}
        </Text>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { gap: 6, width: '100%' },
  campo: { flex: 1, minWidth: 0, padding: 0 },
});
