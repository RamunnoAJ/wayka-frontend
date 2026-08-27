/**
 * Activación de una clínica nueva, tal como la diseñó el handoff "Onboarding
 * Clínica": cinco pasos con una barra de progreso que arranca ya empezada.
 *
 * Tres de los cinco **no son implementables contra el contrato actual** y están
 * marcados con `bloqueadoPor`. No se implementan a medias ni se inventan
 * campos: los documentos de `../../../docs` son el contrato del proyecto
 * (CLAUDE.md), y una pantalla que escribe datos que la API no tiene es código
 * muerto que además miente sobre lo que el sistema guarda.
 */
export const PASOS = [
  {
    clave: 'cuenta',
    etiqueta: 'Tu cuenta',
    porcentaje: 20,
    bloqueadoPor:
      'La cuenta de clínica_admin la crea el administrador de la plataforma por CLI, fuera de la API (RN 4.10). El contrato no tiene un flujo de "definí tu contraseña" en el primer ingreso: `PUT /usuarios/{id}/contrasena` exige estar autenticado y conocer la actual.',
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
    bloqueadoPor:
      'No existe ni el esquema `Clinica` ni ninguna ruta `/clinicas` en `openapi.yaml`, aunque Alcance de Plataformas 3.2 pide editar nombre, dirección y contacto. Horarios de atención, duración del turno y especialidades no están en el Modelo de Datos (4.3).',
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
      'La Cita del contrato no tiene hora (`fecha_programada` es un `date`) ni agenda por veterinario, y no hay campo que active o desactive la visibilidad de una agenda para los tutores. Tampoco existen "días que atiende" en la entidad Veterinario (4.4).',
  },
] as const;

export type ClaveDePaso = (typeof PASOS)[number]['clave'];

export function indiceDe(clave: ClaveDePaso): number {
  return PASOS.findIndex((p) => p.clave === clave);
}
