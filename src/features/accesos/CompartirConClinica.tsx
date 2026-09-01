import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ClinicaPublica } from '../../api/clinica';
import {
  Button,
  EmptyState,
  InlineError,
  Input,
  Presionable,
  SkeletonText,
} from '../../components';
import { useTheme } from '../../theme';

import { useBuscarClinicas } from './queries';

/**
 * Compartir con una veterinaria.
 *
 * La lista muestra la **dirección** además del nombre: dos sucursales de la
 * misma cadena se llaman igual, y elegir la equivocada es darle el historial a
 * quien no atiende al animal.
 *
 * Antes de confirmar, la pantalla dice que la clínica va a ver el historial
 * completo —incluido lo que escribieron otras— y no solo lo que escriba de ahí
 * en adelante. Es el punto entero de la funcionalidad, y conviene decirlo antes
 * y no después.
 */
export function CompartirConClinica({
  enviando,
  error,
  onCompartir,
}: {
  enviando: boolean;
  error?: string;
  onCompartir: (clinica: ClinicaPublica) => void;
}) {
  const { t, px, texto } = useTheme();
  const [busqueda, setBusqueda] = useState('');
  const [elegida, setElegida] = useState<ClinicaPublica | null>(null);
  const clinicas = useBuscarClinicas(busqueda);

  if (elegida) {
    return (
      <View style={estilos.bloque}>
        <Text style={[texto('h4'), { color: t['--text-strong'] }]}>{elegida.nombre}</Text>
        <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>{elegida.direccion}</Text>
        <View
          style={[
            estilos.aviso,
            {
              borderRadius: px('--radius-md'),
              backgroundColor: t['--surface-accent-soft'],
              borderColor: t['--border-default'],
            },
          ]}
        >
          <Text style={[texto('body-sm'), { color: t['--text-strong'] }]}>
            Va a poder ver el historial completo de tu mascota, incluido lo que hayan escrito otras
            veterinarias, y cargar nuevas consultas y turnos.
          </Text>
        </View>
        {error ? <InlineError compact title="No se pudo compartir" description={error} /> : null}
        <Button block loading={enviando} onPress={() => onCompartir(elegida)}>
          {`Compartir con ${elegida.nombre}`}
        </Button>
        <Button block variant="ghost" onPress={() => setElegida(null)}>
          Elegir otra
        </Button>
      </View>
    );
  }

  return (
    <View style={estilos.bloque}>
      <Input
        label="Buscá la veterinaria"
        placeholder="Nombre de la veterinaria"
        value={busqueda}
        onChangeText={setBusqueda}
        autoCapitalize="words"
      />

      {busqueda.trim().length < 2 ? (
        <Text style={[texto('body-sm'), { color: t['--text-subtle'] }]}>
          Escribí al menos dos letras para buscarla.
        </Text>
      ) : clinicas.isPending ? (
        <SkeletonText lines={3} />
      ) : clinicas.isError ? (
        <InlineError title="No se pudo buscar" onRetry={() => clinicas.refetch()} />
      ) : (clinicas.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon="map-pin"
          title="No encontramos ninguna"
          description="Fijate si el nombre está bien escrito. Puede que todavía no use Wayka."
        />
      ) : (
        <View style={estilos.lista}>
          {clinicas.data?.map((clinica) => (
            <Presionable
              key={clinica.id}
              onPress={() => setElegida(clinica)}
              fondo={t['--surface-card']}
              fondoDestacado={t['--surface-hover']}
              borde={t['--border-default']}
              accessibilityLabel={`${clinica.nombre}, ${clinica.direccion}`}
              style={[estilos.opcion, { borderRadius: px('--radius-card') }]}
            >
              <Text style={[texto('body-strong'), { color: t['--text-strong'] }]}>
                {clinica.nombre}
              </Text>
              <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
                {clinica.direccion}
              </Text>
            </Presionable>
          ))}
        </View>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  bloque: { gap: 12 },
  lista: { gap: 10 },
  opcion: { borderWidth: 1, padding: 14, gap: 2 },
  aviso: { borderWidth: 1, padding: 12 },
});
