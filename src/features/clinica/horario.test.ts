import type { FranjaDeAtencion } from '../../api/clinica';

import { estaCerradaTodaLaSemana, validarFranjas } from './horario';

/**
 * Espeja a `TestNuevaGrilla_*` del backend. Si las dos suites dejan de coincidir,
 * es la interfaz la que está dejando armar un horario que la API va a rechazar.
 */
function franja(dia: number, desde: string, hasta: string): FranjaDeAtencion {
  return { dia_semana: dia as 0, hora_desde: desde, hora_hasta: hasta };
}

describe('validarFranjas', () => {
  it('acepta el corte de mediodía', () => {
    const errores = validarFranjas([franja(0, '09:00', '13:00'), franja(0, '16:00', '20:00')], 30);

    expect(errores).toEqual([]);
  });

  it('rechaza dos tramos que se tocan', () => {
    const errores = validarFranjas([franja(0, '09:00', '13:00'), franja(0, '13:00', '18:00')], 30);

    expect(errores).toHaveLength(1);
    expect(errores[0]?.mensaje).toMatch(/sin hueco/);
  });

  it('rechaza dos tramos que se solapan', () => {
    const errores = validarFranjas([franja(1, '09:00', '14:00'), franja(1, '13:00', '18:00')], 30);

    expect(errores).toHaveLength(1);
    expect(errores[0]?.dia).toBe(1);
  });

  it('acepta el mismo horario en días distintos', () => {
    const errores = validarFranjas([franja(0, '09:00', '13:00'), franja(1, '09:00', '13:00')], 30);

    expect(errores).toEqual([]);
  });

  it('rechaza el cierre anterior a la apertura', () => {
    const errores = validarFranjas([franja(0, '18:00', '09:00')], 30);

    expect(errores).toHaveLength(1);
    expect(errores[0]?.mensaje).toMatch(/posterior a la apertura/);
  });

  it('rechaza el turno que no divide alguno de los tramos', () => {
    // El primero divide con turnos de 45; el segundo no, y alcanza con uno.
    const errores = validarFranjas([franja(0, '09:00', '12:00'), franja(0, '16:00', '20:00')], 45);

    expect(errores).toHaveLength(1);
    expect(errores[0]?.posicion).toBe(1);
  });

  it('ubica el error en el día y el tramo, para poder señalarlo', () => {
    const errores = validarFranjas(
      [franja(0, '09:00', '13:00'), franja(3, '09:00', '13:00'), franja(3, '12:00', '18:00')],
      30,
    );

    expect(errores).toEqual([expect.objectContaining({ dia: 3, posicion: 1 })]);
  });
});

describe('estaCerradaTodaLaSemana', () => {
  it('detecta la grilla vacía, que no admite ninguna cita', () => {
    expect(estaCerradaTodaLaSemana([])).toBe(true);
    expect(estaCerradaTodaLaSemana([franja(6, '09:00', '13:00')])).toBe(false);
  });
});
