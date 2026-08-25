// Metro: SVG como componente React + resolución de los @import de /design-system.
const path = require('node:path');

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const dirDesignSystem = path.join(__dirname, 'design-system');

// Los logos son SVG monocromos que se pintan con `color`: importarlos como
// componente evita copiar la geometría a mano en el código.
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer/expo');
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];

// `design-system/styles.css` encadena sus tokens con `@import url("tokens/x.css")`,
// sin `./`: Metro lo lee como un módulo de node_modules y no lo encuentra. Se
// resuelve acá y no editando el archivo, porque /design-system se pisa entero
// con cada entrega de Claude Design.
const resolverOriginal = config.resolver.resolveRequest;
config.resolver.resolveRequest = (contexto, nombreModulo, plataforma) => {
  if (nombreModulo.startsWith('tokens/') && nombreModulo.endsWith('.css')) {
    return { type: 'sourceFile', filePath: path.join(dirDesignSystem, nombreModulo) };
  }
  return resolverOriginal
    ? resolverOriginal(contexto, nombreModulo, plataforma)
    : contexto.resolveRequest(contexto, nombreModulo, plataforma);
};

module.exports = config;
