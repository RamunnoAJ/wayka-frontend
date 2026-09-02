import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { CrearPacienteEntrada, PacienteEnLaCartera } from '../../api/paciente';
import type { TutorEnElPadron } from '../../api/tutor';
import { Badge, Button, Checkbox, InlineError, Input, Select, Skeleton } from '../../components';
import { mensajeDeError } from '../../lib/errores';
import { useTheme } from '../../theme';
import { aIso } from '../paciente/formato';

import { useCrearTutorDesdeElMostrador, useDarDeAltaDesdeElMostrador, usePadron } from './queries';

/**
 * Alta de paciente desde el mostrador (Alcance de Plataformas, 3.2.2).
 *
 * Es el proceso 4.1 con la proyección del clínica_admin: **primero el tutor**,
 * porque dar de alta una mascota arrastra su ficha, y buscarlo antes de crearlo
 * evita el duplicado de quien ya se auto-registró o viene de otra clínica.
 *
 * Lo que cambia respecto del alta del veterinario:
 *
 * - la búsqueda sale del **padrón** —nombre, contacto y si ya tiene documento—,
 *   no de la ficha completa;
 * - la ficha nueva se crea con nombre, contacto y consentimiento, y nada más;
 * - **el chip no se pide**: lo carga el veterinario, que es quien lo implanta y
 *   lo lee. Si se mandara, el backend lo ignora.
 *
 * Termina devolviendo la mascota en la forma de la cartera, que es la que la
 * pantalla de agendar sabe usar: recién dada de alta, ya se le puede tomar el
 * turno sin volver a buscarla.
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

interface Props {
  /** Lo escrito en la búsqueda de la cartera: la mascota que no apareció. */
  nombreDeLaMascota?: string;
  onDadaDeAlta: (paciente: PacienteEnLaCartera) => void;
  onCancelar: () => void;
}

export function AltaDesdeElMostrador({ nombreDeLaMascota = '', onDadaDeAlta, onCancelar }: Props) {
  const [tutor, setTutor] = useState<TutorEnElPadron | null>(null);

  if (!tutor) {
    return <ElegirDelPadron onElegir={setTutor} onCancelar={onCancelar} />;
  }
  return (
    <DatosDeLaMascota
      tutor={tutor}
      nombreInicial={nombreDeLaMascota}
      onCambiarTutor={() => setTutor(null)}
      onDadaDeAlta={onDadaDeAlta}
      onCancelar={onCancelar}
    />
  );
}

function ElegirDelPadron({
  onElegir,
  onCancelar,
}: {
  onElegir: (tutor: TutorEnElPadron) => void;
  onCancelar: () => void;
}) {
  const { t, texto } = useTheme();
  const [busqueda, setBusqueda] = useState('');
  const [creando, setCreando] = useState(false);

  const padron = usePadron(busqueda);

  if (creando) {
    return (
      <FichaNuevaDeTutor
        nombreInicial={busqueda}
        onCreada={onElegir}
        onCancelar={() => setCreando(false)}
      />
    );
  }

  return (
    <View style={estilos.paso}>
      <View style={estilos.titulo}>
        <Text style={[texto('h4'), { color: t['--text-strong'] }]}>¿De quién es?</Text>
        <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
          Paso 1 de 2 · Buscá a la persona antes de cargarla: puede tener ficha de otra clínica o
          haberse registrado desde la app.
        </Text>
      </View>

      <Input
        label="Nombre o contacto"
        value={busqueda}
        onChangeText={setBusqueda}
        placeholder="Gómez, o diego@correo.test"
      />

      {busqueda.trim().length === 0 ? (
        <Text style={[texto('body-sm'), { color: t['--text-subtle'] }]}>
          Escribí un nombre o un contacto para buscar.
        </Text>
      ) : padron.isPending ? (
        <Skeleton height={44} />
      ) : padron.isError ? (
        <InlineError
          title="No se pudo buscar"
          description={mensajeDeError(padron.error)}
          onRetry={() => padron.refetch()}
        />
      ) : (
        <ScrollView style={estilos.scroll}>
          {padron.data.length === 0 ? (
            <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
              {`Nadie del padrón coincide con "${busqueda.trim()}".`}
            </Text>
          ) : (
            padron.data.map((ficha) => (
              <Pressable
                key={ficha.id}
                accessibilityRole="button"
                onPress={() => onElegir(ficha)}
                style={({ hovered, pressed }) => [
                  estilos.opcion,
                  { backgroundColor: hovered || pressed ? t['--surface-hover'] : 'transparent' },
                ]}
              >
                <View style={estilos.flexible}>
                  <Text style={[texto('body'), { color: t['--text-strong'] }]}>{ficha.nombre}</Text>
                  <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
                    {ficha.contacto}
                  </Text>
                </View>
                {/* Que falte el documento no frena nada: lo completa el
                    veterinario cuando atiende. Se muestra para distinguir dos
                    fichas parecidas, y porque es lo único que el mostrador sabe
                    de cuán completa está. */}
                {ficha.tiene_documento ? null : <Badge tone="neutral">Sin documento</Badge>}
              </Pressable>
            ))
          )}
        </ScrollView>
      )}

      <View style={estilos.acciones}>
        <Button variant="ghost" onPress={onCancelar}>
          Cancelar
        </Button>
        <Button variant="secondary" iconLeft="plus" onPress={() => setCreando(true)}>
          Ninguno es: cargar la persona
        </Button>
      </View>
    </View>
  );
}

