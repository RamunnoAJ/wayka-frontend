import { fireEvent } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

import type { Adjunto } from '../../api/adjunto';
import { render } from '../../pruebas/render';
import { useRetirarAdjunto, useSubirAdjunto } from '../paciente/queries';

import { useAdjuntosDeMiMascota } from './queries';

/**
 * La ficha del tutor y la del veterinario leen los mismos adjuntos por claves
 * distintas: en el dispositivo los del tutor salen del namespace de la copia
 * local, que es lo que hace que la pantalla abra sin conexión.
 *
 * Lo que se prueba es que subir un archivo refresque **la lista que el usuario
 * está mirando**. Con la mutación invalidando solo la clave del veterinario, el
 * tutor subía una foto y no la veía hasta volver a entrar a la mascota.
 */
jest.mock('../../lib/base-local', () => ({ hayCopiaLocal: true }));

jest.mock('../../api/adjunto', () => ({
  ...jest.requireActual('../../api/adjunto'),
  listarAdjuntos: jest.fn(),
  subirAdjunto: jest.fn(),
  retirarAdjunto: jest.fn(),
}));

const { listarAdjuntos, subirAdjunto, retirarAdjunto } = jest.requireMock('../../api/adjunto') as {
  listarAdjuntos: jest.Mock;
  subirAdjunto: jest.Mock;
  retirarAdjunto: jest.Mock;
};

function adjunto(id: string, nombre: string): Adjunto {
  return {
    id,
    paciente_id: 'mascota-1',
    evento_id: null,
    subido_por_usuario_id: 'cuenta-1',
    tipo: 'foto',
    nombre_archivo: nombre,
    content_type: 'image/jpeg',
    tamano_bytes: 1024,
    archivo_url: `https://archivos/${id}`,
    es_foto_perfil: false,
  } as Adjunto;
}

const CARNET = adjunto('adj-1', 'carnet.jpg');
const HERIDA = adjunto('adj-2', 'herida.jpg');

/** La ficha del tutor: mira por su clave y sube por la mutación compartida. */
function FichaDeMiMascota() {
  const adjuntos = useAdjuntosDeMiMascota('mascota-1');
  const subir = useSubirAdjunto('mascota-1');
  const retirar = useRetirarAdjunto('mascota-1');

  return (
    <>
      <Text>
        {`lista: ${adjuntos.data?.adjuntos.map((a) => a.nombre_archivo).join(', ') ?? '-'}`}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Subir la foto"
        onPress={() =>
          subir.mutate({
            archivo: {
              uri: 'file:///herida.jpg',
              nombre: 'herida.jpg',
              contentType: 'image/jpeg',
              tamanoBytes: 1024,
            },
            tipo: 'foto',
          })
        }
      >
        <Text>Subir</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Retirar el carnet"
        onPress={() => retirar.mutate(CARNET.id)}
      >
        <Text>Retirar</Text>
      </Pressable>
    </>
  );
}

beforeEach(() => {
  listarAdjuntos.mockReset();
  subirAdjunto.mockReset();
  retirarAdjunto.mockReset();
  listarAdjuntos.mockResolvedValueOnce([CARNET]).mockResolvedValue([CARNET, HERIDA]);
  subirAdjunto.mockResolvedValue(HERIDA);
  retirarAdjunto.mockResolvedValue(undefined);
});

it('muestra el archivo recién subido sin volver a entrar a la mascota', async () => {
  const { findByText, getByLabelText } = await render(<FichaDeMiMascota />);

  expect(await findByText('lista: carnet.jpg')).toBeTruthy();

  await fireEvent.press(getByLabelText('Subir la foto'));

  expect(await findByText('lista: carnet.jpg, herida.jpg')).toBeTruthy();
});

// Retirar tenía el mismo agujero que subir: invalidaba solo la clave del
// veterinario, así que el archivo seguía en la lista del tutor.
it('saca de la lista el archivo retirado sin volver a entrar a la mascota', async () => {
  listarAdjuntos.mockReset();
  listarAdjuntos.mockResolvedValueOnce([CARNET, HERIDA]).mockResolvedValue([HERIDA]);

  const { findByText, getByLabelText } = await render(<FichaDeMiMascota />);

  expect(await findByText('lista: carnet.jpg, herida.jpg')).toBeTruthy();

  await fireEvent.press(getByLabelText('Retirar el carnet'));

  expect(await findByText('lista: herida.jpg')).toBeTruthy();
});
