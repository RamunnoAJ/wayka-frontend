import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  crearVeterinario,
  type CrearVeterinarioEntrada,
  type TipoDocumento,
} from '../../api/veterinario';
import { Avatar, Badge, Button, InlineError, Input, Select } from '../../components';
import { mensajeDeError } from '../../lib/errores';
import { sombra, useTheme } from '../../theme';

/**
 * Paso 4: alta del primer veterinario (proceso 4.12).
 *
 * La ficha y la cuenta de acceso se crean **juntas, en una sola operación**: por
 * eso el formulario pide email y contraseña además de los datos de la persona.
 *
 * Diferencias con el diseño, todas por contrato:
 * - El diseño parte el nombre en "Nombre" y "Apellido"; la entidad Veterinario
 *   tiene un único campo `nombre` (Modelo de Datos, 4.4). Se deja un solo campo
 *   en vez de concatenar dos y perder el dato de dónde corta cada uno.
 * - El diseño manda una invitación por correo. No hay endpoint de invitación:
 *   el alta fija la contraseña inicial, que es lo que el contrato define.
 * - Especialidades y días de atención no existen en el modelo, y no se piden.
 * - `tipo_documento`, `numero_documento` y `matricula` sí existen y son lo que
 *   el backend necesita: sin matrícula la cuenta nace en modo restringido.
 */
const TIPOS_DE_DOCUMENTO: { value: TipoDocumento; label: string }[] = [
  { value: 'dni', label: 'DNI' },
  { value: 'pasaporte', label: 'Pasaporte' },
  { value: 'otro', label: 'Otro documento' },
];

/** Política del contrato (regla 2.1). Se valida por UX; decide el backend. */
function contrasenaValida(valor: string): boolean {
  return valor.length >= 8 && /[a-z]/.test(valor) && /[A-Z]/.test(valor) && /\d/.test(valor);
}

interface PasoProps {
  onListo: (nombre: string) => void;
}

export function PasoPrimerVeterinario({ onListo }: PasoProps) {
  const { t, px, texto } = useTheme();

  const [nombre, setNombre] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>('dni');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [matricula, setMatricula] = useState('');
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completo =
    nombre.trim() && numeroDocumento.trim() && email.trim() && contrasenaValida(contrasena);

  async function guardar() {
    if (!completo || enviando) return;
    setEnviando(true);
    setError(null);
    const entrada: CrearVeterinarioEntrada = {
      nombre: nombre.trim(),
      tipo_documento: tipoDocumento,
      numero_documento: numeroDocumento.trim(),
      email: email.trim(),
      contrasena,
      ...(matricula.trim() ? { matricula: matricula.trim() } : {}),
    };
    try {
      const creado = await crearVeterinario(entrada);
      onListo(creado.veterinario.nombre);
    } catch (causa) {
      setError(mensajeDeError(causa));
    } finally {
      setEnviando(false);
    }
  }

  const tarjeta = {
    borderRadius: px('--radius-card'),
    backgroundColor: t['--surface-card'],
    borderColor: t['--border-default'],
    borderWidth: 1,
    padding: px('--gutter-card'),
  };

  return (
    <View style={estilos.raiz}>
      <View style={estilos.intro}>
        <Text style={[texto('h1'), { color: t['--text-strong'] }]}>Armá tu equipo</Text>
        <Text style={[texto('body-lg'), { color: t['--text-muted'] }]}>
          Cargá al primer veterinario. La ficha y su cuenta de acceso se crean juntas: al guardar ya
          puede entrar con el correo y la contraseña que le pongas.
        </Text>
      </View>

      <View style={estilos.columnas}>
        <View style={[tarjeta, sombra('--shadow-sm'), estilos.formulario]}>
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
          </View>

          <Input
            label="Matrícula"
            hint="Sin matrícula la cuenta entra, pero no puede cargar ni editar historial ni medicación."
            placeholder="MP 4821"
            value={matricula}
            onChangeText={setMatricula}
            autoCapitalize="characters"
          />

          <View style={[estilos.separador, { backgroundColor: t['--border-subtle'] }]} />

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

          <Input
            label="Contraseña inicial"
            icon="lock"
            hint="Mínimo 8 caracteres, con una minúscula, una mayúscula y un dígito."
            error={
              contrasena && !contrasenaValida(contrasena)
                ? 'Todavía no cumple la política de contraseñas.'
                : undefined
            }
            value={contrasena}
            onChangeText={setContrasena}
            secureTextEntry
          />

          {error ? (
            <InlineError compact title="No se pudo crear el veterinario" description={error} />
          ) : null}
        </View>

        <View style={estilos.lateral}>
          <View style={[tarjeta, { backgroundColor: t['--surface-sunken'] }]}>
            <Text style={[texto('overline'), { fontWeight: '700', color: t['--text-subtle'] }]}>
              ASÍ VA A VERSE EN TU EQUIPO
            </Text>
            <View style={estilos.previa}>
              <Avatar name={nombre || 'Nuevo veterinario'} size="lg" />
              <View style={estilos.previaTexto}>
                <Text
                  style={[texto('h4'), { color: nombre ? t['--text-strong'] : t['--text-subtle'] }]}
                >
                  {nombre || 'Nombre y apellido'}
                </Text>
                <Text numberOfLines={1} style={[texto('body-sm'), { color: t['--text-subtle'] }]}>
                  {email || 'correo@tuclinica.vet'}
                </Text>
              </View>
            </View>
            <Badge tone={matricula.trim() ? 'success' : 'warning'}>
              {matricula.trim() ? 'Puede cargar historial' : 'Modo restringido: sin matrícula'}
            </Badge>
          </View>

          <Button
            block
            size="lg"
            iconLeft="user-round"
            disabled={!completo}
            loading={enviando}
            onPress={guardar}
          >
            Crear ficha y cuenta
          </Button>
          <Text style={[texto('caption'), estilos.pie, { color: t['--text-subtle'] }]}>
            Dar de baja al veterinario después desactiva su cuenta en la misma operación, y lo que
            haya escrito conserva su autoría.
          </Text>
        </View>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { gap: 28 },
  intro: { gap: 6, maxWidth: 640 },
  columnas: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' },
  formulario: { flexGrow: 1, flexBasis: 420, minWidth: 320, gap: 16 },
  lateral: { flexGrow: 1, flexBasis: 300, minWidth: 280, gap: 12 },
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  campo: { flexGrow: 2, flexBasis: 200, minWidth: 160 },
  campoChico: { flexGrow: 1, flexBasis: 160, minWidth: 150 },
  separador: { height: 1 },
  previa: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 12, marginBottom: 12 },
  previaTexto: { flex: 1, minWidth: 0, gap: 3 },
  pie: { textAlign: 'center' },
});
