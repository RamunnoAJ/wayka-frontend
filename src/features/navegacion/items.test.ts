import { destinoAlTocar, itemActivo, NAVEGACION_POR_ROL } from './items';
import { TIPO_USUARIO } from '../../constants/roles';

const VETERINARIO = NAVEGACION_POR_ROL[TIPO_USUARIO.VETERINARIO];
const PACIENTES = VETERINARIO.find((item) => item.prefijo === '/pacientes')!;
const AGENDA = VETERINARIO.find((item) => item.prefijo === '/citas')!;

describe('sección activa', () => {
  it('ilumina la sección estando en una ficha de adentro', () => {
    expect(itemActivo(VETERINARIO, '/pacientes/abc')?.prefijo).toBe('/pacientes');
  });
});

describe('a dónde lleva tocar una sección', () => {
  it('no navega si ya estamos parados en esa sección', () => {
    expect(destinoAlTocar(PACIENTES, '/pacientes')).toBeNull();
  });

  /**
   * Estar *dentro* de la sección no es estar en la sección: desde la ficha de
   * un paciente, tocar "Pacientes" tiene que volver al listado. Es el caso que
   * se rompe si el corte se hace por sección activa en vez de por ruta exacta,
   * y deja la pestaña inerte justo donde más se la usa.
   */
  it('vuelve al listado desde una ficha de adentro', () => {
    expect(destinoAlTocar(PACIENTES, '/pacientes/abc')).toBe(PACIENTES.href);
  });

  it('navega a otra sección', () => {
    expect(destinoAlTocar(AGENDA, '/pacientes')).toBe(AGENDA.href);
  });
});

describe('secciones del clínica_admin', () => {
  const ADMIN = NAVEGACION_POR_ROL[TIPO_USUARIO.CLINICA_ADMIN];

  /**
   * El corte es por frecuencia: el tablero y la agenda se miran todos los días,
   * el plantel cada tanto, y Ajustes junta lo que se configura una vez. Las
   * ausencias no tienen sección — se cargan desde la fila de la persona, porque
   * una ausencia es de alguien (Alcance de Plataformas, 3.2).
   */
  it('separa lo que se mira a diario de lo que se configura una vez', () => {
    expect(ADMIN.map((item) => item.prefijo)).toEqual([
      '/panel',
      '/agenda',
      '/veterinarios',
      '/ajustes',
    ]);
  });

  /**
   * El rol alcanza datos administrativos y conteos, no las mascotas atendidas ni
   * su calendario: que esas secciones no estén no es un olvido.
   */
  it('no ofrece pacientes ni agenda clínica', () => {
    const prefijos = ADMIN.map((item) => item.prefijo);
    expect(prefijos).not.toContain('/pacientes');
    expect(prefijos).not.toContain('/atenciones');
  });
});
