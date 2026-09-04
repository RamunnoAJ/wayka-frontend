import { waitFor } from '@testing-library/react-native';

import type { Adjunto } from '../../api/adjunto';
import type { Paciente } from '../../api/paciente';
import { render } from '../../pruebas/render';
import * as consultasDePaciente from '../paciente/queries';

import { FichaDeMiMascota } from './FichaDeMiMascota';
import * as consultas from './queries';

/**
 * El gateo por nivel: el co-tutor de solo lectura ve el peso y no el botón de
 * actualizarlo. Ofrecer una acción que el backend va a rechazar es un error que
 * la interfaz puede evitar, y es lo único de esta regla que vive acá.
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
  created_at: '2026-01-01T12:00:00Z',
  updated_at: '2026-01-01T12:00:00Z',
};

function consultaResuelta<T>(data: T) {
  return { data, isPending: false, isError: false, refetch: jest.fn() } as never;
}

// La ficha lee de la copia local: los hooks que se falsean son los del tutor,
// no los online que comparte el veterinario.
function conNivel(nivel: Paciente['nivel_de_acceso']) {
  jest
    .spyOn(consultas, 'useMiMascota')
    .mockReturnValue(consultaResuelta({ ...MASCOTA, nivel_de_acceso: nivel }));
  jest.spyOn(consultas, 'useHistorialDeMiMascota').mockReturnValue(consultaResuelta([]));
  jest.spyOn(consultas, 'useMedicacionesDeMiMascota').mockReturnValue(consultaResuelta([]));
  jest
    .spyOn(consultas, 'useAdjuntosDeMiMascota')
    .mockReturnValue(consultaResuelta({ adjuntos: [], soloMetadatos: false }));
  jest.spyOn(consultasDePaciente, 'useRetirarAdjunto').mockReturnValue({
    mutate: jest.fn(),
    isPending: false,
  } as never);
}

/** Un adjunto cualquiera de la mascota, con lo que la ficha lee de él. */
function adjunto(extra: Partial<Adjunto> = {}): Adjunto {
  return {
    id: 'a-1',
    paciente_id: 'p-1',
    subido_por_usuario_id: 'u-1',
    tipo: 'foto',
    nombre_archivo: 'luna.png',
    content_type: 'image/png',
    tamano_bytes: 2048,
    archivo_url: 'https://bucket.test/luna.png?firma=valida',
    es_foto_perfil: false,
    created_at: '2026-01-01T12:00:00Z',
    updated_at: '2026-01-01T12:00:00Z',
    ...extra,
  };
}

afterEach(() => jest.restoreAllMocks());

