import { render } from '../../pruebas/render';

import { Rechazos } from './Rechazos';
import * as consultas from './queries';
import type { MutacionEnCola } from './almacen';

/**
 * «Un antecedente rechazado no se pierde de vista […] el rechazo **muestra el
 * contenido completo de lo que se quiso cargar y ofrece corregirlo ahí mismo**,
 * en vez de solo descartarlo — descartar es tirar el único lugar donde el dato
 * estaba escrito» — Sincronización sin Conexión, 6.
 *
 * El payload viaja en la cola y llega a la pantalla; lo que faltaba era
 * dibujarlo. Y como `marcarRechazada` ya borró el registro provisional, la cola
 * es literalmente el único lugar donde queda "la vacuna de 2023".
 */
const RECHAZO: MutacionEnCola = {
  id_mutacion: 'mut-1',
  tipo: 'cargar_antecedente_clinico',
  entidad_id: 'p-1',
  estado: 'rechazada',
  motivo: { codigo: 'datos_invalidos', mensaje: 'falta el antecedente' },
  evento_clinico: {
    tipo: 'vacuna',
    fecha: '2023-03-01',
    fecha_precision: 'mes',
    descripcion: 'Antirrábica, según la libreta',
    campo_estructurado: { nombre_vacuna: 'Antirrábica' },
  },
} as MutacionEnCola;

function conRechazos(rechazos: MutacionEnCola[]) {
  jest.spyOn(consultas, 'useRechazos').mockReturnValue({
    data: rechazos,
    isPending: false,
    isError: false,
    refetch: jest.fn(),
  } as never);
  jest
    .spyOn(consultas, 'useDescartarRechazo')
    .mockReturnValue({ mutate: jest.fn(), isPending: false } as never);
}

afterEach(() => jest.restoreAllMocks());

/**
 * «Los motivos de rechazo que el tutor ve son de negocio ("ese turno ya está
 * ocupado", "el peso lo actualizó la clínica"), **no técnicos**» —
 * Sincronización sin Conexión, 7. El `mensaje` del servidor es diagnóstico y no
 * está escrito para mostrarse: llegaba tal cual, en minúscula y con el prefijo
 * de la categoría.
 */
describe('el motivo de un rechazo', () => {
  it('no muestra el texto que mandó el servidor', async () => {
    conRechazos([
      {
        ...RECHAZO,
        motivo: {
          codigo: 'no_encontrado',
          mensaje: 'datos invalidos: la mascota esta dada de baja',
        },
      } as MutacionEnCola,
    ]);

    const { getByText, queryByText } = await render(<Rechazos />);

    expect(queryByText(/datos invalidos/)).toBeNull();
    expect(getByText(/ya no está/)).toBeOnTheScreen();
  });

  it('traduce el choque de versiones a lo que pasó', async () => {
    conRechazos([
      {
        ...RECHAZO,
        motivo: { codigo: 'version_desactualizada', mensaje: 'version desactualizada' },
      } as MutacionEnCola,
    ]);

    const { getByText } = await render(<Rechazos />);

    expect(getByText(/lo cambió alguien más/)).toBeOnTheScreen();
  });
});

describe('el rechazo de un antecedente', () => {
  it('muestra lo que el tutor había escrito', async () => {
    conRechazos([RECHAZO]);

    const { getByText } = await render(<Rechazos />);

    expect(getByText(/Antirrábica, según la libreta/)).toBeOnTheScreen();
  });

  it('ofrece corregirlo, y no solo descartarlo', async () => {
    conRechazos([RECHAZO]);

    const { getByText } = await render(<Rechazos />);

    expect(getByText('Corregir y volver a cargar')).toBeOnTheScreen();
    expect(getByText('Descartar este cambio')).toBeOnTheScreen();
  });
});
