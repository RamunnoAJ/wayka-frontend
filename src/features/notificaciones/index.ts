export { escucharAperturaDesdeAviso } from './apertura';
export {
  activarAvisos,
  avisosActivados,
  darDeBajaEsteDispositivo,
  desactivarAvisos,
  olvidarRegistro,
  registrarEsteDispositivo,
} from './registro';
export {
  configurarPresentacionDeAvisos,
  HAY_PUSH,
  leerEstadoDelPermiso,
  pedirPermiso,
  type EstadoDelPermiso,
} from './push';
export {
  DEMORA_DE_SIMULACION,
  PUEDE_SIMULAR,
  simularAviso,
  type AvisoSimulado,
} from './simulacion';
