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
| `npm run dev`        | Dev server contra el development build     |
| `npm run go`         | Dev server en modo Expo Go                 |
| `npm run export:web` | Exportación estática de la web a `dist/`   |
| `npm run typecheck`  | `tsc --noEmit` (TypeScript estricto)       |
| `npm run lint`       | ESLint (config de Expo + Prettier)         |
| `npm run format`     | Prettier sobre el código (no toca `docs/`) |

## Cómo probar en móvil

Hay dos caminos y conviene tener claro para qué sirve cada uno.

**Development build** (`npm run dev`) — el binario propio de Wayka, con todos
los módulos nativos. Es el único donde se pueden probar push remoto y los deep
links del scheme `wayka://`. Se construye una vez y después solo se reinstala
si cambia algo nativo (un plugin, una dependencia nativa, un permiso):

```bash
eas build -p android --profile development --local   # APK en build-local/
adb install -r build-local/<archivo>.apk
```

Para iOS en un iPhone físico hace falta Apple Developer Program: la firma no
depende de tener una Mac (EAS compila en la nube), pero sí de un provisioning
profile, que una cuenta gratuita no puede emitir.

En iOS 16 o superior el teléfono no abre una build de desarrollo hasta activar
Ajustes → Privacidad y seguridad → Modo de desarrollador, que pide reiniciar. Es
una vez por dispositivo. Y el UDID va horneado en el provisioning profile: cada
iPhone nuevo se registra con `eas device:create` **antes** de compilar, porque
registrarlo después no alcanza y hay que volver a buildear.

Si el dev client no encuentra el servidor, el problema suele ser cuál IP anuncia
Expo: elige entre todas las interfaces, y acá hay dos docenas de bridges de
Docker, flannel y libvirt donde el teléfono no tiene ruta. `npm run dev:ip`
fuerza `REACT_NATIVE_PACKAGER_HOSTNAME` a la IP de la interfaz que realmente sale
a la red, resolviéndola con `ip route get`. Es solo Linux, y con un exit node de
Tailscale activo tomaría la IP del tailnet.

**Expo Go** (`npm run go`) — sin compilar nada, escaneando el QR. Alcanza para
UI, navegación, cámara, sesión y notificaciones locales. No sirve para push
remoto ni para los deep links del scheme propio.

`app.config.js` existe por esto último: Expo Go rechaza un proyecto que declare
`runtimeVersion` propio con un error engañoso ("requires a newer version of Expo
Go"), así que los scripts `go` levantan `EXPO_USAR_GO=1` para quitar
`runtimeVersion` y `updates` del manifest servido.

## Versiones fijadas a propósito

`react-native-reanimated` y `react-native-worklets` están clavadas en `4.5.1` y
`0.10.1`. `expo-router` arrastra por su cuenta `reanimated@4.6`, que exige
`worklets@0.12`, pero todo el SDK 57 compila contra `worklets@0.10`: con 0.12 el
build nativo de `expo-modules-core` falla con `no member named 'executeSync' in
'worklets::WorkletRuntime'`. No desfijarlas sin verificar que
`expo-modules-core` ya acepte `^0.12.0` como peer.

## Estado actual

Scaffold. No hay ninguna pantalla con lógica de negocio: todas las rutas
renderizan un `Placeholder` explícito. Ver la sección de placeholders en
`docs/08-arquitectura-frontend.md` y los comentarios de:

- `src/lib/refresh.ts` — flujo de refresh sin implementar (decisión abierta:
  dónde guardar el token de refresco en web).
- `src/hooks/useRestaurarSesion.ts` — restauración de sesión al arrancar,
  bloqueada por la misma decisión.
- `src/api/README.md`, `src/features/README.md` — directorios todavía vacíos.
