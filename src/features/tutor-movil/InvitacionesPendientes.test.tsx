import { fireEvent, waitFor } from '@testing-library/react-native';

import { render } from '../../pruebas/render';
import * as consultas from '../accesos/queries';

import { InvitacionesPendientes } from './InvitacionesPendientes';

/**
 * La tarjeta es el único aviso dentro de la app: hasta ahora la invitación solo
 * llegaba por correo, y quien no lo revisaba no se enteraba nunca.
 */
const UNA = [
  {
    id: 'i-1',
    nombre_del_paciente: 'Luna',
    invitado_por: 'Ana Pérez',
    nivel: 'edicion' as const,
    expira_at: '2026-09-08T00:00:00Z',
    created_at: '2026-09-01T00:00:00Z',
  },
];

function consulta<T>(data: T, estado: Partial<{ isPending: boolean; isError: boolean }> = {}) {
  return { data, isPending: false, isError: false, ...estado } as never;
}

function mutacion() {
  return { mutate: jest.fn(), isPending: false, error: null } as never;
}

afterEach(() => jest.restoreAllMocks());

describe('InvitacionesPendientes', () => {
  it('dice quién compartió qué mascota y qué se va a poder hacer', async () => {
    jest.spyOn(consultas, 'useInvitacionesRecibidas').mockReturnValue(consulta(UNA));
    jest.spyOn(consultas, 'useAceptarInvitacionRecibida').mockReturnValue(mutacion());
    jest.spyOn(consultas, 'useRechazarInvitacion').mockReturnValue(mutacion());

    const { getByText } = await render(<InvitacionesPendientes />);

    await waitFor(() => expect(getByText('Ana Pérez te compartió a Luna')).toBeTruthy());
    expect(getByText('Vas a poder ver su historial y editar sus datos.')).toBeTruthy();
  });

  it('acepta por identificador y no por el token del correo', async () => {
    const aceptar = mutacion();
    jest.spyOn(consultas, 'useInvitacionesRecibidas').mockReturnValue(consulta(UNA));
    jest.spyOn(consultas, 'useAceptarInvitacionRecibida').mockReturnValue(aceptar);
    jest.spyOn(consultas, 'useRechazarInvitacion').mockReturnValue(mutacion());

    const { getByText } = await render(<InvitacionesPendientes />);

    await fireEvent.press(getByText('Aceptar'));
    expect((aceptar as unknown as { mutate: jest.Mock }).mutate).toHaveBeenCalledWith('i-1');
  });

  // Sin invitaciones no ocupa lugar, y sin conexión tampoco: la pantalla ya
  // tiene su indicador de sincronización y esto es accesorio.
  it('no dibuja nada sin invitaciones ni cuando falla la consulta', async () => {
    jest.spyOn(consultas, 'useAceptarInvitacionRecibida').mockReturnValue(mutacion());
    jest.spyOn(consultas, 'useRechazarInvitacion').mockReturnValue(mutacion());

    const vacia = jest.spyOn(consultas, 'useInvitacionesRecibidas').mockReturnValue(consulta([]));
    const { queryByText, rerender } = await render(<InvitacionesPendientes />);
    expect(queryByText('Aceptar')).toBeNull();

    vacia.mockReturnValue(consulta(undefined, { isError: true }));
    rerender(<InvitacionesPendientes />);
    expect(queryByText('Aceptar')).toBeNull();
  });
});
