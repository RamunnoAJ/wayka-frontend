import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { camposDeAlergia, camposDeVacuna, type EventoClinico } from '../../api/evento-clinico';
import {
  AllergyChip,
  Icon,
  MedicationItem,
  Presionable,
  SkeletonText,
  StatusDot,
} from '../../components';
import { ESCALA_DE_PRESION, sombra, useTheme } from '../../theme';

import { fechaConPrecision, fechaCorta } from './formato';
import { MarcaDeOrigen } from './MarcaDeOrigen';
import type { DatosCriticos } from './queries';

/**
 * Zona 2: los datos que un veterinario ajeno necesita leer en segundos durante
 * una urgencia — alergias vigentes, medicación activa y vacunas (Modelo de
 * Datos, 4.5).
 *
 * **Nunca desaparece cuando está vacía**: dice "sin alergias registradas". La
 * ausencia de dato es información clínica, y un hueco no se distingue de un
 * dato que no llegó a cargarse.
 *
 * Variante elegida: colapsable. Se abre sola y no se puede cerrar mientras haya
 * una alergia severa — el ahorro de alto vertical no vale ese riesgo.
 */
const MAX_MEDS_EN_BANDA = 3;

interface BandaProps {
  datos: DatosCriticos;
  esMovil: boolean;
  /** Las consultas que alimentan la banda todavía no resolvieron. */
  cargando: boolean;
  /** Alguna de esas consultas falló: no se sabe si hay datos o no los hay. */
  error: boolean;
  onVerMedicacion: () => void;
}

