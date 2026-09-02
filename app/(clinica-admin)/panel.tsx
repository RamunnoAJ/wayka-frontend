import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useState } from 'react';

import { Button, EntradaDePantalla } from '../../src/components';
import { Ausencias } from '../../src/features/ausencias';
import { BotonCerrarSesion } from '../../src/features/auth';
import { EditorDeHorario, FormularioDeClinica, useClinica } from '../../src/features/clinica';
import { Tablero } from '../../src/features/tablero';
import { FormularioDeContrasena } from '../../src/features/cuenta';
import { useSesion } from '../../src/hooks/useSesion';
import { sombra, useTheme } from '../../src/theme';

/**
 * Panel de clínica (Alcance de Plataformas, 3.2). Es la pantalla entera del rol:
 * no hay una barra con secciones paralelas porque no hay nada más. Un tablero
 * arriba y la gestión abajo.
 *
 * La clínica no se da de alta ni de baja desde acá — eso lo hace el
 * administrador de la plataforma por fuera de la API (proceso 4.10). Y no hay
 * acceso a historial ni medicación: el rol alcanza datos administrativos y
 * conteos, no las mascotas atendidas.
 */
export default function Panel() {
  const { t, px, texto } = useTheme();
  const { sesion } = useSesion();
  const clinicaId = sesion?.usuario.clinica_id ?? undefined;
  const clinica = useClinica(clinicaId);
  const [cambiandoContrasena, setCambiandoContrasena] = useState(false);

  return (
    <EntradaDePantalla style={[estilos.raiz, { backgroundColor: t['--surface-page'] }]}>
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
                Cómo viene la semana, los datos con los que te ven los tutores y el horario con el
                que agenda tu equipo.
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
            <>
              <Tablero clinicaId={clinicaId} />
              <FormularioDeClinica clinicaId={clinicaId} />
              <EditorDeHorario clinicaId={clinicaId} />
              <Ausencias zonaHoraria={clinica.data?.zona_horaria} />
            </>
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

              <View style={estilos.salida}>
                <BotonCerrarSesion />
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </EntradaDePantalla>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  contenido: { width: '100%', alignSelf: 'center', paddingVertical: 32, gap: 24 },
  encabezado: { flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 },
  titulo: { flex: 1, minWidth: 260, gap: 6 },
  cuenta: { borderWidth: 1, gap: 10, maxWidth: 520 },
  botonDeCuenta: { alignSelf: 'flex-start' },
  salida: { alignItems: 'flex-start', marginTop: 4 },
});
