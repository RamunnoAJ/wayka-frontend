import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Platform, type TextStyle } from 'react-native';

import { estiloDeTexto, aNumero, type NivelDeTexto } from './tipografia';
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
  /** `true` si el sistema pide movimiento reducido: las duraciones van a 0ms. */
  movimientoReducido: boolean;
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
