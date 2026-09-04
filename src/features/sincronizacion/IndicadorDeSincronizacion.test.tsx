import { render } from '../../pruebas/render';

import { IndicadorDeSincronizacion } from './IndicadorDeSincronizacion';
import * as consultas from './queries';

/**
 * La barra aparece cuando hay algo que el tutor tiene que saber (doc 11,
 * sección 7). Que no esté significa que está todo enviado: un cartel verde
 * permanente arriba de la lista de mascotas ocupa lugar para decir que no pasa
 * nada.
 */
function conEstado(pendientes: number, rechazadas: number) {
  jest
    .spyOn(consultas, 'useEstadoDeSincronizacion')
    .mockReturnValue({ data: { pendientes, rechazadas } } as never);
}

afterEach(() => jest.restoreAllMocks());

describe('IndicadorDeSincronizacion', () => {
  it('no muestra nada cuando está todo sincronizado', async () => {
    conEstado(0, 0);

    const { queryByText } = await render(<IndicadorDeSincronizacion onVerRechazos={jest.fn()} />);

    expect(queryByText(/sin enviar|sin aplicar/)).toBeNull();
    expect(queryByText('Todo al día')).toBeNull();
  });

  // Un cambio pendiente que no apareciera haría que la app pareciera haber
  // perdido lo que el tutor acaba de escribir.
  it('muestra los cambios sin enviar', async () => {
    conEstado(2, 0);

    const { getByText } = await render(<IndicadorDeSincronizacion onVerRechazos={jest.fn()} />);

    expect(getByText('2 cambios sin enviar')).toBeOnTheScreen();
  });

  // Un rechazo invisible es un cambio que el tutor cree hecho y no está.
  it('los rechazos se muestran y llevan a resolverlos', async () => {
    conEstado(0, 1);

    const { getByText } = await render(<IndicadorDeSincronizacion onVerRechazos={jest.fn()} />);

    expect(getByText('1 cambio sin aplicar')).toBeOnTheScreen();
  });
});
