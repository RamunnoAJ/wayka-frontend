import { fireEvent, waitFor } from '@testing-library/react-native';

import { emitir } from '../../lib/telemetria';
import { render } from '../../pruebas/render';

import * as sincronizacion from '../sincronizacion/queries';

import { CargaDeAntecedentes } from './CargaDeAntecedentes';

jest.mock('../../lib/telemetria', () => ({ emitir: jest.fn() }));

const emitirMock = emitir as jest.MockedFunction<typeof emitir>;

beforeEach(() => emitirMock.mockClear());

/**
 * El paso de antecedentes (Alcance de Plataformas, 5.12). Lo que se prueba acá
 * es el recorrido, que es donde vive la decisión de producto: se cargan varios
 * seguidos y el paso se puede saltear entero.
 */
function mutacionFalsa(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    mutate: jest.fn((_entrada: unknown, opciones?: { onSuccess?: (dato: unknown) => void }) =>
      opciones?.onSuccess?.({ id: 'ec-1', enCola: false }),
    ),
    isPending: false,
    error: null,
    reset: jest.fn(),
    ...overrides,
  } as never;
}

/**
 * Se falsean los dos hooks de la cola de sincronización y no la cola misma: lo
 * que se prueba acá es el recorrido de la pantalla, no por qué camino sale la
 * escritura — de eso se ocupan los tests de sincronización.
 */
function cargaFalsa() {
  jest.spyOn(sincronizacion, 'useCargarAntecedenteDelTutor').mockReturnValue(mutacionFalsa());
  jest.spyOn(sincronizacion, 'useRetirarAntecedenteDelTutor').mockReturnValue(mutacionFalsa());
}

afterEach(() => jest.restoreAllMocks());

