import type { Veterinario } from '../../api/veterinario';
import { render } from '../../pruebas/render';

import { AvisoDeMatriculas, nombresDelAviso, sinMatricula } from './AvisoDeMatriculas';

/**
 * Sin matrícula la cuenta entra pero no escribe historial ni medicación (regla
 * 2.1). Lo que se prueba acá es que el listado lo diga **antes** de que alguien
 * intente cargar un evento y no pueda.
 */
function ficha(nombre: string, matricula?: string | null): Veterinario {
  return {
    id: nombre,
    nombre,
    tipo_documento: 'dni',
    numero_documento: '30111222',
    matricula,
    clinica_id: 'c1',
    created_at: '',
    updated_at: '',
  };
}

describe('sinMatricula', () => {
  it('cuenta como faltante la vacía y la que son solo espacios', () => {
    const plantel = [
      ficha('Ana Rossi', 'MP-4821'),
      ficha('Sofía Aguirre', null),
      ficha('Martín Torres', undefined),
      ficha('Paula Nieto', '   '),
    ];

    expect(sinMatricula(plantel).map((f) => f.nombre)).toEqual([
      'Sofía Aguirre',
      'Martín Torres',
      'Paula Nieto',
    ]);
  });
});

describe('nombresDelAviso', () => {
  it('enumera hasta tres y después cuenta', () => {
    expect(nombresDelAviso([ficha('Ana')])).toBe('Ana');
    expect(nombresDelAviso([ficha('Ana'), ficha('Sofía')])).toBe('Ana y Sofía');
    expect(nombresDelAviso([ficha('Ana'), ficha('Sofía'), ficha('Martín')])).toBe(
      'Ana, Sofía y Martín',
    );
    // Con media clínica sin matrícula el aviso tiene que seguir siendo una línea.
    expect(
      nombresDelAviso([
        ficha('Ana'),
        ficha('Sofía'),
        ficha('Martín'),
        ficha('Paula'),
        ficha('Leo'),
      ]),
      // Sin la "y" antes del conteo: "Martín y 2 más" ya lleva la suya, y dos
      // seguidas se leen como un error de tipeo.
    ).toBe('Ana, Sofía, Martín y 2 más');
  });
});

describe('AvisoDeMatriculas', () => {
  it('no dice nada cuando el plantel entero tiene matrícula', async () => {
    const { queryByRole } = await render(
      <AvisoDeMatriculas plantel={[ficha('Ana Rossi', 'MP-4821')]} />,
    );

    expect(queryByRole('alert')).toBeNull();
  });

  it('nombra a quien le falta, para poder ir a buscarla', async () => {
    const { getByText } = await render(
      <AvisoDeMatriculas plantel={[ficha('Ana Rossi', 'MP-4821'), ficha('Sofía Aguirre')]} />,
    );

    expect(getByText(/Sofía Aguirre no puede escribir historial/)).toBeOnTheScreen();
  });

  it('cuenta cuántos son cuando falta más de uno', async () => {
    const { getByText } = await render(
      <AvisoDeMatriculas plantel={[ficha('Sofía Aguirre'), ficha('Martín Torres')]} />,
    );

    expect(getByText(/2 del equipo no pueden escribir historial/)).toBeOnTheScreen();
    expect(getByText(/Sofía Aguirre y Martín Torres/)).toBeOnTheScreen();
  });

  /**
   * El aviso dice qué se pierde, no solo que falta un dato: "sin matrícula" no
   * le dice nada a quien no conoce la regla 2.1.
   */
  it('explica la consecuencia y no solo el dato que falta', async () => {
    const { getByText } = await render(<AvisoDeMatriculas plantel={[ficha('Sofía Aguirre')]} />);

    expect(getByText(/no puede cargar ni editar eventos clínicos ni medicación/)).toBeOnTheScreen();
  });
});
