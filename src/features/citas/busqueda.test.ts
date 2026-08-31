import type { CitaConPaciente } from '../../api/cita';

import { filtrarPorMascota, normalizar } from './busqueda';

function fila(nombre: string) {
  return { cita: { id: nombre }, paciente_nombre: nombre } as CitaConPaciente;
}

describe('la búsqueda por mascota', () => {
  const citas = [fila('Ñoño'), fila('Frida'), fila('Rocco')];

  it('sin texto no acota nada', () => {
    expect(filtrarPorMascota(citas, '   ')).toBe(citas);
  });

  it('ignora tildes, mayúsculas y espacios de más', () => {
    expect(filtrarPorMascota(citas, ' NONO ').map((f) => f.paciente_nombre)).toEqual(['Ñoño']);
    expect(normalizar('Ñoño')).toBe('nono');
  });

  it('encuentra por un pedazo del nombre', () => {
    expect(filtrarPorMascota(citas, 'ric').map((f) => f.paciente_nombre)).toEqual([]);
    expect(filtrarPorMascota(citas, 'rid').map((f) => f.paciente_nombre)).toEqual(['Frida']);
  });
});
