import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { CrearPacienteEntrada } from '../../api/paciente';
import type { Tutor } from '../../api/tutor';
import { Avatar, Badge, Button, InlineError, Input, Select } from '../../components';
import { mensajeDeError } from '../../lib/errores';
import { useTheme } from '../../theme';
import { FormularioDeTutor } from '../tutor/FormularioDeTutor';
import { useBuscarTutores, useCrearTutor } from '../tutor/queries';

import { aIso } from './formato';

/**
 * Alta de paciente (proceso 4.1). Son dos entidades en un solo flujo, y el
 * orden importa: **primero el tutor**.
 *
 * El paso 2 del proceso es buscar la ficha antes de crearla — la persona puede
 * tener ficha desde otra clínica o haberse auto-registrado desde la app. Recién
 * con un tutor elegido se piden los datos de la mascota.
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

interface AltaProps {
  enviando: boolean;
  error?: string;
  onGuardar: (entrada: CrearPacienteEntrada) => void;
  onCancelar: () => void;
}

export function FormularioDeAltaDePaciente({ enviando, error, onGuardar, onCancelar }: AltaProps) {
  const { t, px, texto } = useTheme();
  const [tutor, setTutor] = useState<Tutor | null>(null);

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
      <Text style={[texto('h3'), { color: t['--text-strong'] }]}>Alta de paciente</Text>

      {!tutor ? (
        <ElegirTutor onElegir={setTutor} onCancelar={onCancelar} />
      ) : (
        <DatosDeLaMascota
          tutor={tutor}
          enviando={enviando}
          error={error}
          onCambiarTutor={() => setTutor(null)}
          onGuardar={onGuardar}
          onCancelar={onCancelar}
        />
      )}
    </View>
  );
}

function ElegirTutor({
  onElegir,
  onCancelar,
}: {
  onElegir: (tutor: Tutor) => void;
  onCancelar: () => void;
}) {
  const { t, px, texto } = useTheme();
  const [escrito, setEscrito] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [creando, setCreando] = useState(false);

  const resultados = useBuscarTutores({ busqueda: busqueda || undefined, limite: 20 });
  const crear = useCrearTutor();

  return (
    <View style={estilos.paso}>
      <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
        Paso 1 de 2 · Buscá al tutor antes de crearlo: puede tener ficha de otra clínica o haberse
        registrado desde la app.
      </Text>

      <View style={estilos.buscador}>
        <View style={estilos.campo}>
          <Input
            label="Tutor"
            placeholder="Nombre, teléfono o correo"
            value={escrito}
            onChangeText={setEscrito}
            onSubmitEditing={() => setBusqueda(escrito.trim())}
            returnKeyType="search"
          />
        </View>
        <Button disabled={!escrito.trim()} onPress={() => setBusqueda(escrito.trim())}>
          Buscar
        </Button>
      </View>

      {busqueda && !creando ? (
        resultados.isPending ? (
          <Text style={[texto('body-sm'), { color: t['--text-subtle'] }]}>Buscando…</Text>
        ) : (resultados.data?.length ?? 0) === 0 ? (
          <View style={estilos.paso}>
            <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
              {`Nadie coincide con "${busqueda}".`}
            </Text>
            <Button size="sm" iconLeft="plus" onPress={() => setCreando(true)}>
              Crear la ficha del tutor
            </Button>
          </View>
        ) : (
          <View style={estilos.resultados}>
            {resultados.data?.map((candidato) => (
              <View
                key={candidato.id}
                style={[
                  estilos.candidato,
                  { borderRadius: px('--radius-md'), borderColor: t['--border-default'] },
                ]}
              >
                <Avatar name={candidato.nombre} size="sm" tone="brand" />
                <View style={estilos.flexible}>
                  <Text style={[texto('body-strong'), { color: t['--text-strong'] }]}>
                    {candidato.nombre}
                  </Text>
                  <Text style={[texto('caption'), { color: t['--text-subtle'] }]}>
                    {candidato.contacto}
                  </Text>
                </View>
                {/* Regla 2.2: sin consentimiento no se le da de alta una
                    mascota. Se dice acá, no después del rechazo. */}
                {candidato.consentimiento_datos ? (
                  <Button size="sm" onPress={() => onElegir(candidato)}>
                    Elegir
                  </Button>
                ) : (
                  <Badge tone="danger">Sin consentimiento</Badge>
                )}
              </View>
            ))}
            <Button size="sm" variant="secondary" iconLeft="plus" onPress={() => setCreando(true)}>
              Ninguno es: crear ficha
            </Button>
          </View>
        )
      ) : null}

      {creando ? (
        <FormularioDeTutor
          nombreInicial={busqueda}
          enviando={crear.isPending}
          error={crear.error ? mensajeDeError(crear.error) : undefined}
          onGuardar={(entrada) => crear.mutate(entrada, { onSuccess: onElegir })}
          onCancelar={() => setCreando(false)}
        />
      ) : null}

      <Button variant="ghost" size="sm" onPress={onCancelar}>
        Cancelar
      </Button>
    </View>
  );
}

