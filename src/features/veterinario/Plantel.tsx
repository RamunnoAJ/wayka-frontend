import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Veterinario } from '../../api/veterinario';
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  InlineError,
  Skeleton,
  SkeletonText,
} from '../../components';
import { useAnchoDeVentana } from '../../hooks/useAnchoDeVentana';
import { mensajeDeError } from '../../lib/errores';
import { sombra, useTheme } from '../../theme';

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

  const plantel = usePlantel();
  const crear = useCrearVeterinario();
  const darDeBaja = useDarDeBajaVeterinario();
  const [abierto, setAbierto] = useState(false);
  const [confirmando, setConfirmando] = useState<string | null>(null);

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

          {abierto ? (
            <FormularioDeVeterinario
              enviando={crear.isPending}
              error={crear.error ? mensajeDeError(crear.error) : undefined}
              onGuardar={(entrada) => crear.mutate(entrada, { onSuccess: () => setAbierto(false) })}
              onCancelar={() => setAbierto(false)}
            />
          ) : null}

          {darDeBaja.isError ? (
            <InlineError
              compact
              title="No se pudo dar de baja"
              description={mensajeDeError(darDeBaja.error)}
            />
          ) : null}

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
                  confirmando={confirmando === veterinario.id}
                  dandoDeBaja={darDeBaja.isPending}
                  onPedirBaja={() => setConfirmando(veterinario.id)}
                  onCancelarBaja={() => setConfirmando(null)}
                  onConfirmarBaja={() =>
                    darDeBaja.mutate(veterinario.id, { onSuccess: () => setConfirmando(null) })
                  }
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

interface FilaProps {
  veterinario: Veterinario;
  esMovil: boolean;
  confirmando: boolean;
  dandoDeBaja: boolean;
  onPedirBaja: () => void;
  onCancelarBaja: () => void;
  onConfirmarBaja: () => void;
}

function FilaDeVeterinario({
  veterinario,
  esMovil,
  confirmando,
  dandoDeBaja,
  onPedirBaja,
  onCancelarBaja,
  onConfirmarBaja,
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

      {confirmando ? (
        <View style={estilos.confirmacion}>
          <Text style={[texto('body-sm'), { color: t['--text-danger'] }]}>
            Se desactiva también su cuenta. Lo que escribió queda con su firma.
          </Text>
          <View style={estilos.acciones}>
            <Button variant="danger" size="sm" loading={dandoDeBaja} onPress={onConfirmarBaja}>
              Dar de baja
            </Button>
            <Button variant="ghost" size="sm" onPress={onCancelarBaja}>
              Cancelar
            </Button>
          </View>
        </View>
      ) : (
        <Button variant="ghost" size="sm" iconLeft="archive" onPress={onPedirBaja}>
          Dar de baja
        </Button>
      )}
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
  confirmacion: { gap: 8, minWidth: 260 },
  acciones: { flexDirection: 'row', gap: 8 },
});
