import type { CitaConPaciente } from '../../api/cita';

/**
 * Búsqueda por nombre de mascota dentro del período que se está mirando.
 *
 * Filtra **en el cliente y no en la API** a propósito: la consulta ya trajo
 * todas las citas del período, así que escribir no dispara una consulta nueva ni
 * espera a la red, y lo que se busca es siempre lo que se ve. Es una búsqueda
 * dentro de lo mostrado, no un buscador de la agenda entera — mover la semana
 * cambia el universo, y eso es lo que la grilla ya está diciendo.
 *
 * Se compara sin tildes ni mayúsculas: "Ñoño" se encuentra escribiendo "nono",
 * que es como se teclea con apuro entre paciente y paciente.
 */
export function normalizar(texto: string): string {
  return texto.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function filtrarPorMascota(citas: CitaConPaciente[], busqueda: string): CitaConPaciente[] {
  const aguja = normalizar(busqueda);
  if (!aguja) return citas;
  return citas.filter((fila) => normalizar(fila.paciente_nombre).includes(aguja));
}
