import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { EVENTO_DE_USO } from '../../api/telemetria';
import {
  Badge,
  Button,
  Icon,
  InlineError,
  Presionable,
  type NombreDeIcono,
} from '../../components';
import { useSesion } from '../../hooks/useSesion';
import { mensajeDeError } from '../../lib/errores';
import { emitir } from '../../lib/telemetria';
import { ESCALA_DE_PRESION, sombra, useTheme } from '../../theme';
import { SeccionAdjuntos } from '../paciente/SeccionAdjuntos';
import { derivarAdjuntos } from '../paciente/queries';

import {
  CLASE_DE_ANTECEDENTE,
  FormularioDeAntecedente,
  type AntecedenteACargar,
  type ClaseDeAntecedente,
} from './FormularioDeAntecedente';
import { PASO_DEL_ONBOARDING, ProgresoDelOnboarding } from './ProgresoDelOnboarding';
import {
  useCargarAntecedenteDelTutor,
  useRetirarAntecedenteDelTutor,
  type AntecedenteCargado,
} from '../sincronizacion/queries';

import { useAdjuntosDeMiMascota } from './queries';

/**
 * Cargar los antecedentes de una mascota (Alcance de Plataformas, 5.12; Reglas
 * de Negocio, 4.23).
 *
 * La misma pantalla sirve a los dos caminos y solo cambia el envoltorio: desde
 * el alta viene con el paso del onboarding, y desde la ficha viene sola. La
 * capacidad no se apaga después del alta — el tutor que encuentra la libreta en
 * un cajón dos meses después entra por acá igual.
 *
 * **Se cargan varios seguidos**: guardar uno devuelve al selector con lo ya
 * cargado a la vista, no a la ficha. Vaciar una libreta son seis o siete
 * entradas, y volver al principio en cada una convierte diez minutos en veinte.
 */

interface TarjetaDeClase {
  clase: ClaseDeAntecedente;
  titulo: string;
  ejemplo: string;
  icono: NombreDeIcono;
  /**
   * La vacuna viene destacada: es el antecedente que más tutores tienen a mano
   * —la libreta— y por eso encabeza y se marca. En un menú de cuatro tarjetas
   * un valor por defecto es esto y no una selección previa: nada está elegido
   * hasta que el tutor toca, y abrir el formulario de vacuna sin que lo haya
   * pedido le cobraría un paso al que viene con una alergia.
   */
  destacada?: boolean;
}

/**
 * Cuatro tarjetas y no un desplegable con los siete tipos del historial: el
 * tutor elige entre las cosas que él sabe nombrar, no entre las categorías con
 * las que el modelo las guarda.
 */
const CLASES: TarjetaDeClase[] = [
  {
    clase: CLASE_DE_ANTECEDENTE.VACUNA,
    titulo: 'Una vacuna',
    ejemplo: 'Las que figuran en la libreta',
    icono: 'syringe',
    destacada: true,
  },
  {
    clase: CLASE_DE_ANTECEDENTE.ALERGIA,
    titulo: 'Una alergia',
    ejemplo: 'A una comida, a un remedio, al polen',
    icono: 'shield-alert',
  },
  {
    clase: CLASE_DE_ANTECEDENTE.MEDICACION,
    titulo: 'Algo que toma ahora',
    ejemplo: 'Un tratamiento que sigue en curso',
    icono: 'pill',
  },
  {
    clase: CLASE_DE_ANTECEDENTE.OTRO,
    titulo: 'Otra cosa que le pasó',
    ejemplo: 'Una cirugía, una consulta en otra veterinaria',
    icono: 'notebook-pen',
  },
];

const ETIQUETA_DE_CLASE: Record<ClaseDeAntecedente, string> = {
  vacuna: 'Vacuna',
  alergia: 'Alergia',
  medicacion: 'Medicación',
  otro: 'Antecedente',
};

interface CargaProps {
  pacienteId: string;
  nombreDeMascota?: string;
  /**
   * En el onboarding el paso es salteable y el botón de salida lo dice así.
   * Desde la ficha es simplemente volver.
   */
  enOnboarding?: boolean;
  /**
   * La foto que el tutor eligió en el alta no llegó a subirse. La mascota quedó
   * cargada igual (Reglas de Negocio, 4.17): lo único que hace falta es decirlo,
   * en vez de dejarlo creer que la foto está.
   */
  fotoQueNoSubio?: boolean;
  onTerminar: () => void;
}

interface Cargado {
  clase: ClaseDeAntecedente;
  nombre: string;
  /** Del registro creado, o de su mutación si quedó en la cola. */
  id: string;
  /** Si todavía no llegó al servidor: retirarlo es descartar la mutación. */
  enCola: boolean;
  /** De qué entidad del historial es, que es lo que decide por dónde se retira. */
  entidad: 'evento' | 'medicacion';
}

