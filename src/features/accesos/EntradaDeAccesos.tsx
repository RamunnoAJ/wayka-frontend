import { StyleSheet, Text, View } from 'react-native';

import type { AccesosDelPaciente } from '../../api/acceso-a-paciente';
import { Button, Icon, Presionable } from '../../components';
import { useTheme } from '../../theme';

import { useAccesosDeMascota } from './queries';

/**
 * La entrada a los accesos, en la ficha de la mascota.
 *
 * Cambia de cara según el estado en vez de ser siempre la misma fila: una
 * mascota recién cargada **no la ve nadie**, y ahí lo que hace falta no es una
 * entrada a una lista vacía sino la acción de compartir. Es el momento en que el
 * tutor vuelve del alta, y compartir es lo que hace que la ficha sirva de algo:
 * sin una clínica que la atienda, nadie va a escribirle el historial.
 *
 * Ya compartida, vuelve a ser lo que era: una fila de gestión que dice con
 * quién, y lleva a la pantalla donde se revoca y se cambian niveles.
 */
export function EntradaDeAccesos({
  pacienteId,
  administra,
  onVerAccesos,
  onCompartir,
}: {
  pacienteId: string;
  administra: boolean;
  onVerAccesos: () => void;
  onCompartir: () => void;
}) {
  const { t, px, texto } = useTheme();
  const accesos = useAccesosDeMascota(pacienteId);

  // La lista de accesos no está en la copia local a propósito (Sincronización
  // sin Conexión, 2: lo replicable es el historial de la mascota, no quién la
  // administra). Sin conexión la fila no puede decir con quién se comparte, así
  // que muestra la versión neutra en vez de afirmar que no la ve nadie — que
  // sería justo lo contrario de la verdad.
  const sinDato = accesos.isPending || accesos.isError;
  const vacio = !sinDato && cuantos(accesos.data) === 0;

  if (vacio && administra) {
    return (
      <View
        style={[
          estilos.llamada,
          {
            borderRadius: px('--radius-card'),
            backgroundColor: t['--surface-accent-soft'],
            borderColor: t['--border-default'],
          },
        ]}
      >
        <Text style={[texto('body-strong'), { color: t['--text-strong'] }]}>
          Todavía no la ve nadie
        </Text>
        <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
          Compartila con tu veterinaria para que cargue su historial, o con quien la cuide con vos.
        </Text>
        <Button variant="primary" size="sm" iconLeft="plus" onPress={onCompartir}>
          Compartir
        </Button>
      </View>
    );
  }

  return (
    <Presionable
      onPress={onVerAccesos}
      fondo={t['--surface-card']}
      fondoDestacado={t['--surface-hover']}
      borde={t['--border-default']}
      accessibilityLabel="Quién la ve"
      style={[estilos.fila, { borderRadius: px('--radius-card') }]}
    >
      <View style={estilos.flexible}>
        <Text style={[texto('body-strong'), { color: t['--text-strong'] }]}>Quién la ve</Text>
        <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
          {sinDato ? subtituloSinDato(administra) : resumen(accesos.data)}
        </Text>
      </View>
      <Icon name="chevron-right" size={18} color={t['--text-subtle']} />
    </Presionable>
  );
}

function cuantos(accesos?: AccesosDelPaciente): number {
  return (accesos?.clinicas.length ?? 0) + (accesos?.co_tutores.length ?? 0);
}

function subtituloSinDato(administra: boolean): string {
  return administra ? 'Las veterinarias y las personas con acceso' : 'Con quién más se comparte';
}

/**
 * Nombra a los dos primeros y cuenta el resto. Un nombre suelto no dice nada
 * —"3 accesos" no le sirve a nadie— y la lista entera no entra en una línea.
 */
function resumen(accesos?: AccesosDelPaciente): string {
  const nombres = [
    ...(accesos?.clinicas ?? []).map((clinica) => clinica.nombre),
    ...(accesos?.co_tutores ?? []).map((coTutor) => coTutor.nombre),
  ];
  if (nombres.length === 0) return 'Nadie todavía';
  if (nombres.length === 1) return nombres[0] ?? '';
  if (nombres.length === 2) return `${nombres[0]} y ${nombres[1]}`;
  return `${nombres[0]} y ${nombres.length - 1} más`;
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, padding: 14 },
  llamada: { borderWidth: 1, padding: 14, gap: 8, alignItems: 'flex-start' },
  flexible: { flex: 1, minWidth: 120, gap: 2 },
});
