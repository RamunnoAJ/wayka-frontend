import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ORDEN_DE_PROPUESTAS, type OrdenDePropuestas } from '../../api/propuesta';
import { Button, EmptyState, InlineError, Skeleton, SkeletonText, Tabs } from '../../components';
import { mensajeDeError } from '../../lib/errores';
import { sombra, useTheme } from '../../theme';

import { FormularioDePropuesta } from './FormularioDePropuesta';
import { TarjetaDePropuesta } from './TarjetaDePropuesta';
import { useAlternarVoto, useCrearPropuesta, usePropuestas } from './queries';

/**
 * Tablero de propuestas (Alcance de Plataformas, 3.8 y 5.13).
 *
 * Es la misma pantalla para el tutor y para el veterinario: cada uno ve la
 * audiencia que sale de su token, y por eso acá no hay ninguna decisión de rol.
 * Lo que la pantalla nunca muestra es **quién** escribió o votó cada propuesta
 * (Modelo de Datos, sección 5).
 */
const POR_PAGINA = 20;

const ORDENES = [
  { value: ORDEN_DE_PROPUESTAS.VOTADAS, label: 'Más votadas' },
  { value: ORDEN_DE_PROPUESTAS.RECIENTES, label: 'Nuevas' },
];

export function TableroDePropuestas() {
  const { t, px, texto } = useTheme();

  const [orden, setOrden] = useState<OrdenDePropuestas>(ORDEN_DE_PROPUESTAS.VOTADAS);
  const [pagina, setPagina] = useState(1);
  const [escribiendo, setEscribiendo] = useState(false);

  const propuestas = usePropuestas(orden);
  const crear = useCrearPropuesta();
  const alternar = useAlternarVoto(orden);

  const todas = propuestas.data ?? [];
  const visibles = todas.slice(0, pagina * POR_PAGINA);

  const formulario = (
    <FormularioDePropuesta
      enviando={crear.isPending}
      error={crear.isError ? mensajeDeError(crear.error, ERRORES_DEL_ALTA) : undefined}
      onCancelar={() => {
        crear.reset();
        setEscribiendo(false);
      }}
      onGuardar={(entrada) =>
        crear.mutate(entrada, {
          onSuccess: () => setEscribiendo(false),
        })
      }
    />
  );

  return (
    <ScrollView
      contentContainerStyle={[
        estilos.pagina,
        { paddingHorizontal: px('--gutter-page'), paddingVertical: 32 },
      ]}
    >
      <View style={estilos.encabezado}>
        <Text style={[texto('h2'), { color: t['--text-strong'] }]}>Propuestas</Text>
        <Text style={[texto('body'), { color: t['--text-muted'] }]}>
          Lo que pide la gente que usa Wayka como vos. Votá lo que te sirva y escribí lo que falte.
        </Text>
      </View>

      {escribiendo ? (
        formulario
      ) : (
        <View style={estilos.controles}>
          <Tabs items={ORDENES} value={orden} onChange={setOrden} variant="pill" />
          {todas.length > 0 ? (
            <Button size="sm" iconLeft="plus" onPress={() => setEscribiendo(true)}>
              Escribir una
            </Button>
          ) : null}
        </View>
      )}

      {propuestas.isPending ? (
        <View style={estilos.lista}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                estilos.esqueleto,
                sombra('--shadow-sm'),
                {
                  borderRadius: px('--radius-card'),
                  padding: px('--gutter-card'),
                  borderColor: t['--border-default'],
                },
              ]}
            >
              <Skeleton height={52} width={52} />
              <View style={estilos.flexible}>
                <SkeletonText lines={2} />
              </View>
            </View>
          ))}
        </View>
      ) : propuestas.isError ? (
        <InlineError
          title="No se pudo cargar el tablero"
          description={mensajeDeError(propuestas.error)}
          onRetry={() => propuestas.refetch()}
        />
      ) : todas.length === 0 ? (
        <EmptyState
          icon="lightbulb"
          title="Todavía no hay propuestas"
          description="Contanos qué te haría más fácil usar Wayka. La primera puede ser la tuya."
          action={
            escribiendo ? null : (
              <Button size="sm" iconLeft="plus" onPress={() => setEscribiendo(true)}>
                Escribir la primera
              </Button>
            )
          }
        />
      ) : (
        <>
          {alternar.isError ? (
            <InlineError
              compact
              title="No se pudo registrar el voto"
              description={mensajeDeError(alternar.error)}
            />
          ) : null}

          <View style={estilos.lista}>
            {visibles.map((propuesta) => (
              <TarjetaDePropuesta
                key={propuesta.id}
                propuesta={propuesta}
                enCurso={alternar.isPending && alternar.variables?.id === propuesta.id}
                onVotar={() => alternar.mutate({ id: propuesta.id, votada: propuesta.ya_vote })}
              />
            ))}
          </View>

          {visibles.length < todas.length ? (
            <View style={estilos.paginado}>
              <Button
                size="sm"
                variant="ghost"
                iconLeft="chevron-down"
                onPress={() => setPagina((p) => p + 1)}
              >
                {`Ver más propuestas (${Math.min(POR_PAGINA, todas.length - visibles.length)})`}
              </Button>
              <Text style={[texto('caption'), { color: t['--text-subtle'] }]}>
                {`Mostrando ${visibles.length} de ${todas.length}`}
              </Text>
            </View>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

// El 409 del tope diario tiene código propio justamente para poder decir esto
// sin leer el mensaje del servidor, que es diagnóstico y no contrato.
const ERRORES_DEL_ALTA = {
  limite_diario_alcanzado: 'Ya publicaste cinco propuestas hoy. Probá de nuevo mañana.',
  datos_invalidos: 'El título es lo único obligatorio, y entra en 120 caracteres.',
};

const estilos = StyleSheet.create({
  // Mismo ancho contenido y misma centrada que el resto de las pantallas de
  // una columna: a 1280px una tarjeta de borde a borde se lee peor.
  pagina: { width: '100%', maxWidth: 760, alignSelf: 'center', gap: 16 },
  encabezado: { gap: 4 },
  controles: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  lista: { gap: 12 },
  esqueleto: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderWidth: 1 },
  flexible: { flex: 1 },
  paginado: { alignItems: 'center', gap: 4 },
});
