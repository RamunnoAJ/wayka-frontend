# Wayka — Integración del Design System

MVP — Capa de tokens compartida entre web y nativo
Versión 1.3 · Complementa a 08-arquitectura-frontend.md y al Brief de Integración Frontend entregado por Claude Design (v1.5.0, 2026-08-28)

## 1. Alcance

El design system entregado (`styles.css`, `tokens/*.css`, `assets/`, 39 componentes en `components/`, kits de pantalla) está escrito en React DOM puro: custom properties de CSS, tema activado con un atributo en `<body>`, iconos por `mask-image`, fuentes por `@font-face`. Corre sin cambios en el build web, pero nada de eso existe en iOS/Android nativo.

Este documento define cómo conviven, desde ahora, una fuente de valores en JS/TS (necesaria para nativo) con los archivos CSS entregados (que siguen siendo la fuente de verdad del design system) — sin tocar los 39 componentes todavía. La versión 1.1 incorpora las respuestas concretas de Claude Design a los seis pendientes que le habíamos pasado (`Wayka_Prompt_Design_System_Pendientes.md`).

## 2. Dónde vive cada cosa

```
/design-system                → lo que entrega Claude Design, copiado tal cual, sin editar
  version.json                   señal de versión para el pipeline — ver sección 3.1
  CHANGELOG.md
  styles.css
  tokens/{colors,typography,spacing,radius,elevation,motion,base,meta}.css
  assets/
    fonts/                       .woff2 + estáticos, para web
    fonts/native/                .otf/.ttf, para expo-font — ver sección 5
    *.svg
  components/{core,clinical,navigation}/
  ui_kits/{clinica-web,vet-movil,tutor-movil}/
  readme.md                      incluye el criterio de imágenes (sección 6)
  SKILL.md

/src/theme                    → propio de este repo, generado a partir de /design-system
  tokens.generated.ts            objeto JS/TS con los valores de cada custom property, por tema
  sombras.ts                     tabla de sombra/elevación por plataforma — no se parsea del CSS, ver 3.3
  tipografia-nativa.ts           mapeo de --fw-* a fontFamily para nativo — ver sección 5
  ThemeProvider.tsx              Context + hook useTheme()
  generar-tokens.ts              script que parsea tokens/*.css y regenera tokens.generated.ts
```

`/design-system` no se edita a mano. `/src/theme/tokens.generated.ts`, `sombras.ts` y `tipografia-nativa.ts` tampoco — los tres son generados o derivados de una tabla fija que documenta este archivo, nunca escritos a mano componente por componente.

## 3. Qué hace el script de generación

### 3.1 Disparador: `version.json`, no fecha de archivo

El script compara el campo `version` de `/design-system/version.json` contra la última versión regenerada (guardada en el propio `tokens.generated.ts` como comentario de cabecera). Si difiere, regenera. El semver que aplica Claude Design es sobre el contrato, no sobre el código:

- **MAJOR** — token o componente eliminado/cambiado de forma incompatible. Regenerar y revisar manualmente qué consume ese token.
- **MINOR** — tokens o componentes nuevos. Regenerar sin riesgo.
- **PATCH** — cambia un valor dentro de un token existente (ej. un hex). Regenerar sin riesgo — es el caso esperado cuando lleguen los hexadecimales de marca confirmados (sección 7).

### 3.2 Parseo de `tokens/*.css`

Una declaración por línea (`--nombre:valor;`), con un posible comentario `/* @kind ... */` al final que el script descarta cortando en el primer `;`. Los tokens que **no** se resuelven por parseo directo están listados en `parseExceptions` dentro de `version.json`, y se tratan así:

| Excepción | Tratamiento |
|---|---|
| `color-mix()` en `--color-primary-hover` / `--color-accent-hover` (`:root` y tema tutor) | **Se congelan como hex literales**, pedido a Claude Design en la próxima entrega — decisión tomada acá: no sumamos una librería de color (culori/colorjs.io) solo para resolver 4 tokens, coherente con el criterio de minimalismo ya fijado en Stack Técnico. |
| `--text-*` compuestos (shorthand `font`) en `typography.css` | **No se parsean.** El espejo usa los escalares (`--fw-*`, `--fs-*`, `--lh-*`) directamente — son la fuente de verdad real, los compuestos son comodidad de CSS. |
| `--shadow-*` / `--ring-*` en `elevation.css` | **No se parsean del CSS.** Van hardcodeados en `/src/theme/sombras.ts` con la tabla de la sección 3.3, que Claude Design ya entregó traducida a iOS/Android. |
| `--transition-control` en `motion.css` | **Se ignora en nativo.** Se usa `--dur-fast` + `--ease-standard` animando la propiedad a mano (Reanimated/Animated). |
| `--dur-fast` / `--dur-normal` / `--dur-slow` duplicados bajo `@media (prefers-reduced-motion: reduce)` | El script lee un **segundo juego de valores** (`tokensReducedMotion`), no sobreescribe el primero. En nativo se selecciona con `AccessibilityInfo.isReduceMotionEnabled()`. |
| `--ring-focus` del tema tutor | Vive hoy en el bloque `[data-theme="tutor"]` de `colors.css`, pero conceptualmente es de `elevation.css` — le pedimos a Claude Design que lo mueva para que cada archivo quede autocontenido (confirmado en la respuesta a pendientes, punto 3 de "lo que necesito de vuelta"). Hasta que llegue esa entrega, el script lo busca en `colors.css` como excepción documentada. |

### 3.3 Sombras y foco en nativo (tabla fija, no generada)

Claude Design tradujo `--shadow-*` a valores de plataforma. Esto vive como constante en `/src/theme/sombras.ts`, no se regenera con el script:

| Token | iOS (`shadow*`) | Android (`elevation`) |
|---|---|---|
| `--shadow-xs` | offset 0/1, radius 2, opacity .06 | 1 |
| `--shadow-sm` | offset 0/1, radius 3, opacity .07 | 2 |
| `--shadow-md` | offset 0/4, radius 14, opacity .08 | 4 |
| `--shadow-lg` | offset 0/12, radius 32, opacity .12 | 8 |
| `--shadow-overlay` | offset 0/24, radius 60, opacity .22 | 16 |

`shadowColor` es siempre `#1E1428` (el color base de todas las sombras del sistema). El foco (`--ring-*`) no se resuelve con sombra en nativo: es un borde de 2px en `--border-focus` (`--ring-focus-on-dark` → borde blanco sobre `data-surface="dark"`).

### 3.4 Dos temas, con herencia

El espejo sale como `{ default: {...}, tutor: {...} }`. El tema tutor **hereda** todo lo que no redefine — no es un objeto completo aparte, es un merge sobre `default`.

## 4. `ThemeProvider` y `useTheme()`

Sin cambios respecto de la v1.0: vive en `/src/theme/ThemeProvider.tsx`, envuelve la app en `app/_layout.tsx`, resuelve `temaDefault` o `temaTutor` según el rol de la sesión, y en web sincroniza `document.body.dataset.theme` para que los componentes heredados sigan funcionando sin tocarlos.

## 5. Fuentes en nativo — resuelto, con una decisión propia

Los `.otf`/`.ttf` de Satoshi ya están en `assets/fonts/native/` (entregados por Claude Design). Quedó un hallazgo: **no existe un estático 600 (SemiBold)** — Satoshi entrega Light/Regular/Medium/Bold/Black. Varios tokens (`--text-h2`, `h3`, `h4`, `--text-body-strong`) usan `--fw-semibold: 600`.

**Decisión tomada:** mapear 600 → 700 (Bold) con los estáticos, en vez de cargar `Satoshi-Variable.ttf` y depender de interpolación de peso real — el soporte de fuentes variables en Android es irregular según versión de OS/motor de texto, y la diferencia visual entre 600 y 700 en Satoshi es chica. Es la opción que también recomendó Claude Design.

Consecuencia técnica: en nativo, cada peso es una **familia de fuente distinta** (`fontFamily: 'Satoshi-Bold'`), no un `fontWeight` numérico sobre una sola familia. Por eso existe `/src/theme/tipografia-nativa.ts`: mapea cada `--fw-*` a un nombre de familia ya resuelto, para no repetir `600 → 700` en cada componente que se adapte a React Native. `--fw-semibold` en el CSS web queda sin tocar — el valor 600 ahí es correcto, el mapeo es exclusivamente de la capa nativa.

## 6. Criterio de imágenes

