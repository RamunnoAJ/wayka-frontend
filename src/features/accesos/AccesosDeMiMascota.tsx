import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { CoTutor, VinculoConClinica } from '../../api/acceso-a-paciente';
import type { Invitacion } from '../../api/invitacion';
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  InlineError,
  MenuDeAcciones,
  SkeletonText,
} from '../../components';
import { mensajeDeError } from '../../lib/errores';
import { useTheme } from '../../theme';

import { ConfirmarRevocacion } from './ConfirmarRevocacion';
import { EtiquetaDeNivel } from './EtiquetaDeNivel';
import {
  useAccesosDeMascota,
  useAnularInvitacion,
  useCambiarNivelDeAcceso,
  useInvitacionesDeMascota,
  useRevocarClinica,
  useRevocarCoTutor,
} from './queries';

/**
 * Quién la ve (Alcance de Plataformas, 5.10).
 *
 * El dueño administra; un co-tutor ve la misma lista **sin acciones**. Saber
 * quién más mira el historial de un animal no es una capacidad administrativa:
 * es lo mínimo para entender con quién se está compartiendo, y ocultárselo
 * dejaría a alguien leyendo datos de salud sin saber quién más los lee.
 */
type PorRevocar =
  | { tipo: 'clinica'; id: string; nombre: string }
  | { tipo: 'co-tutor'; id: string; nombre: string };

