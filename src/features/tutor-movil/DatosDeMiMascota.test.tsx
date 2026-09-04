import { fireEvent } from '@testing-library/react-native';

import type { Paciente } from '../../api/paciente';
import { render } from '../../pruebas/render';

import { DatosDeMiMascota } from './DatosDeMiMascota';

/**
 * «Edición de los campos no clínicos: nombre, especie, raza, fecha de
 * nacimiento y sexo […]. La hace el dueño y el co-tutor con nivel de edición; el
 * de lectura los ve y no los toca» — Alcance de Plataformas, 5.7.
 *
 * Sin esta pantalla, los cinco campos quedaban congelados en el alta: un nombre
 * mal tipeado no se podía corregir nunca.
 */
const MASCOTA: Paciente = {
  id: 'p-1',
  nombre: 'Luna',
  especie: 'canino',
  raza: 'mestiza',
  fecha_nacimiento: '2020-03-15',
  sexo: 'hembra',
  peso_actual: 12.5,
  tutor_id: 't-1',
  nivel_de_acceso: 'dueno',
  created_at: '2026-01-01T12:00:00Z',
  updated_at: '2026-01-01T12:00:00Z',
};

function props(sobrescribir: Partial<Parameters<typeof DatosDeMiMascota>[0]> = {}) {
  return {
    mascota: MASCOTA,
    enviando: false,
    onGuardar: jest.fn(),
    onCancelar: jest.fn(),
    ...sobrescribir,
  };
}

describe('DatosDeMiMascota', () => {
  it('llega con lo que ya estaba cargado', async () => {
    const { getByDisplayValue } = await render(<DatosDeMiMascota {...props()} />);

    expect(getByDisplayValue('Luna')).toBeOnTheScreen();
    expect(getByDisplayValue('mestiza')).toBeOnTheScreen();
    expect(getByDisplayValue('2020-03-15')).toBeOnTheScreen();
  });

  // Se envía la intención, no el registro completo (Sincronización, 5): mandar
  // lo que no se tocó pisaría con valores viejos lo que otro tutor cambió.
  it('manda solo lo que cambió', async () => {
    const p = props();
    const { getByDisplayValue, getByText } = await render(<DatosDeMiMascota {...p} />);

    await fireEvent.changeText(getByDisplayValue('Luna'), 'Lunita');
    await fireEvent.press(getByText('Guardar'));

    expect(p.onGuardar).toHaveBeenCalledWith({ nombre: 'Lunita' });
  });

  it('no guarda si no se cambió nada', async () => {
    const p = props();
    const { getByText } = await render(<DatosDeMiMascota {...p} />);

    await fireEvent.press(getByText('Guardar'));

    expect(p.onGuardar).not.toHaveBeenCalled();
  });

  // El número de chip lo carga el veterinario (Reglas de Negocio, 3.2). El copy
  // sí lo nombra, para decir por qué no está: lo que no puede haber es el campo.
  it('no ofrece un campo para el número de chip', async () => {
    const { queryByLabelText } = await render(<DatosDeMiMascota {...props()} />);

    expect(queryByLabelText(/chip|microchip|identificador/i)).toBeNull();
  });
});
