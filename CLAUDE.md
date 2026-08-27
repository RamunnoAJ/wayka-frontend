# Wayka — Frontend

Cliente único para Web (clínica) y aplicación móvil (veterinario + tutor) del sistema de historial clínico veterinario colaborativo. Un solo proyecto Expo desde el día uno — no dos proyectos que se unifican después. Este frontend **nunca es la barrera de seguridad**: valida en UI por UX, pero toda regla de permisos y de negocio la aplica el backend.

## Stack técnico

- **Framework**: React Native + React Native Web, sobre Expo
- **Router**: Expo Router (file-based) — mismo árbol de rutas para la exportación web y los builds nativos
- **Estado de servidor / data fetching**: TanStack Query
- **Cliente de API**: escrito a mano en `/src/api`, sin generación desde `openapi.yaml` (decisión explícita, ver `docs/08-arquitectura-frontend.md`, sección 7 — trade-off aceptado: los tipos se mantienen sincronizados a mano contra el contrato real del backend)
- **Compilación**: EAS Build (permite compilar iOS sin depender de una máquina macOS local)
- **Despliegue**: exportación estática (`expo export --platform web`) para la web de clínica; builds nativos vía EAS para iOS/Android

## Arquitectura: un solo codebase, dos targets de despliegue

No hay bundles separados que excluyen código entre sí. El mismo árbol de rutas compila a:

- **Web**: la usan Clínica_admin y Veterinario.
- **Nativo (iOS/Android)**: los usan Veterinario (paridad total con la web) y Tutor.

Qué pantalla es "alcanzable" en cada build se resuelve con **guards de navegación en runtime** (ver estructura de rutas más abajo), no con exclusión física del bundle — la separación real de acceso ya la garantiza el backend con el bloqueo de canal al emitir el token.

Estructura de carpetas:

```
/app
  _layout.tsx              → layout raíz: QueryClient, sesión, guard de rol/plataforma
  index.tsx                → redirect según sesión

  /(auth)
    login.tsx
    registro-tutor.tsx     → única alta pública, sin sesión (junto a login)

  /(clinica-admin)         → alcanzable solo si tipo_usuario = clínica_admin
  /(veterinario)           → alcanzable en web y en nativo (paridad total)
  /(tutor)                 → alcanzable solo en build nativo

/src
  /api          → un módulo por recurso (paciente.ts, tutor.ts, cita.ts, evento-clinico.ts,
                   medicacion.ts, auth.ts, adjuntos.ts) — fetch + tipos, análogo a "una
                   entidad por repositorio" en el backend
  /features     → lógica de UI por dominio; consume /api, nunca al revés
  /components   → UI compartida, consume el sistema de diseño (brief de Claude Design)
  /hooks        → hooks transversales no atados a un dominio
  /lib          → cliente HTTP base, configuración de QueryClient, interceptor de refresh
  /stores       → estado que no es server state (sesión en memoria, preferencias de UI)
  /theme        → tokens JS/TS + ThemeProvider, generados a partir de /design-system
  /types
  /constants

/design-system  → entrega de Claude Design (CSS, 39 componentes, kits de pantalla). Copiado
                   tal cual, no se edita a mano — se pisa con cada entrega nueva.
```

Detalle completo de la estructura de rutas y de esta separación de carpetas: `docs/08-arquitectura-frontend.md`.

## Principios heredados del backend (no negociables acá tampoco)

Este frontend no los implementa, pero toda pantalla se diseña sabiendo que están:

