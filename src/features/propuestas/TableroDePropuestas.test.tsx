import { fireEvent } from '@testing-library/react-native';

import {
  crearPropuesta,
  listarPropuestas,
  quitarVotoDePropuesta,
  votarPropuesta,
  type Propuesta,
} from '../../api/propuesta';
import { ErrorApi } from '../../lib/errores';
import { render } from '../../pruebas/render';

import { TableroDePropuestas } from './TableroDePropuestas';

jest.mock('../../api/propuesta', () => ({
  ...jest.requireActual('../../api/propuesta'),
  listarPropuestas: jest.fn(),
  crearPropuesta: jest.fn(),
  votarPropuesta: jest.fn(),
  quitarVotoDePropuesta: jest.fn(),
}));

const listar = listarPropuestas as jest.Mock;
const votar = votarPropuesta as jest.Mock;
const quitarVoto = quitarVotoDePropuesta as jest.Mock;
const crear = crearPropuesta as jest.Mock;

function propuesta(overrides: Partial<Propuesta> = {}): Propuesta {
  return {
    id: 'p1',
    titulo: 'Que me avise antes de la vacuna',
    descripcion: null,
    estado: 'recibida',
    votos: 3,
    ya_vote: false,
    created_at: '2026-01-01T10:00:00Z',
    updated_at: '2026-01-01T10:00:00Z',
    ...overrides,
  };
}

beforeEach(() => {
  listar.mockReset();
  votar.mockReset();
  quitarVoto.mockReset();
  crear.mockReset();
});

