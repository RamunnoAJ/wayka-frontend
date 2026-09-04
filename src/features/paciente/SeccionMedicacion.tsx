import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { loDeclaroElTutor } from '../../api/historial';
import type { CrearMedicacionEntrada, Medicacion } from '../../api/medicacion';
import type { Veterinario } from '../../api/veterinario';
import { Button, InlineError, Input, MedicationItem } from '../../components';
import { useTheme } from '../../theme';

import { fechaConPrecision, fechaCorta, hoyEnLaClinica } from './formato';
import { MarcaDeOrigen } from './MarcaDeOrigen';
import { Seccion } from './Seccion';

/**
 * Zona 3.2: medicación, en dos grupos.
 *
 * Refleja la regla 2.2 sin aplicarla: **una sola medicación activa por droga**.
 * El formulario avisa antes de enviar y deshabilita el guardado, pero quien
 * rechaza el alta es el backend — acá solo se evita el viaje perdido.
 */
interface MedicacionProps {
  activas: Medicacion[];
  historicas: Medicacion[];
  plantel: Map<string, Veterinario> | undefined;
  error: boolean;
  onReintentar: () => void;
  esMovil: boolean;
  bloqueado: boolean;
  motivoBloqueo: string;
  onCrear: (entrada: CrearMedicacionEntrada) => void;
  creando: boolean;
  onCerrar: (medicacion: Medicacion) => void;
}

