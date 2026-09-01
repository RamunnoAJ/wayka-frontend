import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { InvitarCoTutorEntrada, NivelInvitado } from '../../api/invitacion';
import { Button, InlineError, Input } from '../../components';
import { useTheme } from '../../theme';

import { SelectorDeNivel } from './SelectorDeNivel';

/**
 * Invitar a otra persona (proceso 4.19).
 *
 * Pide un correo y no una cuenta: quien recibe la invitación puede todavía no
 * estar en Wayka, y ese es justamente el caso que existe para resolver. La
 * pantalla lo dice, para que nadie se frene buscando a alguien que no aparece.
 */
export function InvitarCoTutor({
  enviando,
  error,
  onInvitar,
}: {
  enviando: boolean;
  error?: string;
  onInvitar: (entrada: InvitarCoTutorEntrada) => void;
}) {
  const { t, texto } = useTheme();
  const [email, setEmail] = useState('');
  const [nivel, setNivel] = useState<NivelInvitado>('edicion');

  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  return (
    <View style={estilos.bloque}>
      <Input
        label="Correo de la persona"
        placeholder="beto@ejemplo.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        hint="Le va a llegar un enlace. Si todavía no tiene cuenta, se crea una al aceptar."
        error={email && !emailValido ? 'Revisá el correo.' : undefined}
      />

      <Text style={[texto('body-strong'), { color: t['--text-strong'] }]}>
        Qué va a poder hacer
      </Text>
      <SelectorDeNivel valor={nivel} onCambiar={setNivel} />

      {error ? <InlineError compact title="No se pudo invitar" description={error} /> : null}

      <Button
        block
        disabled={!emailValido}
        loading={enviando}
        onPress={() => onInvitar({ email: email.trim().toLowerCase(), nivel })}
      >
        Enviar invitación
      </Button>
    </View>
  );
}

const estilos = StyleSheet.create({
  bloque: { gap: 12 },
});
