import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { ActualizarVeterinarioEntrada, TipoDocumento } from '../../api/veterinario';
import { Button, InlineError, Input, Select, Skeleton } from '../../components';
import { TIPO_USUARIO } from '../../constants/roles';
import { mensajeDeError } from '../../lib/errores';
import { sombra, useTheme } from '../../theme';
import { AusenciasDelProfesional } from '../ausencias';
import { useMiClinica } from '../clinica';
import { FormularioDeContrasena, useUsuariosDeLaClinica } from '../cuenta';

import { TIPOS_DE_DOCUMENTO } from './FormularioDeVeterinario';
import { useActualizarVeterinario, usePlantel, useReenviarActivacion } from './queries';

/**
 * Edición de una ficha del plantel (Alcance de Plataformas, 3.2).
 *
 * No hay endpoint de ficha individual: el plantel de una clínica está acotado y
 * el listado ya lo trae entero, así que la ficha se resuelve contra la query que
 * ya está en caché en vez de pedir lo mismo de nuevo.
 *
 * El email no se edita acá: vive en la entidad Usuario, no en la ficha.
 *
 * La contraseña **sí**, porque es la única salida que tiene hoy alguien del
 * plantel que olvidó la suya: no existe recuperación sin sesión (Alcance de
 * Plataformas, sección 6), y el contrato deja que un clínica_admin restablezca
 * la de una cuenta de su clínica sin conocerla.
 */
