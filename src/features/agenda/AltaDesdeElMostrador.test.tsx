// En @testing-library/react-native v14 tanto `render` como `fireEvent` son
// asíncronos: sin esperarlos, la aserción corre sobre el árbol anterior.
import { fireEvent } from '@testing-library/react-native';

import { render } from '../../pruebas/render';

import { AltaDesdeElMostrador } from './AltaDesdeElMostrador';
import { useCrearTutorDesdeElMostrador, useDarDeAltaDesdeElMostrador, usePadron } from './queries';

jest.mock('./queries', () => ({
  usePadron: jest.fn(),
  useCrearTutorDesdeElMostrador: jest.fn(),
  useDarDeAltaDesdeElMostrador: jest.fn(),
}));

const usePadronMock = usePadron as jest.MockedFunction<typeof usePadron>;
const useCrearTutorMock = useCrearTutorDesdeElMostrador as jest.MockedFunction<
  typeof useCrearTutorDesdeElMostrador
>;
const useDarDeAltaMock = useDarDeAltaDesdeElMostrador as jest.MockedFunction<
  typeof useDarDeAltaDesdeElMostrador
>;

const crearTutor = jest.fn();
const darDeAlta = jest.fn();

function mutacion(mutate: jest.Mock) {
  return { mutate, isPending: false, isError: false, error: null } as unknown as ReturnType<
    typeof useCrearTutorDesdeElMostrador
  >;
}

function padron(
  data: { id: string; nombre: string; contacto: string; tiene_documento: boolean }[],
) {
  return { isPending: false, isError: false, data } as unknown as ReturnType<typeof usePadron>;
}

beforeEach(() => {
  jest.clearAllMocks();
  usePadronMock.mockReturnValue(padron([]));
  useCrearTutorMock.mockReturnValue(mutacion(crearTutor));
  useDarDeAltaMock.mockReturnValue(
    mutacion(darDeAlta) as unknown as ReturnType<typeof useDarDeAltaDesdeElMostrador>,
  );
});

function propsBase() {
  return { onDadaDeAlta: jest.fn(), onCancelar: jest.fn() };
}

describe('AltaDesdeElMostrador', () => {
  // El paso 1 es buscar antes de crear (proceso 4.1): saltearlo es el camino
  // directo a dos fichas de la misma persona.
  it('arranca buscando en el padrón, no cargando la ficha', async () => {
    const { getByText } = await render(<AltaDesdeElMostrador {...propsBase()} />);

    expect(getByText('¿De quién es?')).toBeTruthy();
    expect(getByText(/Paso 1 de 2/)).toBeTruthy();
  });

  // La proyección es lo que protege el dato: el mostrador ve a quién llamar y si
  // la ficha está completa, y nada más.
  it('muestra nombre y contacto, y avisa cuando falta el documento', async () => {
    usePadronMock.mockReturnValue(
      padron([
        { id: 't1', nombre: 'Diego Gómez', contacto: 'diego@correo.test', tiene_documento: true },
        { id: 't2', nombre: 'Ana Gómez', contacto: '+54 11 5544-8891', tiene_documento: false },
      ]),
    );

    const { getByText, getAllByText } = await render(<AltaDesdeElMostrador {...propsBase()} />);
    await fireEvent.changeText(getByText('Nombre o contacto'), 'gomez');

    expect(getByText('diego@correo.test')).toBeTruthy();
    // Solo la que no lo tiene: la etiqueta señala la ficha incompleta, no todas.
    expect(getAllByText('Sin documento')).toHaveLength(1);
  });

  // Documento y dirección no están, y no es que estén ocultos: el backend los
  // ignora para este rol.
  it('la ficha nueva pide nombre, contacto y consentimiento, y nada más', async () => {
    const { getByText, queryByText } = await render(<AltaDesdeElMostrador {...propsBase()} />);
    await fireEvent.press(getByText('Ninguno es: cargar la persona'));

    expect(getByText('Nombre completo')).toBeTruthy();
    expect(getByText('Contacto')).toBeTruthy();
    expect(getByText('Otorgó el consentimiento de uso de datos')).toBeTruthy();
    expect(queryByText(/Documento/)).toBeNull();
    expect(queryByText(/Dirección/)).toBeNull();
  });

  // El chip lo implanta y lo lee el veterinario: si el campo estuviera, el
  // mostrador escribiría un número que el backend descarta sin decir nada.
  it('no pide el microchip de la mascota', async () => {
    usePadronMock.mockReturnValue(
      padron([
        { id: 't1', nombre: 'Diego Gómez', contacto: 'diego@correo.test', tiene_documento: true },
      ]),
    );

    const { getByText, queryByText } = await render(<AltaDesdeElMostrador {...propsBase()} />);
    await fireEvent.changeText(getByText('Nombre o contacto'), 'gomez');
    await fireEvent.press(getByText('Diego Gómez'));

    expect(getByText('La mascota')).toBeTruthy();
    expect(queryByText('Microchip')).toBeNull();
    expect(getByText(/El microchip no se carga acá/)).toBeTruthy();
  });

  // El alta desemboca en el turno: la mascota vuelve en la forma de la cartera,
  // que es la que la pantalla de agendar sabe usar.
  it('devuelve la mascota con el tutor elegido cuando el alta entra', async () => {
    usePadronMock.mockReturnValue(
      padron([
        { id: 't1', nombre: 'Diego Gómez', contacto: 'diego@correo.test', tiene_documento: true },
      ]),
    );
    darDeAlta.mockImplementation((_entrada, opciones) =>
      opciones.onSuccess({ id: 'p9', nombre: 'Luna', especie: 'canino' }),
    );

    const props = propsBase();
    const { getByText } = await render(<AltaDesdeElMostrador {...props} />);
    await fireEvent.changeText(getByText('Nombre o contacto'), 'gomez');
    await fireEvent.press(getByText('Diego Gómez'));

    await fireEvent.changeText(getByText('Nombre'), 'Luna');
    await fireEvent.changeText(getByText('Raza'), 'Caniche');
    await fireEvent.changeText(getByText('Fecha de nacimiento'), '2022-05-14');
    await fireEvent.changeText(getByText('Peso'), '8,4');
    await fireEvent.press(getByText('Dar de alta y agendar'));

    expect(darDeAlta).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: 'Luna', tutor_id: 't1', peso_actual: 8.4 }),
      expect.anything(),
    );
    // El chip no viaja aunque el backend lo ignore: mandarlo sería decir que se
    // puede cargar desde acá.
    expect(darDeAlta.mock.calls[0][0]).not.toHaveProperty('identificador_externo');
    expect(props.onDadaDeAlta).toHaveBeenCalledWith({
      id: 'p9',
      nombre: 'Luna',
      especie: 'canino',
      tutor_nombre: 'Diego Gómez',
      tutor_contacto: 'diego@correo.test',
    });
  });
});