/**
 * La ficha del mostrador: nombre, contacto y consentimiento.
 *
 * No hay documento ni dirección, y no es que estén ocultos — el backend los
 * ignora para este rol. Los completa el veterinario cuando atiende, que es
 * cuando los tiene delante.
 */
function FichaNuevaDeTutor({
  nombreInicial,
  onCreada,
  onCancelar,
}: {
  nombreInicial: string;
  onCreada: (tutor: TutorEnElPadron) => void;
  onCancelar: () => void;
}) {
  const { t, texto } = useTheme();
  const crear = useCrearTutorDesdeElMostrador();

  const [nombre, setNombre] = useState(nombreInicial);
  const [contacto, setContacto] = useState('');
  const [consentimiento, setConsentimiento] = useState(false);

  const completo = Boolean(nombre.trim() && contacto.trim() && consentimiento);

  return (
    <View style={estilos.paso}>
      <View style={estilos.titulo}>
        <Text style={[texto('h4'), { color: t['--text-strong'] }]}>Cargar a la persona</Text>
        <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
          Con esto alcanza para tomar el turno. El documento y la dirección los completa el
          veterinario en la consulta.
        </Text>
      </View>

      <Input
        label="Nombre completo"
        value={nombre}
        onChangeText={setNombre}
        placeholder="María Pérez"
        autoCapitalize="words"
      />
      <Input
        label="Contacto"
        hint="Teléfono y/o correo. Es por donde la clínica lo ubica."
        value={contacto}
        onChangeText={setContacto}
        placeholder="+54 9 11 5478-2210"
      />

      {/*
        Ley 25.326: sin consentimiento no se le puede dar de alta una mascota
        (regla 2.2). Por teléfono se pide en voz alta, y se tilda acá.
      */}
      <Checkbox
        label="Otorgó el consentimiento de uso de datos"
        description="Ley 25.326. Sin esto no se le puede dar de alta la mascota, y no se revoca desde la aplicación."
        checked={consentimiento}
        onChange={setConsentimiento}
      />

      {crear.isError ? (
        <InlineError
          compact
          title="No se pudo cargar la ficha"
          description={mensajeDeError(crear.error)}
        />
      ) : null}

      <View style={estilos.acciones}>
        <Button variant="ghost" onPress={onCancelar}>
          Volver a buscar
        </Button>
        <Button
          disabled={!completo}
          loading={crear.isPending}
          onPress={() =>
            crear.mutate(
              {
                nombre: nombre.trim(),
                contacto: contacto.trim(),
                consentimiento_datos: true,
              },
              {
                onSuccess: (tutor) =>
                  onCreada({
                    id: tutor.id,
                    nombre: tutor.nombre,
                    contacto: tutor.contacto,
                    tiene_documento: false,
                  }),
              },
            )
          }
        >
          Cargar y seguir
        </Button>
      </View>
    </View>
  );
}

