import type { Adjunto } from '../../api/adjunto';
import { VisorDeArchivo, type RectanguloEnPantalla } from '../../components';

import { tamanoDeArchivo } from './formato';
import { useAdjunto } from './queries';

/**
 * El visor de `components/VisorDeArchivo` con la URL recién firmada.
 *
 * **Se monta con el adjunto elegido y se desmonta al cerrar**, y de ahí que sea
 * un componente y no un hook en la pantalla: `useAdjunto` pide una URL nueva al
 * montarse, y tenerlo arriba dejaría una consulta viva por cada tarjeta que
 * nadie está mirando.
 *
 * La URL que trajo el listado **no se usa como respaldo** mientras la fresca
 * viaja: vence en minutos (regla 4.14.4) y mostrar medio segundo de "el enlace
 * venció" para después arreglarse solo es peor que medio segundo de spinner.
 */
interface VisorDeAdjuntoProps {
  adjunto: Adjunto;
  /** Miniatura desde la que se abrió, para que el visor salga de ahí. */
  origen?: RectanguloEnPantalla;
  onCerrar: () => void;
}

export function VisorDeAdjunto({ adjunto, origen, onCerrar }: VisorDeAdjuntoProps) {
  const fresco = useAdjunto(adjunto.id);

  return (
    <VisorDeArchivo
      nombre={adjunto.nombre_archivo}
      contentType={fresco.data?.content_type ?? adjunto.content_type}
      tamano={tamanoDeArchivo(adjunto.tamano_bytes)}
      url={fresco.data?.archivo_url}
      origen={origen}
      cargando={fresco.isPending}
      error={fresco.isError}
      onReintentar={() => fresco.refetch()}
      onCerrar={onCerrar}
    />
  );
}
