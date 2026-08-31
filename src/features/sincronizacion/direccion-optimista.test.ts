import { copiaLocalDeTutor } from './mutaciones';

/**
 * La copia local tiene que reflejar lo mismo que va a hacer el servidor. Si no,
 * el tutor edita la dirección sin conexión, la pantalla le sigue mostrando el
 * mapa de la casa anterior, y recién al sincronizar el pin desaparece sin que
 * nada lo explique.
 */
describe('copiaLocalDeTutor', () => {
  const guardado = {
    id: 't1',
    nombre: 'Ana',
    direccion: 'Av. Rivadavia 1000',
    direccion_place_id: 'ChIJ_vieja',
    direccion_lat: -34.609722,
    direccion_lng: -58.381592,
  };

  it('limpia el punto cuando el cambio trae solo el texto', () => {
    expect(copiaLocalDeTutor(guardado, { direccion: 'Av. Corrientes 2000' })).toMatchObject({
      direccion: 'Av. Corrientes 2000',
      direccion_place_id: null,
      direccion_lat: null,
      direccion_lng: null,
    });
  });

  it('guarda el punto nuevo cuando el cambio lo trae', () => {
    expect(
      copiaLocalDeTutor(guardado, {
        direccion: 'Av. Corrientes 2000',
        direccion_place_id: 'ChIJ_nueva',
        direccion_lat: -34.6,
        direccion_lng: -58.39,
      }),
    ).toMatchObject({ direccion_place_id: 'ChIJ_nueva', direccion_lat: -34.6 });
  });

  it('no toca la dirección cuando el cambio es de otro campo', () => {
    expect(copiaLocalDeTutor(guardado, { contacto: 'ana@wayka.test' })).toMatchObject({
      direccion: 'Av. Rivadavia 1000',
      direccion_place_id: 'ChIJ_vieja',
    });
  });
});
