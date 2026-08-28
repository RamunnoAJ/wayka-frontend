import { motivoDeRechazo, tamanoLegible, TAMANO_MAXIMO_MB, type ArchivoElegido } from './archivos';

/**
 * El control previo a subir. Duplica a propósito lo que `negocio/adjunto.go`
 * aplica igual (`TamanoMaximoDeAdjunto` y `admiteContentType`): existe para no
 * mandar 10 MB por una red móvil y recién ahí enterarse de que no servía.
 *
 * Que esta tabla se desalinee del backend es el riesgo real, y por eso se
 * prueban los tres tipos con los dos formatos, no solo el caso feliz.
 */
function archivo(cambios: Partial<ArchivoElegido> = {}): ArchivoElegido {
  return {
    uri: 'file:///tmp/estudio.pdf',
    nombre: 'estudio.pdf',
    contentType: 'application/pdf',
    tamanoBytes: 1024,
    ...cambios,
  };
}

describe('motivoDeRechazo', () => {
  it('rechaza por tamaño con el límite en el mensaje, no con un "es muy grande"', () => {
    const grande = archivo({ tamanoBytes: (TAMANO_MAXIMO_MB + 1) * 1024 * 1024 });

    expect(motivoDeRechazo(grande, 'pdf')).toBe(`Supera el límite de ${TAMANO_MAXIMO_MB} MB`);
  });

  it('deja pasar el archivo que mide exactamente el límite', () => {
    const justo = archivo({ tamanoBytes: TAMANO_MAXIMO_MB * 1024 * 1024 });

    expect(motivoDeRechazo(justo, 'pdf')).toBeNull();
  });

  it('foto admite cualquier imagen y ningún PDF', () => {
    expect(motivoDeRechazo(archivo({ contentType: 'image/jpeg' }), 'foto')).toBeNull();
    expect(motivoDeRechazo(archivo({ contentType: 'image/png' }), 'foto')).toBeNull();
    expect(motivoDeRechazo(archivo({ contentType: 'application/pdf' }), 'foto')).not.toBeNull();
  });

  it('pdf no admite una imagen', () => {
    expect(motivoDeRechazo(archivo({ contentType: 'application/pdf' }), 'pdf')).toBeNull();
    expect(motivoDeRechazo(archivo({ contentType: 'image/jpeg' }), 'pdf')).not.toBeNull();
  });

  // La placa y el informe que la acompaña: por eso estudio admite los dos.
  it('estudio admite imagen y PDF', () => {
    expect(motivoDeRechazo(archivo({ contentType: 'image/jpeg' }), 'estudio')).toBeNull();
    expect(motivoDeRechazo(archivo({ contentType: 'application/pdf' }), 'estudio')).toBeNull();
  });

  it('rechaza lo que no es ni imagen ni PDF', () => {
    const doc = archivo({ contentType: 'application/msword', nombre: 'ficha.doc' });

    expect(motivoDeRechazo(doc, 'estudio')).not.toBeNull();
  });
});

describe('tamanoLegible', () => {
  it('usa la coma decimal, como el resto de la ficha', () => {
    expect(tamanoLegible(2_516_582)).toBe('2,4 MB');
  });

  it('no muestra decimales donde no significan nada', () => {
    expect(tamanoLegible(900)).toBe('900 B');
    expect(tamanoLegible(20_480)).toBe('20 kB');
  });
});
