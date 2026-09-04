import { router, usePathname } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MobileTabBar, SidebarNav } from '../../components';
import { useAnchoDeVentana } from '../../hooks/useAnchoDeVentana';
import { useSesion } from '../../hooks/useSesion';
import { usePantallaVista, useTelemetriaAutomatica } from '../../hooks/useTelemetria';
import { useTheme } from '../../theme';
import { useCerrarSesion } from '../auth';
import { useMiClinica } from '../clinica';
import { useMiFichaDeVeterinario } from '../paciente/queries';

import { useCuantasInvitacionesEsperan } from '../accesos/queries';

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

/** Lo que le queda al contenido en el corte, con la barra lateral de 248 puesta. */
const ANCHO_MINIMO_DE_CONTENIDO = ANCHO_PARA_BARRA_LATERAL - 248;

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
  // El valor guardado ya trae el prefijo (`MP-4821`): anteponerle otro daba
  // "MP MP-4821", y encima no entraba en los 248px de la barra.
  return matricula ? `${nombre} · ${matricula}` : `${nombre} · sin matrícula`;
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

  // Acá y no en el layout raíz: el marco solo se dibuja con sesión iniciada, y
  // sin sesión no hay telemetría que emitir ni ruta a la que se pueda entrar.
  useTelemetriaAutomatica(Boolean(sesion));
  usePantallaVista();

  const rol = sesion?.usuario.tipo_usuario;
  const items = rol ? NAVEGACION_POR_ROL[rol] : [];
  const invitaciones = useCuantasInvitacionesEsperan();
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
  //
  // El clínica_admin queda afuera del corte: es rol de web y no tiene canal
  // móvil (Alcance de Plataformas, 2), y su salida de sesión vive en la barra
  // lateral y en ninguna sección (3.2). Con la rama angosta se quedaba sin
  // forma de salir apenas la ventana bajaba de 900 —un zoom al 150 % en un
  // portátil alcanza—, así que para él esa rama no se dibuja nunca.
  const conBarraLateral =
    rol === 'clinica_admin' || ancho === 0 || ancho >= ANCHO_PARA_BARRA_LATERAL;

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
        {/*
          Con la lateral fija, una ventana muy angosta no achica el contenido:
          lo recorta. El ancho mínimo hace que la página se desplace en vez de
          dejar datos fuera de alcance — para el rol que no tiene rama angosta,
          desplazar es la única salida honesta.
        */}
        <View style={[estilos.contenido, { minWidth: ANCHO_MINIMO_DE_CONTENIDO }]}>{children}</View>
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
          // El contador va en Mascotas y no en Avisos: la tarjeta para aceptar
          // vive ahí, y un badge que lleva a una pantalla sin nada que hacer es
          // peor que ninguno. Avisos es el interruptor del push del teléfono.
          pendientes: item.prefijo === '/mascotas' ? invitaciones : undefined,
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