export function FichaDeVeterinario({ veterinarioId }: { veterinarioId: string }) {
  const { t, px, texto } = useTheme();
  const plantel = usePlantel();
  const guardar = useActualizarVeterinario();
  const clinica = useMiClinica();
  const [tocado, setTocado] = useState<ActualizarVeterinarioEntrada>({});
  const [guardado, setGuardado] = useState(false);
  const [restableciendo, setRestableciendo] = useState(false);

  const veterinario = plantel.data?.find((v) => v.id === veterinarioId);

  // `Veterinario` no expone `usuario_id`: la referencia va al revés. Para llegar
  // a la cuenta hay que cruzar los dos listados por `veterinario_id`.
  const cuentas = useUsuariosDeLaClinica(
    { tipo_usuario: TIPO_USUARIO.VETERINARIO },
    Boolean(veterinario),
  );
  const cuenta = cuentas.data?.find((u) => u.veterinario_id === veterinarioId);
  // Sin ningún método de autenticación configurado, nadie estrenó la cuenta: su
  // token de activación sigue sin canjearse (regla 2.1).
  const sinEstrenar = Boolean(cuenta && !cuenta.tiene_contrasena && !cuenta.tiene_google_vinculado);
  const reenvio = useReenviarActivacion();

  if (plantel.isPending) {
    return (
      <View style={[estilos.raiz, estilos.cargando, { backgroundColor: t['--surface-page'] }]}>
        <Skeleton height={26} width="40%" />
        <Skeleton height={56} />
        <Skeleton height={56} />
      </View>
    );
  }

  if (plantel.isError) {
    return (
      <View style={[estilos.raiz, estilos.cargando, { backgroundColor: t['--surface-page'] }]}>
        <InlineError title="No se pudo cargar el plantel" onRetry={() => plantel.refetch()} />
      </View>
    );
  }

  if (!veterinario) {
    return (
      <View style={[estilos.raiz, estilos.cargando, { backgroundColor: t['--surface-page'] }]}>
        <Text style={[texto('h3'), { color: t['--text-strong'] }]}>
          Esta ficha no está en tu plantel
        </Text>
        <Text style={[texto('body'), { color: t['--text-muted'] }]}>
          Puede que se haya dado de baja, o que pertenezca a otra clínica.
        </Text>
      </View>
    );
  }

  const valores: ActualizarVeterinarioEntrada = {
    nombre: veterinario.nombre,
    tipo_documento: veterinario.tipo_documento,
    numero_documento: veterinario.numero_documento,
    matricula: veterinario.matricula ?? '',
    ...tocado,
  };

  function cambiar(campos: ActualizarVeterinarioEntrada) {
    setTocado((previo) => ({ ...previo, ...campos }));
    setGuardado(false);
  }

  return (
    <View style={[estilos.raiz, { backgroundColor: t['--surface-page'] }]}>
      <ScrollView>
        <View
          style={[
            estilos.contenido,
            { maxWidth: px('--content-max'), paddingHorizontal: px('--gutter-page') },
          ]}
        >
          {/*
            La barra lateral tiene "Plantel" y vuelve acá, pero eso hay que
            saberlo: una pantalla a la que se entra desde una fila necesita la
            salida donde se la busca, arriba a la izquierda.
          */}
          <Button
            variant="ghost"
            size="sm"
            iconLeft="arrow-left"
            onPress={() => router.replace('/(clinica-admin)/veterinarios')}
            style={estilos.volver}
          >
            Volver al plantel
          </Button>

          <View style={estilos.titulo}>
            <Text style={[texto('h1'), { color: t['--text-strong'] }]}>{veterinario.nombre}</Text>
            <Text style={[texto('body-lg'), { color: t['--text-muted'] }]}>
              El correo y la contraseña de su cuenta se cambian aparte: son de la cuenta, no de la
              ficha.
            </Text>
          </View>

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
            <Input
              label="Nombre y apellido"
              value={valores.nombre ?? ''}
              onChangeText={(valor) => cambiar({ nombre: valor })}
              autoCapitalize="words"
            />
            <View style={estilos.fila}>
              <View style={estilos.campoChico}>
                <Select
                  label="Tipo de documento"
                  options={TIPOS_DE_DOCUMENTO}
                  value={(valores.tipo_documento ?? 'dni') as TipoDocumento}
                  onChange={(valor) => cambiar({ tipo_documento: valor })}
                />
              </View>
              <View style={estilos.campo}>
                <Input
                  label="Número de documento"
                  value={valores.numero_documento ?? ''}
                  onChangeText={(valor) => cambiar({ numero_documento: valor })}
                  keyboardType="number-pad"
                />
              </View>
            </View>
            {/* Vaciarla es una operación con sentido: deja la ficha en modo
                restringido sin dar de baja a la persona (regla 2.1). */}
            <Input
              label="Matrícula"
              hint="Vacía deja la cuenta sin poder cargar ni editar historial ni medicación."
              value={valores.matricula ?? ''}
              onChangeText={(valor) => cambiar({ matricula: valor })}
              autoCapitalize="characters"
            />
          </View>

          {guardar.isError ? (
            <InlineError
              compact
              title="No se pudo guardar"
              description={mensajeDeError(guardar.error)}
            />
          ) : null}
          {guardado ? (
            <Text style={[texto('body-sm'), { color: t['--text-success'] }]}>
              Cambios guardados.
            </Text>
          ) : null}

          <Button
            size="lg"
            disabled={Object.keys(tocado).length === 0 || !valores.nombre?.trim()}
            loading={guardar.isPending}
            onPress={() =>
              guardar.mutate(
                { id: veterinarioId, cambios: tocado },
                {
                  onSuccess: () => {
                    setTocado({});
                    setGuardado(true);
                  },
                },
              )
            }
          >
            Guardar cambios
          </Button>

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
            <Text style={[texto('h3'), { color: t['--text-strong'] }]}>Acceso</Text>

            {cuentas.isPending ? (
              <Skeleton height={40} />
            ) : cuentas.isError ? (
              <InlineError
                compact
                title="No se pudo cargar la cuenta"
                onRetry={() => cuentas.refetch()}
              />
            ) : !cuenta ? (
              // Pasa con una ficha dada de alta antes de que existiera su cuenta,
              // o con una cuenta desactivada: el listado filtra por rol, no por
              // ficha, así que no encontrarla no es un error de red.
              <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
                Esta ficha no tiene una cuenta activa. Si esta persona debería poder entrar, la
                cuenta se crea desde el alta del plantel.
              </Text>
            ) : sinEstrenar ? (
              // Una cuenta sin ningún método de autenticación es una que nadie
              // estrenó (regla 2.1): su token de activación sigue sin canjearse.
              // Restablecer la contraseña acá no tendría sentido — no hay ninguna
              // que reemplazar, y saltearía el proceso que existe para que la
              // elija su titular.
              <>
                <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>{cuenta.email}</Text>
                <Text style={[texto('caption'), { color: t['--text-subtle'] }]}>
                  Todavía no estrenó su cuenta: le llegó un enlace a ese correo para que elija su
                  contraseña, y no lo usó. Si no le llegó o ya venció, mandáselo de nuevo.
                </Text>
                {reenvio.isError ? (
                  <InlineError
                    compact
                    title="No se pudo reenviar"
                    description={mensajeDeError(reenvio.error)}
                  />
                ) : null}
                <Button
                  variant="secondary"
                  size="sm"
                  style={estilos.botonDeAcceso}
                  loading={reenvio.isPending}
                  disabled={reenvio.isSuccess}
                  onPress={() => reenvio.mutate(veterinarioId)}
                >
                  {reenvio.isSuccess ? 'Enlace reenviado' : 'Reenviar el enlace de activación'}
                </Button>
              </>
            ) : !restableciendo ? (
              <>
                <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>{cuenta.email}</Text>
                <Text style={[texto('caption'), { color: t['--text-subtle'] }]}>
                  Si olvidó su contraseña puede recuperarla por correo. Restablecerla vos es la
                  salida cuando el enlace no le llega o ya no tiene acceso a esa casilla.
                </Text>
                <Button
                  variant="secondary"
                  size="sm"
                  style={estilos.botonDeAcceso}
                  onPress={() => setRestableciendo(true)}
                >
                  Restablecer contraseña
                </Button>
              </>
            ) : (
              <FormularioDeContrasena
                usuarioId={cuenta.id}
                modo="restablecer"
                tieneContrasena={cuenta.tiene_contrasena}
                onListo={() => setRestableciendo(false)}
                onCancelar={() => setRestableciendo(false)}
              />
            )}
          </View>

          {/*
            Las ausencias van en la ficha porque una ausencia es de alguien: la
            pregunta "¿cuándo no está?" se hace mirando a la persona. Quién falta
            hoy lo responde la etiqueta del listado del plantel.
          */}
          <View
            style={[
              estilos.tarjeta,
              sombra('--shadow-sm'),
              {
                padding: px('--gutter-card'),
                borderRadius: px('--radius-card'),
                backgroundColor: t['--surface-card'],
                borderColor: t['--border-default'],
              },
            ]}
          >
            <AusenciasDelProfesional
              veterinarioId={veterinarioId}
              nombre={veterinario.nombre}
              zonaHoraria={clinica.data?.zona_horaria}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  volver: { alignSelf: 'flex-start' },
  raiz: { flex: 1 },
  cargando: { padding: 32, gap: 12 },
  contenido: { width: '100%', alignSelf: 'center', paddingVertical: 32, gap: 20 },
  titulo: { gap: 6, maxWidth: 640 },
  tarjeta: { borderWidth: 1, gap: 14 },
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  campo: { flexGrow: 2, flexBasis: 200, minWidth: 180 },
  campoChico: { flexGrow: 1, flexBasis: 160, minWidth: 150 },
  botonDeAcceso: { alignSelf: 'flex-start' },
});