/**
 * Los cuatro momentos del paso. La carga de antecedentes y la de documentos son
 * dos etapas y no una pantalla con todo junto: fotografiar una libreta y
 * escribir una vacuna son dos tareas distintas, y mezclarlas obliga a decidir
 * cuál se hace primero cuando no hace falta.
 */
type Momento = 'eligiendo' | 'cargando' | 'documentos' | 'resumen';

export function CargaDeAntecedentes({
  pacienteId,
  nombreDeMascota,
  enOnboarding = false,
  fotoQueNoSubio = false,
  onTerminar,
}: CargaProps) {
  const { t, px, texto } = useTheme();
  const { sesion } = useSesion();
  // El onboarding exige conexión; desde la ficha el mismo formulario se encola
  // sin red (Sincronización sin Conexión, 5).
  const cargar = useCargarAntecedenteDelTutor(pacienteId, { soloEnLinea: enOnboarding });
  const retirar = useRetirarAntecedenteDelTutor();
  const adjuntos = useAdjuntosDeMiMascota(pacienteId);
  const [momento, setMomento] = useState<Momento>('eligiendo');
  const [clase, setClase] = useState<ClaseDeAntecedente | null>(null);
  const [cargados, setCargados] = useState<Cargado[]>([]);

  /**
   * El embudo del paso (Telemetría de Producto, 5.3). Se emite **al salir de la
   * pantalla y no al tocar el botón**: el que se va con el gesto de volver
   * también resolvió el paso, y sin contarlo el denominador mentiría hacia
   * abajo justo en el caso que más interesa medir — el que se fue.
   *
   * Los dos valores viajan en refs para que el efecto corra una sola vez: con
   * ellos en las dependencias, cada antecedente cargado emitiría un evento.
   */
  const resultado = useRef(0);
  useEffect(() => {
    resultado.current = cargados.length;
  }, [cargados.length]);
  const desde = useRef(enOnboarding ? 'onboarding' : 'ficha');
  useEffect(
    () => () => {
      emitir(EVENTO_DE_USO.PASO_DE_ANTECEDENTES_RESUELTO, {
        desde: desde.current,
        resultado: resultado.current > 0 ? 'cargo' : 'salteo',
      });
    },
    [],
  );

  function guardar(antecedente: AntecedenteACargar) {
    cargar.mutate(antecedente, {
      onSuccess: (creado) => {
        setCargados((previos) => [...previos, resumirCargado(antecedente, creado)]);
        // Vuelve al selector, no a la ficha: cargar el siguiente es el caso
        // frecuente y no debería costar un viaje de ida y vuelta.
        setMomento('eligiendo');
        setClase(null);
      },
    });
  }

  function quitar(cargado: Cargado) {
    retirar.mutate(
      { id: cargado.id, enCola: cargado.enCola, clase: cargado.entidad },
      { onSuccess: () => setCargados((previos) => previos.filter((c) => c.id !== cargado.id)) },
    );
  }

  /**
   * Con algo cargado se pasa por el resumen; sin nada, salir es salir. Pararlo
   * en una pantalla que dice "no cargaste nada" sería cobrarle un toque más a
   * quien ya dijo que no tenía nada para cargar.
   */
  function terminar() {
    if (cargados.length > 0 && momento !== 'resumen') return setMomento('resumen');
    return onTerminar();
  }

  const deQuien = nombreDeMascota ? ` de ${nombreDeMascota}` : '';

  return (
    <ScrollView contentContainerStyle={estilos.pantalla}>
      <View style={estilos.encabezado}>
        {enOnboarding ? (
          <ProgresoDelOnboarding
            paso={
              momento === 'resumen' ? PASO_DEL_ONBOARDING.LISTO : PASO_DEL_ONBOARDING.ANTECEDENTES
            }
            leyenda={
              momento === 'resumen'
                ? `La ficha${deQuien} está armada.`
                : 'La mascota ya está cargada. Esto es lo último.'
            }
          />
        ) : null}
        <Text style={[texto('h3'), { color: t['--text-strong'] }]}>
          {TITULO_DEL_MOMENTO[momento](deQuien)}
        </Text>
        <Text style={[texto('body'), { color: t['--text-muted'] }]}>
          {BAJADA_DEL_MOMENTO[momento]}
        </Text>
      </View>

      {fotoQueNoSubio ? (
        <InlineError
          compact
          title="La foto no se subió"
          description={`${nombreDeMascota ?? 'La mascota'} quedó cargada igual. La foto se puede sumar cuando quieras, desde su ficha.`}
        />
      ) : null}

      {cargados.length > 0 && momento !== 'resumen' ? (
        <View
          style={[
            estilos.cargados,
            {
              borderRadius: px('--radius-card'),
              backgroundColor: t['--surface-sunken'],
              borderColor: t['--border-subtle'],
            },
          ]}
        >
          <Text style={[texto('overline'), { color: t['--text-subtle'] }]}>
            {`YA CARGASTE ${cargados.length}`}
          </Text>
          <View style={estilos.chips}>
            {cargados.map((cargado, i) => (
              <Badge key={`${cargado.nombre}-${i}`} tone="success" icon="check" size="sm">
                {`${ETIQUETA_DE_CLASE[cargado.clase]}: ${cargado.nombre}`}
              </Badge>
            ))}
          </View>
        </View>
      ) : null}

      {momento === 'cargando' && clase ? (
        <FormularioDeAntecedente
          clase={clase}
          enviando={cargar.isPending}
          error={cargar.error ? mensajeDeError(cargar.error) : undefined}
          onGuardar={guardar}
          onCancelar={() => {
            cargar.reset();
            setMomento('eligiendo');
            setClase(null);
          }}
        />
      ) : momento === 'documentos' ? (
        <>
          {/*
            Es la misma sección de adjuntos de la ficha (Alcance de Plataformas,
            5.6), con la cámara en móvil. Los documentos cuelgan del paciente y
            no de un antecedente puntual: pedirle asociar cada foto a una
            entrada convertiría fotografiar una libreta en una tarea de
            clasificación.
          */}
          <SeccionAdjuntos
            pacienteId={pacienteId}
            adjuntos={derivarAdjuntos(adjuntos.data?.adjuntos ?? []).generales}
            usuarioId={sesion?.usuario.id}
            error={adjuntos.isError}
            onReintentar={() => adjuntos.refetch()}
            esMovil
            bloqueado={false}
            motivoBloqueo=""
            soloMetadatos={adjuntos.data?.soloMetadatos ?? false}
            // El archivo se mira en el visor y no sale de la app (Alcance 5.6).
            permiteDescarga={false}
            puedeEscribir
            onRetirar={() => undefined}
          />
          <Button variant="secondary" onPress={() => setMomento('eligiendo')}>
            Volver a los antecedentes
          </Button>
        </>
      ) : momento === 'resumen' ? (
        <>
          <View style={estilos.tarjetas}>
            {cargados.map((cargado) => (
              <View
                key={cargado.id}
                style={[
                  estilos.tarjeta,
                  { borderRadius: px('--radius-card'), borderColor: t['--border-subtle'] },
                ]}
              >
                <View style={estilos.flexible}>
                  <Text style={[texto('body-strong'), { color: t['--text-strong'] }]}>
                    {cargado.nombre}
                  </Text>
                  <Text style={[texto('caption'), { color: t['--text-muted'] }]}>
                    {ETIQUETA_DE_CLASE[cargado.clase]}
                  </Text>
                </View>
                {/* "Quitar" y no "editar": la Medicación solo admite corregir su
                    cierre, así que retirar y volver a cargar es la única
                    corrección que sirve para las dos entidades por igual. */}
                <Button
                  variant="secondary"
                  size="sm"
                  iconLeft="trash-2"
                  loading={retirar.isPending}
                  onPress={() => quitar(cargado)}
                >
                  Quitar
                </Button>
              </View>
            ))}
          </View>

          {retirar.error ? <InlineError title={mensajeDeError(retirar.error)} compact /> : null}

          <View style={estilos.acciones}>
            <Button variant="secondary" onPress={() => setMomento('eligiendo')}>
              Cargar otro
            </Button>
            <Button onPress={onTerminar}>Listo</Button>
          </View>
        </>
      ) : (
        <>
          <View style={estilos.tarjetas}>
            {CLASES.map((opcion) => (
              <Presionable
                key={opcion.clase}
                accessibilityRole="button"
                accessibilityLabel={opcion.titulo}
                onPress={() => {
                  setClase(opcion.clase);
                  setMomento('cargando');
                }}
                escala={ESCALA_DE_PRESION}
                fondo={t['--surface-card']}
                fondoDestacado={t['--surface-hover']}
                borde={t['--border-default']}
                style={[
                  estilos.tarjeta,
                  sombra('--shadow-sm'),
                  { borderRadius: px('--radius-card') },
                ]}
              >
                <View
                  style={[
                    estilos.icono,
                    {
                      borderRadius: px('--radius-sm'),
                      backgroundColor: t['--color-primary-soft'],
                    },
                  ]}
                >
                  <Icon name={opcion.icono} size={18} color={t['--color-primary-strong']} />
                </View>
                <View style={estilos.flexible}>
                  <View style={estilos.tituloDeClase}>
                    <Text style={[texto('body-strong'), { color: t['--text-strong'] }]}>
                      {opcion.titulo}
                    </Text>
                    {opcion.destacada ? (
                      <Badge tone="info" size="sm">
                        Lo más común
                      </Badge>
                    ) : null}
                  </View>
                  <Text style={[texto('caption'), { color: t['--text-muted'] }]}>
                    {opcion.ejemplo}
                  </Text>
                </View>
                <Icon name="chevron-right" size={18} color={t['--text-subtle']} />
              </Presionable>
            ))}
          </View>

          <Button variant="secondary" iconLeft="camera" onPress={() => setMomento('documentos')}>
            Sumar fotos de la libreta
          </Button>

          <View style={estilos.salida}>
            <Button variant={cargados.length > 0 ? 'primary' : 'secondary'} onPress={terminar}>
              {salida(enOnboarding, cargados.length)}
            </Button>
            {enOnboarding && cargados.length === 0 ? (
              <Text style={[texto('caption'), { color: t['--text-muted'] }]}>
                {costoDeSaltear(nombreDeMascota)}
              </Text>
            ) : null}
          </View>
        </>
      )}
    </ScrollView>
  );
}

