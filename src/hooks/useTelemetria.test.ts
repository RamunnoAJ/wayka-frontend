import { sinIdentificadores } from './useTelemetria';

describe('la ruta que se emite como pantalla', () => {
  it('deja el nombre de la sección y saca el identificador', () => {
    expect(sinIdentificadores('/pacientes/3f8c0f2e-1b9a-4c8e-9d3a-2b7e5f1c0a44')).toBe(
      '/pacientes/:id',
    );
  });

  it('no toca una ruta que no lleva ninguno', () => {
    expect(sinIdentificadores('/(veterinario)/atenciones')).toBe('/(veterinario)/atenciones');
  });
});
