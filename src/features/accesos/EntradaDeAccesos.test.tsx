import { fireEvent, waitFor } from '@testing-library/react-native';

import { render } from '../../pruebas/render';

import { EntradaDeAccesos } from './EntradaDeAccesos';
import * as consultas from './queries';

/**
 * La fila cambia de cara según el estado, y eso es una decisión de la interfaz:
 * el backend devuelve la misma lista vacía en los dos casos. Lo que se prueba es
 * que la acción aparezca cuando hace falta y que sin conexión no afirme algo que
 * no sabe.
 */
const CON_ACCESOS = {
  clinicas: [{ clinica_id: 'c-1', nombre: 'Veterinaria Norte', otorgado_at: '' }],
  co_tutores: [{ tutor_id: 't-2', nombre: 'Beto', nivel: 'edicion' as const, otorgado_at: '' }],
};

function consulta(estado: 'vacio' | 'con-accesos' | 'sin-red') {
  if (estado === 'sin-red') {
    return { data: undefined, isPending: false, isError: true } as never;
  }
  return {
    data: estado === 'vacio' ? { clinicas: [], co_tutores: [] } : CON_ACCESOS,
    isPending: false,
    isError: false,
  } as never;
}

afterEach(() => jest.restoreAllMocks());

describe('EntradaDeAccesos', () => {
  it('sin nadie con acceso ofrece compartir', async () => {
    jest.spyOn(consultas, 'useAccesosDeMascota').mockReturnValue(consulta('vacio'));
    const onCompartir = jest.fn();

    const { getByText } = await render(
      <EntradaDeAccesos
        pacienteId="p-1"
        administra
        onVerAccesos={jest.fn()}
        onCompartir={onCompartir}
      />,
    );

    await waitFor(() => expect(getByText('Todavía no la ve nadie')).toBeTruthy());
    await fireEvent.press(getByText('Compartir'));
    expect(onCompartir).toHaveBeenCalled();
  });

  it('compartida, lleva a la lista y dice con quién', async () => {
    jest.spyOn(consultas, 'useAccesosDeMascota').mockReturnValue(consulta('con-accesos'));
    const onVerAccesos = jest.fn();

    const { getByText } = await render(
      <EntradaDeAccesos
        pacienteId="p-1"
        administra
        onVerAccesos={onVerAccesos}
        onCompartir={jest.fn()}
      />,
    );

    await waitFor(() => expect(getByText('Veterinaria Norte y Beto')).toBeTruthy());
    await fireEvent.press(getByText('Quién la ve'));
    expect(onVerAccesos).toHaveBeenCalled();
  });

  // Un co-tutor no comparte con nadie: la llamada a la acción sería un botón que
  // el backend va a rechazar.
  it('el co-tutor nunca ve la invitación a compartir', async () => {
    jest.spyOn(consultas, 'useAccesosDeMascota').mockReturnValue(consulta('vacio'));

    const { getByText, queryByText } = await render(
      <EntradaDeAccesos
        pacienteId="p-1"
        administra={false}
        onVerAccesos={jest.fn()}
        onCompartir={jest.fn()}
      />,
    );

    await waitFor(() => expect(getByText('Quién la ve')).toBeTruthy());
    expect(queryByText('Todavía no la ve nadie')).toBeNull();
  });

  // La lista de accesos no está en la copia local: sin conexión no se sabe, y
  // decir "no la ve nadie" sería justo lo contrario de la verdad.
  it('sin conexión no afirma que no la ve nadie', async () => {
    jest.spyOn(consultas, 'useAccesosDeMascota').mockReturnValue(consulta('sin-red'));

    const { getByText, queryByText } = await render(
      <EntradaDeAccesos
        pacienteId="p-1"
        administra
        onVerAccesos={jest.fn()}
        onCompartir={jest.fn()}
      />,
    );

    await waitFor(() => expect(getByText('Quién la ve')).toBeTruthy());
    expect(queryByText('Todavía no la ve nadie')).toBeNull();
  });
});
