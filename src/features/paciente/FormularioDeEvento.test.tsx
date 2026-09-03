import { fireEvent, waitFor } from '@testing-library/react-native';

import { ESTADO_DE_CITA, type Cita } from '../../api/cita';
import type { Clinica } from '../../api/clinica';
import { render } from '../../pruebas/render';

import { emitir } from '../../lib/telemetria';

import { FormularioDeEvento } from './FormularioDeEvento';

jest.mock('../../lib/telemetria', () => ({ emitir: jest.fn() }));

const emitirMock = emitir as jest.MockedFunction<typeof emitir>;

beforeEach(() => emitirMock.mockClear());

/**
 * **Cerrar una cita es la única cosa que este formulario hace y que ningún otro
 * puede hacer.** `estado` no lo escribe ningún endpoint: una Cita pasa a
 * cumplida cuando llega el Evento clínico que la referencia por `cita_id`
 * (Reglas de Negocio, 4.4). Si el selector deja de mandar el campo, la agenda
 * de la clínica se llena de citas vencidas que en realidad se atendieron, y
 * ninguna otra prueba lo nota.
 */
const CLINICA: Clinica = {
  id: 'c1',
  nombre: 'Veterinaria Norte',
  direccion: 'Av. Siempre Viva 123',
  contacto: '011-1234-5678',
  duracion_turno_minutos: 30,
  zona_horaria: 'America/Argentina/Buenos_Aires',
  created_at: '',
  updated_at: '',
};

function cita(cambios: Partial<Cita> = {}): Cita {
  return {
    id: 'cita-1',
    paciente_id: 'p1',
    clinica_id: 'c1',
    tipo: 'control',
    fecha_programada: '2027-01-04T12:30:00Z',
    estado: ESTADO_DE_CITA.PENDIENTE,
    notificar_tutor: true,
    created_at: '',
    updated_at: '',
    ...cambios,
  };
}

function propsBase() {
  return {
    enviando: false,
    clinica: CLINICA,
    onGuardar: jest.fn(),
    onCancelar: jest.fn(),
  };
}

async function completarYGuardar(
  utilidades: Awaited<ReturnType<typeof render>>,
  descripcion = 'Control anual sin hallazgos',
) {
  await fireEvent.changeText(utilidades.getByLabelText('Descripción'), descripcion);
  await fireEvent.press(utilidades.getByRole('button', { name: 'Cargar evento' }));
}

describe('FormularioDeEvento y el cierre de la cita', () => {
  it('no ofrece el selector cuando la mascota no tiene nada agendado', async () => {
    const { queryByText } = await render(<FormularioDeEvento {...propsBase()} citas={[]} />);

    expect(queryByText('¿Cierra una cita agendada?')).toBeNull();
  });

  it('manda cita_id de la cita elegida', async () => {
    const props = propsBase();
    const utilidades = await render(
      <FormularioDeEvento {...props} citas={[cita()]} citaInicial="cita-1" />,
    );

    await completarYGuardar(utilidades);

    await waitFor(() => expect(props.onGuardar).toHaveBeenCalledTimes(1));
    expect(props.onGuardar).toHaveBeenCalledWith(expect.objectContaining({ cita_id: 'cita-1' }));
  });

  // Mandar cita_id vacío o nulo sería pedirle al backend que cierre una cita que
  // no existe: cuando no cierra ninguna, el campo no viaja.
  it('no manda cita_id cuando la atención no cierra ninguna cita', async () => {
    const props = propsBase();
    const utilidades = await render(<FormularioDeEvento {...props} citas={[cita()]} />);

    await completarYGuardar(utilidades);

    await waitFor(() => expect(props.onGuardar).toHaveBeenCalledTimes(1));
    expect(props.onGuardar.mock.calls[0]?.[0]).not.toHaveProperty('cita_id');
  });

  // La mascota llegó tarde y se la atendió igual: dejarla vencida para siempre
  // falsearía el historial (Reglas de Negocio, 4.4).
  it('ofrece cerrar una cita vencida, marcada como tal', async () => {
    const { getByText } = await render(
      <FormularioDeEvento
        {...propsBase()}
        citas={[cita({ estado: ESTADO_DE_CITA.VENCIDO })]}
        citaInicial="cita-1"
      />,
    );

    expect(getByText(/\(vencida\)/)).toBeVisible();
  });

  // El backend rechaza el segundo evento que reclame la misma cita.
  it('no ofrece una cita ya cumplida', async () => {
    const { queryByText } = await render(
      <FormularioDeEvento {...propsBase()} citas={[cita({ estado: ESTADO_DE_CITA.CUMPLIDO })]} />,
    );

    expect(queryByText('¿Cierra una cita agendada?')).toBeNull();
  });
});

