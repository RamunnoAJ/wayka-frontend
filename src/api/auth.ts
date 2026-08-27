import type { Canal } from '../constants/roles';
import { http } from '../lib/http';
import { CANAL_ACTUAL } from '../lib/plataforma';
import type { Sesion, Usuario } from '../types/sesion';

/**
 * Autenticación y alta pública. Tipado a mano contra `openapi/openapi.yaml` del
 * backend, sin generación de código (doc 08, sección 7).
 *
 * El contrato está en español: los campos son `contrasena`, `token_de_acceso`,
 * `token_de_refresco`. Las rutas son relativas al prefijo `/api/v1`, que aplica
 * el cliente HTTP.
 */
const RUTAS = {
  login: '/auth/login',
  loginGoogle: '/auth/login/google',
  refresh: '/auth/refresh',
  logout: '/auth/logout',
  registroTutor: '/registro/tutor',
  activacion: '/activacion',
} as const;

/** `Sesion` del contrato: par de tokens + la cuenta. */
interface RespuestaSesion {
  token_de_acceso: string;
  expira_at: string;
  token_de_refresco: string;
  usuario: Usuario;
}

export interface EntradaLogin {
  email: string;
  contrasena: string;
}

export interface EntradaRegistroTutor {
  nombre: string;
  email: string;
  contrasena: string;
  /** Ley 25.326: debe ser `true` o el backend rechaza el alta (regla 4.9). */
  consentimiento_datos: boolean;
}

export interface ResultadoAutenticacion {
  sesion: Sesion;
  tokenRefresco: string;
}

function aResultado(respuesta: RespuestaSesion): ResultadoAutenticacion {
  return {
    sesion: {
      usuario: respuesta.usuario,
      tokenAcceso: respuesta.token_de_acceso,
      expiraAt: respuesta.expira_at,
    },
    tokenRefresco: respuesta.token_de_refresco,
  };
}

/**
 * El `canal` lo fija la plataforma, no el usuario. Es donde el backend aplica
 * el bloqueo de canal: si no corresponde al tipo de usuario responde 403
 * (`permiso_denegado`) **aunque las credenciales sean correctas**.
 */
export async function login(entrada: EntradaLogin): Promise<ResultadoAutenticacion> {
  const respuesta = await http.post<RespuestaSesion>(RUTAS.login, {
    body: { ...entrada, canal: CANAL_ACTUAL satisfies Canal },
    publico: true,
  });
  return aResultado(respuesta);
}

/**
 * Alternativa a la contraseña, sujeta al mismo bloqueo de canal. No crea
 * cuentas: si el email existe sin Google vinculado, lo vincula en este paso.
 *
 * Todavía sin pantalla: falta el `GOOGLE_CLIENT_ID` del backend y el client id
 * del lado del cliente para obtener el `google_id_token`. La función está para
 * que conectarla sea solo la UI.
 */
export async function loginConGoogle(googleIdToken: string): Promise<ResultadoAutenticacion> {
  const respuesta = await http.post<RespuestaSesion>(RUTAS.loginGoogle, {
    body: { google_id_token: googleIdToken, canal: CANAL_ACTUAL satisfies Canal },
    publico: true,
  });
  return aResultado(respuesta);
}

/**
 * Alta pública de tutor: la única del sistema sin autenticación previa.
 *
 * **Devuelve la cuenta creada, no una sesión** (201 `Usuario`): el alta no
 * autentica. Para dejar al tutor adentro hay que iniciar sesión después — lo
 * encadena `src/features/auth/useAutenticar.ts`.
 */
export async function registrarTutor(entrada: EntradaRegistroTutor): Promise<Usuario> {
  return http.post<Usuario>(RUTAS.registroTutor, { body: entrada, publico: true });
}

/**
 * Canjea el token de refresco por uno nuevo. Es de **un solo uso**: la
 * respuesta trae un token rotado que hay que guardar, o el canje siguiente
 * falla. El canal no se declara, se hereda de la sesión.
 */
export async function refrescar(tokenRefresco: string): Promise<ResultadoAutenticacion> {
  const respuesta = await http.post<RespuestaSesion>(RUTAS.refresh, {
    body: { token_de_refresco: tokenRefresco },
    publico: true,
  });
  return aResultado(respuesta);
}

/**
 * Revoca el token de refresco y toda su cadena de renovaciones. El token de
 * acceso vigente sigue valiendo hasta expirar: es la ventana de revocación
 * asumida por el esquema, no un olvido del cliente.
 */
export async function cerrarSesion(tokenRefresco: string): Promise<void> {
  await http.post<null>(RUTAS.logout, {
    body: { token_de_refresco: tokenRefresco },
    publico: true,
  });
}

export interface EntradaDeActivacion {
  /** Token de un solo uso que el administrador de la plataforma entregó a la clínica. */
  token: string;
  contrasena: string;
}

/**
 * Canje del token con el que una cuenta de clínica_admin define su primera
 * contraseña (proceso 4.16). Es el segundo y último endpoint público del
 * sistema, junto con el auto-registro de tutor.
 *
 * **No devuelve sesión**: después de activar hay que iniciar sesión, que es donde
 * el backend aplica el bloqueo de canal. Todo rechazo —token inexistente,
 * vencido o ya usado— responde el mismo 400 con el mismo mensaje, así que la
 * pantalla no puede ni debe distinguirlos.
 */
export async function activarCuenta(entrada: EntradaDeActivacion): Promise<void> {
  await http.post<null>(RUTAS.activacion, { body: entrada, publico: true });
}
