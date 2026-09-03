import { router } from 'expo-router';

import { EntradaDePantalla } from '../../../src/components';
import { AltaDeMiMascota } from '../../../src/features/tutor-movil';
import { useAgregarMiMascota } from '../../../src/features/tutor-movil/queries';
import { mensajeDeError } from '../../../src/lib/errores';

/** Alta de una mascota por su dueño (Alcance de Plataformas, 5.2). */
export default function NuevaMascota() {
  const agregar = useAgregarMiMascota();

  return (
    <EntradaDePantalla>
      <AltaDeMiMascota
        enviando={agregar.isPending}
        error={agregar.error ? mensajeDeError(agregar.error) : undefined}
        onGuardar={(entrada) =>
          agregar.mutate(entrada, {
            // La mascota ya existe: lo siguiente es volcar lo que trae de antes
            // (Reglas de Negocio, 4.17.6). Es un paso ofrecido y salteable —el
            // alta ya está hecha— y no puede ser parte de la misma transacción,
            // porque un antecedente cuelga de un paciente_id que hasta acá no
            // existía. `replace` y no `push`: volver atrás sería volver a un
            // formulario de alta que ya se envió.
            onSuccess: (creada) =>
              router.replace(`/(tutor)/mascotas/${creada.id}/antecedentes?onboarding=1`),
          })
        }
        onCancelar={() => router.back()}
      />
    </EntradaDePantalla>
  );
}