/**
 * El botón de salida cambia de significado, no solo de texto: en el onboarding
 * sin nada cargado es saltear un paso —y decirlo así evita que parezca que la
 * mascota queda a medias—, y con algo cargado es terminar.
 */
function salida(enOnboarding: boolean, cargados: number): string {
  if (!enOnboarding) return 'Volver a la ficha';
  return cargados > 0 ? 'Listo, terminar' : 'Ahora no';
}

/**
 * Lo que se pierde por saltear, y no un "lo hago después" a secas: es cierto que
 * se puede cargar en cualquier momento, y también que hasta que no esté cargado
 * un veterinario que la atienda de urgencia arranca sin saber nada. Decir solo
 * lo primero deja la decisión sin la mitad que importa.
 */
function costoDeSaltear(nombreDeMascota?: string): string {
  const deQuien = nombreDeMascota ?? 'tu mascota';
  return `Se puede cargar cuando quieras. Pero si hay una urgencia antes, el veterinario que la atienda arranca sin saber nada de ${deQuien}.`;
}

function resumirCargado(antecedente: AntecedenteACargar, creado: AntecedenteCargado): Cargado {
  if (antecedente.clase === 'medicacion') {
    return {
      clase: CLASE_DE_ANTECEDENTE.MEDICACION,
      nombre: antecedente.entrada.nombre_droga,
      id: creado.id,
      enCola: creado.enCola,
      entidad: 'medicacion',
    };
  }
  const campos = antecedente.entrada.campo_estructurado;
  const comun = { id: creado.id, enCola: creado.enCola, entidad: 'evento' as const };
  if (campos && 'nombre_vacuna' in campos) {
    return { clase: CLASE_DE_ANTECEDENTE.VACUNA, nombre: campos.nombre_vacuna, ...comun };
  }
  if (campos && 'alergeno' in campos) {
    return { clase: CLASE_DE_ANTECEDENTE.ALERGIA, nombre: campos.alergeno, ...comun };
  }
  return { clase: CLASE_DE_ANTECEDENTE.OTRO, nombre: antecedente.entrada.descripcion, ...comun };
}

