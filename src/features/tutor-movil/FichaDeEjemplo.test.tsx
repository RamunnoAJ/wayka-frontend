import { render } from '../../pruebas/render';

import { FichaDeEjemplo } from './FichaDeEjemplo';

/**
 * La ficha de ejemplo del estado vacío.
 *
 * Es un mock del cliente: no persiste nada y no toca el backend. Lo único que
 * esta prueba cuida es que **se lea como ejemplo** — una ficha de demostración
 * que se confunda con una real es peor que no tenerla.
 */
describe('FichaDeEjemplo', () => {
  it('se anuncia como ejemplo antes de mostrar nada', async () => {
    const { getByText } = await render(<FichaDeEjemplo />);

    expect(getByText(/EJEMPLO/)).toBeOnTheScreen();
    expect(getByText(/mascota inventada/i)).toBeOnTheScreen();
  });

  it('muestra qué va a tener la ficha: identidad y antecedentes', async () => {
    const { getByText } = await render(<FichaDeEjemplo />);

    expect(getByText('Malbec')).toBeOnTheScreen();
    expect(getByText('Vacuna')).toBeOnTheScreen();
    expect(getByText('Antirrábica · 2023')).toBeOnTheScreen();
  });
});
