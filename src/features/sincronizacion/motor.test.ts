import { bajarCambios, subirMutaciones } from '../../api/sincronizacion';

import {
  aplicarDelta,
  descartar,
  hayPacientesSinNivel,
  leerMarca,
  listarPendientes,
  marcarRechazada,
  vaciarCopia,
} from './almacen';
import { sincronizar } from './motor';

jest.mock('../../lib/base-local', () => ({ hayCopiaLocal: true }));
jest.mock('../../api/sincronizacion', () => ({
  ...jest.requireActual('../../api/sincronizacion'),
  bajarCambios: jest.fn(),
  subirMutaciones: jest.fn(),
}));
jest.mock('./almacen', () => ({
  aplicarDelta: jest.fn(),
  confirmarSincronizacion: jest.fn(),
  descartar: jest.fn(),
  hayPacientesSinNivel: jest.fn(),
  leerMarca: jest.fn(),
  listarPendientes: jest.fn(),
  marcarRechazada: jest.fn(),
  vaciarCopia: jest.fn(),
}));

const bajar = bajarCambios as jest.MockedFunction<typeof bajarCambios>;
const subir = subirMutaciones as jest.MockedFunction<typeof subirMutaciones>;
const pendientes = listarPendientes as jest.MockedFunction<typeof listarPendientes>;
const marca = leerMarca as jest.MockedFunction<typeof leerMarca>;
const sinNivel = hayPacientesSinNivel as jest.MockedFunction<typeof hayPacientesSinNivel>;

function delta(sobrescribir: Partial<Awaited<ReturnType<typeof bajarCambios>>> = {}) {
  return { hasta: 10, hay_mas: false, requiere_carga_inicial: false, ...sobrescribir };
}

function enCola(id: string) {
  return {
    id_mutacion: id,
    tipo: 'actualizar_peso_de_paciente' as const,
    entidad_id: 'paciente-1',
    version_base: '2026-08-01T10:00:00Z',
    estado: 'pendiente' as const,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  pendientes.mockResolvedValue([]);
  marca.mockResolvedValue(0);
  sinNivel.mockResolvedValue(false);
  bajar.mockResolvedValue(delta());
});

describe('motor de sincronización', () => {
  // Una copia anterior a que el delta trajera el nivel: esperar a la próxima
  // bajada no sirve, porque una mascota que no cambió no vuelve a viajar.
  it('rehace la copia si le falta el nivel de acceso de alguna mascota', async () => {
    sinNivel.mockResolvedValue(true);
    marca.mockResolvedValue(42);

    const resumen = await sincronizar();

    expect(vaciarCopia).toHaveBeenCalled();
    expect(resumen.rehizoLaCopia).toBe(true);
    // Vuelve a pedir desde cero y no desde la marca guardada.
    expect(bajar).toHaveBeenCalledWith(0);
  });

  it('sube antes de bajar, para que el delta traiga las escrituras propias ya aplicadas', async () => {
    const orden: string[] = [];
    pendientes.mockResolvedValue([enCola('m-1')]);
    subir.mockImplementation(async () => {
      orden.push('subir');
      return { resultados: [{ id_mutacion: 'm-1', resultado: 'aceptada', version: 'v2' }] };
    });
    bajar.mockImplementation(async () => {
      orden.push('bajar');
      return delta();
    });

    await sincronizar();

    expect(orden).toEqual(['subir', 'bajar']);
  });

  it('saca de la cola lo aceptado y deja lo rechazado con su motivo', async () => {
    pendientes.mockResolvedValue([enCola('m-1'), enCola('m-2')]);
    subir.mockResolvedValue({
      resultados: [
        { id_mutacion: 'm-1', resultado: 'aceptada', version: 'v2' },
        {
          id_mutacion: 'm-2',
          resultado: 'rechazada',
          motivo: { codigo: 'version_desactualizada', mensaje: 'cambió' },
        },
      ],
    });

    const resumen = await sincronizar();

    expect(descartar).toHaveBeenCalledWith('m-1');
    expect(marcarRechazada).toHaveBeenCalledWith('m-2', {
      codigo: 'version_desactualizada',
      mensaje: 'cambió',
    });
    expect(resumen).toMatchObject({ subidas: 1, rechazadas: 1 });
  });

  it('un lote con rechazos no corta el resto: el rechazo es por mutación', async () => {
    pendientes.mockResolvedValue([enCola('m-1')]);
    subir.mockResolvedValue({
      resultados: [
        {
          id_mutacion: 'm-1',
          resultado: 'rechazada',
          motivo: { codigo: 'conflicto', mensaje: 'x' },
        },
      ],
    });

    await sincronizar();

    expect(bajar).toHaveBeenCalled();
  });

  it('rehace la copia cuando la marca quedó fuera de la retención', async () => {
    bajar
      .mockResolvedValueOnce(delta({ requiere_carga_inicial: true, hasta: 0 }))
      .mockResolvedValueOnce(delta({ hasta: 42 }));
    marca.mockResolvedValue(7);

    const resumen = await sincronizar();

    expect(vaciarCopia).toHaveBeenCalled();
    expect(bajar).toHaveBeenLastCalledWith(0);
    expect(resumen.rehizoLaCopia).toBe(true);
  });

  it('sigue pidiendo tramos mientras queden cambios', async () => {
    bajar
      .mockResolvedValueOnce(delta({ hasta: 10, hay_mas: true }))
      .mockResolvedValueOnce(delta({ hasta: 20, hay_mas: false }));

    await sincronizar();

    expect(bajar).toHaveBeenNthCalledWith(2, 10);
    expect(aplicarDelta).toHaveBeenCalledTimes(2);
  });

  it('no corre dos veces en paralelo', async () => {
    // El diferido se arma antes de disparar: `sincronizar` es async y la bajada
    // recién ocurre unos microtasks después, así que resolver "al toque" sería
    // resolver algo que todavía no existe.
    let resolver: (valor: Awaited<ReturnType<typeof bajarCambios>>) => void = () => {};
    const enEspera = new Promise<Awaited<ReturnType<typeof bajarCambios>>>((resuelve) => {
      resolver = resuelve;
    });
    bajar.mockReturnValue(enEspera);

    const primera = sincronizar();
    const segunda = sincronizar();
    resolver(delta());
    await Promise.all([primera, segunda]);

    expect(bajar).toHaveBeenCalledTimes(1);
  });
});