- **Motor de permisos en dos niveles** (rol + alcance) — el backend rechaza lo que la UI no llegue a ocultar. Una pantalla que "confía" en que el usuario no va a intentar algo fuera de su rol está mal diseñada igual.
- **Bloqueo de canal**: Tutor solo autentica desde móvil, Clínica_admin solo desde web, Veterinario desde ambos. El campo `canal` que manda el cliente es fijo por plataforma en el código — no una opción que elige el usuario — y es una regla de producto, no una barrera de seguridad (esa la aplica el backend).
- **Quién crea cada cuenta**: el Tutor se auto-registra desde la app; el Clínica_admin crea las cuentas de Veterinario de su propia clínica desde la web; la Clínica y su cuenta clínica_admin las crea el administrador de la plataforma por fuera de este proyecto (CLI del backend) — no hay pantalla acá para eso.
- **Nunca DELETE físico** sobre entidades clínicas — toda baja que el usuario ve como "eliminar" es una baja lógica; el copy de la UI no debería decir "eliminar" cuando el dato sigue existiendo.
- **Contraseñas**: mínimo 8 caracteres, una minúscula, una mayúscula y un dígito — se valida en el cliente por UX, pero el backend es quien decide si un alta se acepta.

## Autenticación y sesión

- **Token de acceso**: en memoria, no persistido. Se pierde al recargar la pestaña web o cerrar la app nativa; se recupera con el token de refresco al arrancar.
- **Token de refresco**:
  - Nativo → `expo-secure-store` (Keychain/Keystore). Resuelto.
  - Web → **sin resolver todavía**. `localStorage` vs. cookie `httpOnly` (esto último requeriría que el backend cambie cómo devuelve el token en el login, algo no contemplado hoy en `../docs/04-arquitectura.md`). No asumir una opción sin confirmar — señalarlo si una tarea toca login web.
- **Interceptor de red**: un 401 por token de acceso vencido dispara un único intento de refresh y reintenta el request original; si el refresh falla, se limpia la sesión y se redirige a `/(auth)/login`. Nunca un loop de reintentos.
- El `canal` es fijo por plataforma en el código, no configurable por el usuario (ver principios heredados, arriba).

## Documentos de referencia

Este archivo resume las decisiones; los siguientes documentos son la fuente de verdad. Los cuatro primeros viven en `../docs/` (raíz del monorepo), compartidos con el backend en una sola copia — son contrato de producto, no de implementación. No duplicarlos acá: editar la copia de la raíz.

1. **[../docs/01-modelo-de-datos.md](../docs/01-modelo-de-datos.md)** — forma de cada entidad, para tipar formularios y respuestas
2. **[../docs/02-reglas-de-negocio.md](../docs/02-reglas-de-negocio.md)** — reglas que la UI debe reflejar aunque no las aplique (ej. no ofrecer una segunda medicación activa de la misma droga)
3. **[../docs/03-alcance-de-plataformas.md](../docs/03-alcance-de-plataformas.md)** — qué pantalla existe en cada build, con qué permisos — el documento más directamente aplicable a este repo
4. **[../docs/04-arquitectura.md](../docs/04-arquitectura.md)** — esquema completo de autenticación (sección 4), necesario para el interceptor de refresh

Propios de este repo:

5. **[docs/08-arquitectura-frontend.md](docs/08-arquitectura-frontend.md)** — estructura de rutas, carpetas, decisiones de router/estado/cliente de API
6. **[docs/09-design-system-integracion.md](docs/09-design-system-integracion.md)** — cómo conviven el CSS entregado por Claude Design y la capa de tokens JS/TS para nativo, sin tocar los componentes heredados todavía
7. **[docs/10-estandares-desarrollo-frontend.md](docs/10-estandares-desarrollo-frontend.md)** — testing y filosofía de comentarios del cliente

## Notas para trabajar en este repo

- Antes de armar una pantalla nueva, revisar `../docs/03-alcance-de-plataformas.md` para el rol/plataforma correspondiente — no inventar una funcionalidad que no esté ahí.
- Si una pantalla necesita una regla de negocio no contemplada en `../docs/02-reglas-de-negocio.md`, señalarlo explícitamente en vez de asumir un comportamiento — son el contrato del proyecto, no una sugerencia (mismo criterio que en el backend).
- Los componentes de `/design-system` se usan tal cual en pantallas web, sin editarlos. Cualquier componente nuevo (los que van en `/src/components`) consume `useTheme()` de `/src/theme`, nunca una custom property de CSS a mano ni un valor de color/espaciado inventado — ver `docs/09-design-system-integracion.md`.
- Todo dato de servidor pasa por TanStack Query — no duplicar server state en `/src/stores`.
