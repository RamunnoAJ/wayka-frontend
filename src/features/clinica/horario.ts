import type { FranjaDeAtencion, Grilla } from '../../api/clinica';

import { minutosDeHora, turnosDeFranja } from './grilla';

/**
 * Las mismas reglas del conjunto que aplica el backend en `NuevaGrilla`,
 * replicadas para no mandar un guardado que ya sabemos que se rechaza. No
 * reemplazan a esa validación: la única que decide sigue siendo la del servidor.
 */
export interface ErrorDeFranja {
  dia: number;
  /** Índice dentro de las franjas de ese día, ya ordenadas por hora. */
  posicion: number;
  mensaje: string;
}

export function validarFranjas(
  franjas: FranjaDeAtencion[],
  duracionMinutos: number,
): ErrorDeFranja[] {
  const errores: ErrorDeFranja[] = [];

  for (let dia = 0; dia <= 6; dia += 1) {
    const delDia = franjas
      .filter((franja) => franja.dia_semana === dia)
      .sort((una, otra) => minutosDeHora(una.hora_desde) - minutosDeHora(otra.hora_desde));

    delDia.forEach((franja, posicion) => {
      const desde = minutosDeHora(franja.hora_desde);
      const hasta = minutosDeHora(franja.hora_hasta);

      if (hasta <= desde) {
        errores.push({
          dia,
          posicion,
          mensaje: 'El cierre tiene que ser posterior a la apertura.',
        });
        return;
      }
      if (duracionMinutos > 0 && (hasta - desde) % duracionMinutos !== 0) {
        errores.push({
          dia,
          posicion,
          mensaje: `Un turno de ${duracionMinutos} min no divide este tramo: el último quedaría cortado por el cierre.`,
        });
      }

      const anterior = delDia[posicion - 1];
      // Se exige mayor estricto y no mayor o igual: dos tramos contiguos son uno
      // solo escrito en dos, y lo que hace que dos signifiquen algo distinto de
      // uno es el hueco entre ellos — el corte de mediodía.
      if (anterior && desde <= minutosDeHora(anterior.hora_hasta)) {
        errores.push({
          dia,
          posicion,
          mensaje: 'Se superpone con el tramo anterior, o lo continúa sin hueco en el medio.',
        });
      }
    });
  }

  return errores;
}

/**
 * Una clínica sin ninguna franja no admite ninguna cita: el backend lo rechaza,
 * y acá se avisa antes de intentarlo porque es un estado fácil de alcanzar
 * borrando tramos uno por uno.
 */
export function estaCerradaTodaLaSemana(franjas: FranjaDeAtencion[]): boolean {
  return franjas.length === 0;
}

export function turnosPorDia(grilla: Grilla, dia: number): number {
  return grilla.franjas
    .filter((franja) => franja.dia_semana === dia)
    .reduce((total, franja) => total + turnosDeFranja(franja, grilla.duracion_turno_minutos), 0);
}
