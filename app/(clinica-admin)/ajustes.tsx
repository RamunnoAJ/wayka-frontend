import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useState } from 'react';

import { EntradaDePantalla, Button } from '../../src/components';
import { EditorDeHorario, FormularioDeClinica } from '../../src/features/clinica';
import { FormularioDeContrasena } from '../../src/features/cuenta';
import { useSesion } from '../../src/hooks/useSesion';
import { sombra, useTheme } from '../../src/theme';

/**
 * Ajustes de la clínica (Alcance de Plataformas, 3.2.4): los datos
 * administrativos, el horario de atención y la cuenta propia.
 *
 * Van juntos porque comparten frecuencia: se configuran una vez y casi no se
 * vuelven a tocar. Lo que se hace todas las semanas —el tablero, la agenda, el
 * plantel— tiene su propia sección.
 *
 * La clínica no se da de alta ni de baja desde acá: eso lo hace el administrador
 * de la plataforma por fuera de la API (proceso 4.10).
 *
 * No hay botón de cerrar sesión: ya vive en la barra lateral, junto al nombre de
 * quien está adentro, que es donde se lo busca.
 */
export default function Ajustes() {
  const { t, px, texto } = useTheme();
  const { sesion } = useSesion();
  const clinicaId = sesion?.usuario.clinica_id ?? undefined;
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
          <View style={estilos.titulo}>
            <Text style={[texto('h1'), { color: t['--text-strong'] }]}>Ajustes</Text>
            <Text style={[texto('body-lg'), { color: t['--text-muted'] }]}>
              Los datos con los que te ven los tutores, el horario con el que agenda tu equipo, y tu
              cuenta.
            </Text>
          </View>

          {clinicaId ? (
            <>
              <FormularioDeClinica clinicaId={clinicaId} />
              <EditorDeHorario clinicaId={clinicaId} />
            </>
          ) : (
            <Text style={[texto('body'), { color: t['--text-muted'] }]}>
              Tu cuenta no tiene una clínica asociada. Escribinos: es un dato que se define al dar
              de alta la clínica y no se puede corregir desde acá.
            </Text>
          )}

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
    </EntradaDePantalla>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  contenido: { width: '100%', alignSelf: 'center', paddingVertical: 32, gap: 24 },
  titulo: { gap: 6 },
  cuenta: { borderWidth: 1, gap: 10, maxWidth: 520 },
  botonDeCuenta: { alignSelf: 'flex-start' },
});
