# Wayka — Respuesta a los pendientes del design system

Versión **1.1.1** (2026-08-25). Contra los seis puntos del prompt, en el mismo orden.

**Resumen:** 1, 2, 5 y 6 quedaron resueltos y están en el repo. El 3 y el 4 **no los puedo cerrar yo** — dependen de un valor que la marca todavía no entregó, y explico exactamente qué falta y qué desbloquea. Detalle abajo.

---

## 1. Versión y changelog — resuelto

Tres piezas, con una sola fuente de verdad:

| Archivo | Para qué |
|---|---|
| `version.json` | **La señal para tu pipeline.** Legible por máquina, en la raíz. Trae `version`, `released`, la lista de `tokenFiles`, los selectores de cada tema y — lo más útil para tu parser — el array `parseExceptions` con cada token que no es un escalar y por qué. |
| `CHANGELOG.md` | Historial legible, con el criterio de versionado explícito. |
| `tokens/meta.css` | `--ds-version` y `--ds-released` como custom properties, para un consumidor que solo tenga el CSS. |

**El criterio de regeneración es el campo `version` de `version.json`.** Si cambió respecto del último build, se regenera el espejo. Nada de fecha de modificación de archivo.

El semver está aplicado al contrato, no al código:

- **MAJOR** — cambia o desaparece un token, o un componente rompe su API. Requiere revisar el consumidor.
- **MINOR** — se agregan tokens o componentes; lo existente sigue valiendo. Regenerás y nada se rompe.
- **PATCH** — cambian valores dentro de un token existente (un hex, un px), o documentación.

Con eso, cuando lleguen los hexadecimales de marca confirmados (punto 4) vas a ver un **PATCH**: mismos nombres, otros valores, regeneración segura.

---

## 2. Formato estable de `tokens/*.css` — resuelto, con excepciones declaradas

Reformateé `spacing.css`, `radius.css`, `typography.css`, `motion.css` y `elevation.css` a **una declaración por línea**, `--nombre:valor;`, sin agrupar. `colors.css` ya estaba así. Los comentarios explicativos van en línea propia. Lo único que queda al final de una declaración es un marcador `/* @kind ... */` en 20 tokens: lo usa el compilador del design system para clasificar valores que no se deducen del nombre (pesos, interlineado, easings). **Tu parser lo puede descartar entero**: cortá la línea en el primer `;` y te queda la declaración limpia. Esto queda como regla de entrega, no como un arreglo de una vez.

Las excepciones que pediste que señale — están todas listadas en `parseExceptions` dentro de `version.json`, y comentadas en el propio archivo donde viven:

**a) `color-mix()` — resuelto en 1.1.1, ya no aplica.** Eran dos tokens, no cuatro: solo `--color-primary-hover` en cada tema (los `--color-accent-hover` ya apuntaban a un token de marca directo). Quedaron congelados como hex literales — `#897AAC` en clínica/vet y `#D78B57` en tutor — calculados en oklab, así que son el resultado exacto de la mezcla anterior y el render no cambió. **No queda ningún `color-mix()` en los tokens.**

**b) `--text-*` en `typography.css` — shorthand `font` compuesto.** Son `peso tamaño/interlineado familia` en un solo valor. **No los parsees:** los pedazos ya existen como tokens escalares (`--fw-*`, `--fs-*`, `--lh-*`) y esos son la fuente de verdad. Los compuestos existen solo por comodidad en CSS.

**c) `--shadow-*` y `--ring-*` en `elevation.css` — cadenas `box-shadow`.** No hay equivalente directo en React Native. Tabla para el espejo:

| Token | iOS (`shadow*`) | Android (`elevation`) |
|---|---|---|
| `--shadow-xs` | offset 0/1, radius 2, opacity .06 | 1 |
| `--shadow-sm` | offset 0/1, radius 3, opacity .07 | 2 |
| `--shadow-md` | offset 0/4, radius 14, opacity .08 | 4 |
| `--shadow-lg` | offset 0/12, radius 32, opacity .12 | 8 |
| `--shadow-overlay` | offset 0/24, radius 60, opacity .22 | 16 |

`shadowColor` siempre `#1E1428` (el `rgba(30,20,40,·)` de todas las sombras). Los `--ring-*` son foco: en nativo no se resuelven con sombra sino con un borde de 2px en `--border-focus`, y `--ring-focus-on-dark` con borde blanco.

