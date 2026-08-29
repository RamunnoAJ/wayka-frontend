# Changelog — Wayka Design System

Versionado semantico aplicado al **contrato**, no al codigo:

- **MAJOR** — cambia o desaparece un token, o un componente cambia su API de forma no compatible. Requiere revisar el consumidor.
- **MINOR** — se agregan tokens o componentes; lo existente sigue valiendo. El espejo en JS se regenera, nada se rompe.
- **PATCH** — cambian valores dentro de un token existente (un hex, un px), documentacion, o correcciones que no tocan nombres.

Regla para el pipeline: **regenerar el espejo de tokens cuando cambie `version` en `version.json`.** Ese archivo es la fuente de verdad legible por maquina; `--ds-version` en `tokens/meta.css` repite el valor para consumidores solo-CSS. La fecha de modificacion de archivo no se usa como senal.

---

## 1.6.0 — 2026-08-29

### Agregado

**Capa de movimiento para nativo (Reanimated).** El sistema tenia duraciones y curvas pensadas para CSS; faltaba el vocabulario que usa la app. Se agregan tres resortes, la escala de desplazamiento y la escala de press, mas dos guias nuevas. Nada de lo existente cambia de valor.

- **Tres resortes criticamente amortiguados** (`--spring-snap-*`, `--spring-default-*`, `--spring-gentle-*`, con `damping`, `stiffness` y `mass` cada uno). Damping ratio ~1.0 en los tres: llegan y se detienen, no rebotan. `snap` (~140 ms) para press, `default` (~260 ms) para tabs y toast, `gentle` (~380 ms) para pantallas y sheets. Mas `--spring-rest-displacement` y `--spring-rest-speed`, obligatorios en los tres.
- **`--motion-offset` (6px)** — desplazamiento unico de entrada para todo el sistema. **`--motion-press-scale` (.97)** y **`--motion-press-scale-lg` (.99)** — feedback de press en controles y en cards grandes.
- **Regla de reparto:** resorte para `transform`, timing para `opacity` y color. Las duraciones existentes no cambian de rol, se acota a que aplican.
- Los tres tokens nuevos de escala se redeclaran en `@media (prefers-reduced-motion)` junto a las duraciones. Los `--spring-*` no: en nativo el hook decide con `useReducedMotion()` y salta al valor final.
- **Guias nuevas:** `guidelines/motion-reanimated.card.html` (el sistema) y `guidelines/motion-recetas.card.html` (codigo por patron: pantalla, press, toast, tabs, camara, pull to refresh, sheet con arrastre, movimiento reducido). `guidelines/motion.card.html` pasa al grupo Movimiento y se renombra a "Duraciones".

---

## 1.5.0 — 2026-08-28

### Cambiado

**`#F6A56C` es el naranja del tutor, confirmado por marca.** `--wayka-naranja-claro` pasa de `#E9A76F` (derivado, tentativo) a `#F6A56C`, y **deja de oscurecerse**: donde antes el tema tutor pintaba `#A34F1D` / `#864016`, ahora pinta el naranja de marca, con **blanco encima** por decision de marca. Queda registrado que blanco sobre `#F6A56C` da **2.0:1**, por debajo del minimo AA (4.5:1 en cuerpo de texto, 3:1 en titulos grandes): donde haya texto chico sobre naranja conviene subir cuerpo y peso, o pasarlo a fondo oscuro.

