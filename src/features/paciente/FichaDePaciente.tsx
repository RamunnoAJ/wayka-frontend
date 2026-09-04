import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { EventoClinico } from '../../api/evento-clinico';
import { estaDadoDeBaja } from '../../api/paciente';
import { useGrilla } from '../clinica/queries';
import {
  Button,
  DialogoDeConfirmacion,
  IconButton,
  InlineError,
  Tabs,
  type ItemDeTab,
} from '../../components';
import { useAnchoDeVentana } from '../../hooks/useAnchoDeVentana';
import { useSesion } from '../../hooks/useSesion';
import { mensajeDeError } from '../../lib/errores';
import { useTheme } from '../../theme';

import { AvisoDePacienteDeBaja, AvisoSinMatricula, MotivoDeBloqueo } from './AvisosDeBloqueo';
import { ConfirmarRevocacion } from '../accesos/ConfirmarRevocacion';
import { useRevocarClinica } from '../accesos/queries';
import { BandaDeUrgencia } from './BandaDeUrgencia';
import { QuienesLaVen } from './QuienesLaVen';
import { AsentarAtencion } from '../consultas';

import { EncabezadoDePaciente } from './EncabezadoDePaciente';
import { EsqueletoDeFicha } from './EsqueletoDeFicha';
import { HistorialClinico } from './HistorialClinico';
import { SeccionAdjuntos } from './SeccionAdjuntos';
import { SeccionCalendario } from './SeccionCalendario';
import { SeccionMedicacion } from './SeccionMedicacion';
import {
  derivarAdjuntos,
  derivarDatosCriticos,
  puedeEscribirClinico,
  useAdjuntos,
  useCerrarMedicacion,
  useCitas,
  useCrearCita,
  useCrearMedicacion,
  useDarDeBajaEvento,
  useEventosClinicos,
  useMedicaciones,
  useMiFichaDeVeterinario,
  usePaciente,
  usePlantelPorAutor,
  useReagendarCita,
  useRetirarAdjunto,
  useRetirarCita,
  useTutor,
} from './queries';

/**
 * Ficha de paciente (Alcance de Plataformas, 3.3) — rol veterinario, web y
 * móvil con paridad total.
 *
 * Composición elegida: **tabs** para el cuerpo y **banda de urgencia
 * colapsable**. Las dos alternativas del diseño (secciones apiladas en dos
 * columnas, banda siempre expandida) quedaron descartadas: el mismo árbol
 * compila a las dos plataformas y una sola sección por vez es lo que degrada a
 * móvil sin perder nada.
 *
 * El clínica_admin no llega acá: su rol no alcanza mascotas ni historial. Lo
 * garantiza el guard del grupo `(veterinario)` y, sobre todo, el backend.
 */
const ANCHO_MOVIL = 900;

type Pestania = 'historial' | 'medicacion' | 'calendario' | 'adjuntos';

const CTA_POR_PESTANIA: Record<Pestania, string> = {
  historial: 'Cargar evento clínico',
  medicacion: 'Nueva medicación',
  calendario: 'Agendar cita',
  adjuntos: 'Subir adjunto',
};

