import { waitFor } from '@testing-library/react-native';

import { render } from '../../pruebas/render';

import { AccesosDeMiMascota } from './AccesosDeMiMascota';
import * as consultas from './queries';

/**
 * Lo que se prueba acá es la decisión que la interfaz toma sola: el co-tutor ve
 * la misma lista que el dueño y **sin acciones**. Que el backend rechace la
 * escritura ya está probado allá; lo que no puede estar allá es que la pantalla
 * no ofrezca un botón que va a rebotar.
 */
const ACCESOS = {
  clinicas: [
    {
      clinica_id: 'c-1',
      nombre: 'Veterinaria Norte',
      direccion: 'Av. Siempre Viva 123',
      otorgado_at: '2026-01-10T12:00:00Z',
    },
  ],
  co_tutores: [
    {
      tutor_id: 't-2',
      nombre: 'Beto Gómez',
      contacto: 'beto@wayka.test',
      nivel: 'edicion' as const,
      otorgado_at: '2026-01-11T12:00:00Z',
    },
  ],
};

function consultaResuelta<T>(data: T) {
  return { data, isPending: false, isError: false, refetch: jest.fn() } as never;
}

function mutacionInerte() {
  return { mutate: jest.fn(), isPending: false, error: null } as never;
}

beforeEach(() => {
  jest.spyOn(consultas, 'useAccesosDeMascota').mockReturnValue(consultaResuelta(ACCESOS));
  jest.spyOn(consultas, 'useInvitacionesDeMascota').mockReturnValue(consultaResuelta([]));
  jest.spyOn(consultas, 'useRevocarClinica').mockReturnValue(mutacionInerte());
  jest.spyOn(consultas, 'useRevocarCoTutor').mockReturnValue(mutacionInerte());
  jest.spyOn(consultas, 'useCambiarNivelDeAcceso').mockReturnValue(mutacionInerte());
  jest.spyOn(consultas, 'useAnularInvitacion').mockReturnValue(mutacionInerte());
});

afterEach(() => jest.restoreAllMocks());

describe('AccesosDeMiMascota', () => {
  it('el dueño ve las acciones de administración', async () => {
    const { getAllByText, getByText } = await render(
      <AccesosDeMiMascota
        pacienteId="p-1"
        nombreDeLaMascota="Luna"
        administra
        onCompartir={jest.fn()}
      />,
    );

    await waitFor(() => expect(getByText('Veterinaria Norte')).toBeTruthy());
    expect(getAllByText('Quitar').length).toBe(2);
    expect(getByText('Compartir')).toBeTruthy();
  });

  it('el co-tutor ve la misma lista y ninguna acción', async () => {
    const { getByText, queryByText } = await render(
      <AccesosDeMiMascota
        pacienteId="p-1"
        nombreDeLaMascota="Luna"
        administra={false}
        onCompartir={jest.fn()}
      />,
    );

    // La lista completa: saber quién más mira el historial de un animal no es
    // administrar, es entender con quién se comparte.
    await waitFor(() => expect(getByText('Veterinaria Norte')).toBeTruthy());
    expect(getByText('Beto Gómez')).toBeTruthy();

    expect(queryByText('Quitar')).toBeNull();
    expect(queryByText('Compartir')).toBeNull();
    expect(queryByText('Solo mirar')).toBeNull();
  });
});
