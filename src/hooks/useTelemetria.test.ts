import { pantallaDeSegmentos } from './useTelemetria';

/**
 * `pantalla` es un enum de pantallas (Telemetría de Producto, 5.2): nunca lleva
 * el valor que completa la ruta. Sale de los **segmentos declarados** de
 * expo-router —nombres de archivo— y no de la ruta navegada, así que por
 * construcción no puede traer un dato.
 */
describe('la pantalla que se emite', () => {
  it('deja el nombre de la sección y nombra el tramo dinámico', () => {
    expect(pantallaDeSegmentos(['(veterinario)', 'pacientes', '[id]'])).toBe('/pacientes/:id');
  });

  it('saca los grupos, que ordenan el árbol y no son pantallas', () => {
    expect(pantallaDeSegmentos(['(veterinario)', 'atenciones'])).toBe('/atenciones');
  });

  // El token de invitación es una credencial viva: 32 bytes en base64url que
  // canjean el acceso al historial de una mascota. No se parece a un UUID, así
  // que enmascarar por la forma del valor lo dejaba pasar entero.
  it('nunca puede traer el token de invitación', () => {
    expect(pantallaDeSegmentos(['(tutor)', 'invitaciones', '[token]'])).toBe(
      '/invitaciones/:token',
    );
  });

  it('nombra cada tramo dinámico como lo declara la ruta', () => {
    expect(pantallaDeSegmentos(['(tutor)', 'mascotas', '[id]', 'accesos'])).toBe(
      '/mascotas/:id/accesos',
    );
  });

  it('resuelve también un comodín', () => {
    expect(pantallaDeSegmentos(['(tutor)', 'archivos', '[...ruta]'])).toBe('/archivos/:ruta');
  });
});