export function BandaDeUrgencia({ datos, esMovil, cargando, error, onVerMedicacion }: BandaProps) {
  const { t, px, texto } = useTheme();
  const [abiertaManual, setAbiertaManual] = useState<boolean | null>(null);

  const abierta = abiertaManual ?? datos.haySevera;
  // Sin los datos no se afirma nada: un "sin alergias registradas" sobre un
  // paciente cuyas consultas fallaron es un falso negativo clínico, y esta banda
  // se lee en segundos durante una urgencia.
  const sinDatos = cargando || error;
  const resumen = error
    ? 'No se pudieron leer los datos críticos'
    : cargando
      ? 'Leyendo los datos críticos…'
      : resumir(datos);
  const colorDelResumen = error ? t['--text-danger'] : t['--text-muted'];
  const enMedsBanda = datos.activas.slice(0, MAX_MEDS_EN_BANDA);
  const ocultas = datos.activas.length - enMedsBanda.length;

  return (
    <View
      style={[
        estilos.banda,
        sombra('--shadow-sm'),
        {
          borderRadius: px('--radius-card'),
          backgroundColor: t['--surface-card'],
          borderColor: t['--border-strong'],
        },
      ]}
    >
      <View style={[estilos.encabezado, { borderBottomColor: t['--border-subtle'] }]}>
        <Icon name="shield-alert" size={18} color={t['--danger-500']} />
        <Text style={[texto('overline'), { fontWeight: '700', color: t['--text-strong'] }]}>
          DATOS CRÍTICOS
        </Text>
        <Text style={[texto('body-sm'), estilos.resumen, { color: colorDelResumen }]}>
          {resumen}
        </Text>
        <Presionable
          accessibilityState={{ expanded: abierta }}
          onPress={() => setAbiertaManual(!abierta)}
          escala={ESCALA_DE_PRESION}
          fondo={t['--surface-card']}
          fondoDestacado={t['--surface-hover']}
          borde={t['--border-default']}
          style={[estilos.toggle, { borderRadius: px('--radius-control') }]}
        >
          <Text style={[texto('caption'), { fontWeight: '600', color: t['--text-brand'] }]}>
            {abierta ? 'Ocultar detalle' : 'Ver detalle'}
          </Text>
        </Presionable>
      </View>

      {abierta ? (
        <View
          style={[
            estilos.grilla,
            { backgroundColor: t['--border-subtle'], flexDirection: esMovil ? 'column' : 'row' },
          ]}
        >
          <Columna fondo={t['--alert-allergy-surface']}>
            <TituloDeColumna
              texto="ALERGIAS"
              color={t['--alert-allergy-text']}
              conteo={sinDatos ? undefined : datos.alergias.length}
              colorConteo={t['--danger-600']}
              fondoConteo={t['--danger-100']}
            />
            {sinDatos ? (
              <SinLeer error={error} />
            ) : datos.alergias.length > 0 ? (
              datos.alergias.map((alergia) => <FilaDeAlergia key={alergia.id} evento={alergia} />)
            ) : (
              <SinDato icono="check" texto="Sin alergias registradas" />
            )}
          </Columna>

          <Columna fondo={t['--surface-card']}>
            <TituloDeColumna
              texto="MEDICACIÓN ACTIVA"
              color={t['--text-subtle']}
              conteo={sinDatos ? undefined : datos.activas.length}
              colorConteo={t['--color-primary-strong']}
              fondoConteo={t['--color-primary-soft']}
            />
            {sinDatos ? (
              <SinLeer error={error} />
            ) : enMedsBanda.length > 0 ? (
              <View style={estilos.lista}>
                {enMedsBanda.map((medicacion) => (
                  <MedicationItem
                    key={medicacion.id}
                    name={medicacion.nombre_droga}
                    dose={medicacion.dosis}
                    frequency={medicacion.frecuencia}
                    prescriber={`desde ${fechaConPrecision(
                      medicacion.fecha_inicio,
                      medicacion.fecha_precision,
                    )}`}
                    badge={<MarcaDeOrigen registro={medicacion} compacta />}
                  />
                ))}
                {ocultas > 0 ? (
                  <Text
                    accessibilityRole="link"
                    onPress={onVerMedicacion}
                    style={[texto('caption'), { fontWeight: '600', color: t['--text-link'] }]}
                  >
                    +{ocultas} más
                  </Text>
                ) : null}
              </View>
            ) : (
              <SinDato icono="check" texto="Sin medicación activa" />
            )}
          </Columna>

          <Columna fondo={t['--surface-card']}>
            <TituloDeColumna texto="VACUNAS" color={t['--text-subtle']} />
            {sinDatos ? (
              <SinLeer error={error} />
            ) : datos.ultimaVacuna ? (
              <View style={estilos.lista}>
                <View style={estilos.bloque}>
                  <Text style={[texto('caption'), { color: t['--text-subtle'] }]}>
                    Última aplicada
                  </Text>
                  <Text style={[texto('body-strong'), { color: t['--text-strong'] }]}>
                    {camposDeVacuna(datos.ultimaVacuna)?.nombre_vacuna ?? 'Vacuna'}
                  </Text>
                  <Text style={[texto('caption'), { color: t['--text-muted'] }]}>
                    {detalleDeVacuna(datos.ultimaVacuna)}
                  </Text>
                </View>
                {datos.proximaDosis ? (
                  <View
                    style={[
                      estilos.bloque,
                      { borderTopWidth: 1, borderTopColor: t['--border-subtle'], paddingTop: 8 },
                    ]}
                  >
                    <Text style={[texto('caption'), { color: t['--text-subtle'] }]}>
                      Próxima dosis
                    </Text>
                    <StatusDot status="pendiente" label={fechaCorta(datos.proximaDosis)} />
                  </View>
                ) : null}
              </View>
            ) : (
              <SinDato icono="syringe" texto="Sin vacunas registradas" />
            )}
          </Columna>
        </View>
      ) : null}
    </View>
  );
}

function FilaDeAlergia({ evento }: { evento: EventoClinico }) {
  const { t, texto } = useTheme();
  const campos = camposDeAlergia(evento);
  if (!campos) return null;

  // El design system distingue dos severidades; el contrato tiene tres.
  const severa = campos.severidad === 'severa';
  const detalle = [
    campos.reaccion,
    `detectada ${fechaConPrecision(evento.fecha, evento.fecha_precision)}`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={estilos.bloque}>
      <View style={estilos.alergiaFila}>
        <AllergyChip label={campos.alergeno} severity={severa ? 'alta' : 'baja'} />
        <Text
          style={[
            texto('overline'),
            {
              fontWeight: severa ? '700' : '500',
              color: severa ? t['--danger-600'] : t['--text-subtle'],
            },
          ]}
        >
          {/* Sin severidad es una alergia que declaró el tutor: graduarla es un
              juicio clínico y el dueño no tiene por qué emitirlo. Se dice que
              falta, no se la muestra como si fuera leve. */}
          {campos.severidad ? campos.severidad.toUpperCase() : 'SEVERIDAD SIN GRADUAR'}
        </Text>
      </View>
      <Text style={[texto('caption'), { color: t['--text-muted'] }]}>{detalle}</Text>
      <MarcaDeOrigen registro={evento} compacta />
    </View>
  );
}

