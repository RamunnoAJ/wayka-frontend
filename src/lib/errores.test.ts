import { ErrorApi, ErrorDeRed, mensajeDeError } from './errores';

/**
 * El `mensaje` del servidor es diagnóstico: está escrito para un log —sin
 * tildes, en minúscula y sin ninguna salida— y llegaba tal cual a la pantalla.
 * El copy lo escribe el cliente a partir del `codigo`, que es lo que el
 * contrato promete estable.
 */
function delServidor(status: number, codigo: string, mensaje: string) {
  return new ErrorApi(status, { codigo, mensaje });
}

describe('mensajeDeError', () => {
  it('no muestra nunca el texto que mandó el servidor', () => {
    const error = delServidor(
      409,
      'documento_en_uso',
      'el documento ya esta en uso por otra ficha',
    );

    expect(mensajeDeError(error)).toBe('Ese documento ya está cargado en otra ficha.');
  });

  it('distingue los tres conflictos de unicidad, que antes eran uno solo', () => {
    expect(mensajeDeError(delServidor(409, 'documento_en_uso', 'x'))).toContain('documento');
    expect(mensajeDeError(delServidor(409, 'matricula_en_uso', 'x'))).toContain('matrícula');
    expect(mensajeDeError(delServidor(409, 'email_en_uso', 'x'))).toContain('correo');
  });

  it('distingue el techo de intentos de una credencial mal escrita', () => {
    // El 429 del limite de intentos y el 401 de credenciales llegan al mismo
    // formulario, y la salida es distinta: uno se resuelve esperando y el otro
    // escribiendo de nuevo.
    const mensaje = mensajeDeError(delServidor(429, 'demasiados_pedidos', 'demasiados intentos'));

    expect(mensaje).toContain('Esperá');
    expect(mensaje).not.toContain('contraseña');
  });

  it('deja que la pantalla afine el copy de un código con lo que ella sabe', () => {
    const error = delServidor(
      409,
      'conflicto',
      'conflicto con el estado actual: ya tiene una cita',
    );

    expect(mensajeDeError(error, { conflicto: 'Esa hora ya está tomada.' })).toBe(
      'Esa hora ya está tomada.',
    );
  });

  it('cae en un genérico ante un código que no conoce', () => {
    const error = delServidor(418, 'codigo_del_futuro', 'algo que este cliente no sabe leer');

    expect(mensajeDeError(error)).toBe('No se pudo completar. Probá de nuevo en un momento.');
  });

  it('ante una respuesta sin la forma del contrato tampoco filtra el HTTP', () => {
    const error = new ErrorApi(502, '<html>Bad Gateway</html>');

    expect(mensajeDeError(error)).toBe('No se pudo completar. Probá de nuevo en un momento.');
  });

  it('la falla de transporte conserva su mensaje, que ya lo escribe el cliente', () => {
    expect(mensajeDeError(new ErrorDeRed())).toBe('No se pudo conectar con el servidor.');
  });
});