describe('FichaDeMiMascota', () => {
  it('el dueño puede actualizar el peso', async () => {
    conNivel('dueno');
    const { getByText } = await render(
      <FichaDeMiMascota
        pacienteId="p-1"
        onVerAccesos={jest.fn()}
        onCompartir={jest.fn()}
        onCargarAntecedente={jest.fn()}
        onEditarDatos={jest.fn()}
      />,
    );

    await waitFor(() => expect(getByText('Luna')).toBeTruthy());
    expect(getByText('Actualizar')).toBeTruthy();
  });

  // Sin conexión la ficha abre igual: los datos, el peso y el historial salen de
  // la copia local. Lo único que no se puede es abrir un archivo, que necesita
  // una URL prefirmada que vence en minutos y por eso no se replica.
  it('sin conexión abre con los datos de la copia y avisa por los adjuntos', async () => {
    conNivel('dueno');
    jest
      .spyOn(consultas, 'useAdjuntosDeMiMascota')
      .mockReturnValue(consultaResuelta({ adjuntos: [], soloMetadatos: true }));

    const { getByText } = await render(
      <FichaDeMiMascota
        pacienteId="p-1"
        onVerAccesos={jest.fn()}
        onCompartir={jest.fn()}
        onCargarAntecedente={jest.fn()}
        onEditarDatos={jest.fn()}
      />,
    );

    await waitFor(() => expect(getByText('Luna')).toBeTruthy());
    expect(getByText('12,5 kg')).toBeTruthy();
    expect(getByText('Necesitás conexión para ver estos archivos o subir uno nuevo.')).toBeTruthy();
  });

  it('el co-tutor de solo lectura ve el peso y no el botón', async () => {
    conNivel('lectura');
    const { getByText, queryByText } = await render(
      <FichaDeMiMascota
        pacienteId="p-1"
        onVerAccesos={jest.fn()}
        onCompartir={jest.fn()}
        onCargarAntecedente={jest.fn()}
        onEditarDatos={jest.fn()}
      />,
    );

    await waitFor(() => expect(getByText('Luna')).toBeTruthy());
    expect(getByText('12,5 kg')).toBeTruthy();
    expect(queryByText('Actualizar')).toBeNull();
  });

  // Los adjuntos son el mismo gateo: el de solo lectura lista y mira (regla
  // 3.2). La zona de carga no se muestra deshabilitada, no se muestra.
  it('el co-tutor de solo lectura ve los adjuntos y no la zona de carga', async () => {
    conNivel('lectura');
    const { getByText, queryByText } = await render(
      <FichaDeMiMascota
        pacienteId="p-1"
        onVerAccesos={jest.fn()}
        onCompartir={jest.fn()}
        onCargarAntecedente={jest.fn()}
        onEditarDatos={jest.fn()}
      />,
    );

    await waitFor(() => expect(getByText('Luna')).toBeTruthy());
    expect(getByText('Adjuntos generales')).toBeTruthy();
    expect(queryByText('Tipo de archivo')).toBeNull();
  });

  it('el co-tutor con edición sí ve la zona de carga de adjuntos', async () => {
    conNivel('edicion');
    const { getByText } = await render(
      <FichaDeMiMascota
        pacienteId="p-1"
        onVerAccesos={jest.fn()}
        onCompartir={jest.fn()}
        onCargarAntecedente={jest.fn()}
        onEditarDatos={jest.fn()}
      />,
    );

    await waitFor(() => expect(getByText('Luna')).toBeTruthy());
    expect(getByText('Tipo de archivo')).toBeTruthy();
  });

  // La foto es un adjunto marcado y no un campo del Paciente (Modelo de Datos,
  // 4.8): la ficha la busca en el listado de adjuntos.
  it('la foto marcada encabeza la ficha', async () => {
    conNivel('dueno');
    jest.spyOn(consultas, 'useAdjuntosDeMiMascota').mockReturnValue(
      consultaResuelta({
        adjuntos: [adjunto(), adjunto({ id: 'a-2', es_foto_perfil: true })],
        soloMetadatos: false,
      }),
    );

    const { getByLabelText, getByText } = await render(
      <FichaDeMiMascota
        pacienteId="p-1"
        onVerAccesos={jest.fn()}
        onCompartir={jest.fn()}
        onCargarAntecedente={jest.fn()}
        onEditarDatos={jest.fn()}
      />,
    );

    await waitFor(() => expect(getByText('Luna')).toBeTruthy());
    expect(getByLabelText('Luna')).toBeTruthy();
  });

  // Sin foto la ficha no rellena con algo que finja serlo: queda el ícono de la
  // especie, que no promete nada.
  it('sin foto marcada la ficha no muestra ninguna', async () => {
    conNivel('dueno');
    jest
      .spyOn(consultas, 'useAdjuntosDeMiMascota')
      .mockReturnValue(consultaResuelta({ adjuntos: [adjunto()], soloMetadatos: false }));

    const { queryByLabelText, getByText } = await render(
      <FichaDeMiMascota
        pacienteId="p-1"
        onVerAccesos={jest.fn()}
        onCompartir={jest.fn()}
        onCargarAntecedente={jest.fn()}
        onEditarDatos={jest.fn()}
      />,
    );

    await waitFor(() => expect(getByText('Luna')).toBeTruthy());
    expect(queryByLabelText('Luna')).toBeNull();
  });

  // Sin conexión los metadatos están y la URL prefirmada no: dibujar la foto
  // sería pedirle a la ficha un archivo que no puede traer.
  it('sin conexión la ficha no intenta mostrar la foto', async () => {
    conNivel('dueno');
    jest.spyOn(consultas, 'useAdjuntosDeMiMascota').mockReturnValue(
      consultaResuelta({
        adjuntos: [adjunto({ es_foto_perfil: true, archivo_url: '' })],
        soloMetadatos: true,
      }),
    );

    const { queryByLabelText, getByText } = await render(
      <FichaDeMiMascota
        pacienteId="p-1"
        onVerAccesos={jest.fn()}
        onCompartir={jest.fn()}
        onCargarAntecedente={jest.fn()}
        onEditarDatos={jest.fn()}
      />,
    );

    await waitFor(() => expect(getByText('Luna')).toBeTruthy());
    expect(queryByLabelText('Luna')).toBeNull();
  });
});

