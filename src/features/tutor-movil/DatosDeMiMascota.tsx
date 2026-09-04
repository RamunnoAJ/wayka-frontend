import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { DatosNoClinicosDeLaMascota, Paciente } from '../../api/paciente';
import { Button, InlineError, Input, Select } from '../../components';
import { useTheme } from '../../theme';
import { aIso } from '../paciente/formato';

/**
 * Los datos no clínicos de la mascota (Alcance de Plataformas, 5.7).
 *
 * **El número de chip no está**: lo carga el veterinario, que es quien lo
 * implanta y lo lee (Reglas de Negocio, 3.2). Y el peso tampoco, que se edita
 * desde la ficha: se toca a diario y tiene su propio control ahí, mientras que
 * estos cinco se corrigen una vez y de a varios juntos.
 *
 * Se manda **lo que cambió y nada más**. Enviar el registro entero pisaría con
 * valores viejos lo que otro tutor haya cambiado mientras tanto, que con la
 * mascota compartida dejó de ser un caso teórico (Sincronización, 5).
 */
const ESPECIES = [
  { value: 'canino', label: 'Canino' },
  { value: 'felino', label: 'Felino' },
  { value: 'otro', label: 'Otra especie' },
];

const SEXOS = [
  { value: 'macho', label: 'Macho' },
  { value: 'hembra', label: 'Hembra' },
];

export function DatosDeMiMascota({
  mascota,
  enviando,
  error,
  onGuardar,
  onCancelar,
}: {
  mascota: Paciente;
  enviando: boolean;
  error?: string;
  onGuardar: (cambios: DatosNoClinicosDeLaMascota) => void;
  onCancelar: () => void;
}) {
  const { t, px, texto } = useTheme();

  const [nombre, setNombre] = useState(mascota.nombre);
  const [especie, setEspecie] = useState(mascota.especie);
  const [raza, setRaza] = useState(mascota.raza ?? '');
  const [sexo, setSexo] = useState(mascota.sexo ?? '');
  const [nacimiento, setNacimiento] = useState(mascota.fecha_nacimiento ?? '');

  const nacimientoValido =
    !nacimiento ||
    (aIso(new Date(nacimiento)) === nacimiento && new Date(nacimiento) <= new Date());

  const cambios: DatosNoClinicosDeLaMascota = {};
  if (nombre.trim() && nombre.trim() !== mascota.nombre) cambios.nombre = nombre.trim();
  if (especie !== mascota.especie) cambios.especie = especie;
  if (raza.trim() !== (mascota.raza ?? '')) cambios.raza = raza.trim();
  if (sexo !== (mascota.sexo ?? '')) cambios.sexo = sexo;
  if (nacimiento !== (mascota.fecha_nacimiento ?? '')) cambios.fecha_nacimiento = nacimiento;

  const hayCambios = Object.keys(cambios).length > 0;

  return (
    <ScrollView style={{ backgroundColor: t['--surface-page'] }}>
      <View style={[estilos.raiz, { padding: px('--gutter-card') }]}>
        <View style={estilos.titulo}>
          <Text style={[texto('h1'), { color: t['--text-strong'] }]}>
            Los datos de {mascota.nombre}
          </Text>
          <Text style={[texto('body'), { color: t['--text-muted'] }]}>
            Lo que no es clínico. El número de chip lo carga la veterinaria, y el peso se actualiza
            desde la ficha.
          </Text>
        </View>

        <Input label="Nombre" value={nombre} onChangeText={setNombre} autoCapitalize="words" />
        <Select label="Especie" options={ESPECIES} value={especie} onChange={setEspecie} />
        <Input
          label="Raza"
          placeholder="Caniche"
          value={raza}
          onChangeText={setRaza}
          autoCapitalize="words"
        />
        <Select label="Sexo" options={SEXOS} value={sexo} onChange={setSexo} />
        <Input
          label="Fecha de nacimiento"
          hint="AAAA-MM-DD"
          placeholder="2022-05-14"
          value={nacimiento}
          onChangeText={setNacimiento}
          error={!nacimientoValido ? 'Poné una fecha válida que no sea futura.' : undefined}
        />

        {error ? <InlineError compact title="No se pudo guardar" description={error} /> : null}

        <View style={estilos.acciones}>
          <Button variant="ghost" disabled={enviando} onPress={onCancelar}>
            Cancelar
          </Button>
          <Button
            size="touch"
            block
            disabled={!hayCambios || !nacimientoValido}
            loading={enviando}
            onPress={() => onGuardar(cambios)}
          >
            Guardar
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  raiz: { gap: 16 },
  titulo: { gap: 4 },
  acciones: { gap: 12, marginTop: 8 },
});
