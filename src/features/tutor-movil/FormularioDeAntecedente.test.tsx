import { fireEvent } from '@testing-library/react-native';

import { render } from '../../pruebas/render';

import {
  FormularioDeAntecedente,
  type AntecedenteACargar,
  type ClaseDeAntecedente,
} from './FormularioDeAntecedente';

/**
 * El formulario del tutor no es el del veterinario con menos campos: es otro
 * formulario. Lo único obligatorio es qué es —la vacuna, el alérgeno, la
 * droga— y la fecha (Reglas de Negocio, 4.23).
 */
async function montar(clase: ClaseDeAntecedente) {
  const onGuardar = jest.fn();
  const pantalla = await render(
    <FormularioDeAntecedente
      clase={clase}
      enviando={false}
      onGuardar={onGuardar}
      onCancelar={jest.fn()}
    />,
  );
  return { ...pantalla, onGuardar };
}

function guardado(onGuardar: jest.Mock): AntecedenteACargar {
  return onGuardar.mock.calls[0]?.[0] as AntecedenteACargar;
}

describe('FormularioDeAntecedente', () => {
  // El lote está impreso en el frasco y lo copia quien vacuna: el dueño tiene la
  // libreta con el nombre y ningún número. Ni siquiera se le pregunta.
  it('la vacuna no pide el lote en ningún lado', async () => {
    const { queryByText } = await montar('vacuna');

    expect(queryByText(/lote/i)).toBeNull();
  });

  it('carga una vacuna sabiendo solo el nombre y el año', async () => {
    const { getByLabelText, getByText, onGuardar } = await montar('vacuna');

    await fireEvent.changeText(getByLabelText('¿Qué vacuna?'), 'Antirrábica');
    await fireEvent.press(getByText('Guardar'));

    const antecedente = guardado(onGuardar);
    expect(antecedente.clase).toBe('evento');
    expect(antecedente.entrada).toMatchObject({
      tipo: 'vacuna',
      fecha_precision: 'anio',
      campo_estructurado: { nombre_vacuna: 'Antirrábica' },
    });
  });

  it('no deja guardar sin decir de qué se trata', async () => {
    const { getByText, onGuardar } = await montar('vacuna');

    await fireEvent.press(getByText('Guardar'));

    expect(onGuardar).not.toHaveBeenCalled();
  });

  // Graduar una alergia es un juicio clínico: si el dueño no lo sabe, la clave
  // no viaja y el veterinario la gradúa cuando la vea.
  it('la alergia sin gravedad no manda la clave vacía', async () => {
    const { getByLabelText, getByText, onGuardar } = await montar('alergia');

    await fireEvent.changeText(getByLabelText('¿A qué es alérgica?'), 'Polen');
    await fireEvent.press(getByText('Guardar'));

    const antecedente = guardado(onGuardar);
    expect(antecedente.entrada).toMatchObject({ campo_estructurado: { alergeno: 'Polen' } });
    if (antecedente.clase === 'evento') {
      expect(antecedente.entrada.campo_estructurado).not.toHaveProperty('severidad');
    }
  });

  // Una medicación en curso es la entidad Medicación y no un Evento clínico: es
  // la que lleva el ciclo de vida del tratamiento vigente (Modelo de Datos, 4.6).
  it('lo que la mascota está tomando se carga como medicación, sin dosis si no la sabe', async () => {
    const { getByLabelText, getByText, onGuardar } = await montar('medicacion');

    await fireEvent.changeText(getByLabelText('¿Qué le estás dando?'), 'Meloxicam');
    await fireEvent.press(getByText('Guardar'));

    const antecedente = guardado(onGuardar);
    expect(antecedente.clase).toBe('medicacion');
    expect(antecedente.entrada).toMatchObject({ nombre_droga: 'Meloxicam' });
    expect(antecedente.entrada).not.toHaveProperty('dosis');
    expect(antecedente.entrada).not.toHaveProperty('frecuencia');
  });

  // "Otra cosa que pasó" no es un tipo nuevo del historial: son los cuatro que
  // ya existen y no llevan campo estructurado.
  it('otra cosa que pasó se guarda como un tipo que ya existe, sin campo estructurado', async () => {
    const { getByLabelText, getByText, onGuardar } = await montar('otro');

    await fireEvent.changeText(getByLabelText('Contanos qué pasó'), 'Se operó de la rodilla');
    await fireEvent.press(getByText('Guardar'));

    const antecedente = guardado(onGuardar);
    expect(antecedente.entrada).toMatchObject({
      tipo: 'consulta',
      descripcion: 'Se operó de la rodilla',
    });
    expect(antecedente.entrada).not.toHaveProperty('campo_estructurado');
  });
});
