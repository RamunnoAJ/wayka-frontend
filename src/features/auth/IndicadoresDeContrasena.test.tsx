import { render } from '../../pruebas/render';

import { IndicadorDeCoincidencia, ReglasDeContrasena } from './IndicadoresDeContrasena';

/**
 * Los indicadores que acompañan a toda contraseña nueva. Lo que se prueba es
 * que digan la verdad mientras se escribe: la política de la regla 2.1 se
 * muestra desde el vacío, y la coincidencia recién cuando hay algo repetido.
 */
describe('ReglasDeContrasena', () => {
  it('muestra la política aunque no se haya escrito nada', async () => {
    const { getByText } = await render(<ReglasDeContrasena valor="" />);

    expect(getByText('Al menos 8 caracteres')).toBeTruthy();
    expect(getByText('Una mayúscula')).toBeTruthy();
    expect(getByText('Un número')).toBeTruthy();
  });
});

describe('IndicadorDeCoincidencia', () => {
  it('no dice nada mientras la repetición está vacía', async () => {
    const { queryByText } = await render(<IndicadorDeCoincidencia nueva="Nueva1234" repetida="" />);

    expect(queryByText(/coinciden/i)).toBeNull();
  });

  it('avisa cuando las dos difieren', async () => {
    const { getByText } = await render(
      <IndicadorDeCoincidencia nueva="Nueva1234" repetida="Otra12345" />,
    );

    expect(getByText('Las dos no coinciden')).toBeTruthy();
  });

  it('confirma cuando las dos son iguales', async () => {
    const { getByText } = await render(
      <IndicadorDeCoincidencia nueva="Nueva1234" repetida="Nueva1234" />,
    );

    expect(getByText('Las dos coinciden')).toBeTruthy();
  });
});
