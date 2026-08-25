# Changelog — Wayka Design System

Versionado semantico aplicado al **contrato**, no al codigo:

- **MAJOR** — cambia o desaparece un token, o un componente cambia su API de forma no compatible. Requiere revisar el consumidor.
- **MINOR** — se agregan tokens o componentes; lo existente sigue valiendo. El espejo en JS se regenera, nada se rompe.
- **PATCH** — cambian valores dentro de un token existente (un hex, un px), documentacion, o correcciones que no tocan nombres.

Regla para el pipeline: **regenerar el espejo de tokens cuando cambie `version` en `version.json`.** Ese archivo es la fuente de verdad legible por maquina; `--ds-version` en `tokens/meta.css` repite el valor para consumidores solo-CSS. La fecha de modificacion de archivo no se usa como senal.

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
