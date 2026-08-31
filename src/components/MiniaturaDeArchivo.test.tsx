import { fireEvent } from '@testing-library/react-native';
import { render } from '../pruebas/render';

import { MiniaturaDeArchivo } from './VisorDeArchivo';

/**
 * La miniatura de la tarjeta de adjunto.
 *
 * **Va en su propio archivo y no junto al visor**: montar el visor deja
 * animaciones y una carga de imagen en curso que se resuelven después de la
 * prueba, y el árbol de la siguiente aparece vacío. Compartir archivo hacía que
 * estas pruebas dependieran del orden.
 */

describe('MiniaturaDeArchivo', () => {
  const props = {
    // Sin `url` a propósito: el gesto no depende de que haya imagen, y una
    // miniatura con una URL remota deja una carga en curso que se resuelve
    // después de la prueba.
    contentType: 'application/pdf',
    icono: 'file-text',
    alto: 88,
    accessibilityLabel: 'Ver carnet.pdf',
  } as const;

  // Los dos gestos se prueban por separado y no en una sola prueba encadenando
  // los dos eventos: `Pressable` no termina la interacción del toque antes de
  // recibir el mantener, y queda en un estado que rompe el render siguiente.
  it('el toque abre el archivo', async () => {
    const abrir = jest.fn();
    const { getByLabelText } = await render(<MiniaturaDeArchivo {...props} onAbrir={abrir} />);

    fireEvent.press(getByLabelText('Ver carnet.pdf'));

    expect(abrir).toHaveBeenCalledTimes(1);
  });

  it('mantener apretado abre el archivo igual que el toque', async () => {
    const abrir = jest.fn();
    const { getByLabelText } = await render(<MiniaturaDeArchivo {...props} onAbrir={abrir} />);

    fireEvent(getByLabelText('Ver carnet.pdf'), 'longPress');

    expect(abrir).toHaveBeenCalledTimes(1);
  });

  it('sin URL cae al icono en vez de dejar el hueco vacío', async () => {
    const { getByLabelText } = await render(
      <MiniaturaDeArchivo
        contentType="application/pdf"
        icono="file-text"
        alto={88}
        accessibilityLabel="carnet.pdf"
      />,
    );

    expect(getByLabelText('carnet.pdf')).toBeVisible();
  });

  it('con URL de imagen dibuja el archivo y no el icono', async () => {
    const { getByLabelText, toJSON } = await render(
      <MiniaturaDeArchivo
        contentType="image/jpeg"
        url="https://bucket/firmada"
        icono="image"
        alto={88}
        accessibilityLabel="herida.jpg"
      />,
    );

    expect(getByLabelText('herida.jpg')).toBeVisible();
    // Que la URL llegue al árbol es lo único que distingue esta rama de la del
    // icono: la imagen no tiene texto ni rol con el que preguntarlo.
    expect(JSON.stringify(toJSON())).toContain('https://bucket/firmada');
  });
});
