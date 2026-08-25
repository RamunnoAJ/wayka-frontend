import { StyleSheet, Text, View } from 'react-native';

interface PlaceholderProps {
  /** Nombre de la pantalla o del componente que todavía no existe. */
  titulo: string;
  /** Qué falta para poder construirlo de verdad. */
  detalle?: string;
}

/**
 * PLACEHOLDER EXPLÍCITO — no es un componente del producto.
 *
 * Sin estilos del sistema de diseño a propósito: el brief de Claude Design no
 * forma parte de este repo todavía (Arq. Frontend, sección 9), y una paleta
 * inventada acá sería más difícil de sacar después que estos estilos crudos.
 */
export function Placeholder({ titulo, detalle }: PlaceholderProps) {
  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.etiqueta}>PLACEHOLDER</Text>
      <Text style={estilos.titulo}>{titulo}</Text>
      {detalle ? <Text style={estilos.detalle}>{detalle}</Text> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  etiqueta: { fontSize: 11, letterSpacing: 1 },
  titulo: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
  detalle: { fontSize: 13, textAlign: 'center', maxWidth: 420 },
});
