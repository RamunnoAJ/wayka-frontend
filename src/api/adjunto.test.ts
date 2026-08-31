import { subirAdjunto, TIPO_DE_ADJUNTO } from './adjunto';

import { http } from '../lib/http';

jest.mock('../lib/http', () => ({
  http: { subirArchivo: jest.fn().mockResolvedValue({}) },
}));

/**
 * El orden de las partes del multipart es contrato, no detalle
 * (`SubirAdjuntoRequest` en `openapi/openapi.yaml`): el backend recorre el
 * formulario en streaming y corta al llegar al archivo, así que `tipo` y
 * `evento_id` tienen que ir antes.
 *
 * Con el archivo primero el servidor responde 400 sin leer el resto del cuerpo
 * y cierra; el teléfono, que todavía está subiendo, no ve ese 400 sino una
 * conexión caída — el usuario lee "No se pudo conectar con el servidor" en una
 * subida que en realidad llegó. Por eso esto se prueba: el síntoma no señala
 * la causa.
 */
function nombresDePartes(formulario: FormData): string[] {
  // El `FormData` de React Native no implementa `entries()`; guarda las partes
  // en `_parts`, en orden de inserción.
  const partes = (formulario as unknown as { _parts?: [string, unknown][] })._parts;
  if (partes) return partes.map(([nombre]) => nombre);
  return [...formulario.keys()];
}

function formularioEnviado(): FormData {
  const mock = http.subirArchivo as jest.Mock;
  return mock.mock.calls[0]![1] as FormData;
}

const archivo = {
  uri: 'file:///tmp/foto-20260831-1213.jpg',
  nombre: 'foto-20260831-1213.jpg',
  contentType: 'image/jpeg',
  tamanoBytes: 0,
};

describe('subirAdjunto arma el multipart en el orden que el backend necesita', () => {
  beforeEach(() => (http.subirArchivo as jest.Mock).mockClear());

  it('manda el tipo antes que el archivo', async () => {
    await subirAdjunto('11111111-1111-4111-8111-111111111111', {
      archivo,
      tipo: TIPO_DE_ADJUNTO.FOTO,
    });

    expect(nombresDePartes(formularioEnviado())).toEqual(['tipo', 'archivo']);
  });

  it('manda también el evento antes que el archivo', async () => {
    await subirAdjunto('11111111-1111-4111-8111-111111111111', {
      archivo,
      tipo: TIPO_DE_ADJUNTO.ESTUDIO,
      evento_id: '22222222-2222-4222-8222-222222222222',
    });

    expect(nombresDePartes(formularioEnviado())).toEqual(['tipo', 'evento_id', 'archivo']);
  });
});
