import type { Adjunto } from '../../api/adjunto';
import { render } from '../../pruebas/render';

import { SeccionAdjuntos } from './SeccionAdjuntos';

/**
 * Qué ofrece la tarjeta de un adjunto sobre la foto de la mascota.
 *
 * La regla la aplica el backend (Reglas de Negocio, 4.14); lo que se prueba acá
 * es que la interfaz no ofrezca lo que va a ser rechazado —marcar un PDF— ni
 * esconda lo que sí se puede.
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

describe('SeccionAdjuntos · foto de la mascota', () => {
  it('ofrece usar una imagen como foto de la mascota', async () => {
    const { getByText } = await render(seccion([adjunto()], { onUsarComoFoto: jest.fn() }));

    expect(getByText('Usar como foto')).toBeOnTheScreen();
  });

  // Marcar un PDF dejaría a la ficha sin nada que mostrar.
  it('no la ofrece sobre lo que no es una imagen', async () => {
    const { queryByText } = await render(
      seccion([adjunto({ tipo: 'pdf', content_type: 'application/pdf' })], {
        onUsarComoFoto: jest.fn(),
      }),
    );

    expect(queryByText('Usar como foto')).toBeNull();
  });

  // La ficha del veterinario lista los mismos archivos, y ahí elegir la foto de
  // la mascota no es una decisión suya.
  it('sin la acción no aparece nada de la foto', async () => {
    const { queryByText } = await render(seccion([adjunto()]));

    expect(queryByText('Usar como foto')).toBeNull();
  });

  it('la que ya es la foto se dice, y no se vuelve a ofrecer', async () => {
    const { getByText, queryByText } = await render(
      seccion([adjunto({ es_foto_perfil: true })], { onUsarComoFoto: jest.fn() }),
    );

    expect(getByText('Foto de la mascota')).toBeOnTheScreen();
    expect(queryByText('Usar como foto')).toBeNull();
  });

  // Sin conexión están los metadatos y no la URL prefirmada: marcar una foto es
  // una escritura en línea, y no entra a la cola del tutor.
  it('sin conexión no se marca ninguna', async () => {
    const { queryByText } = await render(
      seccion([adjunto()], { onUsarComoFoto: jest.fn(), soloMetadatos: true }),
    );

    expect(queryByText('Usar como foto')).toBeNull();
  });

  // El co-tutor de solo lectura mira y no escribe (Reglas de Negocio, 3.2).
  it('el de solo lectura no la marca', async () => {
    const { queryByText } = await render(
      seccion([adjunto()], { onUsarComoFoto: jest.fn(), puedeEscribir: false }),
    );

    expect(queryByText('Usar como foto')).toBeNull();
  });
});
