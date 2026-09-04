import type { TipoUsuario } from '../constants/roles';

/**
 * Cuenta de acceso, tal como la devuelve la API (`Usuario` en
 * `openapi/openapi.yaml`). Nunca trae el hash de la contraseña ni el google_id.
 *
 * Escrito a mano contra el contrato, sin generación (doc 08, sección 7): si el
 * YAML cambia, esto se corrige a mano.
 */
export interface Usuario {
  id: string;
  email: string;
  tipo_usuario: TipoUsuario;
  activo: boolean;
  /** Métodos de autenticación configurados en la cuenta. */
  tiene_contrasena: boolean;
  tiene_google_vinculado: boolean;
  /**
   * Si se probó que la dirección existe y que su titular la lee (regla 4.9.1).
   * **No condiciona ningún permiso**: está para poder ofrecer el reenvío, no
   * para decidir nada a partir de él. Una pantalla que lo use para bloquear algo
   * está inventando una regla que el contrato no tiene.
   */
  email_confirmado: boolean;
  created_at: string;
  updated_at: string;
  /** Presente según el tipo de usuario. */
  tutor_id?: string | null;
  veterinario_id?: string | null;
  clinica_id?: string | null;
  /** Avatar obtenido de Google al vincular la cuenta. */
  avatar_url?: string | null;
  ultimo_acceso?: string | null;
}

/**
 * Sesión en curso. El token de acceso vive solo en memoria; el de refresco lo
 * maneja `src/lib/almacenamiento-refresh.ts`, que no es parte de este tipo.
 *
 * El `canal` no está acá porque la API no lo devuelve: viaja en los claims del
 * JWT y del lado del cliente ya se conoce por la plataforma (`CANAL_ACTUAL`).
 */
export interface Sesion {
  usuario: Usuario;
  tokenAcceso: string;
  /** Vencimiento del token de acceso (`expira_at`), ISO 8601. */
  expiraAt: string;
}
