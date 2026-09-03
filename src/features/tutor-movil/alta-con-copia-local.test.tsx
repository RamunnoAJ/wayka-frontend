import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { crearPaciente } from '../../api/paciente';
import { sincronizar } from '../sincronizacion/motor';

import { useAgregarMiMascota } from './queries';

/**
 * El alta es **en línea**, pero en el dispositivo las pantallas leen la copia
 * local: sin bajar el delta, la mascota recién creada no existe para la ficha ni
 * para el listado, y abrirla daba "no se pudo abrir la ficha" sobre algo que sí
 * se había guardado.
 *
 * Se espera la corrida —y no se dispara y sigue— porque lo que viene justo
 * después es abrir esa ficha.
 */
jest.mock('../../lib/base-local', () => ({ hayCopiaLocal: true }));
jest.mock('../sincronizacion/motor', () => ({ sincronizar: jest.fn() }));
jest.mock('../../api/paciente', () => ({ crearPaciente: jest.fn(), listarPacientes: jest.fn() }));

const crear = crearPaciente as jest.MockedFunction<typeof crearPaciente>;
const correr = sincronizar as jest.MockedFunction<typeof sincronizar>;

function envoltorio({ children }: { children: ReactNode }) {
  const cliente = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false, gcTime: 0 },
    },
  });
  return <QueryClientProvider client={cliente}>{children}</QueryClientProvider>;
}

const ENTRADA = {
  nombre: 'Malbec',
  especie: 'canino',
  raza: 'labrador',
  sexo: 'macho',
  fecha_nacimiento: '2022-05-14',
  peso_actual: 28.4,
};

beforeEach(() => {
  crear.mockReset();
  correr.mockReset();
  crear.mockResolvedValue({ id: 'p-nueva' } as never);
  correr.mockResolvedValue({
    subidas: 0,
    rechazadas: 0,
    cambiosAplicados: 1,
    rehizoLaCopia: false,
  });
});

describe('alta de mi mascota con copia local', () => {
  it('baja el delta antes de devolver la mascota creada', async () => {
    const { result } = await renderHook(() => useAgregarMiMascota(), { wrapper: envoltorio });

    result.current.mutate(ENTRADA);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(correr).toHaveBeenCalled();
    expect(result.current.data).toMatchObject({ id: 'p-nueva' });
  });

  // Una corrida que falla no puede tumbar un alta que el servidor ya aceptó: la
  // mascota está creada, y la copia se pone al día en la corrida siguiente.
  it('si la sincronización falla, el alta sigue siendo un éxito', async () => {
    correr.mockRejectedValue(new Error('sin red'));
    const { result } = await renderHook(() => useAgregarMiMascota(), { wrapper: envoltorio });

    result.current.mutate(ENTRADA);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
