import { duracion, ESCALA_DE_PRESION, ESCALA_DE_PRESION_LG, resorte } from './movimiento';

/**
 * El espejo de movimiento se arma parseando los tokens del design system, que
 * son cadenas: `".97"`, `"140ms"`, `"cubic-bezier(.2,.7,.3,1)"`. Un token que
 * cambie de forma no rompe la compilación — devuelve `NaN` y la animación deja
 * de correr sin que nada avise.
 *
 * No se verifica que un valor sea tal número: eso es del design system, y
 * fijarlo acá sería copiar el token en dos lugares. Lo que se verifica es que
 * el parseo produzca números y que se cumplan las reglas que el sistema declara
 * innegociables.
 */
const PRESETS = ['snap', 'default', 'gentle'] as const;

describe('resortes', () => {
  it.each(PRESETS)('%s sale del token como número y no como NaN', (nombre) => {
    const preset = resorte[nombre];
    expect(preset.damping).toBeGreaterThan(0);
    expect(preset.stiffness).toBeGreaterThan(0);
    expect(preset.mass).toBeGreaterThan(0);
  });

  /**
   * La regla que el sistema llama "nunca overshoot". No se afirma que el ratio
   * sea >= 1 exacto: `snap` queda en 0.9915, apenas por debajo, y el design
   * system dice "~1.0" a propósito. Lo que importa no es el número redondo sino
   * que el rebote no se vea, así que se lo compara contra el umbral de reposo
   * del propio preset — por debajo de eso Reanimated ya da el resorte por
   * terminado y el sobrepaso no llega a dibujarse.
   *
   * Sobrepaso del primer pico de un sistema de segundo orden:
   * `exp(-pi * z / sqrt(1 - z^2))`, y 0 cuando `z >= 1`.
   */
  it.each(PRESETS)('%s no rebota de forma perceptible', (nombre) => {
    const { damping, stiffness, mass, restDisplacementThreshold } = resorte[nombre];
    const z = damping / (2 * Math.sqrt(stiffness * mass));
    const sobrepaso = z >= 1 ? 0 : Math.exp((-Math.PI * z) / Math.sqrt(1 - z * z));

    expect(sobrepaso).toBeLessThan(restDisplacementThreshold);
  });

  // Sin umbrales el resorte sigue resolviendo fracciones de píxel después de
  // haber llegado, y el final del gesto se siente pegajoso.
  it.each(PRESETS)('%s trae los umbrales de reposo', (nombre) => {
    expect(resorte[nombre].restDisplacementThreshold).toBeGreaterThan(0);
    expect(resorte[nombre].restSpeedThreshold).toBeGreaterThan(0);
  });

  it('va de más rápido a más lento: snap, default, gentle', () => {
    expect(resorte.snap.stiffness).toBeGreaterThan(resorte.default.stiffness);
    expect(resorte.default.stiffness).toBeGreaterThan(resorte.gentle.stiffness);
  });
});

describe('duraciones', () => {
  it('crecen en el orden en que están nombradas', () => {
    expect(duracion.instant.duration).toBeLessThan(duracion.fast.duration);
    expect(duracion.fast.duration).toBeLessThan(duracion.normal.duration);
    expect(duracion.normal.duration).toBeLessThan(duracion.slow.duration);
  });

  // `"140ms"` parseado mal da NaN, y `withTiming` con NaN nunca termina.
  it('salen en milisegundos, sin la unidad pegada', () => {
    for (const config of Object.values(duracion)) {
      expect(Number.isFinite(config.duration)).toBe(true);
      expect(config.duration).toBeGreaterThan(0);
    }
  });
});

describe('escalas del press', () => {
  // Hundir de más en un elemento grande se lee como un salto: por eso la
  // escala de las cards es más cercana a 1 que la de los controles chicos.
  it('la de elementos grandes hunde menos que la de los chicos', () => {
    expect(ESCALA_DE_PRESION_LG).toBeGreaterThan(ESCALA_DE_PRESION);
    expect(ESCALA_DE_PRESION_LG).toBeLessThan(1);
  });
});
