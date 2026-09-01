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
export function usePantallaVista(ruta: string): void {
  const anterior = useRef<string | null>(null);

  useEffect(() => {
    const pantalla = sinIdentificadores(ruta);
    if (!pantalla || pantalla === anterior.current) return;
    anterior.current = pantalla;
    emitir(EVENTO_DE_USO.PANTALLA_VISTA, { pantalla });
  }, [ruta]);
}

const PARECE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function sinIdentificadores(ruta: string): string {
  return ruta
    .split('/')
    .map((tramo) => (PARECE_UUID.test(tramo) ? ':id' : tramo))
    .join('/');
}
