# Wayka — Arquitectura de Frontend

MVP — Un solo codebase Expo Router para Web, iOS y Android
Versión 1.0 · Complementa a Alcance de Plataformas, Arquitectura del Sistema y Stack Técnico

## 1. Alcance

Este documento define cómo se organiza el proyecto de frontend (Expo + React Native + React Native Web) para implementar lo ya definido en Alcance de Plataformas (qué pantalla ve cada rol) y Stack Técnico, sección 4 (por qué un codebase compartido). No redefine decisiones de esos documentos — las aplica a una estructura de carpetas y rutas concreta.

El proyecto arranca con foco en la web de clínica (Clínica_admin, Veterinario), pero **es un único proyecto Expo desde el día uno**, no dos proyectos que después se unifican. La app móvil (Veterinario, Tutor) sale del mismo árbol de rutas.

## 2. Decisiones técnicas complementarias al Stack Técnico

| Decisión | Elección | Por qué |
|---|---|---|
| Router | **Expo Router** (file-based) | Viene integrado con Expo — sin configurar un router aparte para web y otro para nativo. El árbol de archivos en `/app` es a la vez la navegación nativa y las rutas de la versión web exportada. |
| Estado de servidor / data fetching | **TanStack Query** | El backend expone entidades con alta/baja lógica y un esquema de JWT con expiración corta — Query resuelve cache, revalidación e invalidación sin reimplementar esa lógica a mano por feature. |
| Cliente de API | **Escrito a mano**, sin generación desde `openapi.yaml` | Decisión explícita de no replicar el patrón contract-first del backend en el cliente. Ver sección 7 para el trade-off que esto acepta. |

> A diferencia del backend, acá no hay un patrón "spec primero, código generado después" en la capa de red — es una asimetría consciente, no un olvido. Vale la pena revisarla si el contrato de la API empieza a cambiar seguido, porque el costo de mantener tipos a mano sincronizados crece con la frecuencia de cambios, no con el tamaño del proyecto.

## 3. Estrategia de un solo codebase para tres plataformas

Expo Router usa el mismo árbol de rutas para dos *targets* de despliegue distintos:

- **Web**: exportación estática (`expo export --platform web`) servida como sitio — la usan Clínica_admin y Veterinario.
- **Nativo**: builds vía EAS Build para iOS y Android — los usan Veterinario y Tutor.

Esto **no** son dos bundles de JavaScript que excluyen código entre sí. Es el mismo router tree compilado a dos formatos de salida distintos. La separación de "qué pantalla es alcanzable en cada build" (Stack Técnico, sección 4.2) se resuelve con guards de navegación en tiempo de ejecución (sección 6), no con exclusión física de pantallas del bundle.

Esto es coherente con lo ya dicho en Stack Técnico: esa separación es de navegación, no de permisos — el backend sigue siendo la única barrera real (Reglas de Negocio, sección 3; Arquitectura, sección 4.4).

## 4. Estructura de rutas (`/app`)

```
/app
  _layout.tsx                 → layout raíz: provee QueryClient, sesión, y el guard de rol/plataforma
  index.tsx                   → redirect según sesión (a login o al home del rol)

  /(auth)
    login.tsx                 → autenticación por email+contraseña o Google
    registro-tutor.tsx        → alta pública de Tutor (única ruta que no requiere sesión, junto a login)

  /(clinica-admin)            → alcanzable solo si tipo_usuario = clínica_admin (Alcance de Plataformas, 3.2)
    _layout.tsx                  guard de rol adicional al de la raíz
    panel.tsx
    veterinarios/index.tsx
    veterinarios/[id].tsx

  /(veterinario)              → alcanzable en web y en nativo (paridad total, Alcance de Plataformas, sección 2)
    _layout.tsx
    pacientes/index.tsx
    pacientes/[id].tsx
    pacientes/[id]/evento-clinico/nuevo.tsx
    pacientes/[id]/medicacion.tsx
    tutores/index.tsx
    tutores/[id].tsx
    citas/index.tsx

  /(tutor)                    → alcanzable en web y en nativo (Alcance de Plataformas, sección 5)
    _layout.tsx
    mascotas/index.tsx        → pestaña 1
    mascotas/nueva.tsx
    mascotas/[id]/index.tsx
    mascotas/[id]/compartir.tsx
    mascotas/[id]/accesos.tsx
    citas.tsx                 → pestaña 2
    ajustes.tsx               → pestaña 3: ficha propia, avisos y cuenta
    invitaciones/[token].tsx  → destino del enlace del correo
    sincronizacion.tsx        → rechazos de la cola sin conexión, se llega desde mascotas
```

