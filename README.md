# Wayka — Frontend

Cliente único (Expo + React Native + React Native Web) para la web de clínica y
la app móvil. Ver `CLAUDE.md` y `docs/08-arquitectura-frontend.md` para las
decisiones de arquitectura.

## Requisitos

- Node 20+ y npm

## Puesta en marcha

```bash
npm install
# .env es opcional en desarrollo: el cliente deduce el host del servidor de
# Metro y usa el puerto 8080. Copiar .env.example solo para apuntar a otro backend.
```

## Comandos

| Comando              | Qué hace                                   |
| -------------------- | ------------------------------------------ |
| `npm run web`        | Dev server web (`expo start --web`)        |
| `npm start`          | Dev server con QR para Expo Go / simulador |
| `npm run export:web` | Exportación estática de la web a `dist/`   |
| `npm run typecheck`  | `tsc --noEmit` (TypeScript estricto)       |
| `npm run lint`       | ESLint (config de Expo + Prettier)         |
| `npm run format`     | Prettier sobre el código (no toca `docs/`) |

## Estado actual

Scaffold. No hay ninguna pantalla con lógica de negocio: todas las rutas
renderizan un `Placeholder` explícito. Ver la sección de placeholders en
`docs/08-arquitectura-frontend.md` y los comentarios de:

- `src/lib/refresh.ts` — flujo de refresh sin implementar (decisión abierta:
  dónde guardar el token de refresco en web).
- `src/hooks/useRestaurarSesion.ts` — restauración de sesión al arrancar,
  bloqueada por la misma decisión.
- `src/api/README.md`, `src/features/README.md` — directorios todavía vacíos.