- **Nuevo `--color-primary-fill-fg`** — el contenido sobre el relleno solido. Blanco en los dos temas hoy, pero ya deja de estar escrito a mano: si en algun momento se decide invertirlo en tutor, es un solo token. `Button primary`, `IconButton solid`, `Tabs segmented`, el dia elegido de `DatePicker` y el "hoy" de `CalendarWeek` tenian `#fff` escrito a mano; ahora usan el token. **Sin cambios visibles en clinica.**
- **Tema tutor:** `--color-primary-fill` y `--surface-nav` = `#F6A56C`; `--color-primary-fill-hover` y `--surface-nav-deep` = `#EE9757`. La nav del tutor es ahora una superficie **clara** con contenido blanco: `--surface-nav-item` y `--border-on-nav` subieron de opacidad para verse sobre el naranja, y `--nav-accent` pasa a violeta.
- **Nuevo `--nav-accent-fg`** (oscuro en clinica, blanco en tutor): el badge de `SidebarNav` leia `--surface-nav-deep` como color de texto, que ya no sirve cuando el acento cambia de claridad.
- **Nueva familia `--surface-immersive`** (`--surface-immersive`, `-item`, `-item-hover`, `--text-on-immersive`, `--text-on-immersive-muted`, `--border-on-immersive`, `--immersive-accent`): superficie **oscura en los dos temas**, para lo que tiene que ser oscuro por su funcion y no por el tema. `CameraCapture` y `Toast` se movieron ahi: colgados de los tokens de nav, el visor de la camara se habria vuelto naranja claro. Marcan `data-surface="immersive"`.
- **Nuevo `--ring-focus-on-brand`** y **nuevo scope `data-surface="brand"`**: la nav clara del tutor se declara como superficie de marca, no como oscura, y ahi el anillo de foco es oscuro. Las pantallas del tutor pasaron de `data-surface="dark"` a `data-surface="brand"`. Quedan tres scopes: `dark` (nav oscura), `brand` (nav clara de marca) e `immersive` (camara, Toast).
- **Nuevo `--logo-on-nav-filter`** (EXCEPCION: cadena `filter`, no un color). El logo monocromo se recolorea segun la nav: blanco en clinica, oscuro en tutor. Reemplaza los `brightness(0) invert(1)` escritos a mano en `SidebarNav` y en las pantallas del tutor.

**Lo que NO cambio:** `--color-primary-strong` del tutor sigue siendo el naranja oscuro (`#B85F2E`). Es el color de **texto, iconos y enlaces sobre blanco** — el naranja de marca ahi da 2.0:1 y es ilegible. Nunca se usa como fondo.

---

## 1.4.0 — 2026-08-28

### Agregado

**Cámara** (`components/core/`)
- **`CameraCapture`** — cámara en pantalla, dentro de la app. No reemplaza al picker del sistema para "elegir del carrete": existe porque la foto clínica necesita **guía de encuadre** y un **paso de revisión** antes de subir, y de ahí el archivo entra a `UploadItem`. Visor a sangre sobre `--surface-nav-deep` con `data-surface="dark"` (misma superficie que la navegación y el `Toast`, así que el foco visible pasa a blanco); controles flotantes en los blancos translúcidos de la nav con blur, sin tarjetas ni paneles opacos encima de la imagen. Los degradados superior e inferior salen del propio token de superficie: no se introdujo ningún negro nuevo.
- Cuatro estados: `listo` (visor vivo, selector de modo, obturador), `revisando` (toma congelada, `Repetir` y `Usar foto` con el mismo peso, sin selector de modo), `procesando` (los mismos dos botones, inertes, spinner en confirmar — el botón no se saca de debajo del dedo) y `sin-permiso`.
- Modos `foto` y `documento`. `documento` dibuja **solo cuatro esquinas** en `--nav-accent`: un rectángulo cerrado se lee como recorte ya aplicado. `foto` no dibuja guía. Cada modo trae su ayuda de encuadre en una línea, reemplazable con `hint`.
- `status="sin-permiso"` sigue el criterio de `PermissionCard`: superficie neutra y **no roja**, consecuencia concreta ("podés adjuntar del carrete, no tomar una foto nueva") y ajustes del teléfono como texto, no como botón de relleno. No vuelve a pedir el permiso.
- `previewSrc` es el único punto de contacto con la plataforma: fotograma de `expo-camera` en nativo, `<video>` montado por el consumidor en web.

**Card nueva:** "Core · Cámara".

### Sin tokens nuevos
El componente se pinta entero con tokens existentes (`--surface-nav-deep`, `--surface-nav-item`, `--border-on-nav`, `--nav-accent`, `--wayka-blanco`, `--wayka-oscuro`). Sin excepciones declaradas.

---

## 1.3.0 — 2026-08-27

### Agregado

