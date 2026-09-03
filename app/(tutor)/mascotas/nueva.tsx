import { router } from 'expo-router';

import { EntradaDePantalla } from '../../../src/components';
import { AltaDeMiMascota } from '../../../src/features/tutor-movil';
import {
  useAgregarMiMascota,
  useSubirFotoDePerfil,
} from '../../../src/features/tutor-movil/queries';
import { mensajeDeError } from '../../../src/lib/errores';

/** Alta de una mascota por su dueño (Alcance de Plataformas, 5.2). */
export default function NuevaMascota() {
  const agregar = useAgregarMiMascota();
  const subirFoto = useSubirFotoDePerfil();

  return (
    <EntradaDePantalla>
      <AltaDeMiMascota
        enviando={agregar.isPending || subirFoto.isPending}
        error={agregar.error ? mensajeDeError(agregar.error) : undefined}
        onGuardar={(entrada, foto) =>
          agregar.mutate(entrada, {
            // La mascota ya existe: lo siguiente es volcar lo que trae de antes
            // (Reglas de Negocio, 4.17.7). Es un paso ofrecido y salteable —el
            // alta ya está hecha— y no puede ser parte de la misma transacción,
            // porque un antecedente cuelga de un paciente_id que hasta acá no
            // existía. `replace` y no `push`: volver atrás sería volver a un
            // formulario de alta que ya se envió.
            onSuccess: async (creada) => {
              // La foto va por el mismo camino y por el mismo motivo, y **su
              // fracaso no revierte el alta**: la mascota queda cargada sin
              // foto, que es un estado válido, y el siguiente paso lo dice en
              // vez de dejar creer que se subió.
              const fallo = foto
                ? await subirFoto
                    .mutateAsync({ pacienteId: creada.id, archivo: foto })
                    .then(() => false)
                    .catch(() => true)
                : false;
              router.replace(
                `/(tutor)/mascotas/${creada.id}/antecedentes?onboarding=1${fallo ? '&foto=fallo' : ''}`,
              );
            },
          })
        }
        onCancelar={() => router.back()}
      />
    </EntradaDePantalla>
  );
}