/**
 * El tiempo de carga es lo que decide si el veterinario vuelve al papel, y el
 * abandono dice si el formulario es largo o si no se entiende. Sin estos dos
 * eventos, la única señal que queda es que dejó de cargar.
 */
describe('lo que el formulario deja medido', () => {
  it('anota que se abrió la carga', async () => {
    await render(<FormularioDeEvento {...propsBase()} />);

    expect(emitirMock).toHaveBeenCalledWith('carga_evento_abierta');
  });

  it('cerrar sin guardar cuenta como abandono, con lo que tardó', async () => {
    const pantalla = await render(<FormularioDeEvento {...propsBase()} />);

    await pantalla.unmount();

    const abandono = emitirMock.mock.calls.find(([nombre]) => nombre === 'carga_evento_abandonada');
    expect(abandono).toBeTruthy();
    expect(typeof abandono?.[1]?.duracion_ms).toBe('number');
  });

  it('guardar no es abandonar', async () => {
    const pantalla = await render(<FormularioDeEvento {...propsBase()} />);
    await completarYGuardar(pantalla);

    await pantalla.unmount();

    expect(emitirMock.mock.calls.map(([nombre]) => nombre)).not.toContain(
      'carga_evento_abandonada',
    );
  });
});

/**
 * Corregir un evento ya firmado no es cargarlo de nuevo: los campos vienen
 * sembrados y el tipo queda fijo, porque la API lo omite de la entrada y
 * cambiarlo sería reescribir qué se hizo en vez de corregir cómo se escribió.
 */
describe('FormularioDeEvento al corregir', () => {
  const EVENTO = {
    id: 'ec-1',
    paciente_id: 'p-1',
    usuario_id: 'u-1',
    cargado_por: 'veterinario' as const,
    tipo: 'vacuna' as const,
    fecha: '2026-05-04',
    fecha_precision: 'dia' as const,
    descripcion: 'Refuerzo antirrábico anual.',
    diagnostico: null,
    campo_estructurado: {
      nombre_vacuna: 'Antirrábica',
      lote: 'AR-8840',
      fecha_proxima_dosis: '2027-04-29',
    },
    created_at: '',
    updated_at: '',
  };

  it('siembra lo que ya estaba escrito', async () => {
    const { getByDisplayValue } = await render(
      <FormularioDeEvento {...propsBase()} valorInicial={EVENTO} />,
    );

    expect(getByDisplayValue('Refuerzo antirrábico anual.')).toBeOnTheScreen();
    expect(getByDisplayValue('2026-05-04')).toBeOnTheScreen();
    // Y el campo estructurado de su tipo, que es lo que más cuesta reescribir.
    expect(getByDisplayValue('Antirrábica')).toBeOnTheScreen();
    expect(getByDisplayValue('AR-8840')).toBeOnTheScreen();
  });

  it('no deja cambiar el tipo', async () => {
    const { getByLabelText } = await render(
      <FormularioDeEvento {...propsBase()} valorInicial={EVENTO} />,
    );

    expect(getByLabelText('Tipo de evento').props.editable).toBe(false);
  });

  it('cambia el verbo del botón: se guarda, no se carga', async () => {
    const { getByText, queryByText } = await render(
      <FormularioDeEvento {...propsBase()} valorInicial={EVENTO} />,
    );

    expect(getByText('Guardar los cambios')).toBeOnTheScreen();
    expect(queryByText('Cargar evento')).toBeNull();
  });
});
