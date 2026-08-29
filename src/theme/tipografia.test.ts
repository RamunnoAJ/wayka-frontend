import { estiloDeTexto, estiloDeTextoSobreMarca, REFUERZO_SOBRE_MARCA_PX } from './tipografia';
import { tokensDefault, tokensTutor, type Tokens } from './tokens.generated';

const TEMA_CLINICA = tokensDefault as Tokens;
const TEMA_TUTOR = { ...tokensDefault, ...tokensTutor } as Tokens;

/**
 * El naranja de marca del tutor con blanco encima da 2.0:1 (design system
 * 1.5.0). Subir cuerpo y peso es la mitigación acordada; esto fija que se
 * aplique solo ahí y que no toque el tema de clínica, donde la navegación es
 * oscura y ya contrasta.
 */
describe('texto sobre el color de marca', () => {
  it('sube el cuerpo en el tema del tutor', () => {
    const normal = estiloDeTexto(TEMA_TUTOR, 'body');
    const reforzado = estiloDeTextoSobreMarca(TEMA_TUTOR, 'body', true);

    expect(reforzado.fontSize).toBe((normal.fontSize ?? 0) + REFUERZO_SOBRE_MARCA_PX);
  });

  // El interlineado se recalcula sobre el cuerpo nuevo: dejarlo en el viejo
  // apretaría las líneas justo donde cuesta leer.
  it('recalcula el interlineado con el cuerpo nuevo', () => {
    const normal = estiloDeTexto(TEMA_TUTOR, 'body');
    const reforzado = estiloDeTextoSobreMarca(TEMA_TUTOR, 'body', true);

    expect(reforzado.lineHeight).toBeGreaterThan(normal.lineHeight ?? 0);
  });

  it('sube el peso del texto de cuerpo, que es el que peor se lee', () => {
    const normal = estiloDeTexto(TEMA_TUTOR, 'body');
    const reforzado = estiloDeTextoSobreMarca(TEMA_TUTOR, 'body', true);

    // En nativo el peso viaja en la familia (no hay estático 600: 600 y 700 son
    // Bold), así que se compara la familia y no `fontWeight`.
    expect(reforzado.fontFamily).not.toBe(normal.fontFamily);
  });

  it('no cambia nada en el tema de clínica', () => {
    expect(estiloDeTextoSobreMarca(TEMA_CLINICA, 'body', false)).toEqual(
      estiloDeTexto(TEMA_CLINICA, 'body'),
    );
  });
});
