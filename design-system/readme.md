# Wayka — Design System

**Version 1.1.1** (2026-08-25). Contrato, criterio de versionado e historial en `CHANGELOG.md`; version legible por maquina en `version.json` y en el token `--ds-version`.

Wayka es un **historial de salud colaborativo y calendario interactivo para veterinarias**. Facilita el día a día de la clínica y mejora la comunicación con los tutores de mascotas. MVP con una clínica piloto; modelo B2B (la clínica es quien paga).

## Fuentes recibidas

| Fuente | Estado |
|---|---|
| 6 logos SVG (`Blanco`, `Oscuro`, `Lila`, `Naranja claro`, `Naranja oscuro`, `Violeta oscuro`) | Recibidos **dos veces, ambas con el bloque `<defs>` vacío**: los seis archivos son idénticos y no traen ningún `fill`. Se conservó la geometría; el color se aplica con `currentColor`. |
| Satoshi (OTF/TTF/webfonts completos) | Recibidos. Los woff2 (variable 300–900 + estáticos) viven en `assets/fonts/`; `@font-face` en `tokens/fonts.css`. |
| Brief de producto (audiencias, roles, pantallas MVP, prioridad visual) | Recibido y aplicado. |
| Modelo de Datos / Reglas de Negocio / Alcance de Plataformas | Mencionados en el brief, **no adjuntados**. Fuente de verdad ante ambigüedades. |

No hubo codebase ni archivo de Figma. Los colores, la escala tipográfica y el inventario de componentes son **propuestas de este design system**, no una extracción de un diseño existente.

## Producto y roles

| Rol | Quién es | Plataforma |
|---|---|---|
| Clínica admin | Gestión administrativa de la clínica | Web |
| Veterinario | Profesional que atiende pacientes | Web + Móvil (paridad total) |
| Tutor | Dueño/responsable de la mascota | Móvil (sin acceso web) |

### Las tres reglas que ordenan todo el sistema

1. **Medicación activa y alergias van primero.** En una derivación de urgencia son los datos que un veterinario necesita en segundos. `CriticalPanel` vive por encima del historial, nunca dentro de la lista cronológica, y sus alertas viajan con la fila del listado (`PatientRow`) para no obligar a abrir la ficha.
2. **Lectura vs. edición siempre explícito.** Todo dato no editable muestra un candado con "Solo lectura" (`DataField`). El tutor nunca debería dudar de qué puede tocar.
3. **La autoría del dato es visible.** Punto violeta = cargado por el veterinario (autoridad profesional). Punto naranja = cargado por el tutor. Mismo código de color en tokens (`--clinical-*` / `--owner-*`), en `Card tone` y en `DataField source`.

---

## CONTENT FUNDAMENTALS

**Idioma:** español rioplatense, voseo. "Cargá el evento", "Ingresá a tu cuenta", "Agendá una cita" — nunca "Carga"/"Ingresa" en imperativo peninsular ni "Cargue usted".

**Persona:** tuteo/voseo directo al usuario ("tus mascotas", "tu veterinaria"). Wayka nunca habla en primera persona ni se nombra a sí mismo dentro de la interfaz.

**Casing:** mayúscula solo inicial, siempre. Botones: "Cargar evento", no "Cargar Evento" ni "CARGAR EVENTO". Únicas versalitas del sistema: las etiquetas overline (`ALERGIAS`, `MEDICACIÓN ACTIVA`, `PESO`) — a 11px, bold, tracking 0.08em.

**Registro por audiencia — el mismo dato, dos redacciones:**

| Contexto | Vet (web/móvil) | Tutor (móvil) |
|---|---|---|
| Medicación | "Meloxicam 0,1 mg/kg · cada 24 h · hasta 28 ago" | igual, pero con la nota "La carga tu veterinaria" |
| Estado vacío | "Todavía no hay eventos" | "Cuando la veterinaria cargue una consulta, la vas a ver acá" |
| Permiso | *(implícito)* | "La información clínica la carga tu veterinaria. Podés verla, no modificarla." |

