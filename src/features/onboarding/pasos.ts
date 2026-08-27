/**
 * Activación de una clínica nueva, tal como la diseñó el handoff "Onboarding
 * Clínica": cinco pasos con una barra de progreso que arranca ya empezada.
 *
 * Los que todavía **no son implementables contra el contrato** están marcados
 * con `bloqueadoPor`. No se implementan a medias ni se inventan campos: los
 * documentos de `../../../docs` son el contrato del proyecto (CLAUDE.md), y una
 * pantalla que escribe datos que la API no tiene es código muerto que además
 * miente sobre lo que el sistema guarda.
 *
 * El paso de la cuenta se desbloqueó al definirse el proceso 4.16: la contraseña
 * se estrena en `(auth)/activacion`, antes de llegar acá. El de los datos de la
 * clínica, al exponerse `GET`/`PATCH /clinicas/{id}` con su horario de atención.
 * El de la agenda sigue parcialmente bloqueado: la hora del turno ya existe,
 * pero la agenda por profesional y su visibilidad no.
 */
export const PASOS = [
  {
    clave: 'cuenta',
    etiqueta: 'Tu cuenta',
    porcentaje: 20,
    bloqueadoPor: null,
  },
  {
    clave: 'demo',
    etiqueta: 'Wayka andando',
    porcentaje: 35,
    bloqueadoPor: null,
  },
  {
    clave: 'clinica',
    etiqueta: 'Datos de la clínica',
    porcentaje: 60,
    bloqueadoPor: null,
  },
  {
    clave: 'veterinario',
    etiqueta: 'Primer veterinario',
    porcentaje: 85,
    bloqueadoPor: null,
  },
  {
    clave: 'agenda',
    etiqueta: 'Activar la agenda',
    porcentaje: 100,
    bloqueadoPor:
      'Falta la parte del diseño que no se especificó: no hay "días que atiende" en la entidad Veterinario (4.4), ni agenda por profesional —la Cita no lleva veterinario asignado (4.7)—, ni un campo que haga visible o invisible la agenda para los tutores. Lo que sí quedó definido, la hora del turno y la grilla, ya está en el calendario de cada paciente.',
  },
] as const;

export type ClaveDePaso = (typeof PASOS)[number]['clave'];

export function indiceDe(clave: ClaveDePaso): number {
  return PASOS.findIndex((p) => p.clave === clave);
}
