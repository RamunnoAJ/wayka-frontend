import { registrarTelemetria } from '../api/telemetria';
import { obtenerTokenAcceso } from '../stores/sesion';

import { cuantosEventosEsperan, despachar, emitir, vaciarColaDeTelemetria } from './telemetria';

jest.mock('../api/telemetria', () => ({
  ...jest.requireActual('../api/telemetria'),
  registrarTelemetria: jest.fn(),
}));
jest.mock('../stores/sesion', () => ({ obtenerTokenAcceso: jest.fn() }));

const registrarMock = registrarTelemetria as jest.MockedFunction<typeof registrarTelemetria>;
const tokenMock = obtenerTokenAcceso as jest.MockedFunction<typeof obtenerTokenAcceso>;

beforeEach(() => {
  vaciarColaDeTelemetria();
  registrarMock.mockReset();
  registrarMock.mockResolvedValue({ recibidos: 1, descartados: 0 });
  tokenMock.mockReturnValue('token');
});

it('acumula y despacha por lote, no un pedido por evento', async () => {
  emitir('pantalla_vista', { pantalla: 'agenda' });
  emitir('pantalla_vista', { pantalla: 'atenciones' });

  expect(registrarMock).not.toHaveBeenCalled();

  await despachar();

  expect(registrarMock).toHaveBeenCalledTimes(1);
  expect(registrarMock.mock.calls[0]![0].eventos).toHaveLength(2);
});

it('no emite sin sesión: la ruta exige token y encolar eso llena la cola al pedo', () => {
  tokenMock.mockReturnValue(null);

  emitir('pantalla_vista', { pantalla: 'agenda' });

  expect(cuantosEventosEsperan()).toBe(0);
});

it('el evento viaja con su momento y su sesión de uso, y sin actor', async () => {
  emitir('sesion_servida_offline', { copia_caducada: false });
  await despachar();

  const lote = registrarMock.mock.calls[0]![0];
  const evento = lote.eventos[0]!;
  // El preset de jest corre como nativo; en la exportación web sería 'web'.
  expect(lote.plataforma).toBe('ios');
  expect(evento.ocurrido_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  expect(evento.sesion_id).toBeTruthy();
  expect(evento.propiedades).toEqual({ copia_caducada: false });
  expect(evento).not.toHaveProperty('usuario_id');
  expect(evento).not.toHaveProperty('intentos');
});

it('un fallo devuelve el lote a la cola en vez de perderlo', async () => {
  registrarMock.mockRejectedValueOnce(new Error('sin red'));

  emitir('pantalla_vista', { pantalla: 'agenda' });
  await despachar();

  expect(cuantosEventosEsperan()).toBe(1);
});

it('descarta lo que agotó los intentos: un evento perdido es un dato menos', async () => {
  registrarMock.mockRejectedValue(new Error('sin red'));

  emitir('pantalla_vista', { pantalla: 'agenda' });
  await despachar();
  await despachar();
  await despachar();

  expect(cuantosEventosEsperan()).toBe(0);
});

it('sin red acumula hasta el techo y descarta lo más viejo', async () => {
  registrarMock.mockRejectedValue(new Error('sin red'));

  for (let i = 0; i < 520; i += 1) emitir('pantalla_vista', { pantalla: `p${i}` });
  // El primer lote automático falló; a partir de ahí solo se acumula, con el
  // mismo criterio que la sincronización: lo vuelve a disparar la conexión. Se
  // espera a que ese despacho termine, o el de la reconexión devolvería el
  // mismo promise en curso.
  await new Promise((listo) => setTimeout(listo, 0));

  expect(cuantosEventosEsperan()).toBeLessThanOrEqual(500);

  registrarMock.mockResolvedValue({ recibidos: 1, descartados: 0 });
  // Se miran solo los lotes de después de la reconexión: el intento fallido de
  // recién llevaba los primeros veinte, que son justo los que se descartan.
  registrarMock.mockClear();
  await despachar();

  const pantallas = registrarMock.mock.calls
    .flatMap((llamada) => llamada[0].eventos)
    .map((evento) => evento.propiedades?.pantalla);
  expect(pantallas).toContain('p519');
  expect(pantallas).not.toContain('p0');
});

it('no despacha dos veces en paralelo los mismos eventos', async () => {
  emitir('pantalla_vista', { pantalla: 'agenda' });

  await Promise.all([despachar(), despachar()]);

  expect(registrarMock).toHaveBeenCalledTimes(1);
});
