import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { CrearTutorEntrada, TipoDocumento } from '../../api/tutor';
import { Button, Checkbox, InlineError, Input, Select } from '../../components';
import { TIPOS_DE_DOCUMENTO } from '../veterinario/FormularioDeVeterinario';
import { useTheme } from '../../theme';

/**
 * Alta de una ficha de tutor.
 *
 * El documento es opcional: el auto-registro no lo pide, y una clínica que da de
 * alta a alguien por teléfono puede no tenerlo a mano. Se completa después. Lo
 * que **no** es opcional es el consentimiento: sin él no se puede dar de alta un
 * Paciente para esta persona (regla 2.2), que es el motivo por el que se crea la
 * ficha.
 */
interface FormularioProps {
  enviando: boolean;
  error?: string;
  /** Se precarga cuando la búsqueda no encontró a nadie con ese texto. */
  nombreInicial?: string;
  onGuardar: (entrada: CrearTutorEntrada) => void;
  onCancelar: () => void;
}

export function FormularioDeTutor({
  enviando,
  error,
  nombreInicial = '',
  onGuardar,
  onCancelar,
}: FormularioProps) {
  const { t, px } = useTheme();

  const [nombre, setNombre] = useState(nombreInicial);
  const [contacto, setContacto] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>('dni');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [direccion, setDireccion] = useState('');
  const [consentimiento, setConsentimiento] = useState(false);

  const completo = nombre.trim() && contacto.trim() && consentimiento;

  return (
    <View
      style={[
        estilos.form,
        {
          borderRadius: px('--radius-card'),
          backgroundColor: t['--surface-sunken'],
          borderColor: t['--border-default'],
        },
      ]}
    >
      <View style={estilos.fila}>
        <View style={estilos.campo}>
          <Input
            label="Nombre completo"
            placeholder="María Pérez"
            value={nombre}
            onChangeText={setNombre}
            autoCapitalize="words"
          />
        </View>
        <View style={estilos.campo}>
          <Input
            label="Contacto"
            hint="Teléfono y/o correo. Es por donde la clínica lo ubica."
            placeholder="+54 9 11 5478-2210"
            value={contacto}
            onChangeText={setContacto}
          />
        </View>
      </View>

      <View style={estilos.fila}>
        <View style={estilos.campoChico}>
          <Select
            label="Tipo de documento"
            options={TIPOS_DE_DOCUMENTO}
            value={tipoDocumento}
            onChange={setTipoDocumento}
          />
        </View>
        <View style={estilos.campo}>
          <Input
            label="Número de documento"
            hint="Opcional: se puede completar más adelante."
            value={numeroDocumento}
            onChangeText={setNumeroDocumento}
            keyboardType="number-pad"
          />
        </View>
        <View style={estilos.campo}>
          <Input
            label="Dirección"
            hint="Opcional."
            value={direccion}
            onChangeText={setDireccion}
            autoCapitalize="sentences"
          />
        </View>
      </View>

      <Checkbox
        label="Otorgó el consentimiento de uso de datos"
        description="Ley 25.326. Sin esto no se le puede dar de alta una mascota, y no se revoca desde la aplicación."
        checked={consentimiento}
        onChange={setConsentimiento}
      />

      {error ? <InlineError compact title="No se pudo crear la ficha" description={error} /> : null}

      <View style={estilos.acciones}>
        <Button
          size="sm"
          disabled={!completo}
          loading={enviando}
          onPress={() =>
            onGuardar({
              nombre: nombre.trim(),
              contacto: contacto.trim(),
              consentimiento_datos: true,
              // El tipo y el número se cargan o se limpian juntos: una ficha
              // nunca tiene uno sin el otro (regla 2.1).
              ...(numeroDocumento.trim()
                ? { tipo_documento: tipoDocumento, numero_documento: numeroDocumento.trim() }
                : {}),
              ...(direccion.trim() ? { direccion: direccion.trim() } : {}),
            })
          }
        >
          Crear ficha de tutor
        </Button>
        <Button variant="ghost" size="sm" onPress={onCancelar}>
          Cancelar
        </Button>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  form: { borderWidth: 1, padding: 20, gap: 14 },
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  campo: { flexGrow: 1, flexBasis: 200, minWidth: 180 },
  campoChico: { flexGrow: 1, flexBasis: 160, minWidth: 150 },
  acciones: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
});
