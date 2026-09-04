import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Paciente } from '../../api/paciente';
import type { Tutor } from '../../api/tutor';
import { Avatar, Badge, Button } from '../../components';
import { sombra, useTheme } from '../../theme';

import { capitalizar, edad, edadCompacta, fechaCorta, microchip, peso } from './formato';

/**
 * Zona 1: identidad del paciente.
 *
 * `clinica_id` y `tutor_id` no aparecen como campos editables y no es un
 * olvido: la clínica es fija en el MVP y cambiar el tutor sería transferir la
 * mascota sin dejar rastro (Modelo de Datos, 4.2).
 */
interface EncabezadoProps {
  paciente: Paciente;
  tutor: Tutor | undefined;
  esMovil: boolean;
  bloqueado: boolean;
  motivoBloqueo: string;
  deBaja: boolean;
  onEditar?: () => void;
  onDejarDeAtender?: () => void;
  onEditarPeso?: () => void;
  onVerTutor?: () => void;
}

export function EncabezadoDePaciente({
  paciente,
  tutor,
  esMovil,
  bloqueado,
  motivoBloqueo,
  deBaja,
  onEditar,
  onDejarDeAtender,
  onEditarPeso,
  onVerTutor,
}: EncabezadoProps) {
  const { t, px, texto } = useTheme();
  const chip = microchip(paciente.identificador_externo);

  return (
    <View
      style={[
        estilos.tarjeta,
        sombra('--shadow-sm'),
        {
          borderRadius: px('--radius-card'),
          backgroundColor: t['--surface-card'],
          borderColor: t['--border-default'],
          padding: px('--gutter-card'),
        },
      ]}
    >
      <View style={estilos.fila}>
        {/* La foto que eligió el tutor encabeza la ficha. Sin foto queda el
            ícono de la especie: rellenarlo con algo que finja ser una foto
            sería peor que la ausencia. */}
        <Avatar
          name={paciente.nombre}
          species={paciente.especie}
          src={paciente.foto_perfil_url}
          size="xl"
        />

        <View style={estilos.identidad}>
          <View style={estilos.titulo}>
            <Text style={[texto('h1'), { color: t['--text-strong'] }]}>{paciente.nombre}</Text>
            <Badge tone="neutral" icon="paw-print">
              {capitalizar(paciente.especie)}
            </Badge>
            {deBaja ? (
              <Badge tone="danger" icon="lock">
                Dado de baja
              </Badge>
            ) : null}
          </View>
          <Text style={[texto('body-lg'), { color: t['--text-muted'], marginTop: 4 }]}>
            {[
              capitalizar(paciente.raza),
              capitalizar(paciente.sexo),
              edad(paciente.fecha_nacimiento),
            ]
              .filter(Boolean)
              .join(' · ')}
          </Text>
          <Text style={[texto('body-sm'), { color: t['--text-subtle'], marginTop: 2 }]}>
            Nació el {fechaCorta(paciente.fecha_nacimiento)}
          </Text>
        </View>

        <View style={estilos.acciones}>
          <Button
            variant="secondary"
            size="sm"
            iconLeft="pencil"
            disabled={bloqueado}
            accessibilityLabel={bloqueado ? motivoBloqueo : undefined}
            onPress={onEditar}
          >
            Editar datos básicos
          </Button>
          {/* El veterinario ya no da de baja la mascota: con una atendida por
              varias clínicas, eso sería dejar que una borre el registro de las
              otras (regla 2.4). Lo que sí puede es sacarla de su cartera, que es
              lo que en realidad quería hacer cuando dejaba de atenderla. */}
          <Button
            variant="ghost"
            size="sm"
            iconLeft="archive"
            disabled={bloqueado}
            accessibilityLabel={bloqueado ? motivoBloqueo : undefined}
            onPress={onDejarDeAtender}
          >
            Dejar de atender
          </Button>
        </View>
      </View>

      <View
        style={[
          estilos.stats,
          {
            borderTopColor: t['--border-subtle'],
            gap: esMovil ? 16 : 20,
            flexDirection: esMovil ? 'column' : 'row',
          },
        ]}
      >
        <Dato titulo="Edad" acento="clinico">
          <Text style={[texto('h3'), { color: t['--text-strong'] }]}>
            {edadCompacta(paciente.fecha_nacimiento)}
          </Text>
          <Text style={[texto('caption'), { color: t['--text-subtle'] }]}>
            {fechaCorta(paciente.fecha_nacimiento)}
          </Text>
        </Dato>

        <Dato titulo="Peso actual" acento="tutor">
          <View style={estilos.pesoFila}>
            <Text style={[texto('h3'), { color: t['--text-strong'] }]}>
              {peso(paciente.peso_actual)}
            </Text>
            {/* El peso es el único dato que el tutor también edita (3.2). */}
            <Button variant="ghost" size="sm" iconLeft="pencil" onPress={onEditarPeso}>
              Editar
            </Button>
          </View>
        </Dato>

        <Dato titulo="Microchip" acento="clinico">
          {chip ? (
            <Text style={[texto('body-strong'), { color: t['--text-strong'] }]}>{chip}</Text>
          ) : (
            <Text style={[texto('body'), { color: t['--text-subtle'], fontStyle: 'italic' }]}>
              Sin cargar
            </Text>
          )}
          <Text style={[texto('caption'), { color: t['--text-subtle'] }]}>
            Identificador externo
          </Text>
        </Dato>

        <Dato titulo="Tutor" acento="tutor">
          {tutor ? (
            <>
              <Text
                accessibilityRole="link"
                onPress={onVerTutor}
                style={[texto('body-lg'), { fontWeight: '600', color: t['--text-link'] }]}
              >
                {tutor.nombre}
              </Text>
              <Text style={[texto('caption'), { color: t['--text-subtle'] }]}>
                {tutor.contacto}
              </Text>
            </>
          ) : (
            <Text style={[texto('body'), { color: t['--text-subtle'] }]}>—</Text>
          )}
        </Dato>
      </View>
    </View>
  );
}

/**
 * Un dato de la grilla. El punto de color distingue el origen: lila para lo
 * clínico, naranja para lo que toca el tutor (`--clinical-accent` /
 * `--owner-accent` del design system).
 */
function Dato({
  titulo,
  acento,
  children,
}: {
  titulo: string;
  acento: 'clinico' | 'tutor';
  children: ReactNode;
}) {
  const { t, texto } = useTheme();
  return (
    <View style={estilos.dato}>
      <View style={estilos.datoTitulo}>
        <View
          style={[
            estilos.punto,
            { backgroundColor: acento === 'tutor' ? t['--owner-accent'] : t['--clinical-accent'] },
          ]}
        />
        <Text style={[texto('overline'), { fontWeight: '700', color: t['--text-subtle'] }]}>
          {titulo.toUpperCase()}
        </Text>
      </View>
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { borderWidth: 1 },
  fila: { flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap', gap: 18 },
  identidad: { flex: 1, minWidth: 190 },
  titulo: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  acciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stats: { flexWrap: 'wrap', marginTop: 20, paddingTop: 18, borderTopWidth: 1 },
  dato: { flex: 1, minWidth: 140, gap: 2 },
  datoTitulo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  punto: { width: 6, height: 6, borderRadius: 3 },
  pesoFila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
