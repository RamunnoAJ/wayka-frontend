import { fireEvent, waitFor } from '@testing-library/react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { ActionSheetIOS } from 'react-native';

import { subirAdjunto } from '../../api/adjunto';
import { TAMANO_MAXIMO_MB } from '../../lib/archivos';
import { render } from '../../pruebas/render';

import { SubidaDeAdjunto } from './SubidaDeAdjunto';

jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));
jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
jest.mock('../../api/adjunto', () => ({ subirAdjunto: jest.fn() }));

const abrirArchivos = DocumentPicker.getDocumentAsync as jest.Mock;
const abrirGaleria = ImagePicker.launchImageLibraryAsync as jest.Mock;
const subir = subirAdjunto as jest.Mock;

/**
 * El tipo por defecto es "foto", y una foto sale de la galería: en iOS el
 * selector de documentos abre la app Archivos, donde las fotos del teléfono no
 * están. Por eso el mock que usan casi todas las pruebas es el de la galería.
 */
function devuelveArchivo(cambios: Record<string, unknown> = {}) {
  abrirGaleria.mockResolvedValue({
    canceled: false,
    assets: [
      {
        uri: 'file:///tmp/placa.jpg',
        fileName: 'placa.jpg',
        mimeType: 'image/jpeg',
        fileSize: 1024 * 1024,
        ...cambios,
      },
    ],
  });
}

/** Lo que devuelve el selector de documentos, con la forma de su propia API. */
function devuelveDocumento(cambios: Record<string, unknown> = {}) {
  abrirArchivos.mockResolvedValue({
    canceled: false,
    assets: [
      {
        uri: 'file:///tmp/informe.pdf',
        name: 'informe.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        ...cambios,
      },
    ],
  });
}

/** Responde la hoja de acción de "estudio" eligiendo la opción `indice`. */
function eligeEnLaHoja(indice: number) {
  return jest
    .spyOn(ActionSheetIOS, 'showActionSheetWithOptions')
    .mockImplementation((_opciones, responder) => responder(indice));
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
    devuelveArchivo({ fileSize: (TAMANO_MAXIMO_MB + 1) * 1024 * 1024 });
    const { getByRole, getByText } = await render(<SubidaDeAdjunto pacienteId="p1" />);

    await fireEvent.press(getByRole('button', { name: 'Elegir foto' }));

    await waitFor(() =>
      expect(getByText(`Supera el límite de ${TAMANO_MAXIMO_MB} MB`)).toBeVisible(),
    );
    expect(subir).not.toHaveBeenCalled();
  });

  it('no sube el archivo cuyo formato no corresponde al tipo declarado', async () => {
    devuelveArchivo({ fileName: 'informe.pdf', mimeType: 'application/pdf' });
    const { getByRole, getByText } = await render(<SubidaDeAdjunto pacienteId="p1" />);

    // El tipo declarado por defecto es "foto", y un PDF no es una foto.
    await fireEvent.press(getByRole('button', { name: 'Elegir foto' }));

    await waitFor(() => expect(getByText('Ese archivo no es JPG, PNG o HEIC')).toBeVisible());
    expect(subir).not.toHaveBeenCalled();
  });

  // El nombre se elige antes de tocar el archivo: en el teléfono el selector
  // abre y sube de una, y después ya no hay dónde escribirlo.
  it('sube con el nombre elegido, y lo olvida para el siguiente archivo', async () => {
    devuelveArchivo();
    subir.mockResolvedValue({ id: 'a1' });
    const { getByRole, getByLabelText } = await render(<SubidaDeAdjunto pacienteId="p1" />);

    await fireEvent.changeText(getByLabelText('Nombre del archivo'), 'Carnet de vacunación');
    await fireEvent.press(getByRole('button', { name: 'Elegir foto' }));

    await waitFor(() => expect(subir).toHaveBeenCalled());
    expect(subir.mock.calls[0][1]).toEqual(
      expect.objectContaining({ nombre_archivo: 'Carnet de vacunación' }),
    );

    await fireEvent.press(getByRole('button', { name: 'Elegir foto' }));

    await waitFor(() => expect(subir).toHaveBeenCalledTimes(2));
    expect(subir.mock.calls[1][1].nombre_archivo).toBeUndefined();
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
    abrirGaleria.mockResolvedValue({ canceled: true, assets: null });
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
  // El bug que motivó esto: "elegir foto" abría la app Archivos en iPhone, que
  // es justo el lugar donde las fotos del teléfono no están.
  it('la foto sale de la galería, no de la app Archivos', async () => {
    devuelveArchivo();
    subir.mockResolvedValue({ id: 'a1' });
    const { getByRole } = await render(<SubidaDeAdjunto pacienteId="p1" />);

    await fireEvent.press(getByRole('button', { name: 'Elegir foto' }));

    await waitFor(() => expect(abrirGaleria).toHaveBeenCalledTimes(1));
    expect(abrirArchivos).not.toHaveBeenCalled();
  });

  // Un PDF no vive en la biblioteca de fotos: preguntar de dónde sacarlo sería
  // ofrecer un camino que no lleva a ningún archivo.
  it('el PDF sale de la app Archivos, sin preguntar', async () => {
    devuelveDocumento();
    subir.mockResolvedValue({ id: 'a1' });
    const hoja = eligeEnLaHoja(0);
    const { getByRole } = await render(<SubidaDeAdjunto pacienteId="p1" />);

    await fireEvent.press(getByRole('button', { name: 'Tipo de archivo' }));
    await fireEvent.press(getByRole('menuitem', { name: 'PDF' }));
    await fireEvent.press(getByRole('button', { name: 'Elegir pdf' }));

    await waitFor(() => expect(abrirArchivos).toHaveBeenCalledTimes(1));
    expect(hoja).not.toHaveBeenCalled();
    expect(abrirGaleria).not.toHaveBeenCalled();
  });

  // El estudio vive en los dos lados: la placa en la galería, el informe
  // escaneado entre los archivos. Es el único tipo que pregunta.
  it('el estudio pregunta de dónde sacarlo y respeta la respuesta', async () => {
    devuelveDocumento();
    subir.mockResolvedValue({ id: 'a1' });
    eligeEnLaHoja(1);
    const { getByRole } = await render(<SubidaDeAdjunto pacienteId="p1" />);

    await fireEvent.press(getByRole('button', { name: 'Tipo de archivo' }));
    await fireEvent.press(getByRole('menuitem', { name: 'Estudio' }));
    await fireEvent.press(getByRole('button', { name: 'Elegir estudio' }));

    await waitFor(() => expect(abrirArchivos).toHaveBeenCalledTimes(1));
    expect(abrirGaleria).not.toHaveBeenCalled();
  });

  it('cerrar la hoja sin elegir no abre ningún selector', async () => {
    eligeEnLaHoja(2);
    const { getByRole } = await render(<SubidaDeAdjunto pacienteId="p1" />);

    await fireEvent.press(getByRole('button', { name: 'Tipo de archivo' }));
    await fireEvent.press(getByRole('menuitem', { name: 'Estudio' }));
    await fireEvent.press(getByRole('button', { name: 'Elegir estudio' }));

    await waitFor(() => expect(abrirGaleria).not.toHaveBeenCalled());
    expect(abrirArchivos).not.toHaveBeenCalled();
  });
});
