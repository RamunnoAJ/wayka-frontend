import { eliminarDispositivo, registrarDispositivo } from '../../api/dispositivo';
import {
  guardarPreferenciaDeAvisos,
  leerPreferenciaDeAvisos,
} from '../../lib/almacenamiento-avisos';

import { leerEstadoDelPermiso, obtenerTokenDePush } from './push';
import {
  activarAvisos,
  avisosActivados,
  darDeBajaEsteDispositivo,
  desactivarAvisos,
  olvidarRegistro,
  registrarEsteDispositivo,
} from './registro';

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

// El almacenamiento se simula en memoria y no se mockea con `jest.fn()` sueltos:
// lo que hay que probar es que la preferencia **sobreviva**, y para eso el doble
// tiene que recordar lo que le guardaron.
jest.mock('../../lib/almacenamiento-avisos', () => {
  let preferencia: boolean | null = null;
  let dispositivo: string | null = null;
  return {
    leerPreferenciaDeAvisos: jest.fn(async () => preferencia ?? true),
    guardarPreferenciaDeAvisos: jest.fn(async (valor: boolean) => {
      preferencia = valor;
    }),
    leerDispositivoRegistrado: jest.fn(async () => dispositivo),
    guardarDispositivoRegistrado: jest.fn(async (id: string | null) => {
      dispositivo = id;
    }),
    __reiniciar: () => {
      preferencia = null;
      dispositivo = null;
    },
  };
});

const almacen = jest.requireMock('../../lib/almacenamiento-avisos') as {
  __reiniciar: () => void;
};

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
    almacen.__reiniciar();
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

  it('cerrar sesión no apaga los avisos: al volver a entrar se registra igual', async () => {
    await registrarEsteDispositivo();
    await darDeBajaEsteDispositivo();
    registrar.mockClear();

    await registrarEsteDispositivo();

    expect(registrar).toHaveBeenCalledTimes(1);
  });
});

/**
 * El interruptor de la pantalla de avisos.
 *
 * Lo que se cuida acá es que **apagarlos siga apagado**: el registro corre en
 * cada login, y sin la preferencia persistida el próximo ingreso volvería a dar
 * de alta el teléfono y el control no serviría para nada.
 *
 * Y que el fallo **sí** se propague, al revés que en el login: acá el tutor está
 * mirando el interruptor que movió, y darlo por hecho cuando el backend no lo
 * aplicó le promete un cambio que no pasó.
 */
describe('interruptor de avisos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    olvidarRegistro();
    almacen.__reiniciar();
    permiso.mockResolvedValue('concedido');
    token.mockResolvedValue('ExponentPushToken[abc]');
    registrar.mockResolvedValue({ id: 'disp-1' });
    eliminar.mockResolvedValue(null);
  });

  it('arranca prendido: el permiso del sistema ya fue una decisión del tutor', async () => {
    await expect(avisosActivados()).resolves.toBe(true);
  });

  it('apagarlos da de baja este teléfono', async () => {
    await registrarEsteDispositivo();

    await desactivarAvisos();

    expect(eliminar).toHaveBeenCalledWith('disp-1');
    await expect(avisosActivados()).resolves.toBe(false);
  });

  it('apagados no se vuelven a registrar en el próximo login', async () => {
    await desactivarAvisos();
    registrar.mockClear();

    await registrarEsteDispositivo();

    expect(registrar).not.toHaveBeenCalled();
  });

  it('prenderlos vuelve a dar de alta el teléfono', async () => {
    await desactivarAvisos();

    await activarAvisos();

    expect(registrar).toHaveBeenCalled();
    await expect(avisosActivados()).resolves.toBe(true);
  });

  it('si el alta falla, el error llega a la pantalla', async () => {
    registrar.mockRejectedValue(new Error('sin red'));

    await expect(activarAvisos()).rejects.toThrow('sin red');
  });

  it('si la baja falla, la preferencia igual queda apagada', async () => {
    await registrarEsteDispositivo();
    eliminar.mockRejectedValue(new Error('sin red'));

    await expect(desactivarAvisos()).rejects.toThrow('sin red');

    // Lo que el tutor pidió se respeta aunque el backend no haya contestado: el
    // próximo login no vuelve a dar de alta el aparato.
    await expect(leerPreferenciaDeAvisos()).resolves.toBe(false);
    expect(guardarPreferenciaDeAvisos).toHaveBeenCalledWith(false);
  });
});
