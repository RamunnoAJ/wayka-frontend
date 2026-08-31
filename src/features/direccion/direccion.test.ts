import { cambioDeDireccion, urlDeMapaEstatico } from './direccion';

describe('cambioDeDireccion', () => {
  it('manda los cuatro campos cuando la dirección se confirmó en el mapa', () => {
    expect(
      cambioDeDireccion({
        texto: 'Av. Rivadavia 1000',
        punto: { placeId: 'ChIJ_x', lat: -34.609722, lng: -58.381592 },
      }),
    ).toEqual({
      direccion: 'Av. Rivadavia 1000',
      direccion_place_id: 'ChIJ_x',
      direccion_lat: -34.609722,
      direccion_lng: -58.381592,
    });
  });

  // Regla 2.6: el backend limpia el punto cuando llega el texto solo, y el
  // cliente tiene que mandar exactamente eso — no los campos del punto viejo.
  it('manda solo el texto cuando la dirección se escribió a mano', () => {
    expect(cambioDeDireccion({ texto: 'Paraje El Sauce s/n' })).toEqual({
      direccion: 'Paraje El Sauce s/n',
    });
  });

  it('manda la cadena vacía para limpiar la dirección entera', () => {
    expect(cambioDeDireccion({ texto: '   ' })).toEqual({ direccion: '' });
  });
});

describe('urlDeMapaEstatico', () => {
  it('arma la url con el pin en el punto confirmado', () => {
    const url = urlDeMapaEstatico({ placeId: 'ChIJ_x', lat: -34.6, lng: -58.38 }, 'CLAVE');

    expect(url).toContain('center=-34.6%2C-58.38');
    expect(url).toContain('markers=');
    expect(url).toContain('key=CLAVE');
  });

  it('no arma ninguna url sin punto confirmado', () => {
    expect(urlDeMapaEstatico(undefined, 'CLAVE')).toBeNull();
  });

  // Sin esto, una clave vacía genera una URL que Google rechaza y la pantalla
  // muestra una imagen rota en lugar de simplemente no mostrar el mapa.
  it('no arma ninguna url sin clave configurada', () => {
    expect(urlDeMapaEstatico({ placeId: 'ChIJ_x', lat: -34.6, lng: -58.38 }, '')).toBeNull();
  });
});
