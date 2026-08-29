import { Text } from 'react-native';

import type { Veterinario } from '../../api/veterinario';
import { render } from '../../pruebas/render';
import { usePlantel as usePlantelComoLista } from '../veterinario/queries';

import { usePlantelPorId } from './queries';

/**
 * El plantel se consulta desde dos lugares con dos formas distintas: la agenda
 * y el panel lo quieren como lista, y el historial clínico como índice por id,
 * para resolver el autor de cada registro sin recorrer el array por evento.
 *
 * Las dos consultas comparten la clave `['veterinarios']`, que es lo correcto —
 * es el mismo recurso y pedirlo dos veces sería pedirlo de más. Lo que no puede
 * pasar es que compartan también la **forma cacheada**: la caché de TanStack
 * Query se indexa por clave, así que la primera en resolver le deja su valor a
 * la otra, y la que esperaba lo contrario recibe un objeto sin los métodos que
 * va a llamar.
 */
jest.mock('../../api/veterinario', () => ({
  ...jest.requireActual('../../api/veterinario'),
  listarVeterinarios: jest.fn(),
}));

const { listarVeterinarios } = jest.requireMock('../../api/veterinario') as {
  listarVeterinarios: jest.Mock;
};

const PLANTEL = [
  { id: 'vet-1', nombre: 'Lucia Ferreyra', matricula: 'MP-4821' },
  { id: 'vet-2', nombre: 'Martin Torres', matricula: 'MP-5507' },
] as Veterinario[];

/** Monta las dos consultas a la vez, que es lo que pasa al navegar entre pantallas. */
function DosConsultas() {
  const lista = usePlantelComoLista();
  const porId = usePlantelPorId();

  return (
    <>
      <Text>{`lista: ${lista.data?.map((v) => v.nombre).join(', ') ?? '-'}`}</Text>
      <Text>{`autor: ${porId.data?.get('vet-1')?.nombre ?? '-'}`}</Text>
    </>
  );
}

beforeEach(() => {
  listarVeterinarios.mockClear();
  listarVeterinarios.mockResolvedValue(PLANTEL);
});

it('sirve el plantel como lista y como índice sin pisarse en la caché', async () => {
  const { findByText } = await render(<DosConsultas />);

  expect(await findByText('lista: Lucia Ferreyra, Martin Torres')).toBeTruthy();
  expect(await findByText('autor: Lucia Ferreyra')).toBeTruthy();
});

// Compartir la clave es la intención: el plantel se pide una sola vez aunque lo
// miren dos pantallas.
it('pide el plantel una sola vez para las dos formas', async () => {
  await render(<DosConsultas />);

  expect(listarVeterinarios).toHaveBeenCalledTimes(1);
});
