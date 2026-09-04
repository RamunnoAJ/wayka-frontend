// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

const adherenciaDS = require('./design-system/_adherence.oxlintrc.json');

// El design system trae sus reglas de adherencia en `_adherence.oxlintrc.json`, escritas
// para oxlint. Se leen de ahí en vez de copiarlas para que una entrega nueva las actualice
// sola, pero solo entran las de sintaxis: las que listan los props válidos de cada
// componente describen los originales React DOM, y nuestros ports a React Native aceptan
// además los props de RN, así que marcarían como error el uso correcto.
const REGLAS_DE_SINTAXIS = adherenciaDS.rules['no-restricted-syntax']
  .slice(1)
  .filter((regla) => !regla.selector.startsWith('JSXOpeningElement'));

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    files: ['src/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}'],
    ignores: ['src/theme/tokens.generated.ts'],
    rules: { 'no-restricted-syntax': ['warn', ...REGLAS_DE_SINTAXIS] },
  },
  {
    // /design-system se copia tal cual de Claude Design y no se edita acá:
    // linterlo con nuestras reglas sería ruido sobre código que no controlamos
    // (de ahí salen las reglas de adherencia de arriba). public/fonts es generado.
    ignores: ['dist/*', '.expo/*', 'node_modules/*', 'design-system/*', 'public/*'],
  },
]);
