// En @testing-library/react-native v14 `render` es asíncrono: sin esperarlo, la
// aserción corre sobre el árbol anterior.
import { Text } from 'react-native';

import { render } from '../../pruebas/render';

import { Shell } from './Shell';

jest.mock('../../hooks/useAnchoDeVentana', () => ({ useAnchoDeVentana: () => mockAncho() }));
jest.mock('../../hooks/useSesion', () => ({ useSesion: () => mockSesion() }));
jest.mock('../../hooks/useTelemetria', () => ({
  useTelemetriaAutomatica: () => {},
  usePantallaVista: () => {},
}));
jest.mock('../auth', () => ({
  useCerrarSesion: () => ({ mutate: jest.fn(), isPending: false }),
}));
jest.mock('../clinica', () => ({ useMiClinica: () => ({ data: undefined }) }));
jest.mock('../paciente/queries', () => ({ useMiFichaDeVeterinario: () => ({ data: undefined }) }));
jest.mock('../accesos/queries', () => ({ useCuantasInvitacionesEsperan: () => 0 }));

let mockAncho: () => number;
let mockSesion: () => { sesion: { usuario: { email: string; tipo_usuario: string } } };

const sesionDe = (tipo_usuario: string) => () => ({
  sesion: { usuario: { email: 'quien@wayka.test', tipo_usuario } },
});

/**
 * El marco corta por ancho para los roles que tienen canal móvil, pero **no
 * para el clínica_admin**: es rol de web (Alcance de Plataformas, 2) y su
 * salida de sesión vive solo en la barra lateral (3.2), así que con la barra
 * inferior quedaba adentro sin forma de salir.
 */
describe('Shell y el corte por ancho', () => {
  // Un render por prueba: dos en el mismo `it` se pisan los `act()`.
  it.each([1440, 901, 899, 768, 390])(
    'el clínica_admin conserva la salida de sesión a %i px',
    async (ancho) => {
      mockSesion = sesionDe('clinica_admin');
      mockAncho = () => ancho;

      const { getByLabelText } = await render(
        <Shell>
          <Text>contenido</Text>
        </Shell>,
      );

      expect(getByLabelText('Cerrar sesión')).toBeOnTheScreen();
    },
  );

  it('el veterinario sí pasa a la barra inferior en ventana angosta', async () => {
    mockSesion = sesionDe('veterinario');
    mockAncho = () => 899;

    const { queryByLabelText } = await render(
      <Shell>
        <Text>contenido</Text>
      </Shell>,
    );

    expect(queryByLabelText('Cerrar sesión')).toBeNull();
  });

  it('el veterinario tiene la barra lateral en ventana ancha', async () => {
    mockSesion = sesionDe('veterinario');
    mockAncho = () => 1440;

    const { getByLabelText } = await render(
      <Shell>
        <Text>contenido</Text>
      </Shell>,
    );

    expect(getByLabelText('Cerrar sesión')).toBeOnTheScreen();
  });
});
