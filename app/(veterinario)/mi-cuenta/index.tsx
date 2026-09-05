import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  Button,
  Icon,
  InlineError,
  Presionable,
  SkeletonText,
  EntradaDePantalla,
} from '../../../src/components';
import { BotonCerrarSesion } from '../../../src/features/auth';
import { FormularioDeContrasena } from '../../../src/features/cuenta';
import { useMiFichaDeVeterinario } from '../../../src/features/paciente/queries';
import { useSesion } from '../../../src/hooks/useSesion';
import { sombra, useTheme } from '../../../src/theme';

/**
 * Mi cuenta (rol veterinario).
 *
 * El tutor edita su ficha en "Mis datos" y el clínica_admin la suya en el panel;
 * el veterinario no tenía ningún lugar donde vivieran sus propios datos, y por
 * eso el cambio de contraseña no tenía dónde ir.
 *
 * **Es de solo lectura salvo la contraseña.** El nombre y la matrícula los carga
 * el clínica_admin al dar de alta la cuenta (proceso 4.12) y no son editables
 * por el propio veterinario: la matrícula decide si puede escribir historial
 * (regla 2.1), así que cambiársela a sí mismo sería cambiarse los permisos.
 */
export default function MiCuenta() {
  const { t, px, texto } = useTheme();
  const { sesion } = useSesion();
  const ficha = useMiFichaDeVeterinario();

  const [cambiando, setCambiando] = useState(false);

  const usuario = sesion?.usuario;

  const tarjeta = {
    padding: px('--gutter-card'),
    borderRadius: px('--radius-card'),
    backgroundColor: t['--surface-card'],
    borderColor: t['--border-default'],
    borderWidth: 1,
  };

  return (
    <EntradaDePantalla style={[estilos.raiz, { backgroundColor: t['--surface-page'] }]}>
      <ScrollView>
        <View
          style={[estilos.contenido, { maxWidth: 640, paddingHorizontal: px('--gutter-page') }]}
        >
          <View style={estilos.titulo}>
            <Text style={[texto('h1'), { color: t['--text-strong'] }]}>Mi cuenta</Text>
            <Text style={[texto('body-lg'), { color: t['--text-muted'] }]}>
              Tus datos y la contraseña con la que entrás.
            </Text>
          </View>

          <View style={[tarjeta, sombra('--shadow-sm'), estilos.bloque]}>
            {ficha.isPending ? (
              <SkeletonText lines={3} />
            ) : ficha.isError ? (
              <InlineError
                compact
                title="No se pudieron cargar tus datos"
                onRetry={() => ficha.refetch()}
              />
            ) : (
              <>
                <Dato etiqueta="NOMBRE" valor={ficha.data?.nombre} />
                <Dato
                  etiqueta="MATRÍCULA"
                  valor={ficha.data?.matricula ?? 'Sin matrícula cargada'}
                  nota={
                    ficha.data?.matricula
                      ? undefined
                      : 'Sin matrícula no podés cargar historial ni medicación. La carga tu clínica.'
                  }
                />
                <Dato etiqueta="CORREO" valor={usuario?.email} />
              </>
            )}
          </View>

          <View style={[tarjeta, sombra('--shadow-sm'), estilos.bloque]}>
            <Text style={[texto('h3'), { color: t['--text-strong'] }]}>Contraseña</Text>

            {!cambiando ? (
              <View style={estilos.fila}>
                <Text style={[texto('body'), { color: t['--text-muted'] }]}>
                  {usuario?.tiene_contrasena
                    ? 'Definida. Cambiala cuando quieras.'
                    : 'Todavía no tenés una: entrás con Google.'}
                </Text>
                <Button variant="secondary" size="sm" onPress={() => setCambiando(true)}>
                  {usuario?.tiene_contrasena ? 'Cambiar' : 'Definir una'}
                </Button>
              </View>
            ) : usuario ? (
              <FormularioDeContrasena
                usuarioId={usuario.id}
                tieneContrasena={usuario.tiene_contrasena}
                onListo={() => setCambiando(false)}
                onCancelar={() => setCambiando(false)}
              />
            ) : null}
          </View>

          {/*
            El tablero cuelga de acá y no del menú (Alcance de Plataformas, 3.8):
            el menú tiene paridad entre web y móvil, así que un ítem más son seis
            pestañas en la barra del teléfono, que es donde el veterinario carga.
          */}
          <Presionable
            onPress={() => router.push('/mi-cuenta/propuestas')}
            fondo={t['--surface-card']}
            borde={t['--border-default']}
            accessibilityLabel="Propuestas"
            style={[tarjeta, sombra('--shadow-sm'), estilos.entrada]}
          >
            <Icon name="lightbulb" size={20} color={t['--text-muted']} />
            <View style={estilos.flexible}>
              <Text style={[texto('body-strong'), { color: t['--text-strong'] }]}>Propuestas</Text>
              <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
                Lo que pide el resto de los profesionales, y qué está pasando con eso.
              </Text>
            </View>
            <Icon name="chevron-right" size={18} color={t['--text-subtle']} />
          </Presionable>

          <View style={estilos.salida}>
            <BotonCerrarSesion />
          </View>
        </View>
      </ScrollView>
    </EntradaDePantalla>
  );
}

function Dato({ etiqueta, valor, nota }: { etiqueta: string; valor?: string; nota?: string }) {
  const { t, texto } = useTheme();
  return (
    <View style={estilos.dato}>
      <Text style={[texto('overline'), { fontWeight: '700', color: t['--text-subtle'] }]}>
        {etiqueta}
      </Text>
      <Text style={[texto('body-strong'), { color: t['--text-strong'] }]}>{valor ?? '—'}</Text>
      {nota ? <Text style={[texto('caption'), { color: t['--text-warning'] }]}>{nota}</Text> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  contenido: { width: '100%', alignSelf: 'center', paddingVertical: 32, gap: 16 },
  titulo: { gap: 6 },
  bloque: { gap: 14 },
  dato: { gap: 2 },
  entrada: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flexible: { flex: 1, gap: 2 },
  fila: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  salida: { alignItems: 'flex-start', marginTop: 8 },
});
