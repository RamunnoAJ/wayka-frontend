import { useEffect, useRef } from 'react';

import { EVENTO_DE_USO } from '../../api/telemetria';
import { emitir } from '../../lib/telemetria';

/**
 * Mide la carga de un evento clínico: cuándo se abrió el formulario, cuánto duró
 * y cómo se cerró. Los dos cierres emiten `duracion_ms`, y son dos eventos
 * distintos porque la mediana de los que se fueron a la mitad no es el tiempo de
 * carga: es el tiempo de abandono.
 *
 * Es el único cronómetro del catálogo y existe porque el tiempo de carga es lo
 * que decide si el veterinario vuelve al papel. El abandono se distingue del
 * guardado por lo que pasó antes de desmontar, no por qué botón se tocó: cerrar
 * la pantalla, tocar atrás o irse a otra ruta son el mismo hecho.
 *
 * `activa` en false lo apaga, y es lo que se usa al **editar** un evento: la
 * métrica mide cargar historial, que es la del norte del piloto (Telemetría de
 * Producto, 5.1). Una corrección no es una carga, y contarla infla el
 * denominador y ensucia la tasa de abandono con ediciones que nadie abandona
 * igual que un formulario en blanco.
 */
export function useCargaDeEventoMedida(activa = true): { guardada: () => void } {
  const abierta = useRef(0);
  const seGuardo = useRef(false);

  useEffect(() => {
    if (!activa) return;
    abierta.current = Date.now();
    emitir(EVENTO_DE_USO.CARGA_EVENTO_ABIERTA);

    return () => {
      if (seGuardo.current) return;
      emitir(EVENTO_DE_USO.CARGA_EVENTO_ABANDONADA, {
        duracion_ms: Date.now() - abierta.current,
      });
    };
  }, [activa]);

  return {
    guardada: () => {
      seGuardo.current = true;
      // Apagada no hay cronómetro que leer: `abierta` sigue en cero y la
      // duración daría el tiempo transcurrido desde 1970. Es el caso de la
      // edición, que no es una carga y no entra en la métrica.
      if (!activa) return;
      emitir(EVENTO_DE_USO.CARGA_EVENTO_GUARDADA, {
        duracion_ms: Date.now() - abierta.current,
      });
    },
  };
}
