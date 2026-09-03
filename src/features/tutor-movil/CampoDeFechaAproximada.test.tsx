import { fireEvent } from '@testing-library/react-native';

import { render } from '../../pruebas/render';

import { CampoDeFechaAproximada, type FechaDeclarada } from './CampoDeFechaAproximada';

/**
 * Una libreta de hace cinco años dice el año, y a veces el mes. Ese es el caso
 * normal de esta pantalla y no el degradado: lo que no se declara se rellena con
 * `01` y viaja con la precisión al lado (Modelo de Datos, 4.5).
 */
async function montar(valor: FechaDeclarada) {
  const onChange = jest.fn();
  const pantalla = await render(<CampoDeFechaAproximada valor={valor} onChange={onChange} />);
  return { ...pantalla, onChange };
}

describe('CampoDeFechaAproximada', () => {
  it('con precisión de año no pide ni el mes ni el día', async () => {
    const { queryByText } = await montar({ fecha: '2023-01-01', precision: 'anio' });

    expect(queryByText('Mes')).toBeNull();
    expect(queryByText('Día')).toBeNull();
  });

  it('con precisión de mes pide el mes y no el día', async () => {
    const { queryByText } = await montar({ fecha: '2023-07-01', precision: 'mes' });

    expect(queryByText('Mes')).toBeTruthy();
    expect(queryByText('Día')).toBeNull();
  });

  // Lo que la precisión declara desconocido se rellena acá y no en el servidor:
  // lo que se muestra y lo que se manda tienen que ser lo mismo.
  it('el año que se escribe sale con el mes y el día en 01', async () => {
    const { getByDisplayValue, onChange } = await montar({
      fecha: '2023-01-01',
      precision: 'anio',
    });

    await fireEvent.changeText(getByDisplayValue('2023'), '2019');

    expect(onChange).toHaveBeenCalledWith({ fecha: '2019-01-01', precision: 'anio' });
  });

  it('no acepta letras ni un año de más de cuatro dígitos', async () => {
    const { getByDisplayValue, onChange } = await montar({
      fecha: '2023-01-01',
      precision: 'anio',
    });

    await fireEvent.changeText(getByDisplayValue('2023'), '20a234567');

    expect(onChange).toHaveBeenCalledWith({ fecha: '2023-01-01', precision: 'anio' });
  });
});
