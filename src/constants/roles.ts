/**
 * Tipos de usuario del sistema (Modelo de Datos, entidad Usuario).
 * El frontend los usa solo para decidir navegación; los permisos reales
 * los aplica el backend.
 */
export const TIPO_USUARIO = {
  CLINICA_ADMIN: 'clinica_admin',
  VETERINARIO: 'veterinario',
  TUTOR: 'tutor',
} as const;

export type TipoUsuario = (typeof TIPO_USUARIO)[keyof typeof TIPO_USUARIO];

/** Canal de autenticación declarado al backend (Arquitectura, 4.4). */
export const CANAL = {
  WEB: 'web',
  MOVIL: 'movil',
} as const;

export type Canal = (typeof CANAL)[keyof typeof CANAL];

/**
 * Ruta home de cada rol, usada por el redirect de `/app/index.tsx` y por los
 * guards de grupo. Un rol sin pantalla alcanzable en la plataforma actual
 * se resuelve en `src/lib/guards.ts`, no acá.
 */
export const HOME_POR_ROL: Record<TipoUsuario, string> = {
  [TIPO_USUARIO.CLINICA_ADMIN]: '/(clinica-admin)/panel',
  [TIPO_USUARIO.VETERINARIO]: '/(veterinario)/pacientes',
  [TIPO_USUARIO.TUTOR]: '/(tutor)/mascotas',
};

export const RUTA_LOGIN = '/(auth)/login';
