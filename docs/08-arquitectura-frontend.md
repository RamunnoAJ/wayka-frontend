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

  /(tutor)                    → alcanzable solo en build nativo (Alcance de Plataformas, sección 5)
    _layout.tsx
    mascotas/index.tsx
    mascotas/[id].tsx
    citas.tsx
    notificaciones.tsx
    mis-datos.tsx
```

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
- **Token de refresco**: su almacenamiento difiere por plataforma y es una decisión abierta:
  - **Nativo**: `expo-secure-store` (Keychain en iOS, Keystore en Android) — resuelto, es el estándar para este caso en Expo.
  - **Web**: sin resolver. `localStorage` es simple pero legible por cualquier script (riesgo XSS); una cookie `httpOnly` es más segura pero requiere que el backend la setee así en vez de devolver el token en el body de la respuesta, lo cual no está contemplado en Arquitectura del Sistema (sección 4.2) tal como está escrita hoy. **Esto queda señalado como ambigüedad a resolver con el backend antes de implementar login web**, no asumido.
- **Canal (`canal: web | movil`)**: fijo por plataforma en el código del cliente (no es una opción que elige el usuario), coherente con que es una regla de producto y no una barrera de seguridad (Arquitectura, sección 4.4).
- **Interceptor de red**: un 401 por token de acceso vencido dispara un único intento de refresh; si el refresh falla (token inválido, reuso detectado, `Usuario.activo = false`), se limpia la sesión y se redirige a `/(auth)/login` — nunca un reintento en loop.

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

Pendiente de un documento propio (análogo a Estándares de Desarrollo del backend, sección 3), una vez que haya pantallas reales sobre las que decidir qué se prueba con qué herramienta. No se fija acá para no repetir el problema que Estándares de Desarrollo ya nombra: un estándar de testing definido antes de tener código tiende a no ajustarse a lo que el código termina necesitando.

## 11. Fuera de alcance de este documento

- **Sistema de diseño / tokens visuales en sí** (paleta, tipografía, densidad) — depende del brief ya entregado por Claude Design. Cómo se integra técnicamente esa entrega con este codebase está en `09-design-system-integracion.md`, no acá.
- **Adaptación de los 39 componentes entregados a primitivas de React Native** — ver `09-design-system-integracion.md`, sección 6, marcado ahí como pendiente de planificación aparte.
- **Estándares de testing y comentarios de frontend** — próximo documento, análogo a 06-estandares-de-desarrollo.md.
- **Almacenamiento seguro del token de refresco en web** — marcado como decisión abierta en la sección 6, no resuelto acá.
- **CI/CD y pipelines de EAS Build / EAS Submit** — ya marcado como pendiente en Arquitectura del Sistema, sección 6.
- **Offline-first / sincronización sin conexión** — no contemplado para el MVP.

## 12. Resumen de encaje con decisiones previas

| Decisión previa | Documento de origen | Cómo la resuelve este documento |
|---|---|---|
| Codebase compartido RN + RN Web | Stack Técnico, sección 4 | Un solo árbol de rutas Expo Router, dos targets de despliegue (sección 3) |
| Pantallas alcanzables por build según rol | Stack Técnico, sección 4.2 | Guards de navegación por grupo de rutas (sección 4), no exclusión de bundle |
| Bloqueo de canal es regla de producto, no de seguridad | Arquitectura, sección 4.4 | Canal fijo por plataforma en el cliente (sección 6) |
| Esquema de token de acceso + refresco | Arquitectura, sección 4 | Interceptor de refresh único, sesión en memoria (sección 6) |
| Sin dispositivo macOS disponible | Stack Técnico, contexto del proyecto | EAS Build sigue siendo el mecanismo de compilación iOS — sin cambios acá |
