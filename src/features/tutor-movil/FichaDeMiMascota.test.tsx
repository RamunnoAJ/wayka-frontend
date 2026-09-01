import { waitFor } from '@testing-library/react-native';

import type { Paciente } from '../../api/paciente';
import { render } from '../../pruebas/render';
import * as consultasDePaciente from '../paciente/queries';

import { FichaDeMiMascota } from './FichaDeMiMascota';
import * as consultas from './queries';

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

// La ficha lee de la copia local: los hooks que se falsean son los del tutor,
// no los online que comparte el veterinario.
function conNivel(nivel: Paciente['nivel_de_acceso']) {
  jest
    .spyOn(consultas, 'useMiMascota')
    .mockReturnValue(consultaResuelta({ ...MASCOTA, nivel_de_acceso: nivel }));
  jest.spyOn(consultas, 'useHistorialDeMiMascota').mockReturnValue(consultaResuelta([]));
  jest.spyOn(consultas, 'useMedicacionesDeMiMascota').mockReturnValue(consultaResuelta([]));
  jest
    .spyOn(consultas, 'useAdjuntosDeMiMascota')
    .mockReturnValue(consultaResuelta({ adjuntos: [], soloMetadatos: false }));
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
      <FichaDeMiMascota pacienteId="p-1" onVerAccesos={jest.fn()} onCompartir={jest.fn()} />,
    );

    await waitFor(() => expect(getByText('Luna')).toBeTruthy());
    expect(getByText('Actualizar')).toBeTruthy();
  });

  // Sin conexión la ficha abre igual: los datos, el peso y el historial salen de
  // la copia local. Lo único que no se puede es abrir un archivo, que necesita
  // una URL prefirmada que vence en minutos y por eso no se replica.
  it('sin conexión abre con los datos de la copia y avisa por los adjuntos', async () => {
    conNivel('dueno');
    jest
      .spyOn(consultas, 'useAdjuntosDeMiMascota')
      .mockReturnValue(consultaResuelta({ adjuntos: [], soloMetadatos: true }));

    const { getByText } = await render(
      <FichaDeMiMascota pacienteId="p-1" onVerAccesos={jest.fn()} onCompartir={jest.fn()} />,
    );

    await waitFor(() => expect(getByText('Luna')).toBeTruthy());
    expect(getByText('12,5 kg')).toBeTruthy();
    expect(getByText('Necesitás conexión para ver estos archivos o subir uno nuevo.')).toBeTruthy();
  });

  it('el co-tutor de solo lectura ve el peso y no el botón', async () => {
    conNivel('lectura');
    const { getByText, queryByText } = await render(
      <FichaDeMiMascota pacienteId="p-1" onVerAccesos={jest.fn()} onCompartir={jest.fn()} />,
    );

    await waitFor(() => expect(getByText('Luna')).toBeTruthy());
    expect(getByText('12,5 kg')).toBeTruthy();
    expect(queryByText('Actualizar')).toBeNull();
  });

  // Los adjuntos son el mismo gateo: el de solo lectura lista y mira (regla
  // 3.2). La zona de carga no se muestra deshabilitada, no se muestra.
  it('el co-tutor de solo lectura ve los adjuntos y no la zona de carga', async () => {
    conNivel('lectura');
    const { getByText, queryByText } = await render(
      <FichaDeMiMascota pacienteId="p-1" onVerAccesos={jest.fn()} onCompartir={jest.fn()} />,
    );

    await waitFor(() => expect(getByText('Luna')).toBeTruthy());
    expect(getByText('Adjuntos generales')).toBeTruthy();
    expect(queryByText('Tipo de archivo')).toBeNull();
  });

  it('el co-tutor con edición sí ve la zona de carga de adjuntos', async () => {
    conNivel('edicion');
    const { getByText } = await render(
      <FichaDeMiMascota pacienteId="p-1" onVerAccesos={jest.fn()} onCompartir={jest.fn()} />,
    );

    await waitFor(() => expect(getByText('Luna')).toBeTruthy());
    expect(getByText('Tipo de archivo')).toBeTruthy();
  });
});
