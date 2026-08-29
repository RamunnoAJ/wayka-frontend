# Wayka — Sistema de movimiento (React Native + Reanimated 3)

> Handoff para Claude Code. Wayka Design System v1.6.0.
> Fuente de verdad de los valores: `tokens/motion.css`.
> Guías originales: `guidelines/motion-reanimated.card.html`, `guidelines/motion-recetas.card.html`.

---

## 0. Principios

1. **Nada se anima sin motivo.** Un elemento se mueve para explicar de dónde viene o para acusar recibo de un toque. Si la animación no responde ninguna de esas dos preguntas, sobra. Wayka es software clínico: la calma es la marca.
2. **Resorte para `transform`, timing para `opacity` y color.** Un resorte sobre `opacity` es indistinguible de una curva y cuesta frames; sobre color no existe. `translate` / `scale` / `rotate` con `withSpring`; `opacity` e interpolación de color con `withTiming`.
3. **Nunca overshoot.** Los tres resortes están críticamente amortiguados (damping ratio ~1.0): llegan y se detienen, no rebotan.
4. **Un solo desplazamiento: 6 px.** No 12 en una pantalla y 20 en otra — la escala del movimiento es del sistema, no de la vista. Toast y sheet son la excepción: vienen desde fuera del layout.
5. **Nunca opacidad como feedback de press.** Apagar el control lo hace parecer deshabilitado. Se usa escala.
6. **`useReducedMotion()` en todo hook de animación.** El estado final es idéntico — se elimina el recorrido, no el resultado.
7. **Ningún componente escribe un número de resorte a mano.** Todo sale de `motion.ts`.

---

## 1. Los tres resortes

| Preset | Parámetros | Duración aprox. | Dónde |
|---|---|---|---|
| `spring.snap` | damping 34 · stiffness 420 · mass 0.7 | ~140 ms | Press de botón, card e icono. Switch, checkbox, radio. Todo lo que responde al dedo. |
| `spring.default` | damping 30 · stiffness 240 · mass 0.9 | ~260 ms | Indicador de tabs, toast, chips que aparecen, expansión de una fila, badge de contador. |
| `spring.gentle` | damping 26 · stiffness 160 · mass 1.0 | ~380 ms | Entrada de pantalla, bottom sheet, modal, retorno del pull to refresh. |

**Umbrales de reposo obligatorios en los tres:** `restDisplacementThreshold: 0.01`, `restSpeedThreshold: 2`. Sin esto el resorte sigue resolviendo fracciones de píxel y el final del gesto se siente pegajoso.

## 2. Duraciones (solo `opacity` y color)

| Token | Valor | Uso |
|---|---|---|
| `instant` | 80 ms | Flash de cámara, cambios que no deben leerse como animación. |
| `fast` | 140 ms | Estados de control: fondo, borde, color de texto. Salida de toast. |
| `normal` | 220 ms | Fades de entrada, crossfade entre vistas. |
| `slow` | 340 ms | Reservado; casi no se usa en nativo. |

Easing único: `Easing.bezier(0.2, 0.7, 0.3, 1)`.

## 3. Escalas

| Token | Valor | Uso |
|---|---|---|
| `OFFSET` | 6 px | Desplazamiento de entrada de cualquier elemento. |
| `PRESS` | 0.97 | Press en botones, iconos, controles chicos. |
| `PRESS_LG` | 0.99 | Press en cards grandes y filas de lista — el mismo factor se lee más fuerte cuanto más grande es el elemento. |

---

## 4. `motion.ts` — espejo de los tokens

```ts
// motion.ts
import { Easing } from 'react-native-reanimated';

const rest = { restDisplacementThreshold: 0.01, restSpeedThreshold: 2 };

export const spring = {
  snap:    { damping: 34, stiffness: 420, mass: 0.7, ...rest },
  default: { damping: 30, stiffness: 240, mass: 0.9, ...rest },
  gentle:  { damping: 26, stiffness: 160, mass: 1.0, ...rest },
} as const;

// timing solo para opacity y color
const easeStandard = Easing.bezier(0.2, 0.7, 0.3, 1);
export const timing = {
  instant: { duration: 80,  easing: easeStandard },
  fast:    { duration: 140, easing: easeStandard },
  normal:  { duration: 220, easing: easeStandard },
  slow:    { duration: 340, easing: easeStandard },
} as const;

export const OFFSET = 6;        // --motion-offset
export const PRESS = 0.97;      // --motion-press-scale
export const PRESS_LG = 0.99;   // --motion-press-scale-lg
```

---

