import { waitFor } from '@testing-library/react-native';

import type { Paciente } from '../../api/paciente';
import { render } from '../../pruebas/render';

import { MisMascotas } from './MisMascotas';
import * as consultas from './queries';

/**
 * La tarjeta muestra la foto que eligió el tutor. Sin foto queda el ícono de la
 * especie: rellenarlo con algo que finja ser una foto sería peor que la
 * ausencia, y es lo mismo que hace la ficha.
 */
const MASCOTA: Paciente = {
  id: 'p-1',
  nombre: 'Luna',
  especie: 'canino',
  raza: 'mestiza',
  fecha_nacimiento: '2020-03-15',
  sexo: 'hembra',
  peso_actual: 12.5,
  tutor_id: 't-1',
  nivel_de_acceso: 'dueno',
  created_at: '2026-01-01T12:00:00Z',
  updated_at: '2026-01-01T12:00:00Z',
};

const FOTO = 'https://bucket.test/luna.png?firma=valida';

function conMascotas(mascotas: Paciente[], fotos: Record<string, string> = {}) {
  jest.spyOn(consultas, 'useMisMascotas').mockReturnValue({
    data: mascotas,
    isPending: false,
    isError: false,
    refetch: jest.fn(),
  } as never);
  jest.spyOn(consultas, 'useAjenasPurgadas').mockReturnValue(false);
  jest.spyOn(consultas, 'useFotosDeMisMascotas').mockReturnValue(fotos);
}

function listado() {
  return render(
    <MisMascotas onAbrir={jest.fn()} onVerRechazos={jest.fn()} onAgregar={jest.fn()} />,
  );
}

afterEach(() => jest.restoreAllMocks());

describe('MisMascotas', () => {
  it('muestra la foto que trae la mascota del listado', async () => {
    conMascotas([{ ...MASCOTA, foto_perfil_url: FOTO }]);

    const { getByLabelText } = await listado();

    await waitFor(() => expect(getByLabelText('Luna')).toBeTruthy());
    expect(getByLabelText('Luna').props.source).toEqual({ uri: FOTO });
  });

  // En el dispositivo la mascota sale de la copia local, que no guarda la URL
  // prefirmada: la foto llega por el pedido aparte y la tarjeta la usa igual.
  it('usa la foto del pedido aparte cuando la mascota viene de la copia local', async () => {
    conMascotas([MASCOTA], { 'p-1': FOTO });

    const { getByLabelText } = await listado();

    await waitFor(() => expect(getByLabelText('Luna')).toBeTruthy());
    expect(getByLabelText('Luna').props.source).toEqual({ uri: FOTO });
  });

  it('sin foto la tarjeta no muestra ninguna', async () => {
    conMascotas([MASCOTA]);

    const { getByText, queryByLabelText } = await listado();

    await waitFor(() => expect(getByText('Luna')).toBeTruthy());
    expect(queryByLabelText('Luna')).toBeNull();
  });
});
