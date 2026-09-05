import { validarContrasenaNueva } from './validaciones';

describe('validarContrasenaNueva — el techo de bcrypt', () => {
  // El backend no puede hashear más de 72 bytes (regla 2.1). Sin esto, una
  // contraseña larga se manda y vuelve rechazada sin que el formulario haya
  // dicho nada.
  it('avisa cuando se pasa del máximo', () => {
    expect(validarContrasenaNueva('Aa1' + 'x'.repeat(70))).toContain('72');
  });

  // Se mide en bytes: cuarenta eñes son ochenta bytes y solo cuarenta letras,
  // así que contar caracteres dejaría pasar lo que el backend rechaza.
  it('cuenta bytes y no letras', () => {
    expect(validarContrasenaNueva('Aa1' + 'ñ'.repeat(40))).toContain('72');
  });

  it('deja pasar la que entra justo', () => {
    expect(validarContrasenaNueva('Aa1' + 'x'.repeat(69))).toBeUndefined();
  });
});