**La barra del tutor tiene tres pestañas y el resto son pantallas de detalle**
(Alcance de Plataformas, sección 5). No todo archivo de `/(tutor)` es una
entrada del menú: `invitaciones/[token]` se abre desde el correo y
`sincronizacion` desde el aviso del listado de mascotas. Quién es pestaña lo
dice `src/features/navegacion/items.ts`, no la cantidad de archivos.

El guard de rol vive en cada `_layout.tsx` de grupo: lee el `tipo_usuario` de la sesión (sección 6) y hace `redirect` si no corresponde — un Tutor que de alguna forma llegara a una URL de `/(veterinario)` en la versión web (que no debería poder ni loguearse ahí, por el bloqueo de canal del backend) rebota, no ve una pantalla oculta a medias.

## 5. Estructura de carpetas fuera de `/app`

```
/src
  /api          → un módulo por recurso (paciente.ts, tutor.ts, cita.ts, evento-clinico.ts, medicacion.ts,
                   auth.ts, adjuntos.ts) — fetch + tipos de request/response, análogo a "una entidad
                   por repositorio" en la capa de datos del backend.
  /features     → lógica de UI por dominio (formularios, validaciones de cliente, hooks de Query
                   específicos de cada pantalla). Un feature consume /api, nunca al revés.
  /components   → componentes de UI compartidos entre pantallas y entre plataformas — consumen el
                   sistema de diseño que resulte del trabajo con Claude Design (sección 9).
  /hooks        → hooks transversales no atados a un dominio (ej. useSesion, useDebounce).
  /lib          → configuración de infraestructura: cliente HTTP base, QueryClient, interceptor de
                   refresh (sección 6), manejo de errores de red.
  /stores       → estado que no es "server state" (sesión en memoria, preferencias de UI).
  /theme        → capa de tokens JS/TS + ThemeProvider, generada a partir del design system
                   de Claude Design — ver 09-design-system-integracion.md.
  /types        → tipos compartidos que no pertenecen a un único módulo de /api.
  /constants
```

El design system entregado por Claude Design (CSS, componentes, kits de pantalla) vive en `/design-system`, en la raíz del proyecto, copiado tal cual y sin editar — no es parte de `/src`. El detalle completo de cómo `/src/theme` se genera a partir de esos archivos está en `09-design-system-integracion.md`.

## 6. Autenticación y sesión

- **Token de acceso**: vive en memoria (store de sesión, no persistido). Se pierde al recargar la pestaña web o al cerrar la app — se recupera pidiendo uno nuevo con el token de refresco al arrancar.
- **Token de refresco**: su almacenamiento difiere por plataforma. Lo decide un solo módulo, `src/lib/almacenamiento-refresh.ts`.
  - **Nativo**: `expo-secure-store` (Keychain en iOS, Keystore en Android) — es el estándar para este caso en Expo.
  - **Web**: `localStorage`. La alternativa era una cookie `httpOnly`, más segura, pero exige que el backend la setee en vez de devolver el token en el body, y eso no es lo que describe Arquitectura 4.2: cambiarlo movía el contrato de autenticación entero para el MVP. **El riesgo aceptado es XSS** — cualquier script que corra en la página puede leer `localStorage`—, y lo que lo acota no es el almacenamiento sino el esquema del backend: el token de refresco es de un solo uso, rota en cada canje, y presentar uno ya usado se lee como reuso y revoca la cadena entera (Arquitectura, 4.2.1). Un token robado sirve hasta que el dueño refresque, y ahí caen las dos sesiones.

    Hay dos casos donde `localStorage` no está y la sesión no puede romperse por eso: la **exportación estática**, que hace el prerender en Node sin `window`, y **Safari en navegación privada**, donde `setItem` lanza por cuota. En los dos se cae a memoria y la sesión funciona dentro de la misma carga de página.
- **Canal (`canal: web | movil`)**: fijo por plataforma en el código del cliente (no es una opción que elige el usuario), coherente con que es una regla de producto y no una barrera de seguridad (Arquitectura, sección 4.4).
- **Interceptor de red**: un 401 por token de acceso vencido dispara un único intento de refresh; si el refresh falla (token inválido, reuso detectado, `Usuario.activo = false`), se limpia la sesión y se redirige a `/(auth)/login` — nunca un reintento en loop.
- **Canje serializado entre pestañas.** Con el token en `localStorage`, todas las pestañas del navegador comparten el mismo: dos que reciben 401 a la vez presentarían el mismo token, y la segunda dispararía la detección de reuso tirando abajo la sesión de las dos. El canje se toma un candado de `navigator.locks` y **lee el token adentro**, así la segunda encuentra el ya rotado. Donde `navigator.locks` no existe se corre sin candado, que es el comportamiento de antes.

