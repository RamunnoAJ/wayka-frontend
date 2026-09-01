// En @testing-library/react-native v14 tanto `render` como `fireEvent` son
// asíncronos: sin esperarlos, la aserción corre sobre el árbol anterior.
import { fireEvent } from '@testing-library/react-native';

import { render } from '../../pruebas/render';

import { AsentarAtencion } from './AsentarAtencion';
import { useAsentarAtencion } from './queries';

jest.mock('./queries', () => ({ useAsentarAtencion: jest.fn() }));

const useAsentarMock = useAsentarAtencion as jest.MockedFunction<typeof useAsentarAtencion>;
const asentar = jest.fn();

beforeEach(() => {
  asentar.mockClear();
  useAsentarMock.mockReturnValue({
    mutate: asentar,
    isPending: false,
    isError: false,
    isSuccess: false,
  } as unknown as ReturnType<typeof useAsentarAtencion>);
});

it('asienta la atención espontánea, que es la que nadie agendó', async () => {
  const pantalla = await render(
    <AsentarAtencion pacienteId="p1" bloqueado={false} motivoBloqueo="" />,
  );

  await fireEvent.press(pantalla.getByLabelText('Atendí sin turno'));

  expect(asentar).toHaveBeenCalledWith({ origen: 'espontanea' });
});

it('distingue la urgencia del resto', async () => {
  const pantalla = await render(
    <AsentarAtencion pacienteId="p1" bloqueado={false} motivoBloqueo="" />,
  );

  await fireEvent.press(pantalla.getByLabelText('Atendí una urgencia'));

  expect(asentar).toHaveBeenCalledWith({ origen: 'urgencia' });
});

it('la ficha en solo lectura no asienta: no hay atención que registrar', async () => {
  const pantalla = await render(
    <AsentarAtencion
      pacienteId="p1"
      bloqueado
      motivoBloqueo="Paciente dado de baja: la ficha queda en solo lectura"
    />,
  );

  // Los dos botones anuncian el mismo motivo, como el resto de las acciones
  // bloqueadas de la ficha: lo que importa es por qué no se puede.
  const bloqueados = pantalla.getAllByLabelText(
    'Paciente dado de baja: la ficha queda en solo lectura',
  );
  await fireEvent.press(bloqueados[0]!);

  expect(asentar).not.toHaveBeenCalled();
});

it('asentada, dice qué falta y no qué se hizo', async () => {
  useAsentarMock.mockReturnValue({
    mutate: asentar,
    isPending: false,
    isError: false,
    isSuccess: true,
  } as unknown as ReturnType<typeof useAsentarAtencion>);

  const pantalla = await render(
    <AsentarAtencion pacienteId="p1" bloqueado={false} motivoBloqueo="" />,
  );

  expect(
    pantalla.getByText('Queda en las atenciones de hoy hasta que le cargues el historial.'),
  ).toBeTruthy();
});
