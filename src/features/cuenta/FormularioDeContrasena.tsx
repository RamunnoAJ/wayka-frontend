import { mensajeDeError } from '../../lib/errores';

import { CamposDeContrasena } from './CamposDeContrasena';
import { useCambiarContrasena } from './queries';

/**
 * Cambio de contraseña de una cuenta, **con sesión iniciada**.
 *
 * Es el mismo formulario para los tres roles: lo que cambia es dónde se monta
 * —una pantalla propia en el veterinario, una sección en el tutor y en el
 * clínica_admin—, no qué pide ni qué valida.
 *
 * En modo `restablecer` lo usa el clínica_admin sobre una cuenta de su clínica:
 * ahí **no se pide la contraseña actual porque no la conoce**, y el contrato lo
 * contempla explícitamente.
 *
 * La recuperación por correo no pasa por acá: no tiene sesión ni cuenta conocida,
 * y usa `CamposDeContrasena` directo con el token como credencial.
 */
interface FormularioDeContrasenaProps {
  usuarioId: string;
  /**
   * `propia` la cambia el dueño de la cuenta; `restablecer`, un clínica_admin
   * sobre una cuenta de su clínica.
   */
  modo?: 'propia' | 'restablecer';
  /**
   * `false` en una cuenta creada con Google que todavía no tiene contraseña: ahí
   * la establece por primera vez y no hay una anterior que acreditar (contrato,
   * `cambiarContrasena`). Solo aplica en modo `propia`.
   */
  tieneContrasena: boolean;
  onListo?: () => void;
  onCancelar?: () => void;
}

export function FormularioDeContrasena({
  usuarioId,
  modo = 'propia',
  tieneContrasena,
  onListo,
  onCancelar,
}: FormularioDeContrasenaProps) {
  const cambiar = useCambiarContrasena(usuarioId);

  // Un admin restableciendo no conoce la anterior, y el backend no se la pide.
  const pedirActual = modo === 'propia' && tieneContrasena;

  const nota =
    modo === 'restablecer'
      ? 'Elegís una contraseña nueva y se la pasás por un medio seguro. No hace falta la anterior, y nadie más que vos y esa persona van a conocer la nueva.'
      : !tieneContrasena
        ? 'Tu cuenta entra con Google y todavía no tiene contraseña. Si la definís, vas a poder usar las dos formas.'
        : undefined;

  return (
    <CamposDeContrasena
      pedirActual={pedirActual}
      nota={nota}
      etiquetaDeGuardar={modo === 'restablecer' ? 'Restablecer contraseña' : 'Guardar contraseña'}
      enviando={cambiar.isPending}
      error={cambiar.isError ? mensajeDeError(cambiar.error) : undefined}
      onCancelar={onCancelar}
      onEnviar={({ nueva, actual }) =>
        cambiar.mutate(
          {
            ...(actual ? { contrasena_actual: actual } : {}),
            contrasena_nueva: nueva,
          },
          { onSuccess: () => onListo?.() },
        )
      }
    />
  );
}
