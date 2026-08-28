import { render } from '@testing-library/react-native';
import { router } from 'expo-router';

import { CLAVE_DEL_TOKEN } from '../lib/almacenamiento-refresh';
import { limpiarSesion, obtenerSesion, setSesion } from '../stores/sesion';
import type { Sesion } from '../types/sesion';

import { useSesionEntrePestanas } from './useSesionEntrePestanas';

jest.mock('../lib/plataforma', () => ({ esWeb: true, esNativo: false, CANAL_ACTUAL: 'web' }));
jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));

const SESION = {
  tokenAcceso: 'acceso-1',
  expiraAt: '2027-01-01T00:00:00Z',
  usuario: {
    id: 'u1',
    email: 'vet@wayka.test',
    tipo_usuario: 'veterinario',
    activo: true,
    metodos: ['contrasena'],
  },
} as unknown as Sesion;

function Sonda() {
  useSesionEntrePestanas();
  return null;
}

/**
 * El preset de Jest es el nativo: hay `window`, pero no la API de eventos del
 * navegador ni `StorageEvent`. La suite aporta un bus mínimo — lo que se prueba
 * es el hook, no la implementación del navegador.
 */
type Escucha = (evento: { key: string | null; newValue: string | null }) => void;

let escuchas: Escucha[] = [];

function instalarBusDeEventos() {
  escuchas = [];
  Object.defineProperty(globalThis, 'window', {
    value: {
      addEventListener: (tipo: string, escucha: Escucha) => {
        if (tipo === 'storage') escuchas.push(escucha);
      },
      removeEventListener: (tipo: string, escucha: Escucha) => {
        if (tipo === 'storage') escuchas = escuchas.filter((e) => e !== escucha);
      },
    },
    configurable: true,
    writable: true,
  });
}

function otraPestanaEscribe(clave: string, valorNuevo: string | null) {
  for (const escucha of [...escuchas]) escucha({ key: clave, newValue: valorNuevo });
}

/**
 * Cerrar sesión en una pestaña tiene que cerrarla en las demás.
 *
 * Sin esto, la pestaña que quedó abierta sigue usable con su token de acceso en
 * memoria hasta que venza: minutos con la ficha de un paciente a la vista en una
 * máquina de la que el usuario ya se fue.
 */
describe('useSesionEntrePestanas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    instalarBusDeEventos();
    setSesion(SESION);
  });

  it('el borrado del token en otra pestaña cierra esta sesión', async () => {
    await render(<Sonda />);

    otraPestanaEscribe(CLAVE_DEL_TOKEN, null);

    expect(obtenerSesion()).toBeNull();
    expect(router.replace).toHaveBeenCalled();
  });

  // Un valor nuevo es la rotación normal de otra pestaña que refrescó. Cerrar la
  // sesión ahí sería echar al usuario cada vez que vence un token de acceso.
  it('la rotación del token no cierra nada', async () => {
    await render(<Sonda />);

    otraPestanaEscribe(CLAVE_DEL_TOKEN, 'refresco-rotado');

    expect(obtenerSesion()).toBe(SESION);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('ignora los cambios de otras claves del almacenamiento', async () => {
    await render(<Sonda />);

    otraPestanaEscribe('otra.cosa', null);

    expect(obtenerSesion()).toBe(SESION);
    expect(router.replace).not.toHaveBeenCalled();
  });

  // Redirigir acá sería sacar de la pantalla de login a alguien que está
  // escribiendo su contraseña en otra pestaña.
  it('sin sesión en esta pestaña no redirige', async () => {
    limpiarSesion();
    await render(<Sonda />);

    otraPestanaEscribe(CLAVE_DEL_TOKEN, null);

    expect(router.replace).not.toHaveBeenCalled();
  });

  it('deja de escuchar al desmontarse', async () => {
    const { unmount } = await render(<Sonda />);

    // `unmount` es asíncrono desde la v14 de la librería: sin esperarlo, la
    // limpieza del efecto todavía no corrió y el test verifica lo contrario de
    // lo que dice.
    await unmount();
    otraPestanaEscribe(CLAVE_DEL_TOKEN, null);

    expect(router.replace).not.toHaveBeenCalled();
  });
});
