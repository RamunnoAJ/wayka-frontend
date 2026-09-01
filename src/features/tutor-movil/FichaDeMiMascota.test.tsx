import { waitFor } from '@testing-library/react-native';

import type { Paciente } from '../../api/paciente';
import { render } from '../../pruebas/render';
import * as consultasDePaciente from '../paciente/queries';

import { FichaDeMiMascota } from './FichaDeMiMascota';

/**
 * El gateo por nivel: el co-tutor de solo lectura ve el peso y no el botón de
 * actualizarlo. Ofrecer una acción que el backend va a rechazar es un error que
 * la interfaz puede evitar, y es lo único de esta regla que vive acá.
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
  created_at: '2026-01-01T12:00:00Z',
  updated_at: '2026-01-01T12:00:00Z',
};

function consultaResuelta<T>(data: T) {
  return { data, isPending: false, isError: false, refetch: jest.fn() } as never;
}

function conNivel(nivel: Paciente['nivel_de_acceso']) {
  jest
    .spyOn(consultasDePaciente, 'usePaciente')
    .mockReturnValue(consultaResuelta({ ...MASCOTA, nivel_de_acceso: nivel }));
  jest.spyOn(consultasDePaciente, 'useEventosClinicos').mockReturnValue(consultaResuelta([]));
  jest.spyOn(consultasDePaciente, 'useMedicaciones').mockReturnValue(consultaResuelta([]));
  jest.spyOn(consultasDePaciente, 'useAdjuntos').mockReturnValue(consultaResuelta([]));
  jest.spyOn(consultasDePaciente, 'useRetirarAdjunto').mockReturnValue({
    mutate: jest.fn(),
    isPending: false,
  } as never);
}

afterEach(() => jest.restoreAllMocks());

describe('FichaDeMiMascota', () => {
  it('el dueño puede actualizar el peso', async () => {
    conNivel('dueno');
    const { getByText } = await render(
      <FichaDeMiMascota pacienteId="p-1" onVerAccesos={jest.fn()} />,
    );

    await waitFor(() => expect(getByText('Luna')).toBeTruthy());
    expect(getByText('Actualizar')).toBeTruthy();
  });

  it('el co-tutor de solo lectura ve el peso y no el botón', async () => {
    conNivel('lectura');
    const { getByText, queryByText } = await render(
      <FichaDeMiMascota pacienteId="p-1" onVerAccesos={jest.fn()} />,
    );

    await waitFor(() => expect(getByText('Luna')).toBeTruthy());
    expect(getByText('12,5 kg')).toBeTruthy();
    expect(queryByText('Actualizar')).toBeNull();
  });
});
