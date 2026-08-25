import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function NoEncontrado() {
  return (
    <>
      <Stack.Screen options={{ title: 'No encontrado' }} />
      <View style={estilos.contenedor}>
        <Text style={estilos.titulo}>Esta pantalla no existe.</Text>
        <Link href="/">
          <Text>Volver al inicio</Text>
        </Link>
      </View>
    </>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  titulo: { fontSize: 18, fontWeight: '600' },
});