**Adjuntos** (`components/core/`)
- **`FileDropzone`** — punto de entrada del adjunto. Reposo / arrastre encima / rechazado, y `dragDrop={false}` lo degrada a un boton `size="touch"` para nativo, donde no hay drag & drop. El tipo se **declara** (`type="foto|pdf|estudio"`), no se infiere: el backend valida el MIME real contra lo declarado, asi que hay una zona por tipo y ninguna zona generica. El limite (`maxSizeMB`) se muestra **en reposo, antes de elegir el archivo** — el 413 no puede ser el primer aviso.
- **`UploadItem`** — un archivo en curso o terminado: icono por tipo con el criterio del catalogo clinico (foto `image`, pdf `file-text`, estudio `microscope`), nombre, peso y estado subiendo / listo / fallo-reintentar. **La barra de progreso va adentro del item**, nunca suelta. No existe "reemplazar": `onRemove` es la unica mutacion y, mientras sube, cancela. `owner="other"` es el adjunto del otro rol: mismo fondo y mismo contraste, sin accion de retirar y con la autoria a la vista — no se atenua, porque atenuarlo lo haria leer como deshabilitado por error.
- **`ProgressBar`** — determinada e indeterminada, `sm`/`md`, tonos primary/success/danger.
- Token de animacion: `@keyframes wayka-indeterminate` en `tokens/base.css` (junto a `wayka-spin`).

**Cuenta y permisos** (`components/core/`)
- **`PermissionCard`** — permiso de push con tres estados de peso visual deliberadamente distinto: sin preguntar (tarjeta completa, unica accion principal de la pantalla), concedido (una linea, sin accion), denegado (bloque discreto y **neutro, no rojo**, que nombra la consecuencia concreta — "no vas a recibir el recordatorio del dia anterior a cada turno" — y lleva a los ajustes del telefono con un boton `ghost`). En denegado el componente no insiste ni vuelve a ofrecer el prompt: el SO no vuelve a preguntar.
- **`SocialButton`** — variante Google para login y registro del tutor. Logo en sus cuatro colores, sin tenir; cromia de la guia de Google, fija en los dos temas.

**Cards nuevas:** "Core · Adjuntos", "Core · Cuenta y permisos", "Móvil tutor · Adjuntos y avisos".

### Cambiado
- **`Toast` rediseñado** — deja de ser una tarjeta blanca con ícono y borde de acento a la izquierda (patrón gastado, y además se confundía con las cards de contenido) y pasa a ser una **barra oscura** sobre `--surface-inverse` con `data-surface="dark"`, la misma superficie que la navegación. Sin ícono y sin franja de color: el tono es un punto de 7 px, coherente con la regla "punto + tipografía". Sin sombra, porque el fondo oscuro ya lo separa. Prop nueva `action` ({ label, onClick }) para una única acción en texto subrayado. La API anterior sigue valiendo (`tone`, `title`, `description`, `onClose`).
- **`AppointmentCard`**: se fue el `border-left` de 3 px de estado. El estado ya lo decían el punto y la etiqueta en overline — el borde era redundante y arrastraba el mismo patrón. Hairline uniforme en los cuatro lados. Sin cambio de API.
- **Login del tutor** (`ui_kits/tutor-movil`): `SocialButton` **arriba** del formulario de email, separado por "o con tu correo". Decidido asi porque es el camino mas corto y ponerlo abajo obliga a leer el formulario antes de descubrirlo; ademas el boton de Google es neutro, con lo que el unico boton de relleno primario de la pantalla sigue siendo "Entrar".
- **Formulario de evento clinico** (`ui_kits/clinica-web`): bloque de adjuntos al final del formulario, con selector de tipo declarado arriba de la zona de arrastre y la lista de items debajo, incluido un adjunto de la tutora que la vet ve pero no puede retirar.

### Excepcion de tokens declarada
`components/core/SocialButton.jsx` escribe hexadecimales literales (`#FFFFFF`, `#DADCE0`, `#3C4043` y los cuatro del logo). Son de **Google**, no de Wayka: no son tokens, no son themeables y **no deben mapearse al espejo de tokens**. Anotado en `version.json` como `tokenExceptions`.

### Sin diseñar, a proposito
Cambio de contraseña: recomendacion de ubicacion en **`RECOMENDACION-CONTRASENA.md`** (seccion dentro de la pantalla de cuenta, no pantalla propia; el rol vet necesita decision de alcance). Sin componentes hasta que el alcance lo ubique.

---

## 1.2.0 — 2026-08-27

