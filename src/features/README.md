# `/src/features` — lógica de UI por dominio

Formularios, validaciones de cliente y hooks de TanStack Query específicos de
cada pantalla, agrupados por dominio.

Un feature consume `/src/api`, nunca al revés (doc 08, sección 5). Todo el
server state pasa por TanStack Query — no duplicarlo en `/src/stores`, que es
solo para lo que no es estado de servidor (sesión en memoria, preferencias).

- `auth/` — validaciones de cliente del ingreso y del alta (regla 2.1 y 4.9), y
  los hooks `useLogin` / `useRegistroTutor`.

Pendientes: `pacientes/`, `tutores/`, `citas/`, `medicacion/`.
