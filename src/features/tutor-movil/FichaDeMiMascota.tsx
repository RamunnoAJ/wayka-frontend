import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { camposDeAlergia, camposDeVacuna, TIPO_DE_EVENTO } from '../../api/evento-clinico';
import { partirPorVigencia } from '../../api/medicacion';
import { puedeAdministrar, puedeEditar } from '../../api/paciente';
import {
  Avatar,
  Badge,
  Button,
  InlineError,
  Input,
  MedicationItem,
  SkeletonText,
} from '../../components';
import { EntradaDeAccesos } from '../accesos/EntradaDeAccesos';
import { EtiquetaDeNivel } from '../accesos/EtiquetaDeNivel';
import { mensajeDeError } from '../../lib/errores';
import { useSesion } from '../../hooks/useSesion';
import { sombra, useTheme } from '../../theme';
import { capitalizar, edad, fechaCorta, peso } from '../paciente/formato';
import { useGuardarPesoDelTutor } from '../sincronizacion';
import { derivarAdjuntos, useRetirarAdjunto } from '../paciente/queries';
import {
  useAdjuntosDeMiMascota,
  useHistorialDeMiMascota,
  useMedicacionesDeMiMascota,
  useMiMascota,
} from './queries';
import { SeccionAdjuntos } from '../paciente/SeccionAdjuntos';

/**
 * Ficha de mi mascota (Alcance de Plataformas, 5.3 y 5.7).
 *
 * Ningún tutor edita dato clínico, en ningún nivel. Lo que sí se edita son los
 * datos del animal, y depende del vínculo: el dueño y el co-tutor con edición
 * pueden, el de solo lectura mira. El nivel viene en la propia ficha, así que la
 * pantalla no necesita pedirlo aparte.
 */
