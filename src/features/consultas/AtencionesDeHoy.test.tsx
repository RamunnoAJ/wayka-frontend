// En @testing-library/react-native v14 tanto `render` como `fireEvent` son
// asíncronos: sin esperarlos, la aserción corre sobre el árbol anterior.
import { fireEvent } from '@testing-library/react-native';

import type { ConsultaAtendidaConPaciente } from '../../api/consulta';
import { render } from '../../pruebas/render';

import { AtencionesDeHoy } from './AtencionesDeHoy';
import { useAtencionesDeLaClinica, useDarDeBajaAtencion } from './queries';

jest.mock('./queries', () => ({
  useAtencionesDeLaClinica: jest.fn(),
  useDarDeBajaAtencion: jest.fn(),
}));

const useAtencionesMock = useAtencionesDeLaClinica as jest.MockedFunction<
  typeof useAtencionesDeLaClinica
>;
const useDarDeBajaMock = useDarDeBajaAtencion as jest.MockedFunction<typeof useDarDeBajaAtencion>;

const darDeBaja = jest.fn();

function atencion(sobreescribe: Partial<ConsultaAtendidaConPaciente> = {}) {
  return {
    consulta: {
      id: 'ca1',
      paciente_id: 'p1',
      clinica_id: 'cl1',
      veterinario_id: 'v1',
      cita_id: null,
      origen: 'espontanea',
      fecha_hora: '2026-09-01T14:30:00-03:00',
      registrada_por_usuario_id: 'u1',
      asentada_automaticamente: false,
      created_at: '2026-09-01T14:30:00-03:00',
      updated_at: '2026-09-01T14:30:00-03:00',
    },
    paciente_nombre: 'Frida',
    veterinario_nombre: 'Dra. Paz',
    eventos_clinicos_n: 0,
    zona_horaria: 'America/Argentina/Buenos_Aires',
    ...sobreescribe,
  } as ConsultaAtendidaConPaciente;
}

function listaCargada(data: ConsultaAtendidaConPaciente[]) {
  return { isPending: false, isError: false, data, refetch: jest.fn() } as unknown as ReturnType<
    typeof useAtencionesDeLaClinica
  >;
}

beforeEach(() => {
  darDeBaja.mockClear();
  useDarDeBajaMock.mockReturnValue({
    mutate: darDeBaja,
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useDarDeBajaAtencion>);
});

it('abre en lo que falta documentar, no en todo lo del día', async () => {
  useAtencionesMock.mockReturnValue(listaCargada([atencion()]));

  await render(<AtencionesDeHoy onAbrirPaciente={jest.fn()} />);

  expect(useAtencionesMock).toHaveBeenCalledWith(expect.objectContaining({ sin_historial: true }));
});

it('la atención sin historial lleva a la ficha donde se carga', async () => {
  useAtencionesMock.mockReturnValue(listaCargada([atencion()]));
  const abrir = jest.fn();

  const pantalla = await render(<AtencionesDeHoy onAbrirPaciente={abrir} />);
  await fireEvent.press(pantalla.getByLabelText('Abrir la ficha de Frida'));

  expect(abrir).toHaveBeenCalledWith('p1');
});

it('no ofrece dar de baja un asiento que ya tiene historial colgado', async () => {
  useAtencionesMock.mockReturnValue(listaCargada([atencion({ eventos_clinicos_n: 2 })]));

  const pantalla = await render(<AtencionesDeHoy onAbrirPaciente={jest.fn()} />);

  expect(pantalla.queryByLabelText('Dar de baja el asiento de Frida')).toBeNull();
  expect(pantalla.getByText('2 en el historial')).toBeTruthy();
});

it('dar de baja el asiento manda el id de la atención', async () => {
  useAtencionesMock.mockReturnValue(listaCargada([atencion()]));

  const pantalla = await render(<AtencionesDeHoy onAbrirPaciente={jest.fn()} />);
  await fireEvent.press(pantalla.getByLabelText('Dar de baja el asiento de Frida'));

  expect(darDeBaja).toHaveBeenCalledWith('ca1');
});

it('con todo documentado la lista queda vacía, y eso es la respuesta', async () => {
  useAtencionesMock.mockReturnValue(listaCargada([]));

  const pantalla = await render(<AtencionesDeHoy onAbrirPaciente={jest.fn()} />);

  expect(pantalla.getByText('Todo lo de hoy está documentado')).toBeTruthy();
});