function DatosDeLaMascota({
  tutor,
  nombreInicial,
  onCambiarTutor,
  onDadaDeAlta,
  onCancelar,
}: {
  tutor: TutorEnElPadron;
  nombreInicial: string;
  onCambiarTutor: () => void;
  onDadaDeAlta: (paciente: PacienteEnLaCartera) => void;
  onCancelar: () => void;
}) {
  const { t, px, texto } = useTheme();
  const alta = useDarDeAltaDesdeElMostrador();

  const [nombre, setNombre] = useState(nombreInicial);
  const [especie, setEspecie] = useState('canino');
  const [raza, setRaza] = useState('');
  const [sexo, setSexo] = useState('macho');
  const [nacimiento, setNacimiento] = useState('');
  const [peso, setPeso] = useState('');

  const pesoNumero = Number(peso.replace(',', '.'));
  const nacimientoValido = /^\d{4}-\d{2}-\d{2}$/.test(nacimiento) && nacimiento <= aIso(new Date());
  const completo = Boolean(
    nombre.trim() && raza.trim() && nacimientoValido && pesoNumero > 0 && !Number.isNaN(pesoNumero),
  );

  const entrada: CrearPacienteEntrada = {
    nombre: nombre.trim(),
    especie,
    raza: raza.trim(),
    sexo,
    fecha_nacimiento: nacimiento,
    peso_actual: pesoNumero,
    tutor_id: tutor.id,
  };

  return (
    <View style={estilos.paso}>
      <View style={estilos.titulo}>
        <Text style={[texto('h4'), { color: t['--text-strong'] }]}>La mascota</Text>
        <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
          {`Paso 2 de 2 · De ${tutor.nombre}`}
        </Text>
      </View>

      <ScrollView style={estilos.scrollAlto}>
        <View style={estilos.campos}>
          <View style={estilos.fila}>
            <View style={estilos.campo}>
              <Input
                label="Nombre"
                value={nombre}
                onChangeText={setNombre}
                placeholder="Luna"
                autoCapitalize="words"
              />
            </View>
            <View style={estilos.campoChico}>
              <Select label="Especie" options={ESPECIES} value={especie} onChange={setEspecie} />
            </View>
          </View>

          <View style={estilos.fila}>
            <View style={estilos.campo}>
              <Input
                label="Raza"
                value={raza}
                onChangeText={setRaza}
                placeholder="Caniche"
                autoCapitalize="words"
              />
            </View>
            <View style={estilos.campoChico}>
              <Select label="Sexo" options={SEXOS} value={sexo} onChange={setSexo} />
            </View>
          </View>

          <View style={estilos.fila}>
            <View style={estilos.campo}>
              <Input
                label="Fecha de nacimiento"
                hint="AAAA-MM-DD"
                value={nacimiento}
                onChangeText={setNacimiento}
                placeholder="2022-05-14"
                error={
                  nacimiento && !nacimientoValido
                    ? 'Poné una fecha válida que no sea futura.'
                    : undefined
                }
              />
            </View>
            {/* El peso lo dice el tutor por teléfono y casi nunca es exacto. Lo
                corrige el veterinario en la consulta, que es cuando la pesa: acá
                alcanza con que la ficha nazca con algo. */}
            <View style={estilos.campoChico}>
              <Input
                label="Peso"
                suffix="kg"
                hint="Aproximado. Lo confirma el veterinario."
                value={peso}
                onChangeText={setPeso}
                placeholder="8,4"
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </View>
      </ScrollView>

      <Text style={[texto('caption'), { color: t['--text-subtle'] }]}>
        El microchip no se carga acá: lo pone el veterinario, que es quien lo implanta y lo lee.
      </Text>

      {alta.isError ? (
        <InlineError
          compact
          title="No se pudo dar de alta"
          description={mensajeDeError(alta.error)}
        />
      ) : null}

      <View style={estilos.acciones}>
        <Button variant="ghost" onPress={onCancelar}>
          Cancelar
        </Button>
        <Button variant="secondary" onPress={onCambiarTutor}>
          Cambiar de persona
        </Button>
        <Button
          disabled={!completo}
          loading={alta.isPending}
          onPress={() =>
            alta.mutate(entrada, {
              onSuccess: (paciente) =>
                onDadaDeAlta({
                  id: paciente.id,
                  nombre: paciente.nombre,
                  especie: paciente.especie,
                  tutor_nombre: tutor.nombre,
                  tutor_contacto: tutor.contacto,
                }),
            })
          }
        >
          Dar de alta y agendar
        </Button>
      </View>

      <View style={{ height: px('--space-1') }} />
    </View>
  );
}

const estilos = StyleSheet.create({
  paso: { gap: 12 },
  titulo: { gap: 2 },
  scroll: { maxHeight: 240 },
  scrollAlto: { maxHeight: 380 },
  campos: { gap: 12 },
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start' },
  campo: { flex: 1, minWidth: 180 },
  campoChico: { width: 150 },
  flexible: { flex: 1, gap: 2 },
  opcion: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  acciones: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 10 },
});