export function FichaDeMiMascota({
  pacienteId,
  onVerAccesos,
  onCompartir,
}: {
  pacienteId: string;
  onVerAccesos: () => void;
  onCompartir: () => void;
}) {
  const { t, px, texto } = useTheme();
  // Todo sale de la copia local en el dispositivo: es lo que hace que la ficha
  // abra sin conexión, con datos que pueden estar unos minutos atrás y lo dice
  // el indicador de sincronización. La excepción son los adjuntos, que necesitan
  // una URL que solo existe en línea.
  const paciente = useMiMascota(pacienteId);
  const eventos = useHistorialDeMiMascota(pacienteId);
  const medicaciones = useMedicacionesDeMiMascota(pacienteId);
  const adjuntos = useAdjuntosDeMiMascota(pacienteId);
  const guardarPeso = useGuardarPesoDelTutor(paciente.data);
  const retirar = useRetirarAdjunto(pacienteId);
  const { sesion } = useSesion();

  const [editandoPeso, setEditandoPeso] = useState(false);
  const [pesoNuevo, setPesoNuevo] = useState('');

  if (paciente.isPending) {
    return (
      <View style={[estilos.raiz, estilos.cargando, { backgroundColor: t['--surface-page'] }]}>
        <SkeletonText lines={5} />
      </View>
    );
  }
  if (paciente.isError || !paciente.data) {
    return (
      <View style={[estilos.raiz, estilos.cargando, { backgroundColor: t['--surface-page'] }]}>
        <InlineError title="No se pudo abrir la ficha" onRetry={() => paciente.refetch()} />
      </View>
    );
  }

  const mascota = paciente.data;
  const puedeEscribir = puedeEditar(mascota);
  const { generales } = derivarAdjuntos(adjuntos.data?.adjuntos);
  const alergias = (eventos.data ?? []).filter((e) => e.tipo === TIPO_DE_EVENTO.ALERGIA);
  const { activas, historicas } = partirPorVigencia(medicaciones.data ?? []);
  const pesoValido = Number(pesoNuevo.replace(',', '.')) > 0;

  const tarjeta = {
    borderRadius: px('--radius-card'),
    backgroundColor: t['--surface-card'],
    borderColor: t['--border-default'],
    borderWidth: 1,
    padding: px('--gutter-card'),
  };

  return (
    <View style={[estilos.raiz, { backgroundColor: t['--surface-page'] }]}>
      <ScrollView>
        <View style={[estilos.contenido, { paddingHorizontal: px('--gutter-mobile') }]}>
          <View style={[tarjeta, sombra('--shadow-sm'), estilos.identidad]}>
            <Avatar name={mascota.nombre} species={mascota.especie} size="xl" />
            <View style={estilos.flexible}>
              <Text style={[texto('h1'), { color: t['--text-strong'] }]}>{mascota.nombre}</Text>
              <Text style={[texto('body'), { color: t['--text-muted'] }]}>
                {[
                  capitalizar(mascota.raza),
                  capitalizar(mascota.sexo),
                  edad(mascota.fecha_nacimiento),
                ].join(' · ')}
              </Text>
              {/* En una mascota propia decir "es tuya" sería ruido; en una ajena
                  es lo primero que hay que saber. */}
              {mascota.nivel_de_acceso && mascota.nivel_de_acceso !== 'dueno' ? (
                <EtiquetaDeNivel nivel={mascota.nivel_de_acceso} />
              ) : null}
            </View>
          </View>

          <EntradaDeAccesos
            pacienteId={pacienteId}
            administra={puedeAdministrar(mascota)}
            onVerAccesos={onVerAccesos}
            onCompartir={onCompartir}
          />

          <View style={[tarjeta, estilos.bloque]}>
            <Text style={[texto('overline'), { fontWeight: '700', color: t['--text-subtle'] }]}>
              PESO ACTUAL
            </Text>
            {!editandoPeso ? (
              <View style={estilos.pesoFila}>
                <Text style={[texto('h2'), { color: t['--text-strong'] }]}>
                  {peso(mascota.peso_actual)}
                </Text>
                {/* El co-tutor de solo lectura ve el peso y no el botón: ofrecer
                    una acción que el backend va a rechazar es un error que la
                    interfaz puede evitar. */}
                {puedeEscribir ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    iconLeft="pencil"
                    onPress={() => {
                      setPesoNuevo(String(mascota.peso_actual).replace('.', ','));
                      setEditandoPeso(true);
                    }}
                  >
                    Actualizar
                  </Button>
                ) : null}
              </View>
            ) : (
              <View style={estilos.bloque}>
                <Input
                  label="Peso"
                  suffix="kg"
                  hint="Al gramo, con coma."
                  value={pesoNuevo}
                  onChangeText={setPesoNuevo}
                  keyboardType="decimal-pad"
                />
                {guardarPeso.isError ? (
                  <InlineError
                    compact
                    title="No se pudo guardar"
                    description={mensajeDeError(guardarPeso.error)}
                  />
                ) : null}
                <View style={estilos.pesoFila}>
                  <Button
                    size="sm"
                    disabled={!pesoValido}
                    loading={guardarPeso.isPending}
                    onPress={() =>
                      guardarPeso.mutate(Number(pesoNuevo.replace(',', '.')), {
                        onSuccess: () => setEditandoPeso(false),
                      })
                    }
                  >
                    Guardar
                  </Button>
                  <Button variant="ghost" size="sm" onPress={() => setEditandoPeso(false)}>
                    Cancelar
                  </Button>
                </View>
              </View>
            )}
          </View>

          {alergias.length > 0 ? (
            <View
              style={[
                tarjeta,
                {
                  backgroundColor: t['--alert-allergy-surface'],
                  borderColor: t['--alert-allergy-border'],
                },
                estilos.bloque,
              ]}
            >
              <Text
                style={[texto('overline'), { fontWeight: '700', color: t['--alert-allergy-text'] }]}
              >
                ALERGIAS
              </Text>
              {alergias.map((evento) => {
                const campos = camposDeAlergia(evento);
                return (
                  <Text
                    key={evento.id}
                    style={[texto('body-strong'), { color: t['--alert-allergy-text'] }]}
                  >
                    {campos ? `${campos.alergeno} · ${campos.severidad}` : 'Alergia registrada'}
                  </Text>
                );
              })}
            </View>
          ) : null}

          <View style={[tarjeta, estilos.bloque]}>
            <Text style={[texto('overline'), { fontWeight: '700', color: t['--text-subtle'] }]}>
              MEDICACIÓN
            </Text>
            {activas.length === 0 && historicas.length === 0 ? (
              <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
                No tiene medicación registrada.
              </Text>
            ) : (
              <>
                {activas.map((m) => (
                  <MedicationItem
                    key={m.id}
                    name={m.nombre_droga}
                    dose={m.dosis}
                    frequency={m.frecuencia}
                    prescriber={`desde ${fechaCorta(m.fecha_inicio)}`}
                  />
                ))}
                {historicas.map((m) => (
                  <MedicationItem
                    key={m.id}
                    name={m.nombre_droga}
                    dose={m.dosis}
                    frequency={m.frecuencia}
                    until={m.fecha_fin ? fechaCorta(m.fecha_fin) : undefined}
                    status="finalizado"
                  />
                ))}
              </>
            )}
          </View>

          <View style={[tarjeta, estilos.bloque]}>
            <Text style={[texto('overline'), { fontWeight: '700', color: t['--text-subtle'] }]}>
              HISTORIAL
            </Text>
            {eventos.isPending ? (
              <SkeletonText lines={3} />
            ) : eventos.isError ? (
              <InlineError
                compact
                title="No se pudo cargar el historial"
                onRetry={() => eventos.refetch()}
              />
            ) : (eventos.data?.length ?? 0) === 0 ? (
              <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
                Todavía no hay atenciones registradas.
              </Text>
            ) : (
              eventos.data?.map((evento) => (
                <View
                  key={evento.id}
                  style={[estilos.evento, { borderTopColor: t['--border-subtle'] }]}
                >
                  <View style={estilos.eventoTitulo}>
                    <Badge tone="neutral">{capitalizar(evento.tipo)}</Badge>
                    <Text style={[texto('caption'), { color: t['--text-subtle'] }]}>
                      {fechaCorta(evento.fecha)}
                    </Text>
                  </View>
                  <Text style={[texto('body'), { color: t['--text-body'] }]}>
                    {evento.descripcion}
                  </Text>
                  {evento.diagnostico ? (
                    <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
                      {`Diagnóstico: ${evento.diagnostico}`}
                    </Text>
                  ) : null}
                  {camposDeVacuna(evento) ? (
                    <Text style={[texto('caption'), { color: t['--text-subtle'] }]}>
                      {camposDeVacuna(evento)?.nombre_vacuna}
                    </Text>
                  ) : null}
                </View>
              ))
            )}
          </View>

          {/*
            Adjuntos (Alcance de Plataformas, 5.6): el tutor sube la ficha
            histórica en papel o la foto de una herida. Es la misma sección que
            ve el veterinario, con la misma regla — cada uno retira solo lo que
            subió (regla 2.4), y el listado ya distingue al dueño por la cuenta
            autenticada.

            No se le pasa `bloqueado`: los motivos de bloqueo de la ficha del
            veterinario son la matrícula vencida y el paciente dado de baja, y
            ninguno de los dos es una decisión que el tutor pueda ver ni
            resolver. Si el backend rechaza, el error aparece en la fila.
          */}
          <SeccionAdjuntos
            pacienteId={pacienteId}
            nombreDePaciente={mascota.nombre}
            adjuntos={generales}
            usuarioId={sesion?.usuario.id}
            error={adjuntos.isError}
            onReintentar={() => adjuntos.refetch()}
            esMovil
            bloqueado={false}
            motivoBloqueo=""
            soloMetadatos={adjuntos.data?.soloMetadatos ?? false}
            onRetirar={(adjunto) => retirar.mutate(adjunto.id)}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  cargando: { padding: 24, gap: 12 },
  contenido: { paddingVertical: 24, gap: 16 },
  identidad: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  flexible: { flex: 1, minWidth: 120, gap: 4 },
  bloque: { gap: 10 },
  pesoFila: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  evento: { gap: 4, paddingTop: 12, borderTopWidth: 1 },
  eventoTitulo: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
});
