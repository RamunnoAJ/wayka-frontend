import { router } from 'expo-router';

import { ListadoDePacientes } from '../../../src/features/paciente/ListadoDePacientes';

/** Cartera de la clínica y alta de paciente (Alcance de Plataformas, 3.3). */
export default function ListadoPacientes() {
  return (
    <ListadoDePacientes
      onAbrir={(paciente) => router.push(`/(veterinario)/pacientes/${paciente.id}`)}
    />
  );
}
