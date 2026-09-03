import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { CrearPacienteEntrada } from '../../api/paciente';
import { Button, InlineError, Input, Select } from '../../components';
import type { ArchivoElegido } from '../../lib/archivos';
import { useTheme } from '../../theme';
import { aIso } from '../paciente/formato';

import { PASO_DEL_ONBOARDING, ProgresoDelOnboarding } from './ProgresoDelOnboarding';
import { SelectorDeFotoDePerfil } from './SelectorDeFotoDePerfil';

/**
 * Alta de una mascota por su dueño (proceso 4.17).
 *
 * **No pide clínica**: en este camino no hay ninguna. La mascota nace del tutor
 * y se comparte después, que es exactamente lo que el modelo anterior no
 * permitía. Tampoco pide el número de chip: lo carga el veterinario, que es
 * quien lo implanta y lo lee.
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

export function AltaDeMiMascota({
  enviando,
  error,
  onGuardar,
  onCancelar,
}: {
  enviando: boolean;
  error?: string;
  /**
   * La foto viaja aparte de la entrada porque **se sube después**: cuelga de un
   * paciente_id que hasta que el alta no termina no existe (Reglas de Negocio,
   * 4.17). Que falle no revierte el alta.
   */
  onGuardar: (entrada: CrearPacienteEntrada, foto: ArchivoElegido | null) => void;
  onCancelar: () => void;
}) {
  const { t, px, texto } = useTheme();

  const [nombre, setNombre] = useState('');
  const [especie, setEspecie] = useState('canino');
  const [raza, setRaza] = useState('');
  const [sexo, setSexo] = useState('macho');
  const [nacimiento, setNacimiento] = useState('');
  const [peso, setPeso] = useState('');
  const [foto, setFoto] = useState<ArchivoElegido | null>(null);

  const pesoNumero = Number(peso.replace(',', '.'));
  const nacimientoValido = /^\d{4}-\d{2}-\d{2}$/.test(nacimiento) && nacimiento <= aIso(new Date());
  const completo =
    nombre.trim() && raza.trim() && nacimientoValido && pesoNumero > 0 && !Number.isNaN(pesoNumero);

  return (
    <View style={[estilos.raiz, { backgroundColor: t['--surface-page'] }]}>
      <ScrollView>
        <View style={[estilos.contenido, { paddingHorizontal: px('--gutter-mobile') }]}>
          <Text style={[texto('h1'), { color: t['--text-strong'] }]}>Agregar una mascota</Text>
          <Text style={[texto('body'), { color: t['--text-muted'] }]}>
            Va a quedar a tu nombre. Después vas a poder compartirla con tu veterinaria y con quien
            la cuide con vos.
          </Text>

          {/* Arranca reconociendo el registro que el tutor ya hizo: empezar en
              cero sería cobrarle dos veces el mismo paso. */}
          <ProgresoDelOnboarding
            paso={PASO_DEL_ONBOARDING.DATOS}
            leyenda="Ya creaste tu cuenta. Falta poco para tener su ficha."
          />

          <SelectorDeFotoDePerfil
            nombre={nombre.trim() || undefined}
            archivo={foto}
            onElegir={setFoto}
          />

          <Input
            label="Nombre"
            placeholder="Luna"
            value={nombre}
            onChangeText={setNombre}
            autoCapitalize="words"
          />
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
            error={
              nacimiento && !nacimientoValido
                ? 'Poné una fecha válida que no sea futura.'
                : undefined
            }
          />
          <Input
            label="Peso"
            suffix="kg"
            hint="Al gramo, con coma."
            placeholder="8,432"
            value={peso}
            onChangeText={setPeso}
            keyboardType="decimal-pad"
          />

          {error ? <InlineError compact title="No se pudo agregar" description={error} /> : null}

          <View style={estilos.acciones}>
            <Button
              block
              disabled={!completo}
              loading={enviando}
              onPress={() =>
                onGuardar(
                  {
                    nombre: nombre.trim(),
                    especie,
                    raza: raza.trim(),
                    sexo,
                    fecha_nacimiento: nacimiento,
                    peso_actual: pesoNumero,
                  },
                  foto,
                )
              }
            >
              Agregar
            </Button>
            <Button block variant="ghost" onPress={onCancelar}>
              Cancelar
            </Button>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  contenido: { paddingVertical: 24, gap: 16 },
  acciones: { gap: 8, marginTop: 8 },
});
