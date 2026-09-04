import { fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';

import { listarVeterinarios, type Veterinario } from '../../api/veterinario';
import { render } from '../../pruebas/render';

import { Plantel } from './Plantel';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('../../api/veterinario', () => ({
  listarVeterinarios: jest.fn(),
  crearVeterinario: jest.fn(),
  actualizarVeterinario: jest.fn(),
  darDeBajaVeterinario: jest.fn(),
}));

const listar = listarVeterinarios as jest.Mock;
const irA = router.push as jest.Mock;

function ficha(nombre: string, matricula?: string | null): Veterinario {
  return {
    id: `id-${nombre}`,
    nombre,
    tipo_documento: 'dni',
    numero_documento: '30111222',
    matricula,
    clinica_id: 'c1',
    created_at: '',
    updated_at: '',
  };
}

beforeEach(() => {
  irA.mockClear();
});

/**
 * La ficha es donde se corrige la matrícula, que es lo que saca a una cuenta del
 * modo restringido (regla 2.1). El listado tiene que ofrecer cómo llegar: la
 * ruta existía y no la enlazaba nadie, así que la pantalla prometía un arreglo
 * que no se podía hacer.
 */
describe('Plantel', () => {
  it('deja entrar a la ficha de cada persona', async () => {
    listar.mockResolvedValue([ficha('Ana Rossi', 'MP-4821'), ficha('Sofía Aguirre')]);

    const { findByLabelText, findByText } = await render(<Plantel />);

    // El menú se nombra por la fila a la que pertenece: con uno por fila,
    // "Acciones" a secas los dejaría a todos con el mismo nombre.
    await fireEvent.press(await findByLabelText('Acciones de Sofía Aguirre'));
    await fireEvent.press(await findByText('Ver ficha'));

    expect(irA).toHaveBeenCalledWith('/(clinica-admin)/veterinarios/id-Sofía Aguirre');
  });

  /**
   * Las acciones viven detrás de los tres puntos: dos botones por fila pesan lo
   * mismo que el nombre, y con una baja entre ellos se apunta a una y se toca la
   * otra.
   */
  it('no muestra las acciones hasta abrir el menú de la fila', async () => {
    listar.mockResolvedValue([ficha('Ana Rossi', 'MP-4821')]);

    const { findByText, queryByText, findByLabelText } = await render(<Plantel />);
    await findByText('Ana Rossi');

    expect(queryByText('Ver ficha')).toBeNull();
    expect(queryByText('Dar de baja')).toBeNull();

    await fireEvent.press(await findByLabelText('Acciones de Ana Rossi'));

    expect(await findByText('Ver ficha')).toBeOnTheScreen();
    expect(await findByText('Dar de baja')).toBeOnTheScreen();
  });

  /**
   * La baja conserva su confirmación: es la única acción del listado que
   * desactiva una cuenta, y el menú no la convierte en un toque.
   */
  it('pide confirmación antes de dar de baja', async () => {
    listar.mockResolvedValue([ficha('Ana Rossi', 'MP-4821')]);

    const { findByText, findByLabelText } = await render(<Plantel />);
    await fireEvent.press(await findByLabelText('Acciones de Ana Rossi'));
    await fireEvent.press(await findByText('Dar de baja'));

    expect(await findByText(/Se desactiva también su cuenta/)).toBeOnTheScreen();
  });

  it('avisa arriba del listado quién no puede escribir historial', async () => {
    listar.mockResolvedValue([ficha('Ana Rossi', 'MP-4821'), ficha('Sofía Aguirre')]);

    const { findByText } = await render(<Plantel />);

    expect(await findByText(/Sofía Aguirre no puede escribir historial/)).toBeOnTheScreen();
  });

  it('no avisa nada cuando el plantel entero tiene matrícula', async () => {
    listar.mockResolvedValue([ficha('Ana Rossi', 'MP-4821')]);

    const { findByText, queryByText } = await render(<Plantel />);
    await findByText('Ana Rossi');

    expect(queryByText(/no puede escribir historial/)).toBeNull();
  });

  /**
   * La búsqueda va al backend y no filtra la lista ya cargada: existe para
   * responder si una matrícula está en uso, y la matrícula es única en todo el
   * sistema, no solo en el plantel que esta pantalla muestra.
   */
  it('busca en el backend y no sobre la lista cargada', async () => {
    listar.mockResolvedValue([ficha('Ana Rossi', 'MP-4821')]);

    const { findByText, findByLabelText } = await render(<Plantel />);
    await findByText('Ana Rossi');

    await fireEvent.changeText(await findByLabelText('Buscar en el plantel'), 'MP-3390');
    await fireEvent.press(await findByText('Buscar'));

    expect(listar).toHaveBeenLastCalledWith({ busqueda: 'MP-3390' });
  });

  // Volver al plantel entero no vuelve a pedirlo: es la misma consulta que ya
  // estaba cacheada antes de buscar, no una segunda con la misma forma.
  it('vuelve al plantel entero al limpiar la búsqueda', async () => {
    listar.mockImplementation((filtros?: { busqueda?: string }) =>
      Promise.resolve(
        filtros?.busqueda ? [ficha('Hernán Vidal', 'MP-3390')] : [ficha('Ana Rossi', 'MP-4821')],
      ),
    );

    const { findByText, findByLabelText, queryByText } = await render(<Plantel />);
    await findByText('Ana Rossi');

    await fireEvent.changeText(await findByLabelText('Buscar en el plantel'), 'MP-3390');
    await fireEvent.press(await findByText('Buscar'));
    await findByText('Hernán Vidal');
    expect(queryByText('Ana Rossi')).toBeNull();

    await fireEvent.press(await findByText('Ver todo'));

    expect(await findByText('Ana Rossi')).toBeOnTheScreen();
  });
});
