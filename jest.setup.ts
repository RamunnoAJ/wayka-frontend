// react-native-gesture-handler necesita su propio setup: sin él,
// `GestureHandlerRootView` intenta instalar el módulo nativo y falla al montar
// cualquier cosa que use gestos (el visor de adjuntos).
import 'react-native-gesture-handler/jestSetup';

/**
 * Los matchers de `@testing-library/react-native` vienen incluidos desde su v14
 * y no hace falta importarlos: este archivo existe para los mocks del entorno.
 *
 * `useAnchoDeVentana` mide la ventana real, que en jsdom es 1024. Alcanza para
 * que las pantallas rendericen en su composición ancha; una prueba que necesite
 * el layout angosto tiene que declararlo ella misma.
 */

// expo-secure-store no existe fuera de un build nativo, y es lo que guarda el
// token de refresco: sin este mock, importar cualquier cosa que arrastre la
// sesión revienta al cargar el módulo.
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

// La carga de las fuentes Satoshi no cambia ningún comportamiento y arrastra el
// cargador de assets nativo, que no existe en jsdom. `useFonts` responde que ya
// terminó para que las pantallas rendericen de una.
jest.mock('expo-font', () => ({
  useFonts: () => [true, null],
  loadAsync: jest.fn(async () => undefined),
  isLoaded: () => true,
}));
