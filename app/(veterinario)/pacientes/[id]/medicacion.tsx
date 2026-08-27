import { useLocalSearchParams } from 'expo-router';

import { FichaDePaciente } from '../../../../src/features/paciente';

/**
 * Medicación de un paciente (Alcance de Plataformas, 3.5).
 *
 * Es la ficha abierta en su pestaña de medicación, no una pantalla aparte: la
 * medicación activa se lee junto con las alergias en la banda de urgencia, y
 * separarla dejaría media vista clínica de cada lado.
 */
export default function MedicacionDelPaciente() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <FichaDePaciente pacienteId={id} pestaniaInicial="medicacion" />;
}
