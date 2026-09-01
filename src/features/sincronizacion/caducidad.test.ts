import type { Paciente } from '../../api/paciente';

import {
  DIAS_DE_COPIA_AJENA,
  confirmarSincronizacion,
  hayAjenasPurgadas,
  purgarAjenasVencidas,
} from './almacen';

/**
 * Caducidad de la copia de las mascotas ajenas (Sincronización sin Conexión, 8).
 *
 * Lo que se prueba es el borde de la regla: cuándo caduca, qué se lleva y qué
 * no. Es la única mitigación que existe para la ventana entre que se revoca un
 * acceso y que el teléfono se entera, así que la parte que importa es que **no
 * toque las mascotas propias** —nadie puede revocarle a alguien lo suyo— y que
 * corra sin depender de la red.
 */
const DUENO = 't-1';
const AJENO = 't-2';

const registros = new Map<string, { entidad: string; id: string; pacienteId: string | null }>();
const marcas = new Map<string, string>();

jest.mock('../../lib/base-local', () => ({
  hayCopiaLocal: true,
  abrirBaseLocal: jest.fn(),
}));

// Una base en memoria con lo justo que el almacén usa: alcanza para ejercer la
// regla sin levantar SQLite, que en este test no aporta nada.
const baseFalsa = {
  getFirstAsync: jest.fn(async (sql: string, ...args: unknown[]) => {
    if (sql.includes('FROM marca')) {
      const valor = marcas.get(String(args[0]));
      return valor ? { valor } : null;
    }
    return null;
  }),
  getAllAsync: jest.fn(async (sql: string) => {
    if (sql.includes('entidad = ?') && sql.includes('paciente_id')) return [];
    return [...registros.values()]
      .filter((fila) => fila.entidad === 'paciente')
      .map((fila) => ({
        datos: JSON.stringify({
          id: fila.id,
          tutor_id: fila.id === 'propia' ? DUENO : AJENO,
        } as Partial<Paciente>),
      }));
  }),
  runAsync: jest.fn(async (sql: string, ...args: unknown[]) => {
    if (sql.startsWith('INSERT INTO marca')) marcas.set(String(args[0]), String(args[1]));
    if (sql.startsWith('DELETE FROM marca')) marcas.delete(String(args[0]));
    if (sql.includes('DELETE FROM registro WHERE paciente_id')) {
      for (const [clave, fila] of registros) {
        if (fila.pacienteId === args[0]) registros.delete(clave);
      }
    }
    if (sql.includes("entidad = 'paciente' AND id")) {
      registros.delete(`paciente:${String(args[0])}`);
    }
  }),
  withTransactionAsync: jest.fn(async (fn: () => Promise<void>) => fn()),
};

beforeEach(async () => {
  registros.clear();
  marcas.clear();
  const { abrirBaseLocal } = jest.requireMock('../../lib/base-local');
  (abrirBaseLocal as jest.Mock).mockResolvedValue(baseFalsa);

  registros.set('paciente:propia', { entidad: 'paciente', id: 'propia', pacienteId: null });
  registros.set('paciente:ajena', { entidad: 'paciente', id: 'ajena', pacienteId: null });
  registros.set('evento:e1', { entidad: 'evento_clinico', id: 'e1', pacienteId: 'ajena' });
});

function haceDias(dias: number): Date {
  return new Date(Date.now() - dias * 24 * 60 * 60 * 1000);
}

describe('caducidad de la copia de mascotas ajenas', () => {
  it('no toca nada mientras la copia se confirmó hace poco', async () => {
    await confirmarSincronizacion(haceDias(DIAS_DE_COPIA_AJENA - 1));

    expect(await purgarAjenasVencidas(DUENO)).toBe(0);
    expect(registros.has('paciente:ajena')).toBe(true);
    expect(await hayAjenasPurgadas()).toBe(false);
  });

  it('se lleva la mascota ajena y su historial al vencer el plazo', async () => {
    await confirmarSincronizacion(haceDias(DIAS_DE_COPIA_AJENA + 1));

    expect(await purgarAjenasVencidas(DUENO)).toBe(1);
    expect(registros.has('paciente:ajena')).toBe(false);
    expect(registros.has('evento:e1')).toBe(false);
    expect(await hayAjenasPurgadas()).toBe(true);
  });

  // Nadie puede revocarle a alguien el acceso a lo suyo, así que vaciarle la app
  // al tutor que se fue sin señal sería romper lo que la copia vino a resolver.
  it('nunca se lleva las mascotas propias', async () => {
    await confirmarSincronizacion(haceDias(DIAS_DE_COPIA_AJENA * 10));

    await purgarAjenasVencidas(DUENO);

    expect(registros.has('paciente:propia')).toBe(true);
  });

  it('sincronizar reinicia el reloj y limpia el aviso', async () => {
    await confirmarSincronizacion(haceDias(DIAS_DE_COPIA_AJENA + 1));
    await purgarAjenasVencidas(DUENO);
    expect(await hayAjenasPurgadas()).toBe(true);

    await confirmarSincronizacion();

    expect(await hayAjenasPurgadas()).toBe(false);
    expect(await purgarAjenasVencidas(DUENO)).toBe(0);
  });

  // Una copia sin confirmación previa es una recién hecha, o una anterior a esta
  // regla: no hay reloj que haya corrido, y purgarla sería castigar por no tener
  // el dato.
  it('sin confirmación previa no purga: la fecha y espera', async () => {
    expect(await purgarAjenasVencidas(DUENO)).toBe(0);
    expect(registros.has('paciente:ajena')).toBe(true);
  });
});
