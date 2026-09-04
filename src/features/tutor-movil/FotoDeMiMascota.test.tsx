import { fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { render } from '../../pruebas/render';

import { FotoDeMiMascota } from './FotoDeMiMascota';

/**
 * La foto de perfil se cambia tocando el avatar y no eligiendo un adjunto
 * (Alcance de Plataformas, 5.3). Lo que se prueba es que el avatar sea eso —una
 * acción, y solo cuando se puede escribir— y que la foto que el backend va a
 * rechazar no llegue a salir.
 */
jest.mock('../../lib/base-local', () => ({ hayCopiaLocal: true }));

jest.mock('../../lib/archivos', () => ({
  ...jest.requireActual('../../lib/archivos'),
  elegirArchivo: jest.fn(),
  preguntarComoSacarLaFoto: jest.fn(),
}));

jest.mock('../../api/adjunto', () => ({
  ...jest.requireActual('../../api/adjunto'),
  subirAdjunto: jest.fn(),
}));

const { elegirArchivo, preguntarComoSacarLaFoto } = jest.requireMock('../../lib/archivos') as {
  elegirArchivo: jest.Mock;
  preguntarComoSacarLaFoto: jest.Mock;
};
const { subirAdjunto } = jest.requireMock('../../api/adjunto') as { subirAdjunto: jest.Mock };

const UNA_FOTO = {
  uri: 'file:///nube.jpg',
  nombre: 'nube.jpg',
  contentType: 'image/jpeg',
  tamanoBytes: 2 * 1024 * 1024,
};

function foto(props: Partial<React.ComponentProps<typeof FotoDeMiMascota>> = {}) {
  return (
    <FotoDeMiMascota pacienteId="mascota-1" nombre="Nube" especie="felino" editable {...props} />
  );
}

beforeEach(() => {
  elegirArchivo.mockReset().mockResolvedValue(UNA_FOTO);
  preguntarComoSacarLaFoto.mockReset().mockResolvedValue('galeria');
  subirAdjunto.mockReset().mockResolvedValue({ id: 'adj-1' });
  jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
});

afterEach(() => jest.restoreAllMocks());

it('el avatar es la acción de poner la foto cuando todavía no hay', async () => {
  const { getByLabelText } = await render(foto());

  expect(getByLabelText('Poner la foto de Nube')).toBeOnTheScreen();
});

it('con una foto cargada, el avatar la cambia', async () => {
  const { getByLabelText } = await render(foto({ fotoUrl: 'https://archivos/nube.jpg' }));

  expect(getByLabelText('Cambiar la foto de Nube')).toBeOnTheScreen();
});

// El co-tutor de solo lectura mira y no escribe (Reglas de Negocio, 3.2), y sin
// conexión no hay URL prefirmada con la que dibujar lo que se elija.
it('sin permiso de escritura el avatar no se toca', async () => {
  const { queryByLabelText } = await render(foto({ editable: false }));

  expect(queryByLabelText('Poner la foto de Nube')).toBeNull();
});

it('sube la foto elegida marcada como foto de perfil', async () => {
  const { getByLabelText } = await render(foto());

  await fireEvent.press(getByLabelText('Poner la foto de Nube'));

  await waitFor(() =>
    expect(subirAdjunto).toHaveBeenCalledWith(
      'mascota-1',
      expect.objectContaining({ archivo: UNA_FOTO, es_foto_perfil: true }),
    ),
  );
});

// El techo se verifica antes de subir: el 413 del backend no puede ser el primer
// aviso después de mandar la foto entera por red móvil.
it('no manda una foto que pasa el techo, y lo dice', async () => {
  elegirArchivo.mockResolvedValue({ ...UNA_FOTO, tamanoBytes: 20 * 1024 * 1024 });
  const { getByLabelText } = await render(foto());

  await fireEvent.press(getByLabelText('Poner la foto de Nube'));

  await waitFor(() => expect(Alert.alert).toHaveBeenCalled());
  expect(subirAdjunto).not.toHaveBeenCalled();
});
