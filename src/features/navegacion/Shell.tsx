import { router, usePathname } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MobileTabBar, SidebarNav } from '../../components';
import { useAnchoDeVentana } from '../../hooks/useAnchoDeVentana';
import { useSesion } from '../../hooks/useSesion';
import { useTheme } from '../../theme';
import { useCerrarSesion } from '../auth';
import { useMiClinica } from '../clinica';
import { useMiFichaDeVeterinario } from '../paciente/queries';

import { destinoAlTocar, itemActivo, NAVEGACION_POR_ROL } from './items';

/**
 * Marco de navegación de una sesión iniciada.
 *
 * En pantalla ancha va la barra lateral; en angosta, la barra inferior. El corte
 * es por **ancho y no por plataforma**: el veterinario tiene paridad entre web y
 * móvil (Alcance de Plataformas, 2), y una web abierta en un teléfono necesita
 * la misma barra inferior que la app.
 *
 * Qué secciones aparecen sale del rol, y las rutas que no están en el menú
 * —una ficha, un formulario— se alcanzan desde adentro de su sección.
 */
const ANCHO_PARA_BARRA_LATERAL = 900;

const NOMBRE_DE_ROL: Record<string, string> = {
  veterinario: 'Veterinario',
  clinica_admin: 'Administración',
  tutor: 'Tutor',
};

/**
 * La matrícula va en el subtítulo porque es lo que decide si el veterinario puede
 * escribir historial (regla 2.1): tenerla a la vista evita descubrir que falta
 * recién cuando un botón aparece deshabilitado.
 */
function descripcionDeRol(rol: string, matricula?: string | null): string {
  const nombre = NOMBRE_DE_ROL[rol] ?? '';
  if (rol !== 'veterinario') return nombre;
  return matricula ? `${nombre} · MP ${matricula}` : `${nombre} · sin matrícula`;
}

export function Shell({ children }: { children: ReactNode }) {
  const { t } = useTheme();
  const ancho = useAnchoDeVentana();
  const ruta = usePathname();
  const { sesion } = useSesion();
  const insets = useSafeAreaInsets();
  const cerrarSesion = useCerrarSesion();

  // La clínica solo la tiene el clínica_admin en su cuenta; para los demás
  // queda sin nombre y el encabezado no lo muestra.
  const clinica = useMiClinica();
  // El nombre de la persona no está en la cuenta: vive en su ficha. Sin ella se
  // muestra el correo, que identifica igual aunque se lea peor.
  const miFicha = useMiFichaDeVeterinario();

  const rol = sesion?.usuario.tipo_usuario;
  const items = rol ? NAVEGACION_POR_ROL[rol] : [];
  const activo = itemActivo(items, ruta);

  // El menú manda el `href` del ítem; a dónde lleva —o si no lleva a ningún
  // lado— lo decide `destinoAlTocar`, que es lo que evita remontar la pantalla
  // en la que ya estamos parados.
  const ir = (href: string) => {
    const item = items.find((candidato) => candidato.href === href);
    const destino = item ? destinoAlTocar(item, ruta) : href;
    if (destino) router.push(destino);
  };

  // Antes de medir la ventana, `ancho` es 0 (la exportación web es estática y
  // el primer render tiene que coincidir con el del servidor). Se asume ancho
  // para no dibujar la barra inferior y sacarla en el segundo render.
  const conBarraLateral = ancho === 0 || ancho >= ANCHO_PARA_BARRA_LATERAL;

  if (items.length === 0) return <>{children}</>;

  if (conBarraLateral) {
    return (
      <View style={[estilos.raiz, estilos.enFila, { backgroundColor: t['--surface-page'] }]}>
        <SidebarNav
          items={items.map((item) => ({
            value: item.href,
            label: item.label,
            icon: item.icono,
          }))}
          value={activo?.href}
          onChange={ir}
          clinic={clinica.data?.nombre}
          user={
            sesion
              ? {
                  name: miFicha.data?.nombre ?? sesion.usuario.email,
                  role: descripcionDeRol(sesion.usuario.tipo_usuario, miFicha.data?.matricula),
                }
              : undefined
          }
          onSalir={() => cerrarSesion.mutate()}
          salidaEnCurso={cerrarSesion.isPending}
        />
        <View style={estilos.contenido}>{children}</View>
      </View>
    );
  }

  return (
    <View style={[estilos.raiz, { backgroundColor: t['--surface-page'], paddingTop: insets.top }]}>
      <View style={estilos.contenido}>{children}</View>
      <MobileTabBar
        items={items.map((item) => ({
          value: item.href,
          label: item.labelCorta ?? item.label,
          icon: item.icono,
        }))}
        value={activo?.href}
        onChange={ir}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  enFila: { flexDirection: 'row' },
  contenido: { flex: 1, minWidth: 0 },
});
