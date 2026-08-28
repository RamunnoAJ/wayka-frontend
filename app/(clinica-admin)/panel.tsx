import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useState } from 'react';

import { Button } from '../../src/components';
import { FormularioDeClinica } from '../../src/features/clinica';
import { FormularioDeContrasena } from '../../src/features/cuenta';
import { useSesion } from '../../src/hooks/useSesion';
import { sombra, useTheme } from '../../src/theme';

/**
 * Panel de clínica (Alcance de Plataformas, 3.2): datos administrativos y
 * horario de atención, más el acceso al plantel.
 *
 * La clínica no se da de alta ni de baja desde acá — eso lo hace el
 * administrador de la plataforma por fuera de la API (proceso 4.10). Y no hay
 * acceso a historial ni medicación: el rol alcanza datos administrativos, no las
 * mascotas atendidas.
 */
export default function Panel() {
  const { t, px, texto } = useTheme();
  const { sesion } = useSesion();
  const clinicaId = sesion?.usuario.clinica_id ?? undefined;
  const [cambiandoContrasena, setCambiandoContrasena] = useState(false);

  return (
    <View style={[estilos.raiz, { backgroundColor: t['--surface-page'] }]}>
      <ScrollView>
        <View
          style={[
            estilos.contenido,
            { maxWidth: px('--content-max'), paddingHorizontal: px('--gutter-page') },
          ]}
        >
          <View style={estilos.encabezado}>
            <View style={estilos.titulo}>
              <Text style={[texto('h1'), { color: t['--text-strong'] }]}>Panel de clínica</Text>
              <Text style={[texto('body-lg'), { color: t['--text-muted'] }]}>
                Los datos con los que te ven los tutores y el horario con el que agenda tu equipo.
              </Text>
            </View>
            <Button
              variant="secondary"
              iconLeft="user-round"
              onPress={() => router.push('/(clinica-admin)/veterinarios')}
            >
              Ver el plantel
            </Button>
          </View>

          {clinicaId ? (
            <FormularioDeClinica clinicaId={clinicaId} />
          ) : (
            <Text style={[texto('body'), { color: t['--text-muted'] }]}>
              Tu cuenta no tiene una clínica asociada. Escribinos: es un dato que se define al dar
              de alta la clínica y no se puede corregir desde acá.
            </Text>
          )}

          {/*
            La cuenta propia va abajo de los datos de la clínica: es lo que menos
            se toca de esta pantalla. El clínica_admin además puede restablecer
            la contraseña de una cuenta de su clínica (contrato,
            `cambiarContrasena`), pero eso vive en el plantel y no acá.
          */}
          {sesion?.usuario ? (
            <View
              style={[
                estilos.cuenta,
                sombra('--shadow-sm'),
                {
                  padding: px('--gutter-card'),
                  borderRadius: px('--radius-card'),
                  backgroundColor: t['--surface-card'],
                  borderColor: t['--border-default'],
                },
              ]}
            >
              <Text style={[texto('h3'), { color: t['--text-strong'] }]}>Tu cuenta</Text>
              <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
                {sesion.usuario.email}
              </Text>

              {!cambiandoContrasena ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={() => setCambiandoContrasena(true)}
                  style={estilos.botonDeCuenta}
                >
                  {sesion.usuario.tiene_contrasena ? 'Cambiar contraseña' : 'Definir contraseña'}
                </Button>
              ) : (
                <FormularioDeContrasena
                  usuarioId={sesion.usuario.id}
                  tieneContrasena={sesion.usuario.tiene_contrasena}
                  onListo={() => setCambiandoContrasena(false)}
                  onCancelar={() => setCambiandoContrasena(false)}
                />
              )}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  contenido: { width: '100%', alignSelf: 'center', paddingVertical: 32, gap: 24 },
  encabezado: { flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 },
  titulo: { flex: 1, minWidth: 260, gap: 6 },
  cuenta: { borderWidth: 1, gap: 10, maxWidth: 520 },
  botonDeCuenta: { alignSelf: 'flex-start' },
});
