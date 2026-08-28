/**
 * El token de refresco en web.
 *
 * La suite corre con el preset nativo, donde `esWeb` es `false`, así que la
 * plataforma se fuerza acá: lo que se prueba es la rama de web, que es la que
 * acaba de cambiar de memoria a `localStorage`.
 *
 * Lo que se cubre es el motivo del cambio —que la sesión sobreviva a un
 * recargo— y los dos casos en que `localStorage` no está y la app tiene que
 * seguir funcionando igual: la exportación estática, que corre en Node sin
 * `window`, y Safari en navegación privada, donde `setItem` lanza por cuota.
 */
jest.mock('./plataforma', () => ({ esWeb: true, esNativo: false, CANAL_ACTUAL: 'web' }));

/**
 * El preset de Jest es el nativo y no trae `localStorage`: la suite lo aporta.
 * Es una implementación mínima sobre un Map — lo que se prueba es el módulo, no
 * la del navegador.
 */
function nuevoAlmacenFalso() {
  const datos = new Map<string, string>();
  return {
    getItem: jest.fn((clave: string) => datos.get(clave) ?? null),
    setItem: jest.fn((clave: string, valor: string) => {
      datos.set(clave, valor);
    }),
    removeItem: jest.fn((clave: string) => {
      datos.delete(clave);
    }),
  };
}

let almacen: ReturnType<typeof nuevoAlmacenFalso>;

function instalarAlmacen(valor: unknown) {
  Object.defineProperty(globalThis, 'window', {
    value: { localStorage: valor },
    configurable: true,
    writable: true,
  });
}

/**
 * `require` y no `import()`: el módulo lee `esWeb` al cargarse, así que hay que
 * traerlo después de poner el mock y volver a traerlo tras cada `resetModules`
 * —que es como se simula un recargo de la pestaña—. El import dinámico de ESM
 * no corre en este entorno de Jest sin `--experimental-vm-modules`.
 */
function almacenamiento(): typeof import('./almacenamiento-refresh') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('./almacenamiento-refresh');
}

describe('el token de refresco en web', () => {
  beforeEach(() => {
    jest.resetModules();
    almacen = nuevoAlmacenFalso();
    instalarAlmacen(almacen);
  });

  it('sobrevive a que se recargue la pestaña', async () => {
    const { guardarTokenRefresco } = almacenamiento();
    await guardarTokenRefresco('refresco-1');

    // Un recargo es un módulo nuevo sin nada en memoria, con el mismo
    // localStorage detrás.
    jest.resetModules();
    const { leerTokenRefresco } = almacenamiento();

    await expect(leerTokenRefresco()).resolves.toBe('refresco-1');
  });

  it('cerrar sesión lo borra de verdad', async () => {
    const { guardarTokenRefresco, borrarTokenRefresco, leerTokenRefresco } = almacenamiento();
    await guardarTokenRefresco('refresco-1');

    await borrarTokenRefresco();

    expect(almacen.getItem('wayka.token-refresco')).toBeNull();
    await expect(leerTokenRefresco()).resolves.toBeNull();
  });

  // Otra pestaña pudo haber rotado el token: el de memoria quedaría viejo, y
  // presentarlo se lee como reuso y revoca la cadena.
  it('lo guardado gana sobre la copia en memoria', async () => {
    const { guardarTokenRefresco, leerTokenRefresco } = almacenamiento();
    await guardarTokenRefresco('refresco-1');

    almacen.setItem('wayka.token-refresco', 'rotado-por-otra-pestana');

    await expect(leerTokenRefresco()).resolves.toBe('rotado-por-otra-pestana');
  });

  // Safari en navegación privada: setItem lanza por cuota.
  it('con el almacenamiento rechazando escrituras la sesión sigue en pie', async () => {
    almacen.setItem.mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    const { guardarTokenRefresco, leerTokenRefresco } = almacenamiento();
    await guardarTokenRefresco('refresco-1');

    await expect(leerTokenRefresco()).resolves.toBe('refresco-1');
  });

  // La exportación estática corre en Node: no hay `window` en el prerender.
  it('sin window no se rompe', async () => {
    instalarAlmacen(undefined);
    Object.defineProperty(globalThis, 'window', { value: undefined, configurable: true });

    const { guardarTokenRefresco, leerTokenRefresco } = almacenamiento();
    await guardarTokenRefresco('refresco-1');

    await expect(leerTokenRefresco()).resolves.toBe('refresco-1');
  });
});