Documentado por Claude Design en `/design-system/readme.md`, bloque **Imagenería** — tono, proporción por tipo de imagen (perfil de mascota 1:1, adjunto/estudio 4:3 sin recortar, miniatura 1:1 56px) y fallback (`--surface-sunken` + ícono de especie, nunca el ícono roto del navegador ni una inicial sobre color de marca). En React Native el fallback se implementa con `defaultSource` / el estado de error del componente `Image`. No se repite acá para no duplicar — está en el `readme.md` del design system, no en este documento.

## 7. Marca: confirmado el naranja del tutor, sigue abierto el resto

**Resuelto en la 1.5.0 del design system (2026-08-28).** `--wayka-naranja-claro` pasó de `#E9A76F` (derivado del nombre de archivo del logo) a **`#F6A56C`, confirmado por marca**, y con él se rehízo el tema tutor. Los dos tokens que esta sección anotaba como "no mecánicos" se resolvieron por decisión de marca y no por ratio de contraste:

- `--color-primary-fill` y `--surface-nav` del tutor **dejaron de oscurecerse**: donde antes iba `#A34F1D`, ahora va el naranja de marca con **blanco encima**. Eso da **2.0:1**, por debajo del mínimo AA (4.5:1 en cuerpo de texto, 3:1 en títulos grandes). Está asumido y registrado en el changelog del design system: donde haya texto chico sobre naranja hay que subir cuerpo y peso, o pasarlo a fondo oscuro.
- `--color-primary-strong` del tutor **sigue siendo** el naranja oscuro `#B85F2E`. Es el color de texto, íconos y enlaces **sobre blanco**, donde el naranja de marca es ilegible. No se usa como fondo en ningún lado.

De ahí salieron tres tokens que el espejo ya refleja y que conviene no confundir entre sí:

| Token | Para qué |
|---|---|
| `--color-primary-fill-fg` | Contenido sobre el relleno sólido. Reemplaza los `#fff` que estaban escritos a mano en `Button` primario e `IconButton` sólido. |
| `--nav-accent-fg` | Texto del badge de la barra lateral, que antes leía `--surface-nav-deep` — inservible cuando el acento cambia de claridad. |
| Familia `--surface-immersive-*` | Lo que es oscuro **por su función y no por el tema**: la cámara. Colgada de los tokens de nav, el visor se habría vuelto naranja claro en el tutor. |

**Sigue bloqueado:** el resto de los hexadecimales de marca (`--wayka-*`) y los colores por variante de logo — el `<defs>` vacío no permite saber si alguna variante usa más de un color. Bloquean todavía el ícono de app (la geometría de los SVG ya es la real; falta el color).

## 8. Qué queda explícitamente afuera de esta etapa

- **Adaptación de los 39 componentes a primitivas de React Native.** Sigue sin planificarse — nada de lo resuelto en esta versión lo adelanta, solo prepara el terreno (tokens ya traducibles a nativo).
- **Íconos**: `Icon.jsx` sigue usando `mask-image` (CSS). La sustitución nativa (`lucide-react-native` o SVGs propios) sigue sin resolverse.
- **Soporte real de fuentes variables en nativo** — descartado para la primera versión por la decisión de la sección 5, pero queda como opción a reconsiderar si el mapeo 600→700 se ve mal en pantalla real.

## 9. Fuera de alcance de este documento

- La adaptación de componentes en sí (sección 8) — documento propio cuando se planifique esa etapa.
- El sistema de diseño visual (paleta, tipografía, densidad) — lo define Claude Design, este documento no lo reinterpreta.
- `10-estandares-desarrollo-frontend.md` (testing, convenciones) sigue pendiente.

## 10. Resumen de encaje con decisiones previas

| Decisión previa | Documento de origen | Cómo la resuelve este documento |
|---|---|---|
| Un solo codebase Expo para web y nativo | 08-arquitectura-frontend.md, sección 3 | La capa de tokens JS/TS es la fuente compartida entre ambos targets |
| Minimalismo — sin dependencias que no se justifiquen | Stack Técnico, sección 1 | Se descarta sumar una librería de color (culori/colorjs.io) para 4 tokens `color-mix()` — se congelan como hex |
| No inventar tokens visuales sueltos por pantalla | CLAUDE.md | Reforzado: los hexadecimales de marca sin confirmar quedan marcados como bloqueados, no se completan con un valor propio |
