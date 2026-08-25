import { Stack } from 'expo-router';

/**
 * Grupo público: login y registro de tutor son las únicas rutas que no
 * requieren sesión (Arquitectura, 4.5). Sin guard de rol, por definición.
 */
export default function LayoutAuth() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
