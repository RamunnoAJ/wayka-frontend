import { render } from '../pruebas/render';

import { FileDropzone } from './FileDropzone';
import { UploadItem } from './UploadItem';

/**
 * Los dos componentes de la carga de adjuntos, probados por lo que el design
 * system pidió explícitamente y una pantalla puede romper sin darse cuenta:
 *
 * 1. **El límite se lee antes de elegir el archivo.** El backend responde 413
 *    cuando el archivo excede el máximo (contrato, `subirAdjunto`); que ese sea
 *    el primer aviso es el viaje perdido que la interfaz puede evitar.
 * 2. **Cada rol retira solo lo que subió** (regla 2.4). El adjunto ajeno se ve
 *    completo, con la autoría a la vista y sin acción de retirar.
 *
 * No se prueba cómo se ve ninguno de los dos: eso es del design system.
 */
describe('FileDropzone', () => {
  it('muestra el límite y el formato admitido antes de elegir el archivo', async () => {
    const { getByText } = await render(<FileDropzone type="pdf" maxSizeMB={10} />);

    expect(getByText('PDF · hasta 10 MB')).toBeVisible();
  });

  it('sigue mostrando el límite cuando degrada a botón, sin arrastre', async () => {
    const { getByText, getByRole } = await render(
      <FileDropzone type="foto" maxSizeMB={5} dragDrop={false} />,
    );

    expect(getByRole('button', { name: 'Elegir foto' })).toBeVisible();
    expect(getByText('JPG, PNG o HEIC · hasta 5 MB')).toBeVisible();
  });

  it('rechazado dice el motivo concreto, no que algo falló', async () => {
    const { getByText } = await render(
      <FileDropzone
        type="foto"
        state="rejected"
        rejectedReason="Supera el límite de 10 MB"
        dragDrop={false}
      />,
    );

    expect(getByText('Supera el límite de 10 MB')).toBeVisible();
  });
});

describe('UploadItem', () => {
  it('no ofrece retirar el adjunto de otro rol, y dice de quién es', async () => {
    const { queryByRole, getByText } = await render(
      <UploadItem
        name="carnet.pdf"
        type="pdf"
        owner="other"
        ownerName="Ana Ruiz"
        onRemove={jest.fn()}
      />,
    );

    expect(getByText('Subido por Ana Ruiz')).toBeVisible();
    expect(queryByRole('button', { name: 'Retirar el adjunto' })).toBeNull();
  });

  it('el propio sí se retira', async () => {
    const { getByRole } = await render(
      <UploadItem name="herida.jpg" owner="mine" onRemove={jest.fn()} />,
    );

    expect(getByRole('button', { name: 'Retirar el adjunto' })).toBeVisible();
  });

  it('mientras sube, la acción cancela en vez de retirar', async () => {
    const { getByRole } = await render(
      <UploadItem name="herida.jpg" status="subiendo" progress={40} onRemove={jest.fn()} />,
    );

    expect(getByRole('button', { name: 'Cancelar la subida' })).toBeVisible();
  });

  it('el fallo trae el dato del error y la salida para reintentar', async () => {
    const { getByText, getByRole } = await render(
      <UploadItem
        name="estudio.pdf"
        type="estudio"
        status="fallo"
        errorMessage="Supera el límite de 10 MB"
        onRetry={jest.fn()}
        onRemove={jest.fn()}
      />,
    );

    expect(getByText('Supera el límite de 10 MB')).toBeVisible();
    expect(getByRole('button', { name: 'Reintentar' })).toBeVisible();
  });
});
