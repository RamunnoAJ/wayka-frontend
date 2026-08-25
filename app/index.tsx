import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { HOME_POR_ROL, RUTA_LOGIN } from '../src/constants/roles';
import { useSesion } from '../src/hooks/useSesion';

/** Punto de entrada: manda al home del rol autenticado, o a login. */
export default function Indice() {
  const { sesion, cargando } = useSesion();

  if (cargando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!sesion) return <Redirect href={RUTA_LOGIN} />;
  return <Redirect href={HOME_POR_ROL[sesion.usuario.tipo_usuario]} />;
}
