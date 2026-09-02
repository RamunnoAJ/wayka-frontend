// En @testing-library/react-native v14 tanto `render` como `fireEvent` son
// asíncronos: sin `await`, la aserción corre antes de que el árbol se actualice.
import { fireEvent } from '@testing-library/react-native';

import type { Grilla } from '../../api/clinica';
import { horaEnLaClinica, instanteEnLaClinica } from '../../lib/zona';
import { render } from '../../pruebas/render';

import { FormularioDeCita } from './FormularioDeCita';

/**
 * Lo que se prueba acá es la regla, no el layout: **el formulario no ofrece una
 * hora que el backend vaya a rechazar** (regla 2.2). El backend la valida igual;
 * esto evita el viaje perdido y el error que el usuario no puede prevenir.
 */
const GRILLA: Grilla = {
  // Abre todos los dias para que el resultado no dependa del dia de la semana en
  // que caiga la fecha que el test elige.
  franjas: [0, 1, 2, 3, 4, 5, 6].map((dia) => ({
    dia_semana: dia as 0,
    hora_desde: '09:00',
    hora_hasta: '18:00',
  })),
  duracion_turno_minutos: 30,
  zona_horaria: 'America/Argentina/Buenos_Aires',
};

function propsBase() {
  return {
    grilla: GRILLA,
    enviando: false,
    etiquetaGuardar: 'Agendar',
    onGuardar: jest.fn(),
    onCancelar: jest.fn(),
  };
}

describe('FormularioDeCita', () => {
  // El formulario arranca en el día de hoy, así que sin congelar el reloj la
  // prueba pasa a la mañana y falla a la tarde: después de las 17:30 no queda
  // ningún turno disponible y la grilla se reemplaza por un aviso.
  // Las 08:00 **en la clínica**: antes de que abra, así están los 18 turnos del
  // día disponibles. Con la hora del dispositivo, que corre en otra zona, el día
  // por defecto del formulario sería otro.
  beforeEach(() => {
    jest.useFakeTimers({ now: instanteEnLaClinica('2027-01-04', 8 * 60) });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('ofrece solo las horas de la grilla de la clínica', async () => {
    const { getByText, queryByText } = await render(<FormularioDeCita {...propsBase()} />);

    expect(getByText('09:00')).toBeOnTheScreen();
    expect(getByText('09:30')).toBeOnTheScreen();
    expect(getByText('17:30')).toBeOnTheScreen();
    // 09:17 no cae sobre la grilla y 18:00 terminaría después del cierre.
    expect(queryByText('09:17')).toBeNull();
    expect(queryByText('18:00')).toBeNull();
  });

  it('no deja guardar hasta elegir un turno', async () => {
    const props = propsBase();
    const { getByText } = await render(<FormularioDeCita {...props} />);

    await fireEvent.press(getByText('Agendar'));

    expect(props.onGuardar).not.toHaveBeenCalled();
  });

  it('devuelve el turno elegido como un instante, no como una hora suelta', async () => {
    const props = propsBase();
    const { getByText } = await render(<FormularioDeCita {...props} />);

    await fireEvent.press(getByText('10:30'));
    await fireEvent.press(getByText('Agendar'));

    expect(props.onGuardar).toHaveBeenCalledTimes(1);
    const entrada = props.onGuardar.mock.calls[0][0];
    // La hora se comprueba en la zona de la clínica, no con getHours(): el
    // dispositivo está en otra y leerlo local daría las 22:30.
    expect(horaEnLaClinica(new Date(entrada.fecha_programada))).toBe('10:30');
    expect(entrada.notificar_tutor).toBe(true);
  });

  it('avisa en vez de romperse cuando la clínica no tiene horario', async () => {
    const { getByText, queryByText } = await render(
      <FormularioDeCita {...propsBase()} grilla={undefined} />,
    );

    expect(getByText(/Falta el horario de la clínica/)).toBeOnTheScreen();
    expect(queryByText('09:00')).toBeNull();
  });

  it('no ofrece cambiar el tipo al reagendar', async () => {
    // Qué control corresponde es criterio clínico, no del calendario (RN 3.2).
    const { getByText, queryByText } = await render(
      <FormularioDeCita {...propsBase()} soloFechaYAviso />,
    );

    expect(queryByText('Tipo')).toBeNull();
    expect(getByText('Día')).toBeOnTheScreen();
  });
});