Al vet se le habla en **datos**: abreviaturas clínicas, unidades, dosis, sin explicar. Al tutor se le habla en **consecuencias**: qué pasó, qué tiene que hacer, cuándo.

**Números:** coma decimal (8,4 kg · 38,9 °C), unidad separada por espacio, cifras siempre en `font-variant-numeric: tabular-nums`. Fechas cortas en minúscula: "12 mar 2026", "17 abr · 10:00".

**Errores:** describen el problema y la salida, nunca culpan. "No se pudo guardar. Revisá la conexión e intentá de nuevo." Nunca "Error 500" ni "Operación inválida".

**Emoji:** prácticamente no. Única excepción tolerada: un 👋 en el saludo de bienvenida del tutor. Nunca en la web de la clínica, nunca en un dato clínico, nunca dentro de un botón.

**Lo que el tono NO es:** ni clínico-frío ("Registro de evento clínico procesado satisfactoriamente") ni infantil-mascotero ("¡Uy, tu peludito necesita su vacunita!"). Es salud: profesional, cálido, breve.

---

## VISUAL FOUNDATIONS

**Color.** Los tonos principales de la marca son los CLAROS: **lila** y **naranja claro**. Los oscuros (violeta, violeta oscuro, naranja, naranja oscuro) trabajan como acentos, hovers y texto sobre los claros — nunca como fondos protagonistas.

**Tema por rol.** El sistema tiene dos temas que invierten primario y acento:
- **Veterinario / clínica (default):** interfaz lila-violeta con acentos naranjas. `--color-primary` = lila; texto/iconos sobre blanco usan `--color-primary-strong` (violeta); todo texto, icono y logo sobre un fondo de color de marca va en blanco (`--color-primary-fg`) o blanco con opacidad para lo secundario — nunca en oscuro. Los contadores y avatares dentro de superficies de color usan blanco pleno o blanco translúcido, no el acento naranja.
- **Tutor:** `<body data-theme="tutor">` — interfaz naranja con acentos lilas/violetas. Los mismos tokens se resuelven en naranja claro / naranja oscuro.

Toda la familia `--color-primary*` / `--color-accent*` es temable; los componentes nunca tocan un hex de marca directo. **Excepción fija:** la autoría del dato no se invierte — punto violeta = veterinario, punto naranja = tutor, en ambos temas. Los semánticos (danger/warning/success/info) están desaturados y `info` es azul. Máximo dos fondos neutros por pantalla; el único fondo tintado de alerta es la alergia (rojo suave). El primario pleno (lila o naranja claro) se reserva para barra lateral, headers móviles y paneles de marca del login.

**Jerarquía (en este orden: tamaño → peso → contraste → espacio; el color va último):** Página `--text-h1` 30/700 · Sección `--text-h3` 20/600 · Título de card `--text-h4` 17/600 · Subtítulo `--text-body-lg` 17/400 gris · Body `--text-body` 15/400 · Metadata `--text-body-sm` 13/400 `--text-subtle` · Label `--text-caption` 12/500 · Overline 11/700 versalita (única). El color queda reservado para cuatro significados: acción (violeta), riesgo real (rojo), autoría del dato (punto violeta/naranja) y estado de cita.

Los hexadecimales de marca son **derivados de los nombres de archivo de los logos** (ver Fuentes). Están todos en `tokens/colors.css` y sustituirlos es cambiar 9 líneas.

**Tipografía.** Satoshi (variable 300–900, con estáticos de fallback). Display y H1 en bold con tracking -0.02em; cuerpo regular a 15px en web y 17px en móvil del tutor; captions 12px medium. Un solo tipo: no hay serif ni display secundaria. Mínimos: 12px en web, 13px en móvil.

