# Wayka — Brief de integración frontend

**Design system v1.1.1** (2026-08-25). Documento de handoff para incorporar el sistema a un proyecto de frontend. Todo lo que sigue existe hoy en este repositorio; nada requiere rediseño previo.

Contexto de destino conocido: **Expo + React Native + React Native Web**, un solo codebase para web, iOS y Android. Los componentes que se entregan son React DOM y sirven para la etapa web; la sección 9 reúne todo lo que hace falta para que el mismo sistema sostenga las pantallas nativas más adelante.

---

## 1. Qué se entrega

| Pieza | Ruta | Qué es |
|---|---|---|
| Punto de entrada CSS | `styles.css` | Único import. Encadena los 9 archivos de tokens + foco global + keyframes. |
| Tokens | `tokens/*.css` | `meta` · `fonts` · `colors` · `typography` · `spacing` · `radius` · `elevation` · `motion` · `base`. Todo en custom properties, una declaración por línea. |
| Versión | `version.json` · `CHANGELOG.md` | Contrato de versionado. `version.json` es la señal legible por máquina; ver sección 8. |
| Fuentes web | `assets/fonts/` | Satoshi variable 300–900 en woff2, más estáticos. `@font-face` ya declarado. |
| Fuentes nativas | `assets/fonts/native/` | Estáticos OTF (300/400/500/700/900 + 2 itálicas) y la variable TTF, para `expo-font`. |
| Logos | `assets/*.svg` | Logo completo, isotipo, wordmark. Geometría real, monocromos, se pintan con `currentColor`. |
| Componentes | `components/{core,clinical,navigation}/` | 39 componentes React DOM, cada uno con `.jsx`, `.d.ts` y `.prompt.md`. |
| Kits de pantalla | `ui_kits/{clinica-web,vet-movil,tutor-movil}/` | Flujos click-through de referencia. **No son código de producción**: son la fuente de verdad de composición y densidad. |
| Reglas completas | `readme.md` | Tono, color, jerarquía, estados, iconografía, imagenería. Lectura obligatoria antes de la primera pantalla. |
| Estado de la deuda | `RESPUESTA-PENDIENTES.md` | Qué quedó resuelto, qué está bloqueado y qué desbloquea cada insumo faltante. |

**Dependencias externas:** solo Lucide (`lucide-static@0.446.0`) por CDN, consumido con `mask-image` a través del componente `Icon`. Ninguna librería de UI, de fechas, de color ni de estilos.

---

## 2. Puesta en marcha

1. Copiar `styles.css`, `tokens/` y `assets/` conservando la estructura de carpetas (los `@import` y los `src` de las fuentes son relativos).
2. Importar `styles.css` una sola vez, en la raíz de la aplicación, antes que cualquier CSS propio.
3. Copiar `components/` como base del catálogo interno. Son componentes React sin dependencias: estilos inline que leen tokens, sin CSS-in-JS ni clases.
4. Marcar el tema del rol en `<body>` (ver sección 4).

Los componentes están escritos como JSX plano con `import React from 'react'`. Si el proyecto usa TypeScript, los `.d.ts` que acompañan a cada archivo ya describen la API pública, prop por prop.

---

## 3. Contrato de tokens

Ningún componente escribe un hexadecimal de marca. Todo pasa por custom properties, y esa es la regla que hay que sostener en el código nuevo.

Familias disponibles: `--color-primary*` y `--color-accent*` (temables), `--surface-*`, `--text-*`, `--border-*`, semánticos `danger`/`warning`/`success`/`info`, clínicos `--clinical-*` / `--owner-*`, `--space-*`, `--radius-*`, `--shadow-*`, `--ring-*`, `--transition-*`.

Tres distinciones que se confunden seguido:

- **`--color-primary` no se usa para rellenar.** Es un tono de superficie (lila / naranja claro): con texto blanco encima no alcanza AA. Todo lo que se pinta lleno con contenido blanco usa **`--color-primary-fill`** y `--color-primary-fill-hover`. `--color-primary` queda para bordes, tintes y superficies suaves.
- **`--surface-nav`** es la superficie oscura de navegación y cabeceras (sidebar, header móvil oscuro, hero del login). Con ella van `--text-on-nav`, `--text-on-nav-muted`, `--surface-nav-item` y `--border-on-nav`. No usar el primario claro como fondo de navegación.
- **`--ring-focus`** se aplica una sola vez, en `styles.css`, sobre `:focus-visible`. Los componentes no lo repiten. Cualquier contenedor oscuro lleva `data-surface="dark"` y hereda automáticamente el anillo blanco.

