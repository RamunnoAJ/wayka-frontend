import { indexarPorAutor, type Veterinario } from './veterinario';

/**
 * El historial guarda la **cuenta** que escribió (`usuario_id`) y no la ficha,
 * porque escriben los dos roles. El índice del plantel tiene que estar armado
 * por esa misma clave: indexado por el id de la ficha no acierta nunca, y cada
 * registro clínico queda diciendo "Autor fuera del plantel actual" —incluso los
 * que firmó quien está mirando la pantalla.
 */
function ficha(sobrescribir: Partial<Veterinario>): Veterinario {
  return {
    id: '7e000000-0000-0000-0000-000000000001',
    nombre: 'Lucía Ferreyra',
    tipo_documento: 'dni',
    numero_documento: '30111222',
    matricula: 'MP-4821',
    clinica_id: 'c0000000-0000-0000-0000-000000000001',
    usuario_id: '50000000-0000-0000-0000-000000000003',
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-01T10:00:00Z',
    ...sobrescribir,
  };
}

describe('el índice del plantel para resolver autoría', () => {
  it('se arma por la cuenta, que es lo que guarda el registro clínico', () => {
    const indice = indexarPorAutor([ficha({})]);

    expect(indice.get('50000000-0000-0000-0000-000000000003')?.nombre).toBe('Lucía Ferreyra');
    // El id de la ficha no es lo que el registro guarda: no tiene que acertar.
    expect(indice.get('7e000000-0000-0000-0000-000000000001')).toBeUndefined();
  });

  // Una ficha cargada sin correo, o con la cuenta dada de baja, sigue en el
  // plantel: no aporta autoría, pero no puede romper el índice.
  it('deja afuera la ficha que todavía no tiene cuenta', () => {
    const indice = indexarPorAutor([
      ficha({ usuario_id: null }),
      ficha({ id: 'otra', usuario_id: '50000000-0000-0000-0000-000000000004', nombre: 'Martín' }),
    ]);

    expect(indice.size).toBe(1);
    expect(indice.get('50000000-0000-0000-0000-000000000004')?.nombre).toBe('Martín');
  });
});