function DatosDeLaMascota({
  tutor,
  enviando,
  error,
  onCambiarTutor,
  onGuardar,
  onCancelar,
}: {
  tutor: Tutor;
  enviando: boolean;
  error?: string;
  onCambiarTutor: () => void;
  onGuardar: (entrada: CrearPacienteEntrada) => void;
  onCancelar: () => void;
}) {
  const { t, px, texto } = useTheme();

  const [nombre, setNombre] = useState('');
  const [especie, setEspecie] = useState('canino');
  const [raza, setRaza] = useState('');
  const [sexo, setSexo] = useState('macho');
  const [nacimiento, setNacimiento] = useState('');
  const [peso, setPeso] = useState('');
  const [chip, setChip] = useState('');

  const pesoNumero = Number(peso.replace(',', '.'));
  const nacimientoValido = /^\d{4}-\d{2}-\d{2}$/.test(nacimiento) && nacimiento <= aIso(new Date());
  const completo =
    nombre.trim() && raza.trim() && nacimientoValido && pesoNumero > 0 && !Number.isNaN(pesoNumero);

  return (
    <View style={estilos.paso}>
      <View
        style={[
          estilos.tutorElegido,
          {
            borderRadius: px('--radius-md'),
            backgroundColor: t['--surface-card'],
            borderColor: t['--border-default'],
          },
        ]}
      >
        <Avatar name={tutor.nombre} size="sm" tone="brand" />
        <View style={estilos.flexible}>
          <Text style={[texto('overline'), { fontWeight: '700', color: t['--text-subtle'] }]}>
            TUTOR
          </Text>
          <Text style={[texto('body-strong'), { color: t['--text-strong'] }]}>{tutor.nombre}</Text>
        </View>
        <Button variant="ghost" size="sm" onPress={onCambiarTutor}>
          Cambiar
        </Button>
      </View>

      <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>Paso 2 de 2 · La mascota</Text>

      <View style={estilos.fila}>
        <View style={estilos.campo}>
          <Input
            label="Nombre"
            placeholder="Luna"
            value={nombre}
            onChangeText={setNombre}
            autoCapitalize="words"
          />
        </View>
        <View style={estilos.campoChico}>
          <Select label="Especie" options={ESPECIES} value={especie} onChange={setEspecie} />
        </View>
        <View style={estilos.campo}>
          <Input
            label="Raza"
            placeholder="Caniche"
            value={raza}
            onChangeText={setRaza}
            autoCapitalize="words"
          />
        </View>
      </View>

      <View style={estilos.fila}>
        <View style={estilos.campoChico}>
          <Select label="Sexo" options={SEXOS} value={sexo} onChange={setSexo} />
        </View>
        <View style={estilos.campo}>
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
        </View>
        <View style={estilos.campoChico}>
          <Input
            label="Peso"
            suffix="kg"
            hint="Al gramo, con coma."
            placeholder="8,432"
            value={peso}
            onChangeText={setPeso}
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      <Input
        label="Microchip"
        hint="Opcional. Único entre fichas vigentes cuando está cargado."
        value={chip}
        onChangeText={setChip}
      />

      {error ? <InlineError compact title="No se pudo dar de alta" description={error} /> : null}

      <View style={estilos.acciones}>
        <Button
          disabled={!completo}
          loading={enviando}
          onPress={() =>
            onGuardar({
              nombre: nombre.trim(),
              especie,
              raza: raza.trim(),
              sexo,
              fecha_nacimiento: nacimiento,
              peso_actual: pesoNumero,
              tutor_id: tutor.id,
              ...(chip.trim() ? { identificador_externo: chip.trim() } : {}),
            })
          }
        >
          Dar de alta
        </Button>
        <Button variant="ghost" onPress={onCancelar}>
          Cancelar
        </Button>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  form: { borderWidth: 1, padding: 20, gap: 14 },
  paso: { gap: 12 },
  buscador: { flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 },
  resultados: { gap: 8 },
  candidato: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, padding: 12 },
  tutorElegido: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    padding: 12,
  },
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  campo: { flexGrow: 2, flexBasis: 200, minWidth: 170 },
  campoChico: { flexGrow: 1, flexBasis: 150, minWidth: 140 },
  flexible: { flex: 1, minWidth: 140, gap: 2 },
  acciones: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
});