Los hexadecimales de marca son derivados de los nombres de archivo de los logos, no una extracción del original. Están todos juntos al principio de `tokens/colors.css`: sustituirlos por los valores oficiales es cambiar 9 líneas y no toca ningún componente. **Advertencia para ese momento:** `--color-primary-fill`, `--color-primary-fill-hover` y el `--surface-nav` del tema tutor no son hex de marca sino decisiones de contraste — hay que recalcularlos contra la paleta nueva, no reemplazarlos mecánicamente.

---

## 4. Tema por rol

El sistema tiene dos temas que invierten primario y acento. Se activan con un atributo en `<body>`:

```html
<body>                     <!-- clínica y veterinario: lila-violeta, acentos naranjas -->
<body data-theme="tutor">  <!-- tutor: naranja, acentos lilas -->
```

Los mismos tokens se resuelven distinto; el árbol de componentes no cambia. **Una excepción fija:** la autoría del dato no se invierte nunca — punto violeta = cargado por el veterinario, punto naranja = cargado por el tutor, en ambos temas.

En React Native no hay atributo en `<body>`: el equivalente es un contexto que seleccione el juego de tokens (`{ default, tutor }`) y lo provea al árbol. El espejo de tokens tiene que salir con esa forma; ver sección 9.

Alcance por plataforma: clínica admin solo web, veterinario web y móvil con paridad total, tutor solo móvil.

---

## 5. Reglas que el código tiene que sostener

Estas son las que se rompen primero cuando entra gente nueva al proyecto. El resto está en `readme.md`.

**Los tres estados son obligatorios.** Cualquier bloque que dependa de datos implementa carga, error y vacío: `Skeleton`/`SkeletonText` con las medidas del contenido real (nunca un spinner centrado), `InlineError` dentro del bloque que falló (el resto de la pantalla sigue usable), `EmptyState` con una acción que resuelva el vacío. `Toast` es solo para avisos efímeros.

**Densidad.** Sin sombras en cards, sin franjas alternas en tablas, sin bordes verticales. Las separaciones son hairlines de 1px. Un estado se comunica con un punto de 6px y tipografía, no con una pastilla tintada. El único fondo tintado de todo el sistema es la alerta de alergia.

**Color con significado.** Cuatro usos y ninguno más: acción, riesgo real, autoría del dato y estado de cita. Un solo color de acción por pantalla.

**Datos críticos primero.** Medicación activa y alergias van por encima del historial, nunca dentro de la lista cronológica, y las alertas viajan con la fila del listado para no obligar a abrir la ficha.

**Lectura vs. edición explícito.** Todo dato no editable muestra candado y "Solo lectura" vía `DataField`.

**Capas.** `Dialog` para confirmar o editar algo puntual. `Sheet` para el resto: desde abajo en móvil, `side="right"` en web para detalle y filtros. Nunca capas anidadas.

**Copy en español rioplatense, voseo.** "Cargá el evento", no "Carga". Mayúscula solo inicial. Coma decimal y `tabular-nums` en cifras. Al veterinario se le habla en datos; al tutor, en consecuencias.

**Imágenes.** Perfil de mascota 1:1 con recorte centrado en la cabeza; adjunto o estudio 4:3 **sin recortar**, con `contain` sobre `--surface-sunken`. Fallback siempre explícito: icono de especie o `paperclip` en `--text-subtle`, nunca el roto del navegador ni la inicial sobre color de marca. Criterio completo en `readme.md`.

**Movimiento.** Un solo easing (`cubic-bezier(.2,.7,.3,1)`), 140ms en controles, 220ms en paneles, 340ms en transición de pantalla móvil. Sin spring ni bounce. `prefers-reduced-motion` lleva todo a 0.

---

## 6. Composición de referencia

Los kits muestran cómo se arman las pantallas reales y valen más que cualquier descripción:

- `ui_kits/clinica-web/` — login, listado de pacientes, ficha completa, formulario de evento clínico, medicación, agenda semanal y diaria, panel de clínica.
- `ui_kits/vet-movil/` — paridad funcional con la web en 372px.
- `ui_kits/tutor-movil/` — solo lectura sobre lo clínico, citas con confirmar y reagendar, adjuntos, datos propios editables.