/**
 * «Lo cargado se ve como propio. En el historial aparece marcado como declarado
 * por el tutor, y con las acciones […] de dar de baja que los registros del
 * veterinario no tienen» — Alcance de Plataformas, 5.12.
 *
 * Sin eso, un antecedente mal cargado quedaba para siempre: fuera del resumen
 * del alta no había ninguna forma de sacarlo.
 */
describe('FichaDeMiMascota · acciones sobre lo que cargó el tutor', () => {
  function conHistorial(eventos: unknown[]) {
    conNivel('dueno');
    jest
      .spyOn(consultas, 'useHistorialDeMiMascota')
      .mockReturnValue(consultaResuelta(eventos as never));
  }

  const DEL_TUTOR = {
    id: 'e-1',
    paciente_id: 'p-1',
    tipo: 'alergia',
    fecha: '2023-03-01',
    fecha_precision: 'mes',
    descripcion: 'Polen',
    cargado_por: 'tutor',
    created_at: '2026-01-01T12:00:00Z',
    updated_at: '2026-01-01T12:00:00Z',
  };
  const DE_LA_CLINICA = {
    ...DEL_TUTOR,
    id: 'e-2',
    descripcion: 'Otitis',
    cargado_por: 'veterinario',
  };

  it('ofrece quitar el antecedente que declaró el tutor', async () => {
    conHistorial([DEL_TUTOR]);

    const { findByLabelText } = await render(
      <FichaDeMiMascota
        pacienteId="p-1"
        onVerAccesos={jest.fn()}
        onCompartir={jest.fn()}
        onCargarAntecedente={jest.fn()}
        onEditarDatos={jest.fn()}
      />,
    );

    expect(await findByLabelText('Acciones del antecedente que cargaste')).toBeOnTheScreen();
  });

  it('no ofrece nada sobre lo que escribió la clínica', async () => {
    conHistorial([DE_LA_CLINICA]);

    const { queryByLabelText } = await render(
      <FichaDeMiMascota
        pacienteId="p-1"
        onVerAccesos={jest.fn()}
        onCompartir={jest.fn()}
        onCargarAntecedente={jest.fn()}
        onEditarDatos={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(queryByLabelText('Acciones del antecedente que cargaste')).toBeNull(),
    );
  });

  // El de solo lectura no escribe nada, ni sobre lo suyo (Reglas de Negocio, 3.2).
  it('el co-tutor de lectura no las ve', async () => {
    conNivel('lectura');
    jest
      .spyOn(consultas, 'useHistorialDeMiMascota')
      .mockReturnValue(consultaResuelta([DEL_TUTOR] as never));

    const { queryByLabelText } = await render(
      <FichaDeMiMascota
        pacienteId="p-1"
        onVerAccesos={jest.fn()}
        onCompartir={jest.fn()}
        onCargarAntecedente={jest.fn()}
        onEditarDatos={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(queryByLabelText('Acciones del antecedente que cargaste')).toBeNull(),
    );
  });
});
