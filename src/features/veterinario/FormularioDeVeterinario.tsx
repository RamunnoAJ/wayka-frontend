import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { CrearVeterinarioEntrada, TipoDocumento } from '../../api/veterinario';
import { Button, InlineError, Input, Select, type OpcionDeSelect } from '../../components';
import { useTheme } from '../../theme';

/**
 * Alta de un veterinario: la ficha y su cuenta de acceso se crean **juntas, en
 * una sola operación** (proceso 4.12). Por eso el formulario pide el email
 * además de los datos de la persona — no hay forma de crear una sin la otra.
 *
 * **No pide contraseña, y el formulario lo dice.** Al veterinario le llega un
 * correo con un enlace para definir la suya. Sin esa línea, quien completa el
 * alta se queda esperando un campo que no está, o peor, cree que la cuenta ya
 * quedó lista para usar.
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
  const { t, px, texto } = useTheme();

  const [nombre, setNombre] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>('dni');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [matricula, setMatricula] = useState('');
  const [email, setEmail] = useState('');

  const completo = nombre.trim() && numeroDocumento.trim() && email.trim();

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
            hint="Sin matrícula entra, pero no carga historial ni medicación. Es única: no puede repetirse con la de otra persona."
            placeholder="MP 4821"
            value={matricula}
            onChangeText={setMatricula}
            autoCapitalize="characters"
          />
        </View>
      </View>

      <Input
        label="Correo profesional"
        icon="mail"
        hint="Es el usuario con el que va a iniciar sesión, y adonde le llega el enlace para activar la cuenta. Un correo equivocado la deja sin poder estrenarse."
        placeholder="nombre@tuclinica.vet"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoComplete="email"
      />

      <Text style={[texto('caption'), { color: t['--text-subtle'] }]}>
        La contraseña no la elegís vos: le llega un enlace para que la defina. Así nadie más que
        ella llega a conocerla.
      </Text>

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
