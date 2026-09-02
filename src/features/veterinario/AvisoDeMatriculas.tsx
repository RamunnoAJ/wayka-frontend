import { StyleSheet, Text, View } from 'react-native';

import type { Veterinario } from '../../api/veterinario';
import { Icon } from '../../components';
import { useTheme } from '../../theme';

/**
 * Quién del plantel quedó en modo restringido por no tener matrícula cargada
 * (Alcance de Plataformas, 3.2.2).
 *
 * Sin matrícula la cuenta entra al sistema pero no puede crear ni editar Eventos
 * clínicos ni Medicación (regla 2.1). Hoy eso se descubre cuando la persona
 * intenta cargar un evento y no puede — el peor momento y el peor lugar para
 * enterarse.
 *
 * Va arriba del listado y no solo como una etiqueta en cada fila: la etiqueta ya
 * está, pero obliga a recorrer el plantel entero para saber si hay alguien
 * restringido, y con ocho personas nadie lo hace.
 */
export function sinMatricula(plantel: Veterinario[]): Veterinario[] {
  return plantel.filter((ficha) => !ficha.matricula?.trim());
}

/**
 * Los nombres se enumeran hasta tres y después se cuentan. Es lo que hace que el
 * aviso sirva para actuar —a quién hay que buscarle la matrícula— sin volverse
 * un párrafo cuando falta media clínica.
 */
export function nombresDelAviso(fichas: Veterinario[]): string {
  const nombres = fichas.map((ficha) => ficha.nombre);
  if (nombres.length <= 3) {
    if (nombres.length <= 1) return nombres.join('');
    return `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}`;
  }
  return `${nombres.slice(0, 3).join(', ')} y ${nombres.length - 3} más`;
}

export function AvisoDeMatriculas({ plantel }: { plantel: Veterinario[] }) {
  const { t, px, texto } = useTheme();
  const faltan = sinMatricula(plantel);

  if (faltan.length === 0) return null;

  return (
    <View
      accessibilityRole="alert"
      style={[
        estilos.raiz,
        {
          padding: px('--gutter-card'),
          borderRadius: px('--radius-card'),
          backgroundColor: t['--warning-50'],
          borderColor: t['--warning-100'],
        },
      ]}
    >
      <Icon name="alert-triangle" color={t['--text-warning']} />
      <View style={estilos.texto}>
        <Text style={[texto('body'), { fontWeight: '600', color: t['--text-strong'] }]}>
          {faltan.length === 1
            ? `${nombresDelAviso(faltan)} no puede escribir historial`
            : `${faltan.length} del equipo no pueden escribir historial`}
        </Text>
        <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
          {faltan.length === 1
            ? 'Le falta la matrícula. Entra al sistema y ve las fichas, pero no puede cargar ni editar eventos clínicos ni medicación.'
            : `Les falta la matrícula: ${nombresDelAviso(faltan)}. Entran al sistema y ven las fichas, pero no pueden cargar ni editar eventos clínicos ni medicación.`}
        </Text>
        <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
          Se carga desde «Ver ficha», en su fila del listado.
        </Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { borderWidth: 1, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  texto: { flex: 1, gap: 4 },
});
