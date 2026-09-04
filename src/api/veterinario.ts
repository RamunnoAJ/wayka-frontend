import { http } from '../lib/http';

/**
 * Plantel de la clínica.
 *
 * El veterinario **lee** el plantel de su propia clínica pero no lo modifica:
 * lo necesita para resolver quién firmó cada registro clínico (Alcance de
 * Plataformas, 3.3). Escribirlo es del clínica_admin.
 */

export type TipoDocumento = 'dni' | 'pasaporte' | 'otro';

export interface Veterinario {
  id: string;
  nombre: string;
  tipo_documento: TipoDocumento;
  numero_documento: string;
  /**
   * Habilitación profesional. **Vacía deja la ficha en modo restringido**: sin
   * matrícula no se crean ni editan Eventos clínicos ni Medicación (regla 2.1).
   * Cargada, es **única en todo el sistema** y no solo en la clínica: la emite
   * un colegio profesional. El backend la guarda normalizada, en mayúsculas.
   */
  matricula?: string | null;
  clinica_id: string;
  /**
   * Cuenta de esta ficha, cuando la tiene. Es la clave con la que se resuelve
   * quién firmó cada registro clínico: el historial guarda la cuenta que
   * escribió y no la ficha, porque escriben los dos roles. Nula mientras la
   * ficha no tenga cuenta — cargada sin correo, o con la cuenta dada de baja.
   */
  usuario_id?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Alta del plantel: la ficha y la cuenta de acceso se crean **juntas, en una
 * sola operación** (proceso 4.12). No hay forma de crear una sin la otra, y la
 * clínica no se envía — es siempre la del administrador que da el alta.
 *
 * **No lleva contraseña.** La cuenta nace sin ningún método de autenticación y
 * al veterinario le sale un correo con el token para elegir la suya. Que la
 * eligiera el administrador hacía pasar la credencial de un profesional por un
 * tercero, y dejaba cada acto médico firmado con esa cuenta atribuible a dos
 * personas.
 */
export interface CrearVeterinarioEntrada {
  nombre: string;
  tipo_documento: TipoDocumento;
  numero_documento: string;
  /**
   * Opcional: sin ella la ficha nace en modo restringido (regla 2.1). Cargada,
   * una que ya use otra ficha vigente devuelve 409.
   */
  matricula?: string;
  /**
   * La dirección a la que sale el correo de activación. Un email equivocado deja
   * la cuenta sin poder estrenarse hasta que se corrija.
   */
  email: string;
}

export type ActualizarVeterinarioEntrada = Partial<
  Pick<CrearVeterinarioEntrada, 'nombre' | 'tipo_documento' | 'numero_documento' | 'matricula'>
>;

/** Ficha + cuenta, tal como las devuelve el alta. */
export interface VeterinarioConCuenta {
  veterinario: Veterinario;
  usuario: {
    id: string;
    email: string;
    activo: boolean;
    /**
     * En `false` junto con `tiene_google_vinculado` es como se reconoce una
     * cuenta sin estrenar: nadie canjeó todavía su token de activación.
     */
    tiene_contrasena: boolean;
    tiene_google_vinculado: boolean;
  };
}

/** Una cuenta sin estrenar no tiene ningún método de autenticación (regla 2.1). */
export function cuentaSinEstrenar(usuario: VeterinarioConCuenta['usuario']): boolean {
  return !usuario.tiene_contrasena && !usuario.tiene_google_vinculado;
}

/**
 * Vuelve a mandar el correo de activación de una cuenta que nadie estrenó. Es la
 * salida del token que se venció o del correo que no llegó.
 *
 * Emitir uno nuevo invalida los anteriores. Sobre una cuenta ya estrenada
 * responde 409: ahí lo que corresponde es restablecer la contraseña.
 */
export function reenviarActivacionDeVeterinario(veterinarioId: string): Promise<null> {
  return http.post<null>(`/veterinarios/${veterinarioId}/activacion/reenvio`);
}

export function crearVeterinario(entrada: CrearVeterinarioEntrada): Promise<VeterinarioConCuenta> {
  return http.post<VeterinarioConCuenta>('/veterinarios', { body: entrada });
}

export function actualizarVeterinario(
  veterinarioId: string,
  entrada: ActualizarVeterinarioEntrada,
): Promise<Veterinario> {
  return http.patch<Veterinario>(`/veterinarios/${veterinarioId}`, { body: entrada });
}

/**
 * Baja lógica de la ficha **y desactivación de la cuenta en la misma
 * transacción** (regla 2.4): separarlas dejaría a un ex empleado con acceso.
 * No cascadea sobre lo que escribió: eventos y medicación conservan su autoría.
 */
export function darDeBajaVeterinario(veterinarioId: string): Promise<null> {
  return http.delete<null>(`/veterinarios/${veterinarioId}`);
}

export interface FiltrosDeVeterinarios {
  /**
   * Coincidencia parcial, sin distinguir mayúsculas, sobre el nombre; o por el
   * comienzo del número de documento o de la matrícula. El plantel no se pagina
   * —una clínica entra en una pantalla— pero sí se busca: es donde se responde
   * si una matrícula ya está cargada, que es única en todo el sistema y cuyo
   * conflicto en el alta no dice de quién es.
   */
  busqueda?: string;
}

export function listarVeterinarios(filtros: FiltrosDeVeterinarios = {}): Promise<Veterinario[]> {
  return http.get<Veterinario[]>('/veterinarios', { params: { ...filtros } });
}

export function obtenerVeterinario(veterinarioId: string): Promise<Veterinario> {
  return http.get<Veterinario>(`/veterinarios/${veterinarioId}`);
}

/**
 * Índice `cuenta → ficha` para resolver la autoría de eventos y medicación sin
 * pedir una ficha por registro.
 *
 * La clave es `usuario_id` y no `id`: el registro clínico guarda la **cuenta**
 * que escribió, porque escriben los dos roles. Indexado por el id de la ficha
 * no acertaba nunca, y todo el historial salía como "Autor fuera del plantel
 * actual" —incluidos los registros de quien estaba mirando la pantalla.
 *
 * La ficha sin cuenta queda afuera: no puede haber firmado nada.
 */
export function indexarPorAutor(veterinarios: Veterinario[]): Map<string, Veterinario> {
  return new Map(
    veterinarios
      .filter((v): v is Veterinario & { usuario_id: string } => Boolean(v.usuario_id))
      .map((v) => [v.usuario_id, v]),
  );
}

/** Regla 2.1, reflejada en la UI: sin matrícula, la ficha es de solo lectura. */
export function puedeEscribirClinico(veterinario: Veterinario | undefined): boolean {
  return Boolean(veterinario?.matricula);
}