**Espaciado y layout.** Escala base 4 (2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 104). Aireado por decisión explícita: 24px de padding en card, 32px de gutter de página, 40px entre secciones, ancho de contenido máximo 1160px centrado. Sidebar fija de 248px; el header de la web es sticky; en móvil el CTA principal queda sticky al pie sobre un degradado de protección (`linear-gradient` desde `--surface-page`, no una cápsula).

**Fondos.** Planos. Sin fotos, sin texturas, sin patrones repetidos, sin gradientes decorativos. La única imagen es el isotipo al 7-8% de opacidad, sobredimensionado y sangrado por una esquina en el login y el header del tutor. No hay ilustración de marca provista.

**Bordes y esquinas.** Todo lleva borde de 1px en `--border-default`; las cards nunca flotan solo con sombra. Radios: 4 (checkbox), 8 (chips, celdas), 10 (controles), 12, 16 (cards), 22 (avatares grandes), 999 (pills, buscador). Nunca esquina viva.

**Sombras.** Bajas y frías, con base en rgba(30,20,40,·). `--shadow-sm` en cards, `--shadow-md` en tooltip, `--shadow-lg` en toast y teléfono, `--shadow-overlay` solo en modal. Nada de sombras interiores.

**Carga, error y vacío.** Los tres estados tienen componente y son obligatorios en cualquier bloque que dependa de datos. Carga: **Skeleton** / **SkeletonText** con las medidas del contenido real, nunca un spinner centrado. Error: **InlineError** dentro del bloque que falló, con reintento si la acción se puede repetir — el resto de la pantalla sigue usable; **Toast** queda solo para avisos efímeros. Vacío: **EmptyState** con una acción que resuelva el vacío.

**Capas.** `Dialog` para confirmar o editar algo puntual, centrado y con foco atrapado. `Sheet` para lo demas: desde abajo en movil (barra de arrastre, boton principal a ancho completo), `side="right"` en web para detalle y filtros. `Tooltip` solo para etiquetas cortas, nunca para contenido que haga falta leer. Nada de capas anidadas.

**Tablas.** `DataTable` aporta la cabecera y el contenedor; las filas son componentes del dominio (`PatientRow`) para que cada contexto muestre lo suyo. Los anchos declarados en `columns` tienen que coincidir con los de la fila. Sin franjas alternas ni bordes verticales: la hairline entre filas alcanza.

**Relleno solido.** El primario claro (lila, naranja claro) es un tono de superficie: con blanco encima no llega a AA. Todo lo que se pinta lleno con texto o icono blanco usa `--color-primary-fill` (violeta en clinica y vet, naranja quemado en tutor) y `--color-primary-fill-hover` — boton primario, IconButton `solid`, dia elegido del calendario. `--color-primary` queda para bordes, tintes y superficies suaves.

**Foco.** Un solo anillo para todo el sistema, aplicado desde `styles.css` sobre `:focus-visible` — los componentes no lo repiten. Sobre superficies oscuras el anillo de marca se pierde contra su propio color: cualquier contenedor con `data-surface="dark"` (SidebarNav, MobileHeader oscuro, los hero del kit tutor) redefine `--ring-focus` a `--ring-focus-on-dark`, un blanco al 55%, y sus descendientes lo heredan sin cambios en el componente.

**Estados.** Hover: cambio de fondo, no de opacidad — el botón primario oscurece hacia `--color-primary-hover` (mezcla del claro con su oscuro); las filas y botones fantasma pasan a `--surface-hover`. Press: mismo color que hover, sin escala ni desplazamiento (es software clínico; nada rebota). Foco: borde violeta + anillo `--ring-focus` de 3px al 22%. Seleccionado: `--surface-selected` (lila claro). Deshabilitado: fondo `--surface-disabled` y texto `--text-subtle`, cursor `not-allowed`.

