import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Veterinario } from '../../api/veterinario';
import {
  Avatar,
  Badge,
  Button,
  DialogoDeConfirmacion,
  EmptyState,
  InlineError,
  Input,
  MenuDeAcciones,
  Skeleton,
  SkeletonText,
} from '../../components';
import { useAnchoDeVentana } from '../../hooks/useAnchoDeVentana';
import { mensajeDeError } from '../../lib/errores';
import { sombra, useTheme } from '../../theme';

import { estaAusenteAhora, FormularioDeAusencia, useAusencias } from '../ausencias';
import { useMiClinica } from '../clinica';

import { AvisoDeMatriculas } from './AvisoDeMatriculas';
import { FormularioDeVeterinario } from './FormularioDeVeterinario';
import { useCrearVeterinario, useDarDeBajaVeterinario, usePlantel } from './queries';

/**
 * Plantel de la clínica (Alcance de Plataformas, 3.2), rol clínica_admin.
 *
 * El veterinario también lee este listado —lo necesita para resolver quién firmó
 * cada registro clínico— pero no lo modifica. Esta pantalla es la del admin: la
 * lectura del veterinario vive dentro de la ficha de paciente.
 */
const ANCHO_MOVIL = 720;

export function Plantel() {
  const { t, px, texto } = useTheme();
  const ancho = useAnchoDeVentana();
  const esMovil = ancho > 0 && ancho < ANCHO_MOVIL;

  const [texto_, setTexto] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const plantel = usePlantel(busqueda);
  const crear = useCrearVeterinario();
  const darDeBaja = useDarDeBajaVeterinario();
  const [abierto, setAbierto] = useState(false);
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [cargandoAusencia, setCargandoAusencia] = useState<string | null>(null);
  const aDarDeBaja = plantel.data?.find((ficha) => ficha.id === confirmando);
  const aAusentar = plantel.data?.find((ficha) => ficha.id === cargandoAusencia);

  // Quién no está hoy. Es la mirada transversal que se perdió al sacar la
  // sección de Ausencias: la lista de cada persona vive en su ficha, pero "quién
  // falta hoy" se pregunta mirando el plantel entero.
  const ausencias = useAusencias();
  const clinica = useMiClinica();
  const ausentes = estaAusenteAhora(ausencias.data);

  return (
    <View style={[estilos.raiz, { backgroundColor: t['--surface-page'] }]}>
      <ScrollView>
        <View
          style={[
            estilos.contenido,
            { maxWidth: px('--content-max'), paddingHorizontal: px('--gutter-page') },
          ]}
        >
          <View style={estilos.encabezado}>
            <View style={estilos.titulo}>
              <Text style={[texto('h1'), { color: t['--text-strong'] }]}>Veterinarios</Text>
              <Text style={[texto('body-lg'), { color: t['--text-muted'] }]}>
                La ficha y la cuenta de acceso se crean juntas, y la baja desactiva las dos.
              </Text>
            </View>
            <Button iconLeft="plus" onPress={() => setAbierto((v) => !v)}>
              Agregar veterinario
            </Button>
          </View>

          {/*
            El plantel entra entero en la pantalla, así que el buscador no está
            para acortarlo: está para responder si un documento o una matrícula
            ya están cargados. La matrícula es única en todo el sistema y el
            conflicto del alta no dice de quién es la que colisiona.
          */}
          <View style={estilos.buscador}>
            <View style={estilos.flexible}>
              <Input
                label="Buscar en el plantel"
                placeholder="Vidal, 25640119 o MP-3390"
                value={texto_}
                onChangeText={setTexto}
                onSubmitEditing={() => setBusqueda(texto_.trim())}
                returnKeyType="search"
                autoCapitalize="none"
              />
            </View>
            <Button variant="secondary" onPress={() => setBusqueda(texto_.trim())}>
              Buscar
            </Button>
            {busqueda ? (
              <Button
                variant="ghost"
                onPress={() => {
                  setTexto('');
                  setBusqueda('');
                }}
              >
                Ver todo
              </Button>
            ) : null}
          </View>

          {abierto ? (
            <FormularioDeVeterinario
              enviando={crear.isPending}
              error={crear.error ? mensajeDeError(crear.error) : undefined}
              onGuardar={(entrada) => crear.mutate(entrada, { onSuccess: () => setAbierto(false) })}
              onCancelar={() => setAbierto(false)}
            />
          ) : null}

          {/*
            Va arriba del listado y no solo como etiqueta en cada fila: la
            etiqueta ya está, pero obliga a recorrer el plantel entero para
            saber si hay alguien restringido.
          */}
          {plantel.data ? <AvisoDeMatriculas plantel={plantel.data} /> : null}

          {plantel.isPending ? (
            <View style={estilos.lista}>
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  style={[
                    estilos.tarjeta,
                    { borderRadius: px('--radius-card'), borderColor: t['--border-default'] },
                  ]}
                >
                  <Skeleton height={48} width={48} circle />
                  <View style={estilos.flexible}>
                    <SkeletonText lines={2} />
                  </View>
                </View>
              ))}
            </View>
          ) : plantel.isError ? (
            <InlineError title="No se pudo cargar el plantel" onRetry={() => plantel.refetch()} />
          ) : (plantel.data?.length ?? 0) === 0 ? (
            <EmptyState
              icon="user-round"
              title="Todavía no hay nadie en el plantel"
              description="Cargá al primer veterinario: al guardarlo ya puede entrar con el correo y la contraseña que le pongas."
              action={
                <Button iconLeft="plus" onPress={() => setAbierto(true)}>
                  Agregar veterinario
                </Button>
              }
            />
          ) : (
            <View style={estilos.lista}>
              {plantel.data?.map((veterinario) => (
                <FilaDeVeterinario
                  key={veterinario.id}
                  veterinario={veterinario}
                  esMovil={esMovil}
                  ausenteHasta={ausentes.get(veterinario.id)?.hasta}
                  zonaHoraria={clinica.data?.zona_horaria}
                  onAbrirFicha={() =>
                    router.push(`/(clinica-admin)/veterinarios/${veterinario.id}`)
                  }
                  onCargarAusencia={() => setCargandoAusencia(veterinario.id)}
                  onPedirBaja={() => {
                    darDeBaja.reset();
                    setConfirmando(veterinario.id);
                  }}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/*
        Un solo diálogo para todo el listado, montado acá y no en cada fila:
        montar uno por fila dejaría tantos modales como personas en el plantel.
      */}
      {aAusentar ? (
        <FormularioDeAusencia
          veterinarioId={aAusentar.id}
          nombre={aAusentar.nombre}
          zonaHoraria={clinica.data?.zona_horaria}
          onCerrar={() => setCargandoAusencia(null)}
        />
      ) : null}

      {aDarDeBaja ? (
        <DialogoDeConfirmacion
          titulo={`¿Dar de baja a ${aDarDeBaja.nombre}?`}
          descripcion="Se desactiva también su cuenta y deja de poder entrar. Lo que escribió queda donde está, con su firma: nada del historial se borra."
          etiquetaConfirmar="Dar de baja"
          enviando={darDeBaja.isPending}
          error={darDeBaja.isError ? mensajeDeError(darDeBaja.error) : undefined}
          onCancelar={() => setConfirmando(null)}
          onConfirmar={() =>
            darDeBaja.mutate(aDarDeBaja.id, { onSuccess: () => setConfirmando(null) })
          }
        />
      ) : null}
    </View>
  );
}

interface FilaProps {
  veterinario: Veterinario;
  esMovil: boolean;
  /** Con valor, no está hoy y la fila lo dice hasta cuándo. */
  ausenteHasta?: Date;
  zonaHoraria: string | undefined;
  onAbrirFicha: () => void;
  onCargarAusencia: () => void;
  onPedirBaja: () => void;
}

function FilaDeVeterinario({
  veterinario,
  esMovil,
  ausenteHasta,
  zonaHoraria,
  onAbrirFicha,
  onCargarAusencia,
  onPedirBaja,
}: FilaProps) {
  const { t, px, texto } = useTheme();

  return (
    <View
      style={[
        estilos.tarjeta,
        sombra('--shadow-sm'),
        {
          borderRadius: px('--radius-card'),
          backgroundColor: t['--surface-card'],
          borderColor: t['--border-default'],
          flexDirection: esMovil ? 'column' : 'row',
          alignItems: esMovil ? 'flex-start' : 'center',
        },
      ]}
    >
      <Avatar name={veterinario.nombre} size="lg" />

      <View style={estilos.flexible}>
        <Text style={[texto('h4'), { color: t['--text-strong'] }]}>{veterinario.nombre}</Text>
        <Text style={[texto('body-sm'), { color: t['--text-subtle'] }]}>
          {`${veterinario.tipo_documento.toUpperCase()} ${veterinario.numero_documento}`}
        </Text>
      </View>

      {/* Sin matrícula la cuenta entra pero no escribe historial ni medicación
          (regla 2.1). Es lo primero que el admin necesita ver de un colega. */}
      <Badge tone={veterinario.matricula ? 'success' : 'warning'}>
        {veterinario.matricula ? `Matrícula ${veterinario.matricula}` : 'Sin matrícula'}
      </Badge>

      {/* Hoy no está: la agenda no le ofrece turnos y sus citas del rango ya
          quedaron sin profesional. */}
      {ausenteHasta ? (
        <Badge tone="warning" icon="calendar-clock">
          {`Ausente hasta el ${new Intl.DateTimeFormat('es-AR', {
            day: 'numeric',
            month: 'short',
            timeZone: zonaHoraria,
          }).format(ausenteHasta)}`}
        </Badge>
      ) : null}

      {
        /*
          Las dos acciones van detrás de los tres puntos y no a la vista: dos
          botones por fila pesan lo mismo que el nombre, y con una baja entre
          ellos la cercanía es el problema — se apunta a una y se toca la otra.
          La baja además conserva su confirmación en la fila.
        */
        <MenuDeAcciones
          accessibilityLabel={`Acciones de ${veterinario.nombre}`}
          acciones={[
            { label: 'Ver ficha', icono: 'pencil', onPress: onAbrirFicha },
            // Una ausencia es de una persona: se carga desde su fila, que es
            // donde se la busca.
            { label: 'Cargar ausencia', icono: 'calendar-clock', onPress: onCargarAusencia },
            { label: 'Dar de baja', icono: 'archive', peligro: true, onPress: onPedirBaja },
          ]}
        />
      }
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  contenido: { width: '100%', alignSelf: 'center', paddingVertical: 32, gap: 20 },
  encabezado: { flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 },
  titulo: { flex: 1, minWidth: 260, gap: 6 },
  lista: { gap: 12 },
  tarjeta: { flexDirection: 'row', alignItems: 'center', gap: 16, borderWidth: 1, padding: 16 },
  flexible: { flex: 1, minWidth: 180, gap: 2 },
  buscador: { flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 },
  confirmacion: { gap: 8, minWidth: 260 },
  acciones: { flexDirection: 'row', gap: 8 },
});