- **Cerrar sesión se propaga a las otras pestañas.** `useSesionEntrePestanas` escucha el evento `storage`: cuando otra pestaña borra el token, esta limpia su sesión y va a login. Sin eso, la que quedó abierta seguía usable con su token de acceso en memoria hasta que venciera —minutos con la ficha de un paciente a la vista en una máquina de la que el usuario ya se fue—. Solo el **borrado** cierra: un valor nuevo es la rotación normal de un refresh ajeno, y cerrar ahí echaría al usuario cada vez que vence un token de acceso.

> **Iniciar sesión en una pestaña no la inicia en las otras.** El caso inverso no está cubierto: la pestaña que estaba en login se queda ahí hasta que se la recargue. Se resuelve con el mismo evento, pero exige canjear el token para conseguir uno de acceso propio, y no hacía falta para el problema que se estaba resolviendo.

## 7. Cliente de API

Sin generación de código desde `openapi.yaml`. Cada módulo de `/src/api` expone funciones tipadas a mano (`crearPaciente(input): Promise<Paciente>`) que llaman al cliente HTTP base de `/src/lib`.

Trade-off aceptado explícitamente: los tipos de request/response se escriben y mantienen a mano, en paralelo al contrato OpenAPI real. Si el contrato cambia (un campo nuevo, un enum que se extiende), no hay ningún mecanismo automático que lo detecte del lado del frontend — queda en manos de disciplina de equipo y, eventualmente, de tests de integración contra el backend real.

## 8. Estado y data fetching

- Todo el **server state** (pacientes, citas, medicación, etc.) se maneja con TanStack Query — sin duplicarlo en un store aparte.
- El **estado de sesión** (usuario autenticado, token de acceso vigente) no es server state en el mismo sentido — vive en `/src/stores`, separado del QueryClient.
- Claves de cache, tiempos de `staleTime` e invalidaciones por feature quedan para el documento de Estándares de Desarrollo de Frontend (pendiente, análogo a 06-estandares-de-desarrollo.md del backend) — no se fijan acá para no adelantar decisiones sin ver las pantallas reales primero.

## 9. Sistema de diseño y componentes

Este documento no define tokens visuales, tipografía ni paleta — eso es responsabilidad del brief de diseño ya producido para el trabajo con Claude Design, entregado como `/design-system` (CSS + 39 componentes React DOM). Cómo esos tokens se vuelven consumibles desde JS/TS para que web y nativo compartan la misma fuente de valores, sin tocar los componentes heredados, está en `09-design-system-integracion.md`. `/src/components` es donde en el futuro vivan las versiones adaptadas a React Native de esos componentes — hoy las pantallas web consumen `/design-system/components` directamente.

## 10. Testing

Definido en [10-estandares-desarrollo-frontend.md](10-estandares-desarrollo-frontend.md), escrito recién con las pantallas del alcance ya construidas — que es lo que esta sección dejaba pendiente a propósito.

## 11. Fuera de alcance de este documento

- **Sistema de diseño / tokens visuales en sí** (paleta, tipografía, densidad) — depende del brief ya entregado por Claude Design. Cómo se integra técnicamente esa entrega con este codebase está en `09-design-system-integracion.md`, no acá.
- **Adaptación de los 39 componentes entregados a primitivas de React Native** — ver `09-design-system-integracion.md`, sección 6, marcado ahí como pendiente de planificación aparte.
- **Almacenamiento seguro del token de refresco en web** — marcado como decisión abierta en la sección 6, no resuelto acá.
- **CI/CD y pipelines de EAS Build / EAS Submit** — ya marcado como pendiente en Arquitectura del Sistema, sección 6.
- **Offline-first / sincronización sin conexión** — el contrato está en `11-sincronizacion-offline.md` (documento compartido, en `/docs` de la raíz): entra al MVP solo para el tutor en móvil. Lo que este documento sigue sin definir es su implementación en el cliente — esquema de la base local, detección de conectividad y política de reintento —, que va en `10-estandares-desarrollo-frontend.md`.

## 12. Resumen de encaje con decisiones previas

| Decisión previa | Documento de origen | Cómo la resuelve este documento |
|---|---|---|
| Codebase compartido RN + RN Web | Stack Técnico, sección 4 | Un solo árbol de rutas Expo Router, dos targets de despliegue (sección 3) |
| Pantallas alcanzables por build según rol | Stack Técnico, sección 4.2 | Guards de navegación por grupo de rutas (sección 4), no exclusión de bundle |
| Bloqueo de canal es regla de producto, no de seguridad | Arquitectura, sección 4.4 | Canal fijo por plataforma en el cliente (sección 6) |
| Esquema de token de acceso + refresco | Arquitectura, sección 4 | Interceptor de refresh único, sesión en memoria (sección 6) |
| Sin dispositivo macOS disponible | Stack Técnico, contexto del proyecto | EAS Build sigue siendo el mecanismo de compilación iOS — sin cambios acá |
