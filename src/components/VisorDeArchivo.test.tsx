import { fireEvent } from '@testing-library/react-native';
import { Linking } from 'react-native';

import { render } from '../pruebas/render';

import { VisorDeArchivo, esImagenMostrable } from './VisorDeArchivo';

/**
 * El visor de adjuntos, probado por lo que distingue un archivo mirable de uno
 * que no lo es — que es la única decisión que toma:
 *
 * 1. **Se mira el content type del servidor, no el tipo declarado.** Un adjunto
 *    de tipo `estudio` puede ser un PDF o una imagen (Modelo de Datos, 4.8), y
 *    el `tipo` no alcanza para saber cuál.
 * 2. **Lo que no se dibuja se delega al sistema**, en vez de dejar una pantalla
 *    vacía que parece un error.
 * 3. **Una imagen que no carga dice que no cargó**, y no que el formato no se
 *    muestra: la URL prefirmada vence en minutos y ese es el caso frecuente.
 *
 * Corren **con movimiento reducido**, que es el camino sin animación del propio
 * visor. No es para esquivar una incomodidad del entorno: lo que estas pruebas
 * cuidan es qué se dibuja, y con la animación puesta habría que afirmar sobre
 * el cuadro en el que quedó el fundido, que es probar reanimated. De paso, el
 * resorte de apertura no sobrevive a la prueba y se dispara sobre el árbol de
 * la siguiente.
 */
jest.mock('react-native-reanimated', () => {
  const real = jest.requireActual('react-native-reanimated');
  // El `default` se repite a mano: esparcir el módulo lo pierde, y con él
  // `Animated.View`, que es lo que el visor usa para el fondo.
  return { ...real, __esModule: true, default: real.default, useReducedMotion: () => true };
});
describe('esImagenMostrable', () => {
  it.each([
    ['image/jpeg', true],
    ['image/png', true],
    ['application/pdf', false],
    ['application/octet-stream', false],
  ])('%s → %s', (contentType, esperado) => {
    expect(esImagenMostrable(contentType)).toBe(esperado);
  });
});

describe('VisorDeArchivo', () => {
  const base = { nombre: 'carnet.pdf', onCerrar: jest.fn() };

  it('dibuja la imagen cuando el servidor dice que es una imagen', async () => {
    const { getByLabelText } = await render(
      <VisorDeArchivo
        {...base}
        nombre="herida.jpg"
        contentType="image/jpeg"
        url="https://bucket/firmada"
      />,
    );

    expect(getByLabelText('herida.jpg')).toBeVisible();
  });

  it('ofrece abrir con el sistema lo que no puede dibujar', async () => {
    const abrir = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);

    const { getByRole } = await render(
      <VisorDeArchivo {...base} contentType="application/pdf" url="https://bucket/firmada" />,
    );

    fireEvent.press(getByRole('button', { name: /Abrir/ }));

    expect(abrir).toHaveBeenCalledWith('https://bucket/firmada');
    abrir.mockRestore();
  });

  it('mientras la URL no llegó no muestra el archivo ni dice que falló', async () => {
    const { queryByRole, queryByText } = await render(
      <VisorDeArchivo {...base} contentType="application/pdf" cargando />,
    );

    expect(queryByRole('button', { name: /Abrir/ })).toBeNull();
    expect(queryByText('No se pudo abrir el archivo')).toBeNull();
  });

  it('un error de la URL se muestra como error y se puede reintentar', async () => {
    const reintentar = jest.fn();

    const { getByText, getByRole } = await render(
      <VisorDeArchivo {...base} contentType="application/pdf" error onReintentar={reintentar} />,
    );

    expect(getByText('No se pudo abrir el archivo')).toBeVisible();
    fireEvent.press(getByRole('button', { name: /Reintentar/i }));
    expect(reintentar).toHaveBeenCalled();
  });
});
