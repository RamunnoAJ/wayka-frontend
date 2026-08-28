import { fireEvent, waitFor } from '@testing-library/react-native';
import * as DocumentPicker from 'expo-document-picker';

import { subirAdjunto } from '../../api/adjunto';
import { TAMANO_MAXIMO_MB } from '../../lib/archivos';
import { render } from '../../pruebas/render';

import { SubidaDeAdjunto } from './SubidaDeAdjunto';

jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));
jest.mock('../../api/adjunto', () => ({ subirAdjunto: jest.fn() }));

const elegirDelSistema = DocumentPicker.getDocumentAsync as jest.Mock;
const subir = subirAdjunto as jest.Mock;

function devuelveArchivo(cambios: Record<string, unknown> = {}) {
  elegirDelSistema.mockResolvedValue({
    canceled: false,
    assets: [
      {
        uri: 'file:///tmp/placa.jpg',
        name: 'placa.jpg',
        mimeType: 'image/jpeg',
        size: 1024 * 1024,
        ...cambios,
      },
    ],
  });
}

/**
 * Lo que se prueba es la regla, no el layout: **la pantalla no manda al backend
 * un archivo que el backend va a rechazar**. El 413 y el error de tipo existen
 * igual del otro lado; esto evita subir 10 MB por red móvil para enterarse.
 *
 * La suite corre con el preset nativo, donde no hay arrastre: la zona degrada a
 * un botón y por eso se lo busca por "Elegir foto" y no por "Elegir del disco".
 */
describe('SubidaDeAdjunto', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('muestra el límite antes de que el usuario elija nada', async () => {
    const { getByText } = await render(<SubidaDeAdjunto pacienteId="p1" />);

    expect(getByText(`JPG, PNG o HEIC · hasta ${TAMANO_MAXIMO_MB} MB`)).toBeVisible();
  });

  it('no sube el archivo que supera el límite, y dice por qué', async () => {
    devuelveArchivo({ size: (TAMANO_MAXIMO_MB + 1) * 1024 * 1024 });
    const { getByRole, getByText } = await render(<SubidaDeAdjunto pacienteId="p1" />);

    await fireEvent.press(getByRole('button', { name: 'Elegir foto' }));

    await waitFor(() =>
      expect(getByText(`Supera el límite de ${TAMANO_MAXIMO_MB} MB`)).toBeVisible(),
    );
    expect(subir).not.toHaveBeenCalled();
  });

  it('no sube el archivo cuyo formato no corresponde al tipo declarado', async () => {
    devuelveArchivo({ name: 'informe.pdf', mimeType: 'application/pdf' });
    const { getByRole, getByText } = await render(<SubidaDeAdjunto pacienteId="p1" />);

    // El tipo declarado por defecto es "foto", y un PDF no es una foto.
    await fireEvent.press(getByRole('button', { name: 'Elegir foto' }));

    await waitFor(() => expect(getByText('Ese archivo no es JPG, PNG o HEIC')).toBeVisible());
    expect(subir).not.toHaveBeenCalled();
  });

  it('el archivo válido sube declarando el tipo, y el evento cuando lo hay', async () => {
    devuelveArchivo();
    subir.mockResolvedValue({ id: 'a1' });
    const { getByRole } = await render(<SubidaDeAdjunto pacienteId="p1" eventoId="e1" />);

    await fireEvent.press(getByRole('button', { name: 'Elegir foto' }));

    await waitFor(() => expect(subir).toHaveBeenCalledTimes(1));
    expect(subir).toHaveBeenCalledWith(
      'p1',
      expect.objectContaining({ tipo: 'foto', evento_id: 'e1' }),
    );
  });

  it('cancelar el selector no es un error: no pasa nada', async () => {
    elegirDelSistema.mockResolvedValue({ canceled: true, assets: null });
    const { getByRole, queryByText } = await render(<SubidaDeAdjunto pacienteId="p1" />);

    await fireEvent.press(getByRole('button', { name: 'Elegir foto' }));

    await waitFor(() => expect(subir).not.toHaveBeenCalled());
    expect(queryByText('No se pudo abrir el selector')).toBeNull();
  });

  // La cámara es el camino corto para la foto que todavía no existe. No
  // reemplaza al selector: los dos tienen que seguir estando.
  it('ofrece sacar una foto además de elegir un archivo', async () => {
    const { getByRole } = await render(<SubidaDeAdjunto pacienteId="p1" />);

    expect(getByRole('button', { name: 'Sacar una foto' })).toBeVisible();
    expect(getByRole('button', { name: 'Elegir foto' })).toBeVisible();
  });

  // Un PDF no sale de una cámara. El modo documento produce una imagen, así que
  // vive bajo los tipos que sí la admiten.
  it('no ofrece la cámara cuando el tipo declarado es PDF', async () => {
    const { getByRole, queryByRole } = await render(<SubidaDeAdjunto pacienteId="p1" />);

    await fireEvent.press(getByRole('button', { name: 'Tipo de archivo' }));
    await fireEvent.press(getByRole('menuitem', { name: 'PDF' }));

    await waitFor(() => expect(queryByRole('button', { name: 'Sacar una foto' })).toBeNull());
  });

  it('el fallo del servidor deja el archivo a la vista, con su motivo y el reintento', async () => {
    devuelveArchivo();
    subir.mockRejectedValue(new Error('El bucket no responde'));
    const { getByRole, getByText } = await render(<SubidaDeAdjunto pacienteId="p1" />);

    await fireEvent.press(getByRole('button', { name: 'Elegir foto' }));

    await waitFor(() => expect(getByText('placa.jpg')).toBeVisible());
    expect(getByRole('button', { name: 'Reintentar' })).toBeVisible();
  });
});