const TITULO_DEL_MOMENTO: Record<Momento, (deQuien: string) => string> = {
  eligiendo: (deQuien) => `¿Qué sabés de antes${deQuien}?`,
  cargando: () => 'Cargar un antecedente',
  documentos: () => 'Fotos de la libreta',
  // "Armaste la ficha" y no "se guardaron los datos": lo que hay en la pantalla
  // lo escribió el tutor, y nombrarlo como un guardado del sistema le saca
  // justamente lo que lo hace suyo.
  resumen: (deQuien) => `Armaste la ficha${deQuien}`,
};

const BAJADA_DEL_MOMENTO: Record<Momento, string> = {
  eligiendo:
    'Las vacunas, las alergias y lo que esté tomando. Si no tenés nada a mano, se puede cargar más adelante desde la ficha.',
  cargando: 'Poné lo que tengas. Lo que no sepas se puede dejar vacío.',
  documentos:
    'La libreta sanitaria, estudios, papeles de otra veterinaria. Quedan guardados en la ficha de la mascota.',
  resumen: 'Revisalo antes de terminar. Si algo salió mal, se puede quitar y cargar de nuevo.',
};

const estilos = StyleSheet.create({
  pantalla: { padding: 16, gap: 20 },
  encabezado: { gap: 6 },
  cargados: { padding: 12, gap: 8, borderWidth: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tarjetas: { gap: 10 },
  tarjeta: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderWidth: 1 },
  icono: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  acciones: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end' },
  salida: { gap: 6 },
  tituloDeClase: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  flexible: { flex: 1, minWidth: 0 },
});
