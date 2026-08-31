import * as Crypto from 'expo-crypto';
import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, Input } from '../../components';
import { HAY_MAPAS, MAPAS_API_KEY } from '../../lib/config';
import { useTheme } from '../../theme';

import { urlDeMapaEstatico, type Direccion } from './direccion';
import { buscarSugerencias, type Sugerencia } from './places';
import { detalleDeLugar } from './places';

/** Lo que se espera a que deje de tipear antes de consultar a Google. */
const ESPERA_MS = 350;

interface CampoDeDireccionProps {
  value: Direccion;
  onChange: (direccion: Direccion) => void;
  label?: string;
  error?: string;
}

/**
 * Campo de dirección con autocompletado y confirmación en el mapa.
 *
 * **Es un campo de texto que además sugiere, no un selector.** Se puede escribir
 * una dirección que Google no conoce —un barrio nuevo, un paraje rural, una casa
 * sin altura— y guardarla igual, sin punto. Exigir la sugerencia dejaría trabada
 * a la persona que vive en una calle mal mapeada, y sin conexión no habría forma
 * de editar la dirección (Reglas de Negocio, 2.6).
 *
 * Escribir a mano **limpia el punto anterior**: el texto nuevo describe otro
 * lugar, y conservar las coordenadas dejaría el pin en la casa de antes. Es la
 * misma regla que aplica el backend; acá se replica para que la pantalla no
 * muestre un mapa que contradice lo que se está escribiendo.
 */
export function CampoDeDireccion({ value, onChange, label, error }: CampoDeDireccionProps) {
  const { t, px, texto } = useTheme();
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([]);
  // Qué entrada corresponde a las sugerencias que hay en mano. Comparado con lo
  // que está escrito ahora, es lo que dice si la consulta todavía está en vuelo
  // sin necesidad de un estado de "cargando" que el efecto tenga que apagar.
  const [entradaBuscada, setEntradaBuscada] = useState('');

  // Un token por edición: Google factura el autocompletado y el detalle como
  // una sola consulta cuando comparten sesión. Sin él, cada tecla se cobra
  // suelta. Se renueva al elegir una sugerencia, que es donde la sesión cierra.
  const sesion = useRef(Crypto.randomUUID());
  // Lo último que escribió la persona, para no pisar el campo con la respuesta
  // de una consulta que quedó vieja.
  const ultimaEntrada = useRef(value.texto);

  const entrada = value.texto;
  // Con el punto ya confirmado no hay nada que sugerir: el texto es el que
  // devolvió Google, y volver a consultarlo abriría una sesión por cada
  // pantalla que muestre una ficha guardada.
  const debeSugerir = HAY_MAPAS && !value.punto && entrada.trim().length >= 3;

  useEffect(() => {
    if (!debeSugerir) return;

    ultimaEntrada.current = entrada;
    const temporizador = setTimeout(async () => {
      const resultado = await buscarSugerencias(entrada, sesion.current, MAPAS_API_KEY);
      if (ultimaEntrada.current !== entrada) return;
      setSugerencias(resultado);
      setEntradaBuscada(entrada);
    }, ESPERA_MS);

    return () => clearTimeout(temporizador);
  }, [entrada, debeSugerir]);

  // Las sugerencias se derivan en vez de limpiarse desde el efecto: si no
  // corresponde sugerir, no se muestran, sin importar qué quedó en el estado de
  // la consulta anterior.
  const visibles = debeSugerir && entradaBuscada === entrada ? sugerencias : [];
  const buscando = debeSugerir && entradaBuscada !== entrada;

  async function elegir(sugerencia: Sugerencia) {
    const detalle = await detalleDeLugar(sugerencia.placeId, sesion.current, MAPAS_API_KEY);
    sesion.current = Crypto.randomUUID();

    // Sin detalle se guarda el texto de la sugerencia sin punto, que es un
    // resultado peor pero utilizable. Descartar lo que la persona ya eligió
    // porque una segunda llamada falló sería perder su trabajo.
    onChange(detalle ?? { texto: sugerencia.texto });
  }

  const mapa = urlDeMapaEstatico(value.punto, MAPAS_API_KEY);

  return (
    <View>
      <Input
        label={label ?? 'Dirección'}
        icon="map-pin"
        value={value.texto}
        // Escribir descarta el punto: el texto nuevo ya no describe ese lugar.
        onChangeText={(texto) => onChange({ texto })}
        placeholder="Calle, número, ciudad"
        autoComplete="street-address"
        error={error}
        hint={
          HAY_MAPAS
            ? 'Elegí una sugerencia para confirmarla en el mapa, o escribila a mano si no aparece.'
            : undefined
        }
      />

      {buscando ? (
        <Text style={[texto('body-sm'), { color: t['--text-muted'], paddingTop: px('--space-2') }]}>
          Buscando direcciones…
        </Text>
      ) : null}

      {visibles.length > 0 ? (
        <View
          style={[
            estilos.sugerencias,
            { backgroundColor: t['--surface-card'], borderColor: t['--border-default'] },
          ]}
        >
          {visibles.map((sugerencia) => (
            <Pressable
              key={sugerencia.placeId}
              onPress={() => elegir(sugerencia)}
              accessibilityRole="button"
              style={({ pressed }) => [
                estilos.sugerencia,
                { paddingVertical: px('--space-3'), paddingHorizontal: px('--space-4') },
                pressed && { backgroundColor: t['--surface-hover'] },
              ]}
            >
              <Icon name="map-pin" size={16} color={t['--text-muted']} />
              <Text style={[texto('body-sm'), { color: t['--text-body'], flex: 1 }]}>
                {sugerencia.texto}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {mapa ? (
        <View
          style={[estilos.mapa, { borderColor: t['--border-default'], marginTop: px('--space-3') }]}
        >
          <Image
            source={{ uri: mapa }}
            style={estilos.imagen}
            resizeMode="cover"
            accessibilityLabel={`Mapa con la ubicación de ${value.texto}`}
          />
        </View>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  sugerencias: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 6,
    overflow: 'hidden',
  },
  sugerencia: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mapa: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagen: {
    width: '100%',
    height: 140,
  },
});
