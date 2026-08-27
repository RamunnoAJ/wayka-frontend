import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { CrearVeterinarioEntrada, TipoDocumento } from '../../api/veterinario';
import { Button, InlineError, Input, Select, type OpcionDeSelect } from '../../components';
import { useTheme } from '../../theme';

/**
 * Alta de un veterinario: la ficha y su cuenta de acceso se crean **juntas, en
 * una sola operación** (proceso 4.12). Por eso el formulario pide email y
 * contraseña además de los datos de la persona — no hay forma de crear una sin
 * la otra, ni un endpoint de invitación.
 *
 * `nombre` es un solo campo porque la entidad tiene uno solo (Modelo de Datos,
 * 4.4): partirlo en nombre y apellido para después concatenar perdería el dato
 * de dónde corta cada uno.
 */
export const TIPOS_DE_DOCUMENTO: OpcionDeSelect<TipoDocumento>[] = [
  { value: 'dni', label: 'DNI' },
  { value: 'pasaporte', label: 'Pasaporte' },
  { value: 'otro', label: 'Otro documento' },
];

/** Política del contrato (regla 2.1). Se valida por UX; decide el backend. */
export function contrasenaValida(valor: string): boolean {
  return valor.length >= 8 && /[a-z]/.test(valor) && /[A-Z]/.test(valor) && /\d/.test(valor);
}

interface FormularioProps {
  enviando: boolean;
  error?: string;
  onGuardar: (entrada: CrearVeterinarioEntrada) => void;
  onCancelar: () => void;
}

export function FormularioDeVeterinario({
  enviando,
  error,
  onGuardar,
  onCancelar,
}: FormularioProps) {
  const { t, px } = useTheme();

  const [nombre, setNombre] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>('dni');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [matricula, setMatricula] = useState('');
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');

  const completo =
    nombre.trim() && numeroDocumento.trim() && email.trim() && contrasenaValida(contrasena);

  return (
    <View
      style={[
        estilos.form,
        {
          borderRadius: px('--radius-card'),
          backgroundColor: t['--surface-sunken'],
          borderColor: t['--border-default'],
        },
      ]}
    >
      <Input
        label="Nombre y apellido"
        placeholder="Ana Rossi"
        value={nombre}
        onChangeText={setNombre}
        autoCapitalize="words"
      />

      <View style={estilos.fila}>
        <View style={estilos.campoChico}>
          <Select
            label="Tipo de documento"
            options={TIPOS_DE_DOCUMENTO}
            value={tipoDocumento}
            onChange={setTipoDocumento}
          />
        </View>
        <View style={estilos.campo}>
          <Input
            label="Número de documento"
            placeholder="30123456"
            value={numeroDocumento}
            onChangeText={setNumeroDocumento}
            keyboardType="number-pad"
          />
        </View>
        <View style={estilos.campo}>
          <Input
            label="Matrícula"
            hint="Sin matrícula entra, pero no carga historial ni medicación."
            placeholder="MP 4821"
            value={matricula}
            onChangeText={setMatricula}
            autoCapitalize="characters"
          />
        </View>
      </View>

      <View style={estilos.fila}>
        <View style={estilos.campo}>
          <Input
            label="Correo profesional"
            icon="mail"
            hint="Es el usuario con el que va a iniciar sesión."
            placeholder="nombre@tuclinica.vet"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoComplete="email"
          />
        </View>
        <View style={estilos.campo}>
          <Input
            label="Contraseña inicial"
            icon="lock"
            hint="Mínimo 8, con minúscula, mayúscula y dígito."
            error={
              contrasena && !contrasenaValida(contrasena)
                ? 'Todavía no cumple la política.'
                : undefined
            }
            value={contrasena}
            onChangeText={setContrasena}
            secureTextEntry
          />
        </View>
      </View>

      {error ? <InlineError compact title="No se pudo dar de alta" description={error} /> : null}

      <View style={estilos.acciones}>
        <Button
          size="sm"
          disabled={!completo}
          loading={enviando}
          onPress={() =>
            onGuardar({
              nombre: nombre.trim(),
              tipo_documento: tipoDocumento,
              numero_documento: numeroDocumento.trim(),
              email: email.trim(),
              contrasena,
              ...(matricula.trim() ? { matricula: matricula.trim() } : {}),
            })
          }
        >
          Crear ficha y cuenta
        </Button>
        <Button variant="ghost" size="sm" onPress={onCancelar}>
          Cancelar
        </Button>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  form: { borderWidth: 1, padding: 20, gap: 14 },
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  campo: { flexGrow: 1, flexBasis: 200, minWidth: 180 },
  campoChico: { flexGrow: 1, flexBasis: 160, minWidth: 150 },
  acciones: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
});
