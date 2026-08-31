/**
 * Envuelve `app.json` para poder arrancar en Expo Go.
 *
 * `runtimeVersion` y `updates` son lo que hace que un build de EAS reciba
 * actualizaciones OTA, pero Expo Go solo entiende proyectos sin
 * `runtimeVersion` propio: con uno definido responde "Project is incompatible
 * with this version of Expo Go", que despista porque no es un problema de
 * versión. Los scripts `go` y `go:tunel` levantan `EXPO_USAR_GO` para sacarlos.
 */
module.exports = ({ config }) => {
  if (process.env.EXPO_USAR_GO === '1') {
    delete config.runtimeVersion;
    delete config.updates;
  }

  return config;
};