export function AccesosDeMiMascota({
  pacienteId,
  nombreDeLaMascota,
  administra,
  onCompartir,
}: {
  pacienteId: string;
  nombreDeLaMascota: string;
  administra: boolean;
  onCompartir: () => void;
}) {
  const { t, px, texto } = useTheme();
  const accesos = useAccesosDeMascota(pacienteId);
  const invitaciones = useInvitacionesDeMascota(pacienteId);
  const revocarClinica = useRevocarClinica(pacienteId);
  const revocarCoTutor = useRevocarCoTutor(pacienteId);
  const cambiarNivel = useCambiarNivelDeAcceso(pacienteId);
  const anular = useAnularInvitacion(pacienteId);

  const [porRevocar, setPorRevocar] = useState<PorRevocar | null>(null);
  const errorAlRevocar = revocarClinica.error ?? revocarCoTutor.error;

  return (
    <View style={[estilos.raiz, { backgroundColor: t['--surface-page'] }]}>
      <ScrollView>
        <View style={[estilos.contenido, { paddingHorizontal: px('--gutter-mobile') }]}>
          <Text style={[texto('h1'), { color: t['--text-strong'] }]}>Quién la ve</Text>

          {administra ? (
            <Button variant="secondary" iconLeft="plus" onPress={onCompartir}>
              Compartir
            </Button>
          ) : null}

          {errorAlRevocar ? (
            <InlineError
              compact
              title="No se pudo revocar"
              description={mensajeDeError(errorAlRevocar)}
            />
          ) : null}

          {accesos.isPending ? (
            <SkeletonText lines={4} />
          ) : accesos.isError ? (
            <InlineError title="No se pudo cargar" onRetry={() => accesos.refetch()} />
          ) : (
            <>
              <Seccion titulo="Veterinarias">
                {(accesos.data?.clinicas.length ?? 0) === 0 ? (
                  <EmptyState
                    icon="stethoscope"
                    title="Ninguna todavía"
                    description="Cuando la compartas con una veterinaria, va a poder ver su historial y agendarle turnos."
                  />
                ) : (
                  accesos.data?.clinicas.map((clinica) => (
                    <FilaDeClinica
                      key={clinica.clinica_id}
                      clinica={clinica}
                      administra={administra}
                      onRevocar={() =>
                        setPorRevocar({
                          tipo: 'clinica',
                          id: clinica.clinica_id,
                          nombre: clinica.nombre,
                        })
                      }
                    />
                  ))
                )}
              </Seccion>

              <Seccion titulo="Personas">
                {(accesos.data?.co_tutores.length ?? 0) === 0 ? (
                  <EmptyState
                    icon="user-round"
                    title="Nadie más por ahora"
                    description="Podés compartirla con quien la cuide con vos."
                  />
                ) : (
                  accesos.data?.co_tutores.map((coTutor) => (
                    <FilaDeCoTutor
                      key={coTutor.tutor_id}
                      coTutor={coTutor}
                      administra={administra}
                      cambiandoNivel={cambiarNivel.isPending}
                      onCambiarNivel={() =>
                        cambiarNivel.mutate({
                          tutorId: coTutor.tutor_id,
                          nivel: coTutor.nivel === 'edicion' ? 'lectura' : 'edicion',
                        })
                      }
                      onRevocar={() =>
                        setPorRevocar({
                          tipo: 'co-tutor',
                          id: coTutor.tutor_id,
                          nombre: coTutor.nombre,
                        })
                      }
                    />
                  ))
                )}
              </Seccion>

              {administra && (invitaciones.data?.length ?? 0) > 0 ? (
                <Seccion titulo="Invitaciones sin aceptar">
                  {invitaciones.data?.map((invitacion) => (
                    <FilaDeInvitacion
                      key={invitacion.id}
                      invitacion={invitacion}
                      onAnular={() => anular.mutate(invitacion.id)}
                    />
                  ))}
                </Seccion>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>

      {porRevocar ? (
        <ConfirmarRevocacion
          nombre={porRevocar.nombre}
          nombreDeLaMascota={nombreDeLaMascota}
          esPersona={porRevocar.tipo === 'co-tutor'}
          enviando={revocarClinica.isPending || revocarCoTutor.isPending}
          onCancelar={() => setPorRevocar(null)}
          onConfirmar={() => {
            const alTerminar = { onSuccess: () => setPorRevocar(null) };
            if (porRevocar.tipo === 'clinica') {
              revocarClinica.mutate(porRevocar.id, alTerminar);
            } else {
              revocarCoTutor.mutate(porRevocar.id, alTerminar);
            }
          }}
        />
      ) : null}
    </View>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  const { t, texto } = useTheme();
  return (
    <View style={estilos.seccion}>
      <Text style={[texto('h4'), { color: t['--text-strong'] }]}>{titulo}</Text>
      {children}
    </View>
  );
}

function FilaDeClinica({
  clinica,
  administra,
  onRevocar,
}: {
  clinica: VinculoConClinica;
  administra: boolean;
  onRevocar: () => void;
}) {
  const { t, px, texto } = useTheme();
  return (
    <View
      style={[
        estilos.fila,
        {
          borderRadius: px('--radius-card'),
          backgroundColor: t['--surface-card'],
          borderColor: t['--border-default'],
        },
      ]}
    >
      <View style={estilos.flexible}>
        <Text style={[texto('body-strong'), { color: t['--text-strong'] }]}>{clinica.nombre}</Text>
        {clinica.direccion ? (
          <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>{clinica.direccion}</Text>
        ) : null}
      </View>
      {administra ? (
        <MenuDeAcciones
          accessibilityLabel={`Acciones de ${clinica.nombre}`}
          acciones={[
            {
              label: 'Que deje de atenderla',
              icono: 'archive',
              peligro: true,
              onPress: onRevocar,
            },
          ]}
        />
      ) : null}
    </View>
  );
}

function FilaDeCoTutor({
  coTutor,
  administra,
  cambiandoNivel,
  onCambiarNivel,
  onRevocar,
}: {
  coTutor: CoTutor;
  administra: boolean;
  cambiandoNivel: boolean;
  onCambiarNivel: () => void;
  onRevocar: () => void;
}) {
  const { t, px, texto } = useTheme();
  return (
    <View
      style={[
        estilos.fila,
        {
          borderRadius: px('--radius-card'),
          backgroundColor: t['--surface-card'],
          borderColor: t['--border-default'],
        },
      ]}
    >
      <Avatar name={coTutor.nombre} size="sm" tone="brand" />
      <View style={estilos.flexible}>
        <Text style={[texto('body-strong'), { color: t['--text-strong'] }]}>{coTutor.nombre}</Text>
        <EtiquetaDeNivel nivel={coTutor.nivel} />
      </View>
      {administra ? (
        /*
          Dos acciones y una de ellas quita el acceso: juntas en la fila, la
          distancia entre cambiar el nivel y revocar es de unos píxeles.
        */
        <MenuDeAcciones
          accessibilityLabel={`Acciones de ${coTutor.nombre}`}
          acciones={[
            {
              label: coTutor.nivel === 'edicion' ? 'Dejar que solo mire' : 'Dejar que edite',
              icono: 'pencil',
              deshabilitada: cambiandoNivel,
              onPress: onCambiarNivel,
            },
            { label: 'Quitarle el acceso', icono: 'archive', peligro: true, onPress: onRevocar },
          ]}
        />
      ) : null}
    </View>
  );
}

function FilaDeInvitacion({
  invitacion,
  onAnular,
}: {
  invitacion: Invitacion;
  onAnular: () => void;
}) {
  const { t, px, texto } = useTheme();
  return (
    <View
      style={[
        estilos.fila,
        {
          borderRadius: px('--radius-card'),
          backgroundColor: t['--surface-sunken'],
          borderColor: t['--border-default'],
        },
      ]}
    >
      <View style={estilos.flexible}>
        <Text style={[texto('body-strong'), { color: t['--text-strong'] }]}>
          {invitacion.email}
        </Text>
        <Badge tone="warning">Sin aceptar</Badge>
      </View>
      <MenuDeAcciones
        accessibilityLabel={`Acciones de la invitación a ${invitacion.email}`}
        acciones={[{ label: 'Anular la invitación', icono: 'x', peligro: true, onPress: onAnular }]}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  contenido: { paddingVertical: 24, gap: 20 },
  seccion: { gap: 10 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, padding: 14 },
  flexible: { flex: 1, minWidth: 120, gap: 4, alignItems: 'flex-start' },
  acciones: { alignItems: 'flex-end', gap: 4 },
});
