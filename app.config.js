/**
 * Envuelve `app.json` para poder arrancar en Expo Go.
 *
 * `runtimeVersion` y `updates` son lo que hace que un build de EAS reciba
 * actualizaciones OTA, pero Expo Go solo entiende proyectos sin
 * `runtimeVersion` propio: con uno definido responde "Project is incompatible
 * with this version of Expo Go", que despista porque no es un problema de
 * versión. Los scripts `go` y `go:tunel` levantan `EXPO_USAR_GO` para sacarlos.
 *
 * También inyecta la clave de Google Maps. Va acá y no en `app.json` porque
 * `app.json` se commitea: el valor vive en `.env`, que está ignorado por git.
 */
module.exports = ({ config }) => {
  if (process.env.EXPO_USAR_GO === '1') {
    delete config.runtimeVersion;
    delete config.updates;
  }

  return conClaveDeMapas(config);
};

/**
 * El mapa nativo de Android e iOS no lee `EXPO_PUBLIC_*` en tiempo de ejecución
 * como sí hace el resto del cliente: la clave se compila dentro del binario, así
 * que tiene que estar en la configuración del proyecto antes del build nativo.
 * Cambiarla pide `expo prebuild` de nuevo, no alcanza con reiniciar Metro.
 *
 * Es la misma clave que usa el autocompletado de Places por HTTP. Sin ella el
 * proyecto levanta igual, con el mapa en blanco: obligarla rompería el arranque
 * de cualquiera que clone el repo sin haber dado de alta una clave facturable,
 * que es justo lo que el proveedor nulo de `EXPO_PUBLIC_MAPAS_PROVEEDOR` evita.
 */
function conClaveDeMapas(config) {
  const clave = process.env.EXPO_PUBLIC_MAPAS_API_KEY;
  if (!clave) {
    return config;
  }

  return {
    ...config,
    ios: {
      ...config.ios,
      config: { ...config.ios?.config, googleMapsApiKey: clave },
    },
    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        googleMaps: { ...config.android?.config?.googleMaps, apiKey: clave },
      },
    },
  };
}
