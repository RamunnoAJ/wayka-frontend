/**
 * Envuelve `app.json` para dos cosas que no se pueden expresar en un JSON
 * estático: arrancar en Expo Go, y separar la app de desarrollo de la real.
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

  return conVarianteDeDesarrollo(config);
};

/**
 * Le da identidad propia al build de desarrollo.
 *
 * Sin esto, el dev client y los builds de preview y producción comparten
 * `com.wayka.app`, que para el sistema operativo es **la misma app**: instalar
 * el APK de preview desinstala el dev client sin avisar, y el error se
 * manifiesta después, cuando abrís lo que creías que era el cliente de
 * desarrollo y arranca en la pantalla de login.
 *
 * Con el sufijo, las dos conviven en el mismo teléfono. El `slug` no cambia
 * —es el mismo proyecto de EAS— y el nombre visible sí, para poder
 * distinguirlas en la pantalla de inicio.
 *
 * La variante la declara `eas.json` en el perfil de desarrollo. No se deduce de
 * `__DEV__` ni del perfil: `app.config.js` corre en Node durante el prebuild,
 * donde ninguna de esas dos cosas existe todavía.
 */
function conVarianteDeDesarrollo(config) {
  if (process.env.APP_VARIANTE !== 'desarrollo') return config;

  return {
    ...config,
    name: `${config.name} Dev`,
    // Esquema propio: con el mismo, un enlace profundo abriría cualquiera de
    // las dos apps y cuál gana lo decide el sistema, no nosotros.
    scheme: `${config.scheme}-dev`,
    ios: { ...config.ios, bundleIdentifier: `${config.ios.bundleIdentifier}.dev` },
    android: { ...config.android, package: `${config.android.package}.dev` },
  };
}
