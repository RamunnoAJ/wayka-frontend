// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    // /design-system se copia tal cual de Claude Design y no se edita acá:
    // linterlo con nuestras reglas sería ruido sobre código que no controlamos
    // (trae su propio _adherence.oxlintrc.json). public/fonts es generado.
    ignores: ['dist/*', '.expo/*', 'node_modules/*', 'design-system/*', 'public/*'],
  },
]);