function Columna({ fondo, children }: { fondo: string; children: ReactNode }) {
  return <View style={[estilos.columna, { backgroundColor: fondo }]}>{children}</View>;
}

function TituloDeColumna({
  texto: etiqueta,
  color,
  conteo,
  colorConteo,
  fondoConteo,
}: {
  texto: string;
  color: string;
  conteo?: number;
  colorConteo?: string;
  fondoConteo?: string;
}) {
  const { px, texto } = useTheme();
  return (
    <View style={estilos.tituloColumna}>
      <Text style={[texto('overline'), { fontWeight: '700', color }]}>{etiqueta}</Text>
      {conteo != null ? (
        <View
          style={[
            estilos.conteo,
            { borderRadius: px('--radius-pill'), backgroundColor: fondoConteo },
          ]}
        >
          <Text style={[texto('overline'), { fontWeight: '700', color: colorConteo }]}>
            {conteo}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/**
 * La columna cuando el dato no llegó. No dice "no hay": dice que no se sabe, que
 * es lo único cierto — y con el error a la vista, porque en una urgencia la
 * diferencia entre "no tiene alergias" y "no pudimos leerlas" es la decisión.
 */
function SinLeer({ error }: { error: boolean }) {
  const { t, texto } = useTheme();
  if (!error) return <SkeletonText lines={2} />;
  return (
    <View style={estilos.sinDato}>
      <Icon name="alert-triangle" size={16} color={t['--text-danger']} />
      <Text style={[texto('body-sm'), { color: t['--text-danger'] }]}>No se pudo leer</Text>
    </View>
  );
}

function SinDato({ icono, texto: etiqueta }: { icono: 'check' | 'syringe'; texto: string }) {
  const { t, texto } = useTheme();
  return (
    <View style={estilos.sinDato}>
      <Icon name={icono} size={16} color={t['--text-muted']} />
      <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>{etiqueta}</Text>
    </View>
  );
}

function detalleDeVacuna(evento: EventoClinico): string {
  const campos = camposDeVacuna(evento);
  return [fechaCorta(evento.fecha), campos?.lote && `lote ${campos.lote}`]
    .filter(Boolean)
    .join(' · ');
}

/** Una línea con lo que hay: es lo único visible cuando la banda está cerrada. */
function resumir(datos: DatosCriticos): string {
  const partes: string[] = [];

  const severas = datos.alergias.filter((a) => camposDeAlergia(a)?.severidad === 'severa').length;
  if (severas > 0) partes.push(`${severas} alergia${severas > 1 ? 's severas' : ' severa'}`);
  else if (datos.alergias.length > 0) {
    partes.push(
      `${datos.alergias.length} alergia${datos.alergias.length > 1 ? 's no severas' : ' no severa'}`,
    );
  } else partes.push('sin alergias registradas');

  const activas = datos.activas.length;
  partes.push(
    activas > 0
      ? `${activas} medicaci${activas > 1 ? 'ones activas' : 'ón activa'}`
      : 'sin medicación activa',
  );

  partes.push(datos.ultimaVacuna ? 'con vacunas registradas' : 'sin vacunas registradas');
  return partes.join(' · ');
}

const estilos = StyleSheet.create({
  banda: { borderWidth: 1, overflow: 'hidden' },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  resumen: { flex: 1, minWidth: 160 },
  toggle: { borderWidth: 1, paddingVertical: 6, paddingHorizontal: 12 },
  grilla: { gap: 1 },
  columna: { flex: 1, gap: 10, paddingVertical: 16, paddingHorizontal: 20 },
  tituloColumna: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  conteo: { paddingVertical: 1, paddingHorizontal: 7 },
  lista: { gap: 8 },
  bloque: { gap: 3 },
  alergiaFila: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  sinDato: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