### Agregado
- **`CalendarWeek` y `CalendarEvent`** (clinical): vista de semana en columnas por dia, sin franjas horarias. El tinte del bloque ES el estado — pendiente en lila, cumplido en neutro, vencido en rojo — con el rango horario adentro en tabular-nums; hoy se marca solo en el numero del dia (pastilla llena). Es la excepcion declarada a la regla "punto + tipografia": en el calendario el bloque entero es el marcador.
- **`Tabs variant="segmented"`**: mismo pill, pero el activo se rellena con `--color-primary-fill` y texto blanco. Es el conmutador Dia / Semana / Mes de la agenda.
- Card nueva: "Clínica · Calendario".

### Cambiado
- La agenda semanal del kit clinica-web dejo la grilla por franjas horarias y usa `CalendarWeek`, con el rango de fechas como titulo, chevrons al lado y el conmutador segmentado a la derecha. La leyenda de puntos se fue: el estado se lee en los propios bloques.

---

## 1.1.1 — 2026-08-25

Entrega de formato: mismos nombres y mismos valores resueltos, cero cambios visuales.

### Cambiado
- `--color-primary-hover` **congelado como hex literal** en los dos temas: `#897AAC` en clinica/vet (era `color-mix(in oklab, lila 62%, violeta)`) y `#D78B57` en tutor (era la mezcla equivalente con los naranjas). Los valores son el resultado exacto de la mezcla anterior, calculado en oklab — el render no cambia. Ya no queda ningun `color-mix()` en los tokens.
- `--ring-focus` del tema tutor se movio de `colors.css` a `elevation.css`, junto al resto de los `--ring-*`. Cada archivo de tokens queda autocontenido: ningun override cruza de archivo.

---

## 1.1.0 — 2026-08-24

### Agregado
- Tokens de navegacion oscura: `--surface-nav`, `--surface-nav-deep`, `--surface-nav-item`, `--surface-nav-item-hover`, `--text-on-nav`, `--text-on-nav-muted`, `--border-on-nav`, `--nav-accent`.
- `--color-primary-fill` y `--color-primary-fill-hover`: relleno solido que si alcanza AA con blanco encima.
- `--ring-focus-on-dark` y el mecanismo `[data-surface="dark"]`, que redefine el anillo de foco por herencia.
- Componentes: `Skeleton`, `SkeletonText`, `InlineError`, `Sheet`, `DatePicker`, `Calendar`, `DataTable`.
- `IconButton variant="on-dark"`.
- Cards nuevas: "Core · Estados" y "Core · Capas y datos".
- `tokens/meta.css`, `version.json`, este changelog.
- `assets/fonts/native/`: estaticos OTF y la variable TTF para `expo-font`.
- Criterio de imagenes y fotos en `readme.md`.

### Cambiado
- **Navegacion y cabeceras dejaron de usar el primario claro como fondo.** El lila claro con blanco encima no llegaba a contraste; ahora usan `--surface-nav`.
- Relleno solido del boton primario, `IconButton solid` y el dia elegido del calendario: pasaron de `--color-primary` a `--color-primary-fill`.
- `--text-link-hover` apuntaba a blanco (enlaces invisibles al hover); ahora usa `--color-primary-fill-hover`.
- Tema tutor: `--surface-nav` a `#A34F1D` (el naranja oscuro anterior quedaba en 4.0:1 con blanco).
- Menos densidad visual: `Card` sin sombra ni linea bajo el titulo; `AppointmentCard` y `AllergyChip` sin pastilla tintada (punto de 6px + tipografia); `PatientRow` muestra una alergia con "+n"; tabla de pacientes sin cabecera con fondo.
- El foco visible se aplica una sola vez en `styles.css` sobre `:focus-visible`; los componentes ya no lo repiten.
- `tokens/*.css` reformateados a **una declaracion por linea** para que el parseo automatico sea estable.

### Sin resolver
- Hexadecimales de marca sin confirmar (`--wayka-*`).
- Los SVG de logo llegaron sin colores de relleno.

---

## 1.0.0 — 2026-08-19

Primera entrega: tokens completos, 32 componentes, 17 specimen cards, tres UI kits (clinica web, vet movil, tutor movil), tema por rol con `[data-theme="tutor"]`.