describe('TableroDePropuestas', () => {
  it('muestra las propuestas en el orden que devuelve el backend', async () => {
    listar.mockResolvedValue([
      propuesta({ id: 'p1', titulo: 'La más votada', votos: 9 }),
      propuesta({ id: 'p2', titulo: 'La menos votada', votos: 1 }),
    ]);

    const { findByText } = await render(<TableroDePropuestas />);

    // El orden no se recalcula acá: lo decide la query, con su desempate.
    await findByText('La más votada');
    await findByText('La menos votada');
    expect(listar).toHaveBeenCalledWith({ orden: 'votadas', limite: 200 });
  });

  it('muestra el estado de cada propuesta', async () => {
    listar.mockResolvedValue([
      propuesta({ id: 'p1', titulo: 'Ya está hecha', estado: 'hecha' }),
      propuesta({ id: 'p2', titulo: 'No se va a hacer', estado: 'descartada' }),
    ]);

    const { findByText } = await render(<TableroDePropuestas />);

    await findByText('Hecha');
    // Una descartada se sigue mostrando: es una respuesta pública, no una baja.
    await findByText('Descartada');
    await findByText('No se va a hacer');
  });

  it('registra el voto y lo saca sobre la misma propuesta', async () => {
    listar.mockResolvedValue([propuesta({ votos: 3, ya_vote: false })]);
    votar.mockResolvedValue(propuesta({ votos: 4, ya_vote: true }));
    quitarVoto.mockResolvedValue(propuesta({ votos: 3, ya_vote: false }));

    const { findByLabelText } = await render(<TableroDePropuestas />);

    const boton = await findByLabelText(/^Votar/);
    await fireEvent.press(boton);

    const puesto = await findByLabelText(/^Sacar mi voto/);
    expect(votar).toHaveBeenCalledWith('p1');
    await fireEvent.press(puesto);

    await findByLabelText(/^Votar/);
    expect(quitarVoto).toHaveBeenCalledWith('p1');
  });

  it('no vuelve a pedir la lista después de votar', async () => {
    listar.mockResolvedValue([propuesta()]);
    votar.mockResolvedValue(propuesta({ votos: 4, ya_vote: true }));

    const { findByLabelText } = await render(<TableroDePropuestas />);
    await fireEvent.press(await findByLabelText(/^Votar/));
    await findByLabelText(/^Sacar mi voto/);

    // Invalidar la lista la traería reordenada por votos, y la tarjeta recién
    // tocada se movería debajo del dedo. Se escribe la fila que volvió.
    expect(listar).toHaveBeenCalledTimes(1);
  });

  it('explica el error cuando el voto falla y no cambia el contador', async () => {
    listar.mockResolvedValue([propuesta({ votos: 3, ya_vote: false })]);
    votar.mockRejectedValue(new ErrorApi(500, { codigo: 'error_interno', mensaje: 'falló' }));

    const { findByLabelText, findByText } = await render(<TableroDePropuestas />);
    await fireEvent.press(await findByLabelText(/^Votar/));

    await findByText('No se pudo registrar el voto');
    // Sigue sin voto: el contador nunca se movió por adelantado.
    await findByLabelText(/^Votar .* 3 votos$/);
  });

  it('ofrece escribir la primera cuando no hay ninguna', async () => {
    listar.mockResolvedValue([]);

    const { findByText } = await render(<TableroDePropuestas />);

    await findByText('Todavía no hay propuestas');
    await findByText('Escribir la primera');
  });

  it('deja reintentar cuando la lista no carga', async () => {
    listar.mockRejectedValueOnce(new ErrorApi(500, { codigo: 'error_interno', mensaje: 'falló' }));
    listar.mockResolvedValueOnce([propuesta({ titulo: 'Cargó al reintentar' })]);

    const { findByText } = await render(<TableroDePropuestas />);

    await fireEvent.press(await findByText('Reintentar'));
    await findByText('Cargó al reintentar');
  });

  it('pagina de a veinte y dice cuántas está mostrando', async () => {
    listar.mockResolvedValue(
      Array.from({ length: 25 }, (_, i) =>
        propuesta({ id: `p${i}`, titulo: `Propuesta ${i}`, votos: 25 - i }),
      ),
    );

    const { findByText, queryByText } = await render(<TableroDePropuestas />);

    await findByText('Mostrando 20 de 25');
    expect(queryByText('Propuesta 24')).toBeNull();

    await fireEvent.press(await findByText('Ver más propuestas (5)'));
    await findByText('Propuesta 24');
  });

  it('no muestra quién escribió ni quién votó cada propuesta', async () => {
    listar.mockResolvedValue([propuesta({ titulo: 'Una propuesta' })]);

    const { findByText, queryByText } = await render(<TableroDePropuestas />);

    await findByText('Una propuesta');
    // El contrato no trae autor ni votantes, y la pantalla no los inventa a
    // partir de nada (Modelo de Datos, sección 5).
    expect(queryByText(/Escrita por/i)).toBeNull();
    expect(queryByText(/Votada por/i)).toBeNull();
  });

  it('publica una propuesta nueva y vuelve al tablero', async () => {
    listar.mockResolvedValue([]);
    crear.mockResolvedValue(propuesta({ titulo: 'La primera' }));

    const { findByText, findByLabelText } = await render(<TableroDePropuestas />);

    await fireEvent.press(await findByText('Escribir la primera'));
    await fireEvent.changeText(
      await findByLabelText('Qué te haría más fácil usar Wayka'),
      'Que me avise antes de la vacuna',
    );
    await fireEvent.press(await findByText('Publicar'));

    expect(crear).toHaveBeenCalledWith({
      titulo: 'Que me avise antes de la vacuna',
      descripcion: undefined,
    });
    // Vuelve al tablero: el formulario no queda abierto después de publicar.
    await findByText('Más votadas');
  });

  it('avisa cuando ya se publicaron cinco propuestas hoy', async () => {
    listar.mockResolvedValue([]);
    crear.mockRejectedValue(
      new ErrorApi(409, { codigo: 'limite_diario_alcanzado', mensaje: 'tope' }),
    );

    const { findByText, findByLabelText } = await render(<TableroDePropuestas />);

    await fireEvent.press(await findByText('Escribir la primera'));
    await fireEvent.changeText(
      await findByLabelText('Qué te haría más fácil usar Wayka'),
      'La sexta del día',
    );
    await fireEvent.press(await findByText('Publicar'));

    await findByText('Ya publicaste cinco propuestas hoy. Probá de nuevo mañana.');
  });
});
