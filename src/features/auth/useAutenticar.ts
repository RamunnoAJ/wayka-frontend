import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

import {
  login,
  registrarTutor,
  type EntradaLogin,
  type EntradaRegistroTutor,
  type ResultadoAutenticacion,
} from '../../api/auth';
import { HOME_POR_ROL } from '../../constants/roles';
import { guardarTokenRefresco } from '../../lib/almacenamiento-refresh';
import { setSesion } from '../../stores/sesion';
import { registrarEsteDispositivo } from '../notificaciones';

/**
 * Hooks de ingreso y de alta. Los dos terminan igual: guardan el token de
 * refresco, dejan la sesión en memoria y llevan al home del rol.
 */

async function entrar(resultado: ResultadoAutenticacion, limpiarCache: () => void): Promise<void> {
  // La cache del usuario anterior no se comparte con el nuevo.
  limpiarCache();
  await guardarTokenRefresco(resultado.tokenRefresco);
  setSesion(resultado.sesion);

  // El teléfono se registra recién con la sesión puesta, porque el registro va
  // autenticado. No se espera el resultado: quedarse sin avisos no puede
  // demorar la entrada, y el registro no falla de una forma que el usuario
  // pueda resolver acá.
  void registrarEsteDispositivo();

  router.replace(HOME_POR_ROL[resultado.sesion.usuario.tipo_usuario]);
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entrada: EntradaLogin) => login(entrada),
    onSuccess: (resultado) => entrar(resultado, () => queryClient.clear()),
  });
}

/**
 * Alta de tutor.
 *
 * El alta **no autentica**: `POST /registro/tutor` devuelve la cuenta creada,
 * no una sesión. Para que el tutor quede adentro —que es lo que promete la
 * regla 4.9, paso 6— se encadena un login con las mismas credenciales.
 *
 * Si el alta sale bien y el login falla, la cuenta igual quedó creada: por eso
 * el error de este segundo paso se distingue, para no decirle a alguien que no
 * pudo registrarse cuando en realidad ya tiene cuenta.
 */
export class RegistroSinSesion extends Error {
  constructor(causa: unknown) {
    super('Tu cuenta quedó creada, pero la sesión no se pudo iniciar. Probá ingresar.');
    this.name = 'RegistroSinSesion';
    this.cause = causa;
  }
}

export function useRegistroTutor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entrada: EntradaRegistroTutor): Promise<ResultadoAutenticacion> => {
      await registrarTutor(entrada);
      try {
        return await login({ email: entrada.email, contrasena: entrada.contrasena });
      } catch (causa) {
        throw new RegistroSinSesion(causa);
      }
    },
    onSuccess: (resultado) => entrar(resultado, () => queryClient.clear()),
  });
}