**d) `--transition-control` en `motion.css`.** Lista de transiciones CSS. En nativo se ignora: usás `--dur-fast` + `--ease-standard` y animás las propiedades a mano.

**e) `--dur-fast|normal|slow` están declarados dos veces:** en `:root` y de nuevo dentro de `@media (prefers-reduced-motion:reduce)` en 0ms. Tu parser tiene que leer eso como un **segundo juego de valores**, no sobreescribir el primero. En React Native el equivalente es `AccessibilityInfo.isReduceMotionEnabled()`.

**f) Dos scopes de tema, no uno.** `colors.css` declara `:root` y después `[data-theme="tutor"]` con ~15 tokens redefinidos. El espejo tiene que salir como `{ default: {...}, tutor: {...} }`, y el tutor **hereda** todo lo que no redefine. El override cruzado que había acá quedó resuelto en 1.1.1: el `--ring-focus` del tema tutor se movió a `elevation.css`, junto al resto de los `--ring-*`. **Ningún override cruza de archivo**, así que podés parsear archivo por archivo sin resolver referencias externas.

---

## 3. Logos: SVG originales — bloqueado, pero menos de lo que parece

Revisé los seis archivos de `uploads/` de nuevo y hay una precisión importante que corrige lo que dice la sección 7 del brief:

**La geometría original sí está completa.** Los paths son los reales, con todas las curvas del isotipo y del wordmark. Lo único que falta es el `fill`: el `<defs>` traía la clase `.cls-1` vacía, así que los seis archivos son geométricamente idénticos y ninguno declara color. Los tres SVG de `assets/` (`wayka-logo.svg`, `wayka-isotipo.svg`, `wayka-wordmark.svg`) son esa geometría real, recortada por viewBox y pintada con `currentColor`.

Consecuencia práctica: **para el app icon no estás bloqueado por la geometría, sino por el color** — que es exactamente el punto 4. En cuanto tengas los hexadecimales confirmados, el icono se genera del isotipo que ya está en el repo, sin esperar nada de la marca.

Lo que sigue faltando y solo puede venir del diseñador de marca:
- Los valores de relleno por variante (qué color exacto es "Lila", "Naranja oscuro", etc.).
- Si alguna variante tiene **más de un color** en el mismo archivo (el `<defs>` vacío tapa esa posibilidad: si hubiera `.cls-1` y `.cls-2`, hoy no lo sabríamos).
- El área de resguardo oficial, si la marca definió una distinta de la que asumí (media altura del isotipo).

**No puedo generar los originales yo**: inventar los fills sería sustituir una decisión de marca por una mía, y es justo lo que el punto 4 quiere evitar. Lo dejo explícitamente abierto, como pediste.

Sobre el app icon específicamente, cuando tengas el color: iOS pide 1024×1024 sin transparencia y sin esquinas redondeadas propias; Android adaptativo pide foreground y background separados, con el isotipo dentro del 66% central seguro. La geometría actual sirve para las tres salidas.

---

## 4. Hexadecimales de marca — bloqueado

Sin cambios: los nueve valores `--wayka-*` de `tokens/colors.css` están derivados de los nombres de archivo de los logos ("Lila", "Naranja claro", "Violeta oscuro"…), no extraídos de un original. **No los puedo confirmar** — no hay fuente en el repo contra la cual validarlos.

Lo que sí puedo garantizar es que el reemplazo es barato y acotado:

- Son **9 líneas** al principio de `tokens/colors.css`, todas juntas y comentadas como `VALORES A CONFIRMAR`.
- Ningún componente escribe un hex de marca: todos leen alias (`--color-primary*`, `--surface-*`, `--text-*`). Cambiar los nueve propaga a todo el sistema y a los tres kits.
- Sale como **PATCH** en el changelog, así tu pipeline regenera sin tratarlo como ruptura.

**Una advertencia para cuando lleguen los valores reales:** hay dos tokens que no son un hex de marca sino una decisión de contraste, y que hay que recalcular a mano contra la paleta nueva, no reemplazar mecánicamente:

- `--color-primary-fill` / `--color-primary-fill-hover`. El primario claro (lila, naranja claro) no llega a AA con blanco encima, así que todo lo que se pinta lleno usa este otro tono. En el tema tutor son hex literales (`#A34F1D`, `#864016`) elegidos por ratio de contraste, no derivados de un logo.
- `--surface-nav` del tema tutor, por lo mismo.

Si la paleta real cambia el tono de base, esos tres valores hay que volver a medirlos. Avisame cuando tengas los hexadecimales y lo hago junto con el swap.

---

## 5. Fuentes para nativo — resuelto

Respuesta corta a tu pregunta: **los estáticos de `assets/fonts/` eran `.woff2`, así que no servían para `expo-font`.** Pero los `.otf` y `.ttf` originales sí habían llegado y estaban sin copiar al sistema. Los agregué:

```
assets/fonts/native/
  Satoshi-Light.otf      300
  Satoshi-Regular.otf    400
  Satoshi-Medium.otf     500
  Satoshi-Bold.otf       700
  Satoshi-Black.otf      900
  Satoshi-Italic.otf     400 italic
  Satoshi-BoldItalic.otf 700 italic
  Satoshi-Variable.ttf   300–900 variable
```

`assets/fonts/` mantiene los `.woff2` para web. No hay que pedir nada más.

**El hallazgo que importa: el peso 600 no existe como estático.** Satoshi entrega Light, Regular, Medium, Bold y Black — no hay SemiBold. En web no se nota porque la variable interpola 600 sin problema, y el sistema usa `--fw-semibold: 600` en bastantes lugares (`--text-h2`, `h3`, `h4`, `--text-body-strong`).

Dos opciones para nativo:

1. **Cargar `Satoshi-Variable.ttf`** y usar 600 real. El soporte de fuentes variables en React Native es irregular en Android según versión de OS y motor de texto; probalo temprano en un dispositivo real, no solo en emulador.
2. **Cargar los estáticos y mapear 600 → 700 (Bold).** Es lo que recomiendo para la primera versión nativa: predecible en las dos plataformas. El salto visual es chico porque 600 y 700 en Satoshi están cerca.

Si van por la opción 2, en nativo cada peso es una familia distinta (`Satoshi-Bold` como `fontFamily`, no `fontWeight: 700`) — conviene que el espejo de tokens exponga los `--fw-*` ya resueltos a nombre de familia para no repetir el mapeo en cada componente.

Dejé `--fw-semibold` sin tocar y con el comentario del caso en `typography.css`. No lo cambié porque en web el valor es correcto; el mapeo es una decisión de la capa nativa.

---

## 6. Criterio de imágenes — resuelto (aunque dijiste que no urgía)

Era corto de escribir, así que quedó documentado en `readme.md`, en el bloque **Imagenería**. En resumen:

- **Tono.** Cálido y natural, luz de día, sin filtro ni grano. Mascota y tutor en contexto real de clínica o casa, nunca fondo de estudio.
- **Proporción.** Perfil de mascota 1:1, recorte centrado en la cabeza, `--radius-xl` en la ficha y `--radius-pill` como avatar. Adjunto o estudio 4:3, `--radius-md`, **sin recortar** — el contenido clínico se ve completo, con `contain` sobre `--surface-sunken` si no coincide. Miniatura de lista 1:1 de 56px, `--radius-sm`.
- **Fallback.** Nunca el roto del navegador ni la inicial sobre color de marca: `--surface-sunken` con el icono de especie (`dog`/`cat`) o `paperclip` centrado, `--text-subtle` a 26px. En React Native es el `defaultSource` / estado de error del `Image`.
- **Nunca.** Foto de fondo detrás de texto, imagen a sangre, collage, ni fotografía dentro de un bloque clínico — medicación, alergias y dosis son dato, no ilustración.

Si cuando llegue el momento el criterio no les cierra, cámbienlo sin culpa: es una propuesta, no una restricción heredada de la marca.

---

## Lo que necesito de vuelta

1. **Los hexadecimales de marca confirmados** (punto 4). Desbloquea también el app icon del punto 3. Es lo único que bloquea un build visible a un cliente.
2. **Si alguna variante de logo tiene más de un color**, el SVG con las clases pobladas.
3. ~~Dos decisiones sobre el parseo~~ — **confirmadas y aplicadas en 1.1.1.** Ver `CHANGELOG.md`.