describe('CargaDeAntecedentes', () => {
  it('ofrece las cuatro cosas que el tutor sabe nombrar, no los siete tipos del historial', async () => {
    cargaFalsa();
    const { getByText, queryByText } = await render(
      <CargaDeAntecedentes pacienteId="p-1" onTerminar={jest.fn()} />,
    );

    expect(getByText('Una vacuna')).toBeOnTheScreen();
    expect(getByText('Una alergia')).toBeOnTheScreen();
    expect(getByText('Algo que toma ahora')).toBeOnTheScreen();
    expect(getByText('Otra cosa que le pasó')).toBeOnTheScreen();
    // Los nombres del modelo no se le muestran a nadie.
    expect(queryByText('Urgencia')).toBeNull();
  });

  // Vaciar una libreta son seis o siete entradas: volver al principio en cada
  // una convierte diez minutos en veinte.
  it('después de guardar vuelve al selector, con lo ya cargado a la vista', async () => {
    cargaFalsa();
    const { getByLabelText, getByText } = await render(
      <CargaDeAntecedentes pacienteId="p-1" onTerminar={jest.fn()} />,
    );

    await fireEvent.press(getByText('Una vacuna'));
    await fireEvent.changeText(getByLabelText('¿Qué vacuna?'), 'Antirrábica');
    await fireEvent.press(getByText('Guardar'));

    await waitFor(() => expect(getByText('Una alergia')).toBeOnTheScreen());
    expect(getByText('YA CARGASTE 1')).toBeOnTheScreen();
    expect(getByText('Vacuna: Antirrábica')).toBeOnTheScreen();
  });

  // El paso no es bloqueante: la mascota se creó igual (Reglas de Negocio, 4.17).
  it('en el onboarding la salida dice que se está salteando un paso', async () => {
    cargaFalsa();
    const onTerminar = jest.fn();
    const { getByText } = await render(
      <CargaDeAntecedentes pacienteId="p-1" enOnboarding onTerminar={onTerminar} />,
    );

    await fireEvent.press(getByText('Ahora no'));

    expect(onTerminar).toHaveBeenCalled();
  });

  // Un "lo hago después" a secas deja la decisión sin la mitad que importa:
  // cargarlo se puede en cualquier momento, y hasta que no esté cargado una
  // urgencia empieza a ciegas.
  it('la salida del onboarding dice qué se pierde por saltear, con el nombre de la mascota', async () => {
    cargaFalsa();
    const { getByText } = await render(
      <CargaDeAntecedentes
        pacienteId="p-1"
        nombreDeMascota="Malbec"
        enOnboarding
        onTerminar={jest.fn()}
      />,
    );

    expect(getByText(/urgencia antes.*sin saber nada de Malbec/i)).toBeOnTheScreen();
  });

  // La foto es un paso aparte del alta y su fracaso no la revierte: lo único
  // que hace falta es decirlo (Reglas de Negocio, 4.17).
  it('avisa que la foto no se subió, sin dar la mascota por perdida', async () => {
    cargaFalsa();
    const { getByText } = await render(
      <CargaDeAntecedentes
        pacienteId="p-1"
        nombreDeMascota="Malbec"
        enOnboarding
        fotoQueNoSubio
        onTerminar={jest.fn()}
      />,
    );

    expect(getByText('La foto no se subió')).toBeOnTheScreen();
    expect(getByText(/Malbec quedó cargada igual/i)).toBeOnTheScreen();
  });

  it('desde la ficha la salida es simplemente volver', async () => {
    cargaFalsa();
    const { getByText, queryByText } = await render(
      <CargaDeAntecedentes pacienteId="p-1" onTerminar={jest.fn()} />,
    );

    expect(getByText('Volver a la ficha')).toBeOnTheScreen();
    expect(queryByText(/saltear/i)).toBeNull();
  });

  // Se emite al salir y no al tocar el botón: el que se va con el gesto de
  // volver también resolvió el paso, y sin contarlo el denominador del embudo
  // mentiría hacia abajo justo en el caso que más interesa (Telemetría, 5.3).
  it('al salir del paso emite el embudo con sus dos cortes', async () => {
    cargaFalsa();
    const { unmount } = await render(
      <CargaDeAntecedentes pacienteId="p-1" enOnboarding onTerminar={jest.fn()} />,
    );

    await unmount();

    expect(emitirMock).toHaveBeenCalledWith('paso_de_antecedentes_resuelto', {
      desde: 'onboarding',
      resultado: 'salteo',
    });
  });

  it('el embudo distingue al que cargó algo del que siguió de largo', async () => {
    cargaFalsa();
    const { getByLabelText, getByText, unmount } = await render(
      <CargaDeAntecedentes pacienteId="p-1" onTerminar={jest.fn()} />,
    );

    await fireEvent.press(getByText('Una vacuna'));
    await fireEvent.changeText(getByLabelText('¿Qué vacuna?'), 'Antirrábica');
    await fireEvent.press(getByText('Guardar'));
    await unmount();

    expect(emitirMock).toHaveBeenCalledWith('paso_de_antecedentes_resuelto', {
      desde: 'ficha',
      resultado: 'cargo',
    });
  });

  // Fotografiar una libreta y escribir una vacuna son dos tareas distintas:
  // mezclarlas obliga a decidir cuál se hace primero cuando no hace falta.
  it('los documentos son una etapa aparte, con la cámara del paso de adjuntos', async () => {
    cargaFalsa();
    const { getByText } = await render(
      <CargaDeAntecedentes pacienteId="p-1" onTerminar={jest.fn()} />,
    );

    await fireEvent.press(getByText('Sumar fotos de la libreta'));

    await waitFor(() => expect(getByText('Fotos de la libreta')).toBeOnTheScreen());
    expect(getByText('Volver a los antecedentes')).toBeOnTheScreen();
  });

  it('con algo cargado, terminar pasa por el resumen antes de salir', async () => {
    cargaFalsa();
    const onTerminar = jest.fn();
    const { getByLabelText, getByText } = await render(
      <CargaDeAntecedentes pacienteId="p-1" enOnboarding onTerminar={onTerminar} />,
    );

    await fireEvent.press(getByText('Una vacuna'));
    await fireEvent.changeText(getByLabelText('¿Qué vacuna?'), 'Antirrábica');
    await fireEvent.press(getByText('Guardar'));
    await waitFor(() => expect(getByText('Listo, terminar')).toBeOnTheScreen());
    await fireEvent.press(getByText('Listo, terminar'));

    await waitFor(() => expect(getByText('Armaste la ficha')).toBeOnTheScreen());
    expect(onTerminar).not.toHaveBeenCalled();
    expect(getByText('Quitar')).toBeOnTheScreen();

    await fireEvent.press(getByText('Listo'));
    expect(onTerminar).toHaveBeenCalled();
  });

  // Pararlo en una pantalla que dice "no cargaste nada" sería cobrarle un toque
  // más a quien ya dijo que no tenía nada para cargar.
  it('sin nada cargado, saltear sale directo y no muestra ningún resumen', async () => {
    cargaFalsa();
    const onTerminar = jest.fn();
    const { getByText, queryByText } = await render(
      <CargaDeAntecedentes pacienteId="p-1" enOnboarding onTerminar={onTerminar} />,
    );

    await fireEvent.press(getByText('Ahora no'));

    expect(onTerminar).toHaveBeenCalled();
    expect(queryByText('Armaste la ficha')).toBeNull();
  });
});