export function FichaDePaciente({
  pacienteId,
  pestaniaInicial = 'historial',
  onSalirDeLaCartera,
}: {
  pacienteId: string;
  pestaniaInicial?: Pestania;
  /** Al desvincular, la mascota sale de la cartera y esta pantalla deja de tener
   *  a quién mostrar: quien la usa decide adónde volver. */
  onSalirDeLaCartera?: () => void;
}) {
  const { t } = useTheme();
  const ancho = useAnchoDeVentana();
  const esMovil = ancho > 0 && ancho < ANCHO_MOVIL;
  const { sesion } = useSesion();

  const [pestania, setPestania] = useState<Pestania>(pestaniaInicial);
  const [confirmandoDesvinculo, setConfirmandoDesvinculo] = useState(false);
  const [eventoADarDeBaja, setEventoADarDeBaja] = useState<EventoClinico | null>(null);
  const dejarDeAtender = useRevocarClinica(pacienteId);

  const paciente = usePaciente(pacienteId);
  const tutor = useTutor(paciente.data?.tutor_id);
  const eventos = useEventosClinicos(pacienteId);
  const darDeBajaEvento = useDarDeBajaEvento(pacienteId);
  const medicaciones = useMedicaciones(pacienteId);
  const citas = useCitas(pacienteId);
  const adjuntos = useAdjuntos(pacienteId);
  const plantel = usePlantelPorAutor();
  const miFicha = useMiFichaDeVeterinario();
  // La grilla la manda la clínica donde se agenda, que para el veterinario es la
  // suya: una mascota atendida también en otra tiene allá su propia agenda, con
  // otro horario y otro huso (Modelo de Datos, 4.7).
  const grilla = useGrilla(miFicha.data?.clinica_id);

  const cerrar = useCerrarMedicacion(pacienteId);
  const crear = useCrearMedicacion(pacienteId);
  const retirar = useRetirarAdjunto(pacienteId);
  const retirarCita = useRetirarCita(pacienteId);
  const agendar = useCrearCita(pacienteId);
  const reagendar = useReagendarCita(pacienteId);

  if (paciente.isPending) {
    return (
      <Marco esMovil={esMovil}>
        <EsqueletoDeFicha esMovil={esMovil} />
      </Marco>
    );
  }

  // La identidad es lo único sin lo que la pantalla no existe: si falla,
  // no hay ficha que mostrar. El resto de los errores viven en su bloque.
  if (paciente.isError || !paciente.data) {
    return (
      <Marco esMovil={esMovil}>
        <InlineError
          title="No se pudo cargar la ficha"
          description="Revisá la conexión e intentá de nuevo."
          onRetry={() => paciente.refetch()}
        />
      </Marco>
    );
  }

  const datos = paciente.data;
  const deBaja = estaDadoDeBaja(datos);
  // La matrícula se comprueba solo cuando la ficha propia ya llegó: mientras
  // carga no se bloquea nada, o la pantalla parpadearía en solo lectura.
  const sinMatricula = miFicha.isSuccess && !puedeEscribirClinico(miFicha.data);
  const bloqueado = deBaja || sinMatricula;
  const motivoBloqueo = deBaja
    ? 'Paciente dado de baja: la ficha queda en solo lectura'
    : sinMatricula
      ? 'Necesitás la matrícula cargada para crear o editar'
      : '';

  // El único CTA que sale de la ficha es el de evento clínico: su formulario es
  // largo y tiene ruta propia. Los otros tres se resuelven en su propia sección.
  function accionDePestania(actual: Pestania) {
    if (actual === 'historial') {
      router.push(`/(veterinario)/pacientes/${pacienteId}/evento-clinico/nuevo`);
    }
  }

  const criticos = derivarDatosCriticos(eventos.data, medicaciones.data);
  const { generales, porEvento } = derivarAdjuntos(adjuntos.data);

  const pestanias: ItemDeTab<Pestania>[] = [
    { value: 'historial', label: 'Historial', count: eventos.data?.length || undefined },
    { value: 'medicacion', label: 'Medicación', count: criticos.activas.length || undefined },
    {
      value: 'calendario',
      label: 'Calendario',
      count: citas.data?.filter((c) => c.estado === 'pendiente').length || undefined,
    },
    { value: 'adjuntos', label: 'Adjuntos', count: generales.length || undefined },
  ];

  return (
    <Marco esMovil={esMovil} titulo={datos.nombre}>
      {confirmandoDesvinculo && miFicha.data ? (
        <ConfirmarRevocacion
          nombre="tu veterinaria"
          nombreDeLaMascota={datos.nombre}
          esPersona={false}
          enviando={dejarDeAtender.isPending}
          onCancelar={() => setConfirmandoDesvinculo(false)}
          onConfirmar={() =>
            dejarDeAtender.mutate(miFicha.data.clinica_id, {
              onSuccess: () => {
                setConfirmandoDesvinculo(false);
                onSalirDeLaCartera?.();
              },
            })
          }
        />
      ) : null}
      {/*
        Dar de baja un evento no lo borra: deja de listarse, conserva su autoría
        y queda auditado. El diálogo lo dice, porque "dar de baja" suena a que
        el dato se pierde.
      */}
      {eventoADarDeBaja ? (
        <DialogoDeConfirmacion
          titulo="¿Dar de baja este evento?"
          descripcion="Deja de aparecer en el historial. No se borra: conserva la firma de quien lo escribió y queda registrado quién lo retiró. Si cumplía una cita, esa cita puede volver a quedar pendiente."
          etiquetaConfirmar="Dar de baja"
          enviando={darDeBajaEvento.isPending}
          error={darDeBajaEvento.isError ? mensajeDeError(darDeBajaEvento.error) : undefined}
          onCancelar={() => setEventoADarDeBaja(null)}
          onConfirmar={() =>
            darDeBajaEvento.mutate(eventoADarDeBaja.id, {
              onSuccess: () => setEventoADarDeBaja(null),
            })
          }
        />
      ) : null}

      {deBaja ? <AvisoDePacienteDeBaja /> : null}
      {sinMatricula ? <AvisoSinMatricula /> : null}

      <EncabezadoDePaciente
        paciente={datos}
        tutor={tutor.data}
        esMovil={esMovil}
        bloqueado={bloqueado}
        motivoBloqueo={motivoBloqueo}
        deBaja={deBaja}
        onDejarDeAtender={() => setConfirmandoDesvinculo(true)}
      />

      {/* Debajo de la identidad y antes que nada del historial: es lo primero
          que se hace al recibir a la mascota, y lo que se escribe viene después
          (Alcance de Plataformas, 3.3.1). */}
      <AsentarAtencion
        pacienteId={pacienteId}
        bloqueado={bloqueado}
        motivoBloqueo={motivoBloqueo}
      />

      {/*
        La banda lee de dos consultas: sin las dos no puede afirmar que no hay
        alergias ni medicación, que es lo que un veterinario ajeno viene a leer
        acá en segundos.
      */}
      <BandaDeUrgencia
        datos={criticos}
        esMovil={esMovil}
        cargando={eventos.isPending || medicaciones.isPending}
        error={eventos.isError || medicaciones.isError}
        onVerMedicacion={() => setPestania('medicacion')}
      />

      <QuienesLaVen
        pacienteId={pacienteId}
        nombreDelDueno={tutor.data?.nombre}
        contactoDelDueno={tutor.data?.contacto}
        clinicaPropiaID={miFicha.data?.clinica_id}
      />

      <View style={estilos.barraDePestanias}>
        <View style={estilos.flexible}>
          <Tabs items={pestanias} value={pestania} onChange={setPestania} scrollable={esMovil} />
        </View>
        {!esMovil ? (
          <Button
            iconLeft="plus"
            disabled={bloqueado}
            accessibilityLabel={bloqueado ? motivoBloqueo : undefined}
            onPress={() => accionDePestania(pestania)}
          >
            {CTA_POR_PESTANIA[pestania]}
          </Button>
        ) : null}
      </View>
      {bloqueado ? <MotivoDeBloqueo motivo={motivoBloqueo} /> : null}

      {pestania === 'historial' ? (
        <HistorialClinico
          eventos={eventos.data}
          adjuntosPorEvento={porEvento}
          plantel={plantel.data}
          cargando={eventos.isPending}
          error={eventos.isError}
          onReintentar={() => eventos.refetch()}
          esMovil={esMovil}
          bloqueado={bloqueado}
          motivoBloqueo={motivoBloqueo}
          onCargarEvento={() => accionDePestania('historial')}
          onEditarEvento={(evento) =>
            router.push(`/(veterinario)/pacientes/${pacienteId}/evento-clinico/${evento.id}`)
          }
          onDarDeBajaEvento={(evento) => {
            darDeBajaEvento.reset();
            setEventoADarDeBaja(evento);
          }}
        />
      ) : null}

      {pestania === 'medicacion' ? (
        <SeccionMedicacion
          activas={criticos.activas}
          historicas={criticos.historicas}
          plantel={plantel.data}
          error={medicaciones.isError}
          onReintentar={() => medicaciones.refetch()}
          esMovil={esMovil}
          bloqueado={bloqueado}
          motivoBloqueo={motivoBloqueo}
          onCrear={(entrada) => crear.mutate(entrada)}
          creando={crear.isPending}
          onCerrar={(medicacion) => cerrar.mutate(medicacion.id)}
        />
      ) : null}

      {pestania === 'calendario' ? (
        <SeccionCalendario
          citas={citas.data}
          grilla={grilla.data}
          plantel={plantel.data ? [...plantel.data.values()] : undefined}
          error={citas.isError}
          onReintentar={() => citas.refetch()}
          esMovil={esMovil}
          bloqueado={bloqueado}
          motivoBloqueo={motivoBloqueo}
          onAgendar={(entrada) => agendar.mutate(entrada)}
          onReagendar={(cita, entrada) =>
            reagendar.mutate({
              citaId: cita.id,
              cambios: {
                fecha_programada: entrada.fecha_programada,
                notificar_tutor: entrada.notificar_tutor,
                veterinario_id: entrada.veterinario_id,
              },
            })
          }
          onRegistrarAtencion={(cita) =>
            router.push(
              `/(veterinario)/pacientes/${pacienteId}/evento-clinico/nuevo?cita=${cita.id}`,
            )
          }
          onRetirar={(cita) => retirarCita.mutate(cita.id)}
          guardando={agendar.isPending || reagendar.isPending}
          errorAlGuardar={
            agendar.error || reagendar.error || retirarCita.error
              ? mensajeDeError(agendar.error ?? reagendar.error ?? retirarCita.error)
              : undefined
          }
        />
      ) : null}

      {pestania === 'adjuntos' ? (
        <SeccionAdjuntos
          pacienteId={pacienteId}
          adjuntos={generales}
          usuarioId={sesion?.usuario.id}
          error={adjuntos.isError}
          onReintentar={() => adjuntos.refetch()}
          esMovil={esMovil}
          bloqueado={bloqueado}
          motivoBloqueo={motivoBloqueo}
          onRetirar={(adjunto) => retirar.mutate(adjunto.id)}
        />
      ) : null}

      {esMovil ? (
        <View style={[estilos.ctaMovil, { backgroundColor: t['--surface-page'] }]}>
          <Button
            size="touch"
            iconLeft="plus"
            block
            disabled={bloqueado}
            accessibilityLabel={bloqueado ? motivoBloqueo : undefined}
            onPress={() => accionDePestania(pestania)}
          >
            {CTA_POR_PESTANIA[pestania]}
          </Button>
        </View>
      ) : null}
    </Marco>
  );
}

