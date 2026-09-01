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
            // Va a la ficha recién creada y no al listado: lo siguiente que hace
            // quien acaba de cargar una mascota es compartirla.
            onSuccess: (creada) => router.replace(`/(tutor)/mascotas/${creada.id}`),
          })
        }
        onCancelar={() => router.back()}
      />
    </EntradaDePantalla>
  );
}
