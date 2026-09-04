import { useSegments } from 'expo-router';
import * as Network from 'expo-network';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { EVENTO_DE_USO } from '../api/telemetria';
import { escucharAperturaDesdeAviso } from '../features/notificaciones';
import { despachar, emitir } from '../lib/telemetria';

/**
 * Cuándo sube la telemetría acumulada.
 *
 * Los mismos tres momentos que la sincronización, y por el mismo motivo: son
 * cuando puede haber red. Más el paso al fondo, que es el que importa acá y no
 * allá — la app suspendida puede no volver, y lo que quedó sin subir se pierde.
 *
 * No hay temporizador. Una corrida que falla por falta de red la vuelve a
 * disparar el listener de conexión, y una que falla por otra cosa volvería a
 * fallar igual (Telemetría de Producto, 7).
 */
export function useTelemetriaAutomatica(habilitada: boolean): void {
  useEffect(() => {
    if (!habilitada) return;

    void despachar();
    const dejarDeEscucharAvisos = escucharAperturaDesdeAviso();
    const red = Network.addNetworkStateListener((estado) => {
      if (estado.isInternetReachable) void despachar();
    });
    const app = AppState.addEventListener('change', (estado) => {
      if (estado !== 'active') void despachar();
    });
    return () => {
      dejarDeEscucharAvisos();
      red.remove();
      app.remove();
      // Al desmontar —cerrar sesión, recargar la web— se intenta una última vez.
      void despachar();
    };
  }, [habilitada]);
}

/**
 * Qué pantalla se abrió. Sale de la ruta y no de cada pantalla: una emisión por
 * componente se olvida en la siguiente que alguien agregue, y lo que se mide es
 * qué partes del producto se usan y cuáles no abrió nadie.
 *
 * La ruta viaja tal cual, sin los ids que la completan: `/pacientes/{id}` diría
 * qué mascota se miró, y eso es exactamente lo que la telemetría no guarda.
 */
export function usePantallaVista(): void {
  const anterior = useRef<string | null>(null);
  const segmentos = useSegments();

  useEffect(() => {
    const pantalla = pantallaDeSegmentos(segmentos);
    if (!pantalla || pantalla === anterior.current) return;
    anterior.current = pantalla;
    emitir(EVENTO_DE_USO.PANTALLA_VISTA, { pantalla });
  }, [segmentos]);
}

/**
 * La pantalla, derivada de los **segmentos declarados** de expo-router y no de
 * la ruta con valores. `pantalla` es el enum de pantallas que el catálogo
 * declara (Telemetría de Producto, 5.2), no el lugar donde termina guardado un
 * dato.
 *
 * Los segmentos son nombres de archivo —`mascotas`, `[id]`—, así que por
 * construcción no pueden traer un valor. Enmascarar por la forma del *valor*
 * fallaba en silencio: el token de invitación son 32 bytes en base64url, no se
 * parece a un UUID, y viajaba entero a una tabla con 13 meses de retención
 * siendo una credencial canjeable.
 *
 * Cruzarlos contra la ruta tampoco sirve: `usePathname` y `useSegments` se
 * actualizan en momentos distintos durante una navegación, y con los dos
 * desfasados salían pantallas enmascaradas de más (`/:valor/:valor`), medido
 * en el emulador.
 */
export function pantallaDeSegmentos(segmentos: readonly string[]): string {
  const tramos = segmentos
    // Los grupos —`(tutor)`— ordenan el árbol de archivos y no son pantallas.
    .filter((segmento) => !segmento.startsWith('('))
    .map((segmento) =>
      segmento.startsWith('[')
        ? `:${segmento.replace(/^\[\.{0,3}/, '').replace(/\]$/, '')}`
        : segmento,
    );

  return `/${tramos.join('/')}`;
}
