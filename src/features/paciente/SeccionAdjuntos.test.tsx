import { fireEvent, waitFor } from '@testing-library/react-native';

import type { Adjunto } from '../../api/adjunto';
import { render } from '../../pruebas/render';

import { SeccionAdjuntos } from './SeccionAdjuntos';
import * as consultas from './queries';

/**
 * Qué ofrece la fila de un adjunto, que es lo que decide qué puede hacer cada
 * rol sin pedirle nada al backend para enterarse.
 *
 * Las reglas las aplica el backend (Reglas de Negocio, 4.14 y 2.4); lo que se
 * prueba acá es que la interfaz no ofrezca lo que va a ser rechazado —marcar un
 * PDF, renombrar un archivo ajeno— ni esconda lo que sí se puede.
 */
function adjunto(extra: Partial<Adjunto> = {}): Adjunto {
  return {
    id: 'a-1',
    paciente_id: 'p-1',
    subido_por_usuario_id: 'u-1',
    tipo: 'foto',
    nombre_archivo: 'luna.png',
    content_type: 'image/png',
    tamano_bytes: 2048,
    archivo_url: 'https://bucket.test/luna.png?firma=valida',
    es_foto_perfil: false,
    created_at: '2026-01-01T12:00:00Z',
    updated_at: '2026-01-01T12:00:00Z',
    ...extra,
  };
}

function seccion(adjuntos: Adjunto[], props: Partial<Parameters<typeof SeccionAdjuntos>[0]> = {}) {
  return (
    <SeccionAdjuntos
      pacienteId="p-1"
      adjuntos={adjuntos}
      usuarioId="u-1"
      error={false}
      onReintentar={jest.fn()}
      esMovil
      bloqueado={false}
      motivoBloqueo=""
      onRetirar={jest.fn()}
      {...props}
    />
  );
}

/** Las acciones viven detrás del botón de tres puntos de la fila. */
async function abrirMenu(
  pantalla: Awaited<ReturnType<typeof render>>,
  nombre = 'luna.png',
): Promise<void> {
  await fireEvent.press(await pantalla.findByLabelText(`Acciones de ${nombre}`));
}

afterEach(() => jest.restoreAllMocks());

describe('SeccionAdjuntos · foto de la mascota', () => {
  // La foto de perfil se cambia tocando el avatar de la ficha (Alcance de
  // Plataformas, 5.3). Elegirla acá obligaba a saber que es un adjunto marcado,
  // que es cómo se guarda y no cómo se piensa.
  it('no ofrece marcar ninguna como foto de la mascota', async () => {
    const pantalla = await render(seccion([adjunto()]));

    await abrirMenu(pantalla);

    expect(pantalla.queryByText('Usar como foto')).toBeNull();
  });

  // Cuál es la vigente sí se dice: es la única forma de saber, desde la lista,
  // qué archivo está encabezando la ficha.
  it('dice cuál es la que la ficha muestra', async () => {
    const pantalla = await render(seccion([adjunto({ es_foto_perfil: true })]));

    expect(pantalla.getByText('Foto de la mascota')).toBeOnTheScreen();
  });
});

describe('SeccionAdjuntos · nombre del archivo', () => {
  it('renombra el archivo propio', async () => {
    const mutate = jest.fn();
    jest
      .spyOn(consultas, 'useRenombrarAdjunto')
      .mockReturnValue({ mutate, isPending: false, isError: false, reset: jest.fn() } as never);
    const pantalla = await render(seccion([adjunto()]));

    await abrirMenu(pantalla);
    await fireEvent.press(pantalla.getByText('Cambiar el nombre'));

    // La extensión no se edita: la conserva el backend.
    const campo = await pantalla.findByDisplayValue('luna');
    await fireEvent.changeText(campo, 'Carnet de vacunación');
    await fireEvent.press(pantalla.getByText('Guardar'));

    await waitFor(() => expect(mutate).toHaveBeenCalled());
    expect(mutate.mock.calls[0][0]).toEqual({
      adjuntoId: 'a-1',
      nombre: 'Carnet de vacunación',
    });
  });

  // Mismo criterio que retirar (Reglas de Negocio, 2.4).
  it('no renombra ni retira el archivo de otro', async () => {
    const pantalla = await render(seccion([adjunto({ subido_por_usuario_id: 'otro' })]));

    await abrirMenu(pantalla);

    expect(pantalla.queryByText('Cambiar el nombre')).toBeNull();
    expect(pantalla.queryByText('Retirar')).toBeNull();
    // Bajarlo sí: leerlo lo puede cualquiera que alcance la mascota.
    expect(pantalla.getByText('Descargar')).toBeOnTheScreen();
  });
});

describe('SeccionAdjuntos · descarga', () => {
  it('baja el archivo pidiendo la URL de nuevo', async () => {
    const mutate = jest.fn();
    jest
      .spyOn(consultas, 'useDescargarAdjunto')
      .mockReturnValue({ mutate, isPending: false, isError: false } as never);
    const pantalla = await render(seccion([adjunto()]));

    await abrirMenu(pantalla);
    await fireEvent.press(pantalla.getByText('Descargar'));

    expect(mutate).toHaveBeenCalledWith('a-1');
  });

  // Sin conexión no hay URL prefirmada que abrir: la copia local guarda los
  // metadatos y no el archivo.
  it('sin conexión no se baja nada', async () => {
    const pantalla = await render(seccion([adjunto()], { soloMetadatos: true }));

    expect(pantalla.queryByText('Descargar')).toBeNull();
  });

  // «El archivo no se descarga al dispositivo […] Una copia local sería
  // historial clínico fuera del alcance del motor de permisos» y «No hay acción
  // de descarga ni de compartir» — Alcance de Plataformas, 5.6. Es la ficha del
  // tutor: para el veterinario la descarga sí está permitida (Reglas 3.2).
  it('en la ficha del tutor no se ofrece bajar el archivo', async () => {
    const pantalla = await render(seccion([adjunto()], { permiteDescarga: false }));

    await abrirMenu(pantalla);

    expect(pantalla.queryByText('Descargar')).toBeNull();
    // El resto del menú sigue: mirar y renombrar lo propio no salen del sistema.
    expect(pantalla.getByText('Cambiar el nombre')).toBeOnTheScreen();
  });
});
