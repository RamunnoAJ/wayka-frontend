import { useSyncExternalStore } from 'react';

import type { Sesion } from '../types/sesion';

/**
 * Store de sesión: estado de cliente, NO server state — por eso vive acá y no
 * en TanStack Query (Arq. Frontend, sección 8).
 *
 * El token de acceso se guarda solo en memoria: se pierde al recargar la
 * pestaña web o cerrar la app nativa, y se recupera con el token de refresco
 * al arrancar (Arq. Frontend, sección 6). Ese rescate todavía no existe —
 * depende de la decisión abierta sobre dónde guardar el token de refresco
 * en web (ver `src/lib/refresh.ts`).
 *
 * Implementado con useSyncExternalStore para no sumar una librería de estado
 * antes de saber si hace falta más que esto.
 */

/** `null` = sin sesión. `undefined` = todavía no se intentó restaurar. */
type EstadoSesion = Sesion | null | undefined;

let sesion: EstadoSesion = undefined;
const suscriptores = new Set<() => void>();

function notificar(): void {
  suscriptores.forEach((s) => s());
}

export function obtenerSesion(): EstadoSesion {
  return sesion;
}

export function obtenerTokenAcceso(): string | null {
  return sesion?.tokenAcceso ?? null;
}

export function setSesion(nueva: Sesion): void {
  sesion = nueva;
  notificar();
}

/** Marca la restauración como terminada sin sesión (o cierra la sesión). */
export function limpiarSesion(): void {
  sesion = null;
  notificar();
}

function suscribir(callback: () => void): () => void {
  suscriptores.add(callback);
  return () => suscriptores.delete(callback);
}

export function useSesionStore(): EstadoSesion {
  return useSyncExternalStore(
    suscribir,
    () => sesion,
    () => sesion,
  );
}