Patrones a copiar de ahí: sidebar fija de 248px, ancho de contenido máximo 1160px, gutter de página de 32px, padding de card de 24px, CTA principal sticky al pie en móvil sobre degradado de protección.

---

## 7. Componentes

`core/` — Icon, Button, IconButton, Input, Textarea, Select, Checkbox, Radio, Switch, Card, Badge, Tag, Avatar, Tabs, Dialog, **Sheet**, Toast, Tooltip, SearchField, **DatePicker**, **Calendar**, **DataTable**, EmptyState, **Skeleton**, **SkeletonText**, **InlineError**

`clinical/` — CriticalPanel, AllergyChip, MedicationItem, TimelineEvent, AppointmentCard, PatientRow, DataField, PetHeader, StatusDot

`navigation/` — SidebarNav, PageHeader, MobileTabBar, MobileHeader

`DataTable` aporta cabecera y contenedor; las filas son componentes del dominio (`PatientRow`), y los anchos de `columns` tienen que coincidir con los de la fila.

**Variantes deprecadas** que siguen funcionando como alias y no deberían usarse en código nuevo: `Button variant="accent"` → `primary`, `Badge tone="brand"|"accent"` → `primary`, `Card tone="clinical"|"owner"` → `default`.

---

## 8. Versionado

Tres piezas con una sola fuente de verdad:

- **`version.json`** — la señal para el pipeline. Trae `version`, `released`, la lista de `tokenFiles`, los selectores de cada tema, un array `parseExceptions` con cada token que no es un escalar y el motivo, y `unconfirmed` con lo que espera insumo de la marca.
- **`CHANGELOG.md`** — historial legible.
- **`--ds-version` / `--ds-released`** en `tokens/meta.css`, para un consumidor que solo tenga el CSS.

**El criterio de regeneración es el campo `version` de `version.json`.** Si cambió respecto del último build, se regenera el espejo de tokens. La fecha de modificación de archivo no se usa como señal.

Semver aplicado al contrato, no al código: **MAJOR** cambia o quita un token o rompe la API de un componente · **MINOR** agrega y no rompe nada · **PATCH** cambia valores dentro de tokens existentes, o documentación. Cuando lleguen los hexadecimales de marca confirmados va a salir como PATCH: mismos nombres, otros valores, regeneración segura.

---

## 9. Camino a React Native

Los componentes actuales son React DOM (CSS, `<body data-theme>`, `mask-image`) y no se portan tal cual. Lo que sí está preparado para cruzar es el contrato de tokens.

**Formato de los tokens.** `tokens/*.css` está escrito para parseo automático: una declaración por línea, `--nombre:valor;`, sin agrupar. Los comentarios explicativos van en línea propia; lo único que queda al final de una declaración es un marcador `/* @kind ... */` en 20 tokens, que el parser puede descartar cortando en el primer `;`. **No queda ningún `color-mix()`** y **ningún override cruza de archivo** — se puede parsear archivo por archivo sin resolver referencias externas.

**Lo que no es un escalar** (todo listado en `parseExceptions` de `version.json`):

- `--text-*` en `typography.css` son shorthand `font` compuesto. **No parsearlos:** los pedazos existen como `--fw-*`, `--fs-*`, `--lh-*` y esos son la fuente de verdad.
- `--shadow-*` y `--ring-*` son cadenas `box-shadow`. Equivalencias para nativo, con `shadowColor: '#1E1428'` siempre:

  | Token | iOS (offset y/radius/opacity) | Android (`elevation`) |
  |---|---|---|
  | `--shadow-xs` | 1 / 2 / .06 | 1 |
  | `--shadow-sm` | 1 / 3 / .07 | 2 |
  | `--shadow-md` | 4 / 14 / .08 | 4 |
  | `--shadow-lg` | 12 / 32 / .12 | 8 |
  | `--shadow-overlay` | 24 / 60 / .22 | 16 |

  Los `--ring-*` son foco: en nativo no se resuelven con sombra sino con un borde de 2px en `--border-focus`, y `--ring-focus-on-dark` con borde blanco.