## 5. Entrada de pantalla

Fade + 6 px hacia arriba. Un solo builder reutilizable; el contenido principal lo usa entero, no elemento por elemento. Si la pantalla tiene header y cuerpo, escalonar con `delay` de 40 ms — nunca más de dos escalones.

```ts
// enter.ts
import { withSpring, withTiming, withDelay } from 'react-native-reanimated';
import { spring, timing, OFFSET } from './motion';

export const enterUp = (delay = 0) => () => {
  'worklet';
  return {
    initialValues: { opacity: 0, transform: [{ translateY: OFFSET }] },
    animations: {
      opacity: withDelay(delay, withTiming(1, timing.normal)),
      transform: [{ translateY: withDelay(delay, withSpring(0, spring.gentle)) }],
    },
  };
};

// en la pantalla
<Animated.View entering={enterUp()}>{header}</Animated.View>
<Animated.View entering={enterUp(40)}>{body}</Animated.View>
```

---

## 6. Press — botones y cards

El único feedback táctil del sistema. `spring.snap` en las dos direcciones: al soltar vuelve con la misma física con que se hundió. El color de fondo lo sigue manejando el estado del componente con `withTiming`, no el resorte.

```ts
// usePress.ts
import { useSharedValue, useAnimatedStyle, withSpring, useReducedMotion }
  from 'react-native-reanimated';
import { spring, PRESS } from './motion';

export function usePress(target = PRESS) {
  const reduced = useReducedMotion();
  const s = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return {
    style,
    onPressIn:  () => { if (!reduced) s.value = withSpring(target, spring.snap); },
    onPressOut: () => { if (!reduced) s.value = withSpring(1, spring.snap); },
  };
}

// uso — card grande: usePress(PRESS_LG)
const press = usePress();
<Pressable {...press} onPress={onSubmit}>
  <Animated.View style={[styles.button, press.style]}>…</Animated.View>
</Pressable>
```

---

## 7. Toast / snackbar

Entra desde su borde (8 px, no 6 — viene de fuera del layout) con `spring.default`; sale con timing, sin resorte: al salir nadie mira el toast, y un resorte de salida alarga la espera. Salida siempre más rápida que la entrada.

```ts
import Animated, { withSpring, withTiming } from 'react-native-reanimated';
import { spring, timing } from './motion';

const toastIn = () => {
  'worklet';
  return {
    initialValues: { opacity: 0, transform: [{ translateY: 8 }] },   // -8 si es top
    animations: {
      opacity: withTiming(1, timing.fast),
      transform: [{ translateY: withSpring(0, spring.default) }],
    },
  };
};

const toastOut = () => {
  'worklet';
  return {
    initialValues: { opacity: 1, transform: [{ translateY: 0 }] },
    animations: {
      opacity: withTiming(0, timing.fast),
      transform: [{ translateY: withTiming(8, timing.fast) }],
    },
  };
};

<Animated.View entering={toastIn} exiting={toastOut} style={styles.toast}>…</Animated.View>
```

---

## 8. Tabs y segmented control

Se mueve el indicador, no las etiquetas. `onLayout` mide cada tab una vez y el indicador viaja con `spring.default`; el color del texto cruza con `withTiming` en paralelo. Sin overshoot: el indicador no puede pasarse del tab y volver.

```ts
const [tabs, setTabs] = useState<{x:number; w:number}[]>([]);
const x = useSharedValue(0);
const w = useSharedValue(0);

useEffect(() => {
  const t = tabs[active];
  if (!t) return;
  x.value = reduced ? t.x : withSpring(t.x, spring.default);
  w.value = reduced ? t.w : withSpring(t.w, spring.default);
}, [active, tabs]);

const indicator = useAnimatedStyle(() => ({
  transform: [{ translateX: x.value }], width: w.value,
}));

<Pressable onLayout={e => measure(i, e.nativeEvent.layout)} …>
<Animated.View style={[styles.indicator, indicator]} />
```

---

## 9. Cámara — captura, flash y revisión

Tres momentos encadenados y muy cortos: el obturador confirma que se tomó la foto, el flash tapa el salto del sensor, la miniatura dice dónde quedó. El flash usa `instant` en las dos direcciones; nada acá lleva resorte salvo el rebote del botón.

