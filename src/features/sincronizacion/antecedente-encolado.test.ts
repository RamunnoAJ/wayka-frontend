import { encolarAntecedenteClinico, encolarMedicacionDeclarada } from './mutaciones';

import { encolarAlta } from './almacen';

jest.mock('expo-crypto', () => ({ randomUUID: () => 'mut-1' }));
jest.mock('./almacen', () => ({ encolar: jest.fn(), encolarAlta: jest.fn() }));

const alta = encolarAlta as jest.MockedFunction<typeof encolarAlta>;

beforeEach(() => alta.mockClear());

/**
 * Un antecedente cargado sin conexión es la primera **alta** de la cola: no hay
 * registro previo cuyo `updated_at` mandar como versión base, y el `entidad_id`
 * es la mascota y no el registro que se va a crear (doc 11, sección 5).
 */
describe('encolar un antecedente', () => {
  it('viaja sin versión base y con la mascota como entidad', async () => {
    await encolarAntecedenteClinico('p-1', {
      tipo: 'vacuna',
      fecha: '2023-01-01',
      fecha_precision: 'anio',
      descripcion: 'Antirrábica, según la libreta',
      campo_estructurado: { nombre_vacuna: 'Antirrábica' },
    });

    const [mutacion, entidad] = alta.mock.calls[0] ?? [];
    expect(mutacion).toMatchObject({
      tipo: 'cargar_antecedente_clinico',
      entidad_id: 'p-1',
    });
    expect(mutacion).not.toHaveProperty('version_base');
    expect(entidad).toBe('evento_clinico');
  });

  // La ficha lo tiene que mostrar igual que a uno ya sincronizado: marcado como
  // declarado por el tutor y con la fecha escrita como se declaró.
  it('el registro provisional ya viene marcado como del tutor', async () => {
    await encolarAntecedenteClinico('p-1', {
      tipo: 'vacuna',
      fecha: '2023-01-01',
      fecha_precision: 'anio',
      descripcion: 'Antirrábica, según la libreta',
    });

    expect(alta.mock.calls[0]?.[2]).toMatchObject({
      paciente_id: 'p-1',
      cargado_por: 'tutor',
      fecha_precision: 'anio',
    });
  });

  it('devuelve el id de la mutación, que es con lo que se la puede descartar', async () => {
    const id = await encolarAntecedenteClinico('p-1', {
      tipo: 'consulta',
      fecha: '2023-01-01',
      descripcion: 'Se operó de la rodilla',
    });

    expect(id).toBe('mut-1');
  });

  // Es la que el animal está tomando ahora: nace activa (Modelo de Datos, 4.6).
  it('la medicación declarada nace activa y sin dosis si no se sabe', async () => {
    await encolarMedicacionDeclarada('p-1', {
      nombre_droga: 'Meloxicam',
      fecha_inicio: '2023-01-01',
      fecha_precision: 'anio',
    });

    const [mutacion, entidad, provisional] = alta.mock.calls[0] ?? [];
    expect(mutacion).toMatchObject({ tipo: 'cargar_antecedente_de_medicacion' });
    expect(entidad).toBe('medicacion');
    expect(provisional).toMatchObject({ fecha_fin: null, dosis: null, frecuencia: null });
  });

  // Sin precisión declarada la fecha es exacta, que es el default del contrato.
  it('sin precisión declarada el provisional dice día', async () => {
    await encolarMedicacionDeclarada('p-1', {
      nombre_droga: 'Meloxicam',
      fecha_inicio: '2026-08-27',
    });

    expect(alta.mock.calls[0]?.[2]).toMatchObject({ fecha_precision: 'dia' });
  });
});