- `--transition-control` es una lista de transiciones CSS; en nativo se ignora y se usa `--dur-fast` + `--ease-standard` animando a mano.
- `--dur-fast|normal|slow` están declarados dos veces: en `:root` y de nuevo en `@media (prefers-reduced-motion:reduce)` en 0ms. El parser tiene que leerlo como un segundo juego de valores, no sobreescribir el primero. El equivalente nativo es `AccessibilityInfo.isReduceMotionEnabled()`.
- **Dos scopes de tema.** `colors.css` declara `:root` y `[data-theme="tutor"]` con ~15 tokens redefinidos; `elevation.css` declara el `--ring-focus` del tutor. El espejo sale como `{ default, tutor }`, donde el tutor hereda todo lo que no redefine.

**Tipografía en nativo.** `assets/fonts/native/` trae los estáticos OTF y la variable TTF, listos para `expo-font`. **El peso 600 no existe como estático** — Satoshi entrega Light, Regular, Medium, Bold y Black, sin SemiBold — y el sistema usa `--fw-semibold: 600` en `--text-h2`, `h3`, `h4` y `--text-body-strong`. En web la variable lo interpola sin problema. Para nativo, dos opciones:

1. Cargar `Satoshi-Variable.ttf` y usar 600 real. El soporte de fuentes variables en React Native es irregular en Android según OS y motor de texto: probarlo temprano en dispositivo real, no en emulador.
2. Cargar los estáticos y **mapear 600 → 700 (Bold)**. Es lo recomendado para la primera versión nativa: predecible en las dos plataformas, y el salto visual es chico porque 600 y 700 en Satoshi están cerca.

Si van por la opción 2, en nativo cada peso es una familia distinta (`fontFamily: 'Satoshi-Bold'`, no `fontWeight: 700`): conviene que el espejo exponga los `--fw-*` ya resueltos a nombre de familia para no repetir el mapeo en cada componente.

**Iconos.** El componente `Icon` usa `mask-image`, que no existe en nativo. La ruta razonable es `react-native-svg` con los SVG de Lucide, manteniendo **los mismos nombres** del vocabulario fijo del producto (`paw-print`, `pill`, `syringe`, `shield-alert`…), documentado en `readme.md`. Así el reemplazo por un set propio de Wayka sigue siendo un solo cambio de origen.

---

## 10. Deuda conocida y decisiones abiertas

**Bloqueado, esperando insumo de la marca:**

- **Los hexadecimales de marca están sin confirmar.** Los nueve `--wayka-*` están derivados de los nombres de archivo de los logos, no extraídos de un original. Es lo único que bloquea un build visible a un cliente. Ver la advertencia de la sección 3 sobre los tres tokens de contraste que hay que recalcular a mano.
- **Los SVG de logo llegaron sin colores de relleno.** La geometría original **sí está completa** — los paths son los reales; el `<defs>` traía la clase `.cls-1` vacía, así que los seis archivos son geométricamente idénticos y ninguno declara color. Consecuencia práctica: el app icon **no está bloqueado por el SVG sino por el color**. En cuanto haya paleta confirmada se genera del isotipo que ya está en el repo (iOS 1024×1024 sin transparencia ni esquinas propias; Android adaptativo con foreground y background separados, isotipo dentro del 66% central).
- Queda abierto si alguna variante de logo tiene **más de un color**: con el `<defs>` vacío no hay forma de saberlo.

**Decisiones nuestras, revisables:**

- **Lucide es una sustitución declarada**, no el set de la marca. Si Wayka produce el suyo, se reemplaza la constante `BASE` de `components/core/Icon.jsx` manteniendo los mismos nombres.
- **No hay banco de imágenes.** El criterio de foto, proporción y fallback está en `readme.md` como propuesta; cámbienlo sin culpa cuando haya material real.
- **Modelo de datos, reglas de negocio y alcance de plataformas** se mencionan en el brief de producto pero no fueron adjuntados. Son fuente de verdad ante cualquier ambigüedad de este documento.

**Fuera de alcance del MVP:** vista de paciente derivado en urgencia y pantallas de notificaciones.

---

## 11. Cómo trabajar con un agente de código

El repositorio incluye `SKILL.md` en la raíz: apuntando un agente a esta carpeta, lee las reglas, los `.prompt.md` de cada componente y los kits, y produce pantallas consistentes sin más contexto. Cada `.prompt.md` trae los ejemplos de uso y las reglas de cuándo *no* usar ese componente.
