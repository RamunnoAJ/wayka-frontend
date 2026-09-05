import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { CrearPropuestaEntrada } from '../../api/propuesta';
import { Button, InlineError, Input } from '../../components';
import { useTheme } from '../../theme';

/** Los mismos topes que valida el backend (Reglas de Negocio, 2.8). */
export const TITULO_MINIMO = 3;
export const TITULO_MAXIMO = 120;
export const DESCRIPCION_MAXIMA = 1000;

interface FormularioDePropuestaProps {
  enviando: boolean;
  error?: string;
  onGuardar: (entrada: CrearPropuestaEntrada) => void;
  onCancelar: () => void;
}

/**
 * Título obligatorio y detalle opcional. El formulario avisa el techo mientras
 * se escribe en vez de dejar que el backend lo rechace: el límite se descubre
 * antes y no después de haber escrito.
 */
export function FormularioDePropuesta({
  enviando,
  error,
  onGuardar,
  onCancelar,
}: FormularioDePropuestaProps) {
  const { t, px, texto } = useTheme();

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const recortado = titulo.trim();
  const puedeEnviar = recortado.length >= TITULO_MINIMO && !enviando;

  return (
    <View
      style={[
        estilos.form,
        {
          borderRadius: px('--radius-card'),
          padding: px('--gutter-card'),
          backgroundColor: t['--surface-sunken'],
          borderColor: t['--border-default'],
        },
      ]}
    >
      <Input
        label="Qué te haría más fácil usar Wayka"
        placeholder="Que me avise antes de la vacuna"
        hint={`En una línea. ${recortado.length}/${TITULO_MAXIMO}`}
        value={titulo}
        onChangeText={setTitulo}
        maxLength={TITULO_MAXIMO}
        autoCapitalize="sentences"
      />

      <Input
        label="Contanos un poco más (opcional)"
        placeholder="Para qué te serviría, cuándo te pasa."
        hint={`${descripcion.length}/${DESCRIPCION_MAXIMA}`}
        value={descripcion}
        onChangeText={setDescripcion}
        maxLength={DESCRIPCION_MAXIMA}
        autoCapitalize="sentences"
        multiline
      />

      <Text style={[texto('caption'), { color: t['--text-subtle'] }]}>
        Se publica sin tu nombre y queda votada por vos. Después no se puede editar ni borrar: los
        votos que junte son votos a lo que escribiste.
      </Text>

      {error ? <InlineError compact title="No se pudo publicar" description={error} /> : null}

      <View style={estilos.acciones}>
        <Button size="sm" variant="ghost" onPress={onCancelar} disabled={enviando}>
          Cancelar
        </Button>
        <Button
          size="sm"
          loading={enviando}
          disabled={!puedeEnviar}
          onPress={() =>
            onGuardar({
              titulo: recortado,
              descripcion: descripcion.trim() || undefined,
            })
          }
        >
          Publicar
        </Button>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  form: { gap: 16, borderWidth: 1 },
  acciones: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
});
