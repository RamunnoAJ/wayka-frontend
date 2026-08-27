import { StyleSheet, Text, View } from 'react-native';

import { FormularioDeVeterinario } from '../veterinario';
import { useCrearVeterinario } from '../veterinario/queries';
import { mensajeDeError } from '../../lib/errores';
import { useTheme } from '../../theme';

/**
 * Paso 4: alta del primer veterinario (proceso 4.12).
 *
 * El formulario es el mismo que el del plantel: es la misma operación, y tenerla
 * dos veces garantizaba que se separaran en cuanto una de las dos cambiara.
 *
 * Diferencias con el diseño del handoff, todas por contrato:
 * - El diseño parte el nombre en "Nombre" y "Apellido"; la entidad Veterinario
 *   tiene un único campo `nombre` (Modelo de Datos, 4.4).
 * - El diseño manda una invitación por correo. No hay endpoint de invitación: el
 *   alta fija la contraseña inicial, que es lo que el contrato define.
 * - Especialidades y días de atención no existen en el modelo, y no se piden.
 */
interface PasoProps {
  onListo: (nombre: string) => void;
}

export function PasoPrimerVeterinario({ onListo }: PasoProps) {
  const { t, texto } = useTheme();
  const crear = useCrearVeterinario();

  return (
    <View style={estilos.raiz}>
      <View style={estilos.intro}>
        <Text style={[texto('h1'), { color: t['--text-strong'] }]}>Armá tu equipo</Text>
        <Text style={[texto('body-lg'), { color: t['--text-muted'] }]}>
          Cargá al primer veterinario. La ficha y su cuenta de acceso se crean juntas: al guardar ya
          puede entrar con el correo y la contraseña que le pongas.
        </Text>
      </View>

      <FormularioDeVeterinario
        enviando={crear.isPending}
        error={crear.error ? mensajeDeError(crear.error) : undefined}
        onGuardar={(entrada) =>
          crear.mutate(entrada, { onSuccess: (creado) => onListo(creado.veterinario.nombre) })
        }
        onCancelar={() => onListo('')}
      />

      <Text style={[texto('caption'), { color: t['--text-subtle'] }]}>
        Dar de baja al veterinario después desactiva su cuenta en la misma operación, y lo que haya
        escrito conserva su autoría.
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { gap: 24 },
  intro: { gap: 6, maxWidth: 640 },
});
