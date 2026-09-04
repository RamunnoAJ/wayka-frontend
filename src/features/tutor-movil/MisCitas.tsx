import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmptyState, InlineError, SkeletonText, Tabs, type ItemDeTab } from '../../components';
import { useTheme } from '../../theme';
import { useEstadosPorRegistro } from '../sincronizacion';

import { CalendarioDeCitas, MODO_DE_CALENDARIO, type ModoDeCalendario } from '../citas';
import { hoyEnLaClinica } from '../paciente/formato';

import { useMiAgenda } from './queries';
import { TarjetaDeCita, tono } from './TarjetaDeCita';

/**
 * Mis citas (Alcance de Plataformas, 5.4).
 *
 * En el dispositivo las citas salen de la **copia local**, que es lo que hace
 * que la pantalla abra sin conexión; en web salen del endpoint de alcance, donde
 * cuál de los dos alcances aplica lo decide el rol del token.
 *
 * Se ven en el calendario, por semana o por mes, con las del período debajo de
 * la grilla. No hay un listado aparte: sería la misma información ordenada de
 * otra manera, y dos vistas que dicen lo mismo terminan discrepando.
 *
 * El tutor **no agenda**: qué control corresponde es criterio clínico. El estado
 * tampoco lo mueve nadie desde la app: lo pone el sistema (Modelo de Datos,
 * 4.7).
 *
 * **Pendiente**: el contrato le da al tutor reagendar `fecha_programada`,
 * cambiar `notificar_tutor` y dar de baja la cita (regla 3.2), y esta pantalla
 * todavía no ofrece ninguna de las tres — por eso el texto lo manda a pedírselo
 * a la clínica. Los hooks para hacerlo sin conexión ya existen
 * (`useReagendarDelTutor`, `useRetirarCitaDelTutor`); lo que falta es el
 * selector de turno contra la grilla de la clínica, que es una decisión de
 * diseño y no un cableado.
 */
const VISTAS: ItemDeTab<ModoDeCalendario>[] = [
  { value: MODO_DE_CALENDARIO.SEMANA, label: 'Semana' },
  { value: MODO_DE_CALENDARIO.MES, label: 'Mes' },
];

export function MisCitas() {
  const { t, px, texto } = useTheme();
  // La semana es lo que abre: la pregunta frecuente del tutor es qué le viene
  // ahora, y el mes entero la contesta con más de lo que hace falta.
  const [modo, setModo] = useState<ModoDeCalendario>(MODO_DE_CALENDARIO.SEMANA);
  const [ancla, setAncla] = useState(hoyEnLaClinica());
  const agenda = useMiAgenda();
  const estados = useEstadosPorRegistro();
  const citas = agenda.data ?? [];

  return (
    <View style={[estilos.raiz, { backgroundColor: t['--surface-page'] }]}>
      <ScrollView>
        <View style={[estilos.contenido, { paddingHorizontal: px('--gutter-mobile') }]}>
          <Text style={[texto('h1'), { color: t['--text-strong'] }]}>Mis citas</Text>

          {agenda.isPending ? (
            <SkeletonText lines={4} />
          ) : agenda.isError ? (
            <InlineError title="No se pudieron cargar tus citas" onRetry={() => agenda.refetch()} />
          ) : citas.length === 0 ? (
            // Sin una sola cita no hay calendario que mirar: un mes vacío no
            // explica por qué está vacío, y este texto sí.
            <EmptyState
              icon="calendar-days"
              title="No tenés citas agendadas"
              description="Las agenda la veterinaria cuando queda un control o una vacuna pendiente, y te llega un aviso cuando se acerca."
            />
          ) : (
            <>
              <Tabs items={VISTAS} value={modo} onChange={setModo} variant="pill" />
              <CalendarioDeCitas
                citas={citas}
                modo={modo}
                ancla={ancla}
                onAncla={setAncla}
                colorDePunto={(tokens, fila) => tono(tokens, fila.cita.estado).texto}
                renderCita={(fila) => (
                  <TarjetaDeCita
                    fila={fila}
                    estadoLocal={estados.data?.get(fila.cita.id)?.estado}
                  />
                )}
              />
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  contenido: { paddingVertical: 24, gap: 20 },
});
