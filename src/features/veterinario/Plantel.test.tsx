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

    const { findAllByText } = await render(<Plantel />);
    const entradas = await findAllByText('Ver ficha');

    expect(entradas).toHaveLength(2);
    await fireEvent.press(entradas[1]!);
    expect(irA).toHaveBeenCalledWith('/(clinica-admin)/veterinarios/id-Sofía Aguirre');
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
});
