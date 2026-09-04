/**
 * Validaciones de cliente del alta y del ingreso.
 *
 * Son por UX: adelantan el error sin ir al servidor. **El backend es quien
 * decide** si un alta se acepta — que algo pase acá no significa nada
 * (CLAUDE.md, "el frontend nunca es la barrera de seguridad").
 *
 * Copy en español rioplatense, voseo, mayúscula solo inicial (BRIEF, sección 5).
 */

/** Política de contraseña de la regla 2.1: 8+, una minúscula, una mayúscula, un dígito. */
export const REGLAS_CONTRASENA = [
  { prueba: (v: string) => v.length >= 8, texto: 'Al menos 8 caracteres' },
  { prueba: (v: string) => /[a-z]/.test(v), texto: 'Una minúscula' },
  { prueba: (v: string) => /[A-Z]/.test(v), texto: 'Una mayúscula' },
  { prueba: (v: string) => /\d/.test(v), texto: 'Un número' },
] as const;

export function validarEmail(valor: string): string | undefined {
  const limpio = valor.trim();
  if (!limpio) return 'Ingresá tu correo';
  // Validación deliberadamente laxa: el correo real lo confirma el backend, y
  // una expresión estricta rechaza direcciones válidas más seguido de lo que
  // atrapa errores.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpio)) return 'Ese correo no parece válido';
  return undefined;
}

/** En el ingreso no se valida la política: solo que no esté vacía. */
export function validarContrasenaDeIngreso(valor: string): string | undefined {
  if (!valor) return 'Ingresá tu contraseña';
  return undefined;
}

export function validarContrasenaNueva(valor: string): string | undefined {
  if (!valor) return 'Elegí una contraseña';
  const faltan = REGLAS_CONTRASENA.filter((regla) => !regla.prueba(valor));
  if (faltan.length === 0) return undefined;
  return `Le falta: ${faltan.map((regla) => regla.texto.toLowerCase()).join(', ')}`;
}

/**
 * La repetición es del formulario, no del backend: el servidor recibe una sola
 * contraseña. Sirve para atajar el error de tipeo antes de que quede una
 * credencial que nadie sabe cuál es.
 */
export function validarRepetirContrasena(nueva: string, repetida: string): string | undefined {
  if (!repetida) return 'Repetí la contraseña';
  if (repetida !== nueva) return 'Las dos no coinciden';
  return undefined;
}

export function validarNombre(valor: string): string | undefined {
  if (!valor.trim()) return 'Ingresá tu nombre';
  return undefined;
}

export function validarConsentimiento(valor: boolean): string | undefined {
  // Regla 4.9, paso 2: sin consentimiento explícito no se crea ni la ficha ni
  // la cuenta. Se bloquea acá para no mandar un alta que el backend va a
  // rechazar de todos modos.
  if (!valor) return 'Necesitamos tu consentimiento para crear la cuenta';
  return undefined;
}