**Animación.** Un solo easing: `cubic-bezier(.2,.7,.3,1)`. 140ms controles, 220ms paneles, 340ms transición de pantalla móvil. Solo fades y desplazamientos cortos; sin spring, sin bounce, sin animación de entrada en listas. `prefers-reduced-motion` lleva todas las duraciones a 0.

**Transparencia y blur.** Casi ausente. Solo el backdrop del modal (rgba(30,20,40,.42) + blur 2px) y las capas de blanco al 12-14% sobre el violeta de la sidebar.

**Imagenería.** No hay banco de imágenes en las fuentes; hoy los adjuntos se representan como placeholders sobre `--surface-sunken`. Criterio para cuando haya fotos reales:

- **Tono.** Cálido y natural, luz de día, sin filtro ni grano, sin viñeteo. Mascota y tutor en contexto real de clínica o casa, nunca fondo de estudio.
- **Proporción y recorte.** Foto de perfil de mascota: cuadrada 1:1, recorte centrado en la cabeza, con `--radius-xl` en la ficha y `--radius-pill` cuando funciona como avatar. Adjunto o estudio: 4:3 horizontal con `--radius-md`, sin recortar — el contenido clínico se ve completo, con `object-fit: contain` sobre `--surface-sunken` si la proporción no coincide. Miniatura en lista: 1:1 de 56px, `--radius-sm`.
- **Fallback.** Si la imagen no carga, o todavía no hay ninguna, el hueco muestra `--surface-sunken` con el icono de especie (`dog`/`cat`) o `paperclip` centrado en `--text-subtle` a 26px — nunca un roto del navegador, nunca la inicial del nombre sobre color de marca.
- **Nunca.** Foto de fondo detrás de texto, imagen a sangre completa, collage, ni fotografía dentro de un bloque clínico (medicación, alergias, dosis): ese contenido es dato, no ilustración.

---

## ICONOGRAPHY

**No se recibió ningún set de iconos.** Sustitución declarada: **Lucide** (`lucide-static@0.446.0`), la coincidencia más cercana al tono del sistema — contorno, trazo 2px, esquinas redondeadas, mismo peso óptico que Satoshi.

- Se consumen vía CDN con `CSS mask-image`, de modo que el glifo hereda `currentColor` y respeta cualquier token de color. Todo pasa por el componente `Icon`; nunca se escribe un `<svg>` a mano.
- Tamaños: 13px dentro de badges, 16px en campos y botones sm, 18px en botones md y sidebar, 20-22px en barras móviles, 26px en estados vacíos.
- Vocabulario fijo del producto: `paw-print` pacientes · `dog`/`cat` especie · `calendar-days` agenda · `pill` medicación · `syringe` vacuna · `stethoscope` consulta · `scissors` cirugía · `microscope` estudio · `scale` peso · `notebook-pen` nota · `shield-alert`/`triangle-alert` alergia · `lock` solo lectura · `pencil` editable · `paperclip` adjunto · `building-2` clínica.
- **No se usan emoji como iconos** ni caracteres unicode decorativos. Si Wayka produce su propio set, reemplazar la constante `BASE` de `components/core/Icon.jsx` y mantener los mismos nombres.

**Logo.** `assets/wayka-logo.svg` (completo), `wayka-isotipo.svg` (marca sola), `wayka-wordmark.svg` (solo texto). Monocromos: se pintan con `color`/`currentColor`, o con `filter: brightness(0) invert(1)` dentro de un `<img>`. **Sobre los primarios (lila / naranja claro) todo va SIEMPRE en blanco** — logo, texto e iconos; blanco con opacidad para lo secundario y marcas de agua — nunca en negro u oscuro. El logo oscuro queda solo para fondos neutros claros. Área de resguardo: media altura del isotipo en los cuatro lados.

---

## Índice del proyecto

**Raíz**
- `styles.css` — punto de entrada único (solo `@import`)
- `readme.md` — este archivo · `SKILL.md` — versión Agent Skill · `thumbnail.html` — tile del sistema

