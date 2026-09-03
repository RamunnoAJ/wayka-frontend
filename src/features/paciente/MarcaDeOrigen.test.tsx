import type { EventoClinico } from '../../api/evento-clinico';
import { render } from '../../pruebas/render';

import { MarcaDeOrigen } from './MarcaDeOrigen';

/**
 * La marca es contrato, no decoración (Modelo de Datos, 4.5): un veterinario
 * ajeno que lee la vista de urgencia en treinta segundos tiene que saber qué
 * está mirando sin buscarlo.
 */
const ANTECEDENTE: EventoClinico = {
  id: 'ec-1',
  paciente_id: 'p-1',
  usuario_id: 'u-tutor',
  cargado_por: 'tutor',
  tipo: 'vacuna',
  fecha: '2023-01-01',
  fecha_precision: 'anio',
  descripcion: 'Antirrábica, según la libreta',
  created_at: '',
  updated_at: '',
};

describe('MarcaDeOrigen', () => {
  it('dice con todas las letras que lo declaró el tutor', async () => {
    const { getByText } = await render(<MarcaDeOrigen registro={ANTECEDENTE} />);

    expect(getByText('Lo declaró el tutor')).toBeOnTheScreen();
  });

  it('lo dice igual en la variante compacta: se acorta el espacio, no el texto', async () => {
    const { getByText } = await render(<MarcaDeOrigen registro={ANTECEDENTE} compacta />);

    expect(getByText('Lo declaró el tutor')).toBeOnTheScreen();
  });

  // El registro no está mal: lo declaró otra persona. No hay ningún proceso de
  // validación en el modelo y la interfaz no puede inventar uno.
  it('no juzga el dato: no dice que esté sin verificar ni pendiente', async () => {
    const { queryByText } = await render(<MarcaDeOrigen registro={ANTECEDENTE} />);

    expect(queryByText(/verificar/i)).toBeNull();
    expect(queryByText(/pendiente/i)).toBeNull();
  });

  // Marcar también lo del profesional, que es el caso normal del historial,
  // convertiría la marca en ruido — que es como deja de leerse.
  it('no marca lo que escribió un profesional', async () => {
    const { queryByText } = await render(
      <MarcaDeOrigen registro={{ ...ANTECEDENTE, cargado_por: 'veterinario' }} />,
    );

    expect(queryByText(/declaró/i)).toBeNull();
  });
});
