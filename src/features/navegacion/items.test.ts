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
