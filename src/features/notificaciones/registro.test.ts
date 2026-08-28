import { eliminarDispositivo, registrarDispositivo } from '../../api/dispositivo';

import { darDeBajaEsteDispositivo, olvidarRegistro, registrarEsteDispositivo } from './registro';
import { leerEstadoDelPermiso, obtenerTokenDePush } from './push';

jest.mock('../../api/dispositivo', () => ({
  registrarDispositivo: jest.fn(),
  eliminarDispositivo: jest.fn(),
  PLATAFORMA_DE_DISPOSITIVO: { IOS: 'ios', ANDROID: 'android' },
}));

jest.mock('./push', () => ({
  HAY_PUSH: true,
  leerEstadoDelPermiso: jest.fn(),
  obtenerTokenDePush: jest.fn(),
  plataformaDelDispositivo: () => 'android',
}));

const registrar = registrarDispositivo as jest.Mock;
const eliminar = eliminarDispositivo as jest.Mock;
const permiso = leerEstadoDelPermiso as jest.Mock;
const token = obtenerTokenDePush as jest.Mock;

/**
 * Lo que se prueba es que **nada de esto pueda dejar a alguien afuera de la
 * app**. El registro del teléfono cuelga del login y la baja del logout: si un
 * fallo de push se propagara, un servicio caído impediría entrar o salir, que
 * es mucho peor que quedarse sin recordatorios.
 *
 * Y la baja: sin ella, el próximo aviso de esta cuenta llega a un teléfono
 * donde ya entró otra persona (Modelo de Datos, sección 5).
 */
describe('registro del dispositivo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    olvidarRegistro();
    permiso.mockResolvedValue('concedido');
    token.mockResolvedValue('ExponentPushToken[abc]');
    registrar.mockResolvedValue({ id: 'disp-1' });
    eliminar.mockResolvedValue(null);
  });

  it('registra el teléfono cuando el permiso ya está concedido', async () => {
    await registrarEsteDispositivo();

    expect(registrar).toHaveBeenCalledWith({
      token_push: 'ExponentPushToken[abc]',
      plataforma: 'android',
    });
  });

  // Pedir el permiso en el arranque es pedirlo cuando menos se entiende. Lo pide
  // la pantalla de avisos, y hasta entonces el login se va sin token.
  it('no registra nada si el permiso todavía no se concedió', async () => {
    permiso.mockResolvedValue('sin-preguntar');

    await registrarEsteDispositivo();

    expect(registrar).not.toHaveBeenCalled();
  });

  it('no registra nada si no se pudo obtener el token', async () => {
    token.mockResolvedValue(null);

    await registrarEsteDispositivo();

    expect(registrar).not.toHaveBeenCalled();
  });

  it('un fallo del backend no corta el login', async () => {
    registrar.mockRejectedValue(new Error('el servicio no responde'));

    await expect(registrarEsteDispositivo()).resolves.toBeUndefined();
  });

  it('da de baja el teléfono que registró en esta sesión', async () => {
    await registrarEsteDispositivo();

    await darDeBajaEsteDispositivo();

    expect(eliminar).toHaveBeenCalledWith('disp-1');
  });

  it('no intenta dar de baja nada si no llegó a registrarse', async () => {
    await darDeBajaEsteDispositivo();

    expect(eliminar).not.toHaveBeenCalled();
  });

  it('un fallo al dar de baja no corta el cierre de sesión', async () => {
    await registrarEsteDispositivo();
    eliminar.mockRejectedValue(new Error('sin red'));

    await expect(darDeBajaEsteDispositivo()).resolves.toBeUndefined();
  });

  // Cerrar sesión dos veces no puede borrar el dispositivo de la sesión
  // siguiente: el id se olvida en la primera.
  it('la baja no se repite', async () => {
    await registrarEsteDispositivo();

    await darDeBajaEsteDispositivo();
    await darDeBajaEsteDispositivo();

    expect(eliminar).toHaveBeenCalledTimes(1);
  });
});
