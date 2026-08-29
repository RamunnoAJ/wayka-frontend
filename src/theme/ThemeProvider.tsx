import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Platform, type TextStyle } from 'react-native';

import { estiloDeTexto, estiloDeTextoSobreMarca, aNumero, type NivelDeTexto } from './tipografia';
import {
  tokensDefault,
  tokensReducedMotion,
  tokensTutor,
  type NombreToken,
  type Tokens,
} from './tokens.generated';

export type NombreTema = 'default' | 'tutor';

interface ValorTema {
  nombre: NombreTema;
  /** Valores crudos, con los mismos nombres que las custom properties del CSS. */
  t: Tokens;
  /** `t['--space-5']` (`"16px"`) → `16`. Para medidas en estilos de RN. */
  px: (token: NombreToken) => number;
  /** Recompone un `--text-*` desde sus escalares (ver `tipografia.ts`). */
  texto: (nivel: NivelDeTexto) => TextStyle;
  /**
   * Igual que `texto`, para lo que va **encima del naranja de marca** del tutor
   * (la navegación y el relleno primario). Ahí el contenido blanco da 2.0:1, y
   * esto sube cuerpo y peso para que se lea. En clínica no cambia nada.
   */
  textoSobreMarca: (nivel: NivelDeTexto) => TextStyle;
  /** `true` si el sistema pide movimiento reducido: las duraciones van a 0ms. */
  movimientoReducido: boolean;
  /**
   * `true` cuando lo que se pinta sobre el color de marca necesita refuerzo —
   * hoy, el tema tutor. Para componentes que arman su propio tamaño de texto y
   * no pueden usar `textoSobreMarca` tal cual.
   */
  reforzarSobreMarca: boolean;
}

const Contexto = createContext<ValorTema | null>(null);

interface ThemeProviderProps {
  /**
   * Tema del rol. El default (lila) es el de clínica y veterinario; `tutor`
   * invierte primario y acento. Lo resuelve quien conoce la sesión, no este
   * componente.
   */
  nombre?: NombreTema;
  children: ReactNode;
}

export function ThemeProvider({ nombre = 'default', children }: ThemeProviderProps) {
  const [movimientoReducido, setMovimientoReducido] = useState(false);

  useEffect(() => {
    let vigente = true;
    AccessibilityInfo.isReduceMotionEnabled().then((valor) => {
      if (vigente) setMovimientoReducido(valor);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setMovimientoReducido);
    return () => {
      vigente = false;
      sub.remove();
    };
  }, []);

  // En web los componentes heredados de /design-system siguen leyendo el CSS,
  // así que el atributo de <body> tiene que seguir al tema (doc 09, sección 4).
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    if (nombre === 'tutor') document.body.dataset.theme = 'tutor';
    else delete document.body.dataset.theme;
  }, [nombre]);

  const valor = useMemo<ValorTema>(() => {
    const t = {
      ...tokensDefault,
      ...(nombre === 'tutor' ? tokensTutor : {}),
      ...(movimientoReducido ? tokensReducedMotion : {}),
    } as Tokens;

    return {
      nombre,
      t,
      px: (token) => aNumero(t[token]),
      texto: (nivel) => estiloDeTexto(t, nivel),
      textoSobreMarca: (nivel) => estiloDeTextoSobreMarca(t, nivel, nombre === 'tutor'),
      reforzarSobreMarca: nombre === 'tutor',
      movimientoReducido,
    };
  }, [nombre, movimientoReducido]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useTheme(): ValorTema {
  const valor = useContext(Contexto);
  if (!valor) throw new Error('useTheme() fuera de un <ThemeProvider>.');
  return valor;
}
