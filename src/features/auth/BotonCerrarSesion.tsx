import { Button } from '../../components';

import { useCerrarSesion } from './useCerrarSesion';

/**
 * Salida de la sesión desde la pantalla de cuenta de cada rol.
 *
 * La barra lateral ya tiene la suya, pero solo se dibuja en pantalla ancha: en
 * el teléfono —y en la web abierta en un teléfono— el marco es la barra
 * inferior, que solo lleva secciones. Sin esto no había forma de salir.
 *
 * Es secundario a propósito: la acción primaria de esas pantallas es guardar
 * los datos, y el design system pide una sola primaria por pantalla.
 *
 * No pide confirmación. Cerrar sesión no destruye nada —los datos viven en el
 * backend— y volver a entrar cuesta un login; un diálogo acá sería fricción sin
 * riesgo que la justifique.
 */
export function BotonCerrarSesion({ block }: { block?: boolean }) {
  const cerrarSesion = useCerrarSesion();

  return (
    <Button
      variant="secondary"
      iconLeft="log-out"
      block={block}
      loading={cerrarSesion.isPending}
      onPress={() => cerrarSesion.mutate()}
    >
      Cerrar sesión
    </Button>
  );
}