```ts
const flash = useSharedValue(0);
const shutter = useSharedValue(1);
const thumb = useSharedValue(0);

function onCapture() {
  // 1. obturador: el botón se hunde y vuelve
  shutter.value = withSequence(
    withSpring(0.9, spring.snap),
    withSpring(1, spring.snap),
  );
  // 2. flash: velo blanco 80 ms adentro, 80 ms afuera
  flash.value = withSequence(
    withTiming(0.85, timing.instant),
    withTiming(0, timing.instant),
  );
  // 3. miniatura entra en la esquina cuando el flash ya bajó
  thumb.value = withDelay(160, withSpring(1, spring.default));
}

// velo — pointerEvents="none" sobre el visor
const veil = useAnimatedStyle(() => ({ opacity: flash.value }));
// paso a revisión: crossfade, sin desplazamiento — el encuadre no debe saltar
const review = useAnimatedStyle(() => ({
  opacity: withTiming(isReviewing ? 1 : 0, timing.normal),
}));
```

---

## 10. Pull to refresh

Mientras el dedo está abajo nada se anima: el indicador sigue el scroll 1:1, interpolado. El resorte aparece solo al soltar.

```ts
const y = useSharedValue(0);
const THRESHOLD = 72;

const onScroll = useAnimatedScrollHandler({
  onScroll: e => { y.value = e.contentOffset.y; },
  onEndDrag: e => {
    if (e.contentOffset.y <= -THRESHOLD) runOnJS(refresh)();
  },
});

// el indicador sigue al dedo, sin animación: es el gesto mismo
const spinner = useAnimatedStyle(() => {
  const p = interpolate(-y.value, [0, THRESHOLD], [0, 1], Extrapolation.CLAMP);
  return { opacity: p, transform: [{ scale: 0.8 + p * 0.2 }, { rotate: `${p * 180}deg` }] };
});

// al terminar, la lista vuelve con gentle
function onRefreshDone() { y.value = withSpring(0, spring.gentle); }
```

---

## 11. Bottom sheet — cerrar con arrastre

Único gesto interactivo del sistema. Durante el arrastre el sheet sigue al dedo sin física y no se puede subir más allá del tope (`Math.max(0, …)`). Al soltar decide velocidad o distancia: cierra con timing, vuelve con `spring.gentle`. El backdrop se atenúa con el recorrido, no con su propia animación.

```ts
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const ty = useSharedValue(HEIGHT);
const start = useSharedValue(0);

const pan = Gesture.Pan()
  .onStart(() => { start.value = ty.value; })
  .onUpdate(e => { ty.value = Math.max(0, start.value + e.translationY); })
  .onEnd(e => {
    const dismiss = ty.value > HEIGHT * 0.3 || e.velocityY > 800;
    if (dismiss) {
      ty.value = withTiming(HEIGHT, timing.normal, f => { if (f) runOnJS(onClose)(); });
    } else {
      ty.value = withSpring(0, spring.gentle);   // vuelve a su sitio
    }
  });

const sheet = useAnimatedStyle(() => ({ transform: [{ translateY: ty.value }] }));
const backdrop = useAnimatedStyle(() => ({
  opacity: interpolate(ty.value, [0, HEIGHT], [1, 0], Extrapolation.CLAMP),
}));

<GestureDetector gesture={pan}>
  <Animated.View style={[styles.sheet, sheet]}>…</Animated.View>
</GestureDetector>
```

---

## 12. Movimiento reducido

No es un caso límite: iOS y Android lo activan también al bajar batería. Una línea por hook.

```ts
const reduced = useReducedMotion();

// resorte  → asignación directa
s.value = reduced ? 1 : withSpring(1, spring.snap);
// timing   → duración 0
o.value = withTiming(1, reduced ? { duration: 0 } : timing.normal);
// entering → sin offset, solo el fade
initialValues: { opacity: 0, transform: [{ translateY: reduced ? 0 : OFFSET }] }
```

---

## 13. Checklist de revisión

- [ ] ¿El valor del resorte sale de `motion.ts` y no está escrito a mano?
- [ ] ¿`transform` con resorte y `opacity`/color con timing?
- [ ] ¿El desplazamiento de entrada es 6 px (o 8 px si viene de fuera del layout)?
- [ ] ¿El press usa escala y no opacidad?
- [ ] ¿El hook consulta `useReducedMotion()`?
- [ ] ¿Ningún resorte rebota o se pasa del destino?
- [ ] ¿Los umbrales de reposo están en todos los presets?
- [ ] ¿La animación explica un origen o acusa un toque? Si no, se borra.

---

## Pendiente

No hay React Navigation en el proyecto. Las recetas asumen que la pantalla entrante se anima sola con `enterUp()` y que no hay coreografía de salida. Si se adopta un navegador (`expo-router`, stack propio), falta definir el par entrada/salida coordinado.