/** Ancho máximo, gutters y encabezado de navegación, según plataforma. */
function Marco({
  esMovil,
  titulo,
  children,
}: {
  esMovil: boolean;
  titulo?: string;
  children: ReactNode;
}) {
  const { t, px, texto, textoSobreMarca } = useTheme();

  return (
    <View style={[estilos.raiz, { backgroundColor: t['--surface-page'] }]}>
      {esMovil ? (
        <View style={[estilos.cabeceraMovil, { backgroundColor: t['--surface-nav'] }]}>
          <IconButton icon="arrow-left" label="Volver a pacientes" size="sm" variant="on-dark" />
          <Text style={[textoSobreMarca('body-strong'), { color: t['--text-on-nav'], flex: 1 }]}>
            {titulo ?? 'Ficha de paciente'}
          </Text>
        </View>
      ) : (
        <View
          style={[
            estilos.migas,
            { backgroundColor: t['--surface-page'], borderBottomColor: t['--border-subtle'] },
          ]}
        >
          <Text style={[texto('body-sm'), { fontWeight: '600', color: t['--text-link'] }]}>
            Pacientes
          </Text>
          <Text style={[texto('body-sm'), { color: t['--text-subtle'] }]}>/</Text>
          <Text style={[texto('body-strong'), { color: t['--text-strong'] }]}>
            {titulo ?? 'Ficha'}
          </Text>
        </View>
      )}

      <ScrollView>
        <View
          style={[
            estilos.contenido,
            {
              maxWidth: px('--content-max'),
              gap: esMovil ? 16 : 20,
              paddingHorizontal: esMovil ? px('--gutter-mobile') : px('--gutter-page'),
              paddingTop: esMovil ? 16 : 24,
              paddingBottom: esMovil ? 16 : 56,
            },
          ]}
        >
          {children}
        </View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  cabeceraMovil: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  migas: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
  },
  contenido: { width: '100%', alignSelf: 'center' },
  barraDePestanias: { flexDirection: 'row', alignItems: 'flex-end', gap: 16 },
  flexible: { flex: 1, minWidth: 0 },
  ctaMovil: { paddingTop: 8 },
});
