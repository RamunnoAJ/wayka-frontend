import type { NombreDeIcono } from '../../components';
import { TIPO_USUARIO, type TipoUsuario } from '../../constants/roles';

/**
 * Qué secciones ve cada rol. Es la traducción directa de Alcance de Plataformas:
 * el menú no puede ofrecer algo que el rol no alcanza, aunque el guard y el
 * backend lo rechacen igual.
 */
export interface ItemDeNavegacion {
  /** Ruta del grupo, tal como la resuelve Expo Router. */
  href: string;
  /** Prefijo con el que se decide si la sección está activa. */
  prefijo: string;
  label: string;
  /** Etiqueta corta para la barra inferior, donde no entra la larga. */
  labelCorta?: string;
  icono: NombreDeIcono;
}

const VETERINARIO: ItemDeNavegacion[] = [
  {
    href: '/(veterinario)/citas',
    prefijo: '/citas',
    label: 'Agenda',
    icono: 'calendar-days',
  },
  // Va al lado de la agenda porque se miran juntas: la agenda dice qué hay por
  // atender y esta, qué se atendió y todavía no se documentó.
  {
    href: '/(veterinario)/atenciones',
    prefijo: '/atenciones',
    label: 'Atenciones',
    icono: 'clipboard-check',
  },
  {
    href: '/(veterinario)/pacientes',
    prefijo: '/pacientes',
    label: 'Pacientes',
    icono: 'paw-print',
  },
  {
    href: '/(veterinario)/tutores',
    prefijo: '/tutores',
    label: 'Tutores',
    icono: 'user-round',
  },
  // Va en el menú y no colgada del avatar de la barra lateral porque el
  // veterinario tiene paridad entre web y móvil: en el teléfono no hay avatar
  // donde colgarla, y una pantalla alcanzable solo en web rompería esa paridad.
  {
    href: '/(veterinario)/mi-cuenta',
    prefijo: '/mi-cuenta',
    label: 'Mi cuenta',
    labelCorta: 'Cuenta',
    icono: 'circle-user',
  },
];

// El clínica_admin no tiene "Pacientes" ni "Agenda" y no es un olvido: su rol
// alcanza datos administrativos, no las mascotas atendidas ni su calendario.
const CLINICA_ADMIN: ItemDeNavegacion[] = [
  // El panel es solo el tablero: lo único que se mira todos los días. Después la
  // agenda, que es donde se reparte lo que el tablero cuenta sin repartir.
  {
    href: '/(clinica-admin)/panel',
    prefijo: '/panel',
    label: 'Panel',
    icono: 'clipboard-check',
  },
  {
    href: '/(clinica-admin)/agenda',
    prefijo: '/agenda',
    label: 'Agenda',
    icono: 'calendar-days',
  },
  // Las ausencias no tienen sección: se cargan desde la fila de la persona y se
  // listan en su ficha, porque una ausencia es de alguien.
  {
    href: '/(clinica-admin)/veterinarios',
    prefijo: '/veterinarios',
    label: 'Plantel',
    icono: 'user-round',
  },
  // Ajustes junta lo que comparte frecuencia: los datos de la clínica y el
  // horario se configuran una vez y casi no se vuelven a tocar.
  {
    href: '/(clinica-admin)/ajustes',
    prefijo: '/ajustes',
    label: 'Ajustes',
    icono: 'settings',
  },
];

const TUTOR: ItemDeNavegacion[] = [
  {
    href: '/(tutor)/mascotas',
    prefijo: '/mascotas',
    label: 'Mis mascotas',
    labelCorta: 'Mascotas',
    icono: 'paw-print',
  },
  { href: '/(tutor)/citas', prefijo: '/citas', label: 'Citas', icono: 'calendar-days' },
  // Tres y no más: es la lista entera de lo que el tutor abre por sí mismo
  // (Alcance de Plataformas, 5). Los adjuntos cuelgan de una mascota y los
  // avisos son un interruptor, no una bandeja — ninguno de los dos sostiene una
  // entrada acá, y una barra de cinco convierte la pestaña en un renglón.
  {
    href: '/(tutor)/ajustes',
    prefijo: '/ajustes',
    label: 'Ajustes',
    icono: 'settings',
  },
];

export const NAVEGACION_POR_ROL: Record<TipoUsuario, ItemDeNavegacion[]> = {
  [TIPO_USUARIO.VETERINARIO]: VETERINARIO,
  [TIPO_USUARIO.CLINICA_ADMIN]: CLINICA_ADMIN,
  [TIPO_USUARIO.TUTOR]: TUTOR,
};

/**
 * Sección activa a partir de la ruta. Se compara por prefijo y no por igualdad
 * porque una ficha (`/pacientes/abc`) tiene que dejar iluminada su sección.
 */
export function itemActivo(items: ItemDeNavegacion[], ruta: string): ItemDeNavegacion | undefined {
  return items.find((item) => ruta === item.prefijo || ruta.startsWith(`${item.prefijo}/`));
}

/**
 * A dónde lleva tocar una sección del menú, o `null` si no lleva a ningún lado
 * porque ya estamos ahí.
 *
 * Navegar a la ruta en la que uno está monta la pantalla de nuevo y le dispara
 * la animación de entrada: la app se mueve para decir que llegó a un lugar
 * nuevo, y no llegó a ninguno.
 *
 * El corte es por **ruta exacta y no por sección activa**. Desde la ficha de un
 * paciente la sección iluminada sigue siendo Pacientes, pero ahí tocarla tiene
 * que volver al listado — que es justamente para lo que se la toca.
 */
export function destinoAlTocar(item: ItemDeNavegacion, ruta: string): string | null {
  return ruta === item.prefijo ? null : item.href;
}
