# `/src/api` — cliente de API escrito a mano

Un módulo por recurso, análogo a "una entidad por repositorio" en el backend.
Cada módulo exporta funciones tipadas que llaman al cliente HTTP base de
`/src/lib/http.ts`.

Sin generación desde `openapi.yaml` — decisión explícita (doc 08, secciones 2 y
7). El trade-off aceptado: los tipos se mantienen sincronizados a mano contra el
contrato real del backend, sin ningún mecanismo automático que detecte una
divergencia.

Reglas:

- Un módulo de `/src/api` no importa nada de `/src/features` ni de `/app`.
- Los hooks de TanStack Query viven en `/src/features`, no acá: este directorio
  es solo transporte + tipos.

Módulos:

- `auth.ts` — login (contraseña y Google), registro de tutor, refresco y cierre
  de sesión.

La fuente de verdad del contrato es `openapi/openapi.yaml` del repo de backend,
servido en `/openapi.yaml` con visor en `/docs`. Los nombres del contrato están
en español (`contrasena`, `token_de_acceso`, `token_de_refresco`) y los tipos de
acá los respetan tal cual: cualquier traducción a otro vocabulario haría más
difícil comparar contra el YAML.

Pendientes: `paciente.ts`, `tutor.ts`, `cita.ts`, `evento-clinico.ts`,
`medicacion.ts`, `adjuntos.ts`.
