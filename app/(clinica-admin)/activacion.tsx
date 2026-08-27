import { router } from 'expo-router';

import { OnboardingClinica } from '../../src/features/onboarding';

/** Activación de una clínica nueva (handoff "Onboarding Clínica"), solo web. */
export default function Activacion() {
  return <OnboardingClinica onTerminar={() => router.replace('/(clinica-admin)/panel')} />;
}
