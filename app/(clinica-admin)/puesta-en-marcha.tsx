import { router } from 'expo-router';

import { OnboardingClinica } from '../../src/features/onboarding';

/**
 * Puesta en marcha de una clínica nueva (handoff "Onboarding Clínica"), solo web.
 *
 * Se llama así y no "activación" para no confundirla con `(auth)/activacion`,
 * que es el canje del token con el que la cuenta define su contraseña: son dos
 * momentos distintos y consecutivos.
 */
export default function PuestaEnMarcha() {
  return <OnboardingClinica onTerminar={() => router.replace('/(clinica-admin)/panel')} />;
}
