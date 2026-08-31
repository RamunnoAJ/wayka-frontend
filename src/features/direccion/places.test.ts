import { buscarSugerencias, detalleDeLugar } from './places';

const respuesta = (cuerpo: unknown, ok = true) =>
  Promise.resolve({ ok, json: () => Promise.resolve(cuerpo) } as Response);

describe('buscarSugerencias', () => {
  afterEach(() => jest.restoreAllMocks());

  it('devuelve las sugerencias con su place_id', async () => {
    jest.spyOn(global, 'fetch').mockReturnValue(
      respuesta({
        suggestions: [
          {
            placePrediction: {
              placeId: 'ChIJ_x',
              text: { text: 'Av. Rivadavia 1000, CABA' },
            },
          },
        ],
      }),
    );

    await expect(buscarSugerencias('Rivadavia 1000', 'sesion-1', 'CLAVE')).resolves.toEqual([
      { placeId: 'ChIJ_x', texto: 'Av. Rivadavia 1000, CABA' },
    ]);
  });

  // El autocompletado es una ayuda, no una barrera: si Google no contesta, el
  // campo tiene que seguir siendo un input de texto que se puede guardar.
  it('devuelve una lista vacía cuando el proveedor falla', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('sin red'));

    await expect(buscarSugerencias('Rivadavia', 'sesion-1', 'CLAVE')).resolves.toEqual([]);
  });

  it('no consulta sin clave configurada', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');

    await expect(buscarSugerencias('Rivadavia', 'sesion-1', '')).resolves.toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('detalleDeLugar', () => {
  afterEach(() => jest.restoreAllMocks());

  it('devuelve la dirección normalizada con su punto', async () => {
    jest.spyOn(global, 'fetch').mockReturnValue(
      respuesta({
        id: 'ChIJ_x',
        formattedAddress: 'Av. Rivadavia 1000, C1033 CABA',
        location: { latitude: -34.609722, longitude: -58.381592 },
      }),
    );

    await expect(detalleDeLugar('ChIJ_x', 'sesion-1', 'CLAVE')).resolves.toEqual({
      texto: 'Av. Rivadavia 1000, C1033 CABA',
      punto: { placeId: 'ChIJ_x', lat: -34.609722, lng: -58.381592 },
    });
  });

  it('devuelve null cuando el lugar viene sin coordenadas', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockReturnValue(respuesta({ id: 'ChIJ_x', formattedAddress: 'Av. Rivadavia 1000' }));

    await expect(detalleDeLugar('ChIJ_x', 'sesion-1', 'CLAVE')).resolves.toBeNull();
  });
});