**`tokens/`** — `fonts.css` · `colors.css` · `typography.css` · `spacing.css` · `radius.css` · `elevation.css` · `motion.css` · `base.css`

**`assets/`** — `wayka-logo.svg` · `wayka-isotipo.svg` · `wayka-wordmark.svg`

**`guidelines/`** — 17 specimen cards (Colors, Type, Spacing, Brand)

### Components

`components/core/` — **Icon**, **Button**, **IconButton**, **Input**, **Textarea**, **Select**, **Checkbox**, **Radio**, **Switch**, **Card**, **Badge**, **Tag**, **Avatar**, **Tabs**, **Dialog**, **Toast**, **Tooltip**, **SearchField**, **Sheet**, **DatePicker**, **Calendar**, **DataTable**, **EmptyState**, **Skeleton**, **SkeletonText**, **InlineError**

`components/clinical/` — **CriticalPanel**, **AllergyChip**, **MedicationItem**, **TimelineEvent**, **AppointmentCard**, **PatientRow**, **DataField**, **PetHeader**, **StatusDot**

`components/navigation/` — **SidebarNav**, **PageHeader**, **MobileTabBar**, **MobileHeader**

Cada componente trae `.jsx`, `.d.ts` y `.prompt.md`. Como no había una biblioteca de origen, el inventario se autoró desde cero: el set estándar (`core/`) más una familia clínica que el brief exige explícitamente.

**Variantes deprecadas (auditoría ago 2026, siguen funcionando como alias):** `Button variant="accent"` → `primary` (una sola acción por pantalla) · `Badge tone="brand"/"accent"` → `primary` · `Card tone="clinical"/"owner"` → `default` (la autoría la marca `DataField`, no el fondo del contenedor). Nuevo: `Button loading`.

**Adiciones intencionales:** `Icon` (envoltorio del set sustituto de Lucide) y toda la carpeta `clinical/`, derivada de las tres reglas de arriba — sin ella, cada pantalla reimplementaría el panel de alergias a mano.

### UI kits

- `ui_kits/clinica-web/` — Login, listado de pacientes, ficha completa, formulario de evento clínico, gestión de medicación, agenda semanal/diaria, panel de clínica. Click-through.
- `ui_kits/vet-movil/` — paridad funcional con la web en 372px: agenda, pacientes, ficha con datos críticos primero, carga rápida de evento, perfil.
- `ui_kits/tutor-movil/` — login/alta, mis mascotas, ficha solo lectura, citas con confirmar/reagendar, subida de adjuntos, datos propios editables.

### Auditoría de simplificación (ago 2026)

Principio: **menos ruido visual, jerarquía más fuerte, acciones más claras.**

1. **Un solo color de acción por tema.** Lila-violeta en la interfaz del vet, naranja en la del tutor; nunca los dos como botones en la misma pantalla.
2. **El naranja dejó de ser estado.** "Pendiente" pasó de naranja a violeta suave; el panel de medicación pasó de naranja a superficie neutra con icono violeta. El naranja quedó como acento: logo, calidez del tutor, "editable por el tutor".
3. **Fondos tintados solo para riesgo real.** Única card con fondo de color: la alerta de alergia. Cards clínicas/del tutor volvieron a blanco. Badges y tags son sobrios: fondo neutro con borde sutil; el tono solo colorea el icono o un punto de 6px (danger además tiñe el texto).
4. **`info` ya no duplica al primario** (violeta → azul desaturado). Los cuatro semánticos se desaturaron.
5. **Jerarquía por tipografía y espacio**, documentada arriba y en la card "Jerarquía" (grupo Type).

### Pendiente / fuera de alcance
- Vista de paciente derivado en urgencia (fase posterior, sin definición funcional).
- Pantallas de notificaciones (pendientes de definición de negocio).
