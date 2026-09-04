import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { HOME_POR_ROL, RUTA_LOGIN, type TipoUsuario } from '../constants/roles';
import { useSesion } from '../hooks/useSesion';
import { useTheme } from '../theme';

interface GuardDeRolProps {
  /** Roles que pueden alcanzar este grupo de rutas. */
  permitidos: TipoUsuario[];
  /**
   * `false` si el grupo no existe en la plataforma actual (ej. `(tutor)` en web).
   * Rebota igual que un rol equivocado — el bloqueo real lo aplica el backend
   * al emitir el token (bloqueo de canal).
   */
  alcanzableEnPlataforma?: boolean;
  children: ReactNode;
}

/**
 * Guard de navegación, no de seguridad: evita mostrar una pantalla a medias a
 * quien no corresponde. El backend es la única barrera real (Arq. Frontend,
 * secciones 3 y 4).
 */
export function GuardDeRol({
  permitidos,
  alcanzableEnPlataforma = true,
  children,
}: GuardDeRolProps) {
  const { sesion, cargando } = useSesion();
  const { t } = useTheme();

  if (cargando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={t['--color-primary-strong']} />
      </View>
    );
  }

  if (!sesion) return <Redirect href={RUTA_LOGIN} />;

  // Grupo inexistente en esta plataforma: mandar al home del rol sería un loop
  // (el home de ese rol tampoco existe acá), así que se corta la sesión hacia
  // login. En la práctica no debería pasar: el backend no emite un token para
  // un tipo_usuario fuera de su canal.
  if (!alcanzableEnPlataforma) return <Redirect href={RUTA_LOGIN} />;

  const rol = sesion.usuario.tipo_usuario;
  if (!permitidos.includes(rol)) return <Redirect href={HOME_POR_ROL[rol]} />;

  return <>{children}</>;
}