export function SeccionMedicacion({
  activas,
  historicas,
  plantel,
  error,
  onReintentar,
  esMovil,
  bloqueado,
  motivoBloqueo,
  onCrear,
  creando,
  onCerrar,
}: MedicacionProps) {
  const { t, px, texto } = useTheme();
  const [abierto, setAbierto] = useState(false);
  const [droga, setDroga] = useState('');
  const [dosis, setDosis] = useState('');
  const [frecuencia, setFrecuencia] = useState('');

  const duplicada = activas.find(
    (m) => m.nombre_droga.trim().toLowerCase() === droga.trim().toLowerCase(),
  );
  const completo = droga.trim() && dosis.trim() && frecuencia.trim();

  function guardar() {
    if (!completo || duplicada) return;
    onCrear({
      nombre_droga: droga.trim(),
      dosis: dosis.trim(),
      frecuencia: frecuencia.trim(),
      fecha_inicio: hoyEnLaClinica(),
    });
    setDroga('');
    setDosis('');
    setFrecuencia('');
    setAbierto(false);
  }

  function detalle(medicacion: Medicacion): string {
    // Al tutor no se lo nombra acá: de eso se ocupa la marca de origen, que es
    // la que tiene que leerse de un vistazo.
    const autor = loDeclaroElTutor(medicacion)
      ? undefined
      : plantel?.get(medicacion.usuario_id)?.nombre;
    const desde = fechaConPrecision(medicacion.fecha_inicio, medicacion.fecha_precision);
    const rango = medicacion.fecha_fin
      ? `${desde} → ${fechaCorta(medicacion.fecha_fin)}`
      : `desde ${desde}`;
    return [rango, autor].filter(Boolean).join(' · ');
  }

  return (
    <Seccion
      titulo="Medicación"
      accion={
        <Button
          size="sm"
          iconLeft="plus"
          disabled={bloqueado}
          accessibilityLabel={bloqueado ? motivoBloqueo : undefined}
          onPress={() => setAbierto((v) => !v)}
        >
          Nueva medicación
        </Button>
      }
    >
      {abierto && !bloqueado ? (
        <View
          style={[
            estilos.form,
            { backgroundColor: t['--surface-sunken'], borderBottomColor: t['--border-subtle'] },
          ]}
        >
          <View style={[estilos.formGrilla, { flexDirection: esMovil ? 'column' : 'row' }]}>
            <View style={estilos.campo}>
              <Input label="Droga" value={droga} onChangeText={setDroga} placeholder="Meloxicam" />
            </View>
            <View style={estilos.campo}>
              <Input label="Dosis" value={dosis} onChangeText={setDosis} placeholder="0,1 mg/kg" />
            </View>
            <View style={estilos.campo}>
              <Input
                label="Frecuencia"
                value={frecuencia}
                onChangeText={setFrecuencia}
                placeholder="cada 24 h"
              />
            </View>
          </View>

          {duplicada ? (
            <InlineError
              compact
              title={`Ya existe una medicación activa de ${duplicada.nombre_droga}`}
              description="Cerrá el tratamiento vigente antes de indicar una nueva pauta de la misma droga."
            />
          ) : null}

          <View style={estilos.formAcciones}>
            <Button
              size="sm"
              disabled={!completo || Boolean(duplicada)}
              loading={creando}
              onPress={guardar}
            >
              Guardar medicación
            </Button>
            <Button variant="ghost" size="sm" onPress={() => setAbierto(false)}>
              Cancelar
            </Button>
          </View>
        </View>
      ) : null}

      <View style={{ padding: px('--gutter-card'), gap: 22 }}>
        {error ? (
          <InlineError title="No se pudo cargar la medicación" onRetry={onReintentar} compact />
        ) : null}

        <View style={estilos.grupo}>
          <TituloDeGrupo etiqueta="ACTIVAS" conteo={activas.length} destacado />
          {activas.length > 0 ? (
            activas.map((medicacion) => (
              <View key={medicacion.id} style={estilos.filaActiva}>
                <View style={estilos.flexible}>
                  <MedicationItem
                    name={medicacion.nombre_droga}
                    dose={medicacion.dosis}
                    frequency={medicacion.frecuencia}
                    prescriber={detalle(medicacion)}
                    badge={<MarcaDeOrigen registro={medicacion} compacta />}
                  />
                </View>
                <Button
                  variant="secondary"
                  size="sm"
                  iconLeft="square-check"
                  disabled={bloqueado}
                  accessibilityLabel={bloqueado ? motivoBloqueo : undefined}
                  onPress={() => onCerrar(medicacion)}
                >
                  Cerrar tratamiento
                </Button>
              </View>
            ))
          ) : (
            <View
              style={[
                estilos.vacio,
                { borderRadius: px('--radius-md'), borderColor: t['--border-default'] },
              ]}
            >
              <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
                Sin medicación activa. El paciente no tiene ninguna pauta vigente.
              </Text>
            </View>
          )}
        </View>

        <View
          style={[
            estilos.grupo,
            { borderTopWidth: 1, borderTopColor: t['--border-subtle'], paddingTop: 20 },
          ]}
        >
          <TituloDeGrupo etiqueta="HISTÓRICAS" conteo={historicas.length} />
          {historicas.length > 0 ? (
            historicas.map((medicacion) => (
              <MedicationItem
                key={medicacion.id}
                name={medicacion.nombre_droga}
                dose={medicacion.dosis}
                frequency={medicacion.frecuencia}
                until={medicacion.fecha_fin ? fechaCorta(medicacion.fecha_fin) : undefined}
                prescriber={detalle(medicacion)}
                status="finalizado"
                badge={<MarcaDeOrigen registro={medicacion} compacta />}
              />
            ))
          ) : (
            <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
              Todavía no hay tratamientos cerrados.
            </Text>
          )}
        </View>
      </View>
    </Seccion>
  );
}

function TituloDeGrupo({
  etiqueta,
  conteo,
  destacado,
}: {
  etiqueta: string;
  conteo: number;
  destacado?: boolean;
}) {
  const { t, px, texto } = useTheme();
  return (
    <View style={estilos.tituloGrupo}>
      <Text style={[texto('overline'), { color: t['--text-subtle'] }]}>{etiqueta}</Text>
      <View
        style={[
          estilos.conteo,
          {
            borderRadius: px('--radius-pill'),
            backgroundColor: destacado ? t['--color-primary-soft'] : t['--neutral-100'],
          },
        ]}
      >
        <Text
          style={[
            texto('overline'),
            {
              fontWeight: '700',
              color: destacado ? t['--color-primary-strong'] : t['--text-muted'],
            },
          ]}
        >
          {conteo}
        </Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  form: { paddingVertical: 16, paddingHorizontal: 20, gap: 12, borderBottomWidth: 1 },
  formGrilla: { flexWrap: 'wrap', gap: 12 },
  campo: { flex: 1, minWidth: 180 },
  formAcciones: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  grupo: { gap: 10 },
  tituloGrupo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  conteo: { paddingVertical: 1, paddingHorizontal: 7 },
  filaActiva: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  flexible: { flex: 1, minWidth: 240 },
  vacio: { borderWidth: 1, borderStyle: 'dashed', padding: 16 },
});
