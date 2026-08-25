/**
 * Genera `tokens.generated.ts` a partir de `/design-system/tokens/*.css`.
 *
 * Se corre a mano: `npm run tokens:generar`. El disparador es el campo
 * `version` de `design-system/version.json` — si coincide con la versión ya
 * generada, no hace nada (doc 09, sección 3.1). Forzar con `--force`.
 *
 * Lo que NO parsea está declarado en `parseExceptions` de `version.json`:
 * los `--text-*` compuestos, los `--shadow-*` / `--ring-*` (viven en
 * `sombras.ts`) y `--transition-control`. Las duraciones redeclaradas bajo
 * `@media (prefers-reduced-motion)` salen como un segundo juego de valores,
 * no pisan el primero.
 *
 * Node 24 ejecuta TypeScript directo (type stripping), así que no hace falta
 * sumar un runner al proyecto.
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raizRepo = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const dirDs = join(raizRepo, 'design-system');
const salida = join(raizRepo, 'src', 'theme', 'tokens.generated.ts');
const dirFuentesWeb = join(raizRepo, 'public', 'fonts');

interface VersionJson {
  version: string;
  released: string;
  tokenFiles: string[];
  themes: Record<string, string>;
}

type Mapa = Record<string, string>;

/**
 * Tokens que no son escalares y se descartan en el parseo (`parseExceptions` de
 * `version.json`). La excepción es **por archivo**, no global: `--text-*` es un
 * shorthand `font` en `typography.css`, pero en `colors.css` los `--text-*` son
 * alias de color perfectamente escalares (`--text-strong`, `--text-muted`) que
 * sí van al espejo.
 *
 * Colisión conocida: `--text-body` está declarado en los dos archivos. En el CSS
 * gana el de `typography.css` (se importa después); en este espejo queda el
 * color de `colors.css`, porque el shorthand no se parsea. Ver doc 09.
 */
const EXCEPCIONES: { archivo: string; test: RegExp }[] = [
  { archivo: 'tokens/typography.css', test: /^--text-/ },
  { archivo: 'tokens/elevation.css', test: /^--shadow-/ },
  { archivo: 'tokens/elevation.css', test: /^--ring-/ },
  { archivo: 'tokens/motion.css', test: /^--transition-/ },
];

const esExcepcion = (archivo: string, nombre: string) =>
  EXCEPCIONES.some((e) => e.archivo === archivo && e.test.test(nombre));

/**
 * Extrae las declaraciones de un archivo, agrupadas por scope.
 *
 * Los tokens vienen "una declaración por línea" (BRIEF, sección 9), así que
 * alcanza con seguir la apertura de bloque de cada línea en vez de parsear CSS
 * de verdad. Los scopes que interesan son tres: `:root`, `[data-theme="tutor"]`
 * y el `:root` dentro de `@media (prefers-reduced-motion:reduce)`.
 */
function parsearArchivo(
  archivo: string,
  css: string,
): { root: Mapa; tutor: Mapa; reducedMotion: Mapa } {
  const root: Mapa = {};
  const tutor: Mapa = {};
  const reducedMotion: Mapa = {};

  let enMediaReduced = false;
  let destino: Mapa | null = null;

  for (const linea of css.split('\n')) {
    const texto = linea.trim();
    if (!texto || texto.startsWith('/*') || texto.startsWith('*')) continue;

    if (texto.startsWith('@media') && texto.includes('prefers-reduced-motion')) {
      enMediaReduced = true;
    }
    if (texto.includes(':root{')) destino = enMediaReduced ? reducedMotion : root;
    else if (texto.includes('[data-theme="tutor"]{')) destino = tutor;

    const declaracion = texto.match(/^(--[a-z0-9-]+)\s*:\s*([^;]+);/i);
    if (declaracion && destino) {
      const [, nombre, valor] = declaracion as unknown as [string, string, string];
      if (!esExcepcion(archivo, nombre)) destino[nombre] = valor.trim();
    }

    if (texto.endsWith('}}')) {
      enMediaReduced = false;
      destino = null;
    } else if (texto === '}') {
      destino = null;
    }
  }

  return { root, tutor, reducedMotion };
}

/**
 * Resuelve las cadenas `var(--otro)`. Se hace después de mergear el tema, para
 * que un alias como `--surface-brand:var(--color-primary)` tome el primario del
 * tema tutor y no el del default.
 */
function resolver(mapa: Mapa): Mapa {
  const resuelto: Mapa = {};
  const enCurso = new Set<string>();

  const valorDe = (nombre: string): string => {
    if (resuelto[nombre] !== undefined) return resuelto[nombre];
    const crudo = mapa[nombre];
    if (crudo === undefined) throw new Error(`Token no declarado: ${nombre}`);
    if (enCurso.has(nombre)) throw new Error(`Referencia circular en ${nombre}`);
    enCurso.add(nombre);
    const valor = crudo.replace(/var\((--[a-z0-9-]+)\)/gi, (_, ref: string) => valorDe(ref));
    enCurso.delete(nombre);
    resuelto[nombre] = valor;
    return valor;
  };

  for (const nombre of Object.keys(mapa)) valorDe(nombre);
  return resuelto;
}

function ordenar(mapa: Mapa): Mapa {
  return Object.fromEntries(Object.entries(mapa).sort(([a], [b]) => a.localeCompare(b)));
}

function serializar(mapa: Mapa, sangria: string): string {
  return Object.entries(mapa)
    .map(([clave, valor]) => `${sangria}'${clave}': ${JSON.stringify(valor)},`)
    .join('\n');
}

/**
 * Copia las fuentes web a `/public/fonts` y reescribe el `@font-face` de
 * `tokens/fonts.css` para que apunte ahí.
 *
 * Hace falta porque los `url("../assets/fonts/…")` del CSS entregado son
 * relativos al archivo, y Metro emite el CSS bajo `_expo/static/css/` sin
 * reescribir esas rutas: las fuentes quedarían 404 en el build web. El archivo
 * generado se sirve desde `/public` y lo enlaza `app/+html.tsx`.
 */
function generarFuentesWeb(): number {
  const css = readFileSync(join(dirDs, 'tokens', 'fonts.css'), 'utf8');
  const archivos = new Set<string>();

  const reescrito = css.replace(/url\("([^"]+\.woff2)"\)/g, (_, ruta: string) => {
    const archivo = basename(ruta);
    archivos.add(ruta);
    return `url("/fonts/${archivo}")`;
  });

  mkdirSync(dirFuentesWeb, { recursive: true });
  for (const ruta of archivos) {
    const origen = join(dirDs, 'tokens', ruta);
    copyFileSync(origen, join(dirFuentesWeb, basename(ruta)));
  }

  writeFileSync(
    join(dirFuentesWeb, 'satoshi.generated.css'),
    `/* ARCHIVO GENERADO — no editar. Fuente: design-system/tokens/fonts.css.\n` +
      `   Regenerar: npm run tokens:generar */\n${reescrito}`,
  );

  return archivos.size;
}

function main(): void {
  const version = JSON.parse(readFileSync(join(dirDs, 'version.json'), 'utf8')) as VersionJson;

  const forzar = process.argv.includes('--force');
  if (!forzar) {
    try {
      const previo = readFileSync(salida, 'utf8');
      if (previo.includes(`design-system v${version.version}`)) {
        console.log(`tokens.generated.ts ya está en v${version.version} — nada que hacer.`);
        return;
      }
    } catch {
      // No existe todavía: se genera.
    }
  }

  const crudoRoot: Mapa = {};
  const crudoTutor: Mapa = {};
  const crudoReduced: Mapa = {};

  for (const archivo of version.tokenFiles) {
    const css = readFileSync(join(dirDs, archivo), 'utf8');
    const { root, tutor, reducedMotion } = parsearArchivo(archivo, css);
    Object.assign(crudoRoot, root);
    Object.assign(crudoTutor, tutor);
    Object.assign(crudoReduced, reducedMotion);
  }

  const porDefecto = ordenar(resolver(crudoRoot));
  const tutorCompleto = resolver({ ...crudoRoot, ...crudoTutor });

  // El tema tutor sale como diff sobre el default, no como objeto completo:
  // hereda todo lo que no redefine (doc 09, sección 3.4).
  const tutor = ordenar(
    Object.fromEntries(
      Object.entries(tutorCompleto).filter(([clave, valor]) => porDefecto[clave] !== valor),
    ),
  );

  const reducedMotion = ordenar(crudoReduced);

  const contenido = `/**
 * ARCHIVO GENERADO — no editar a mano.
 * Fuente: design-system v${version.version} (${version.released}).
 * Regenerar: npm run tokens:generar
 *
 * Espejo en JS/TS de las custom properties de \`/design-system/tokens/*.css\`,
 * necesario porque en iOS/Android no existe el CSS. Los nombres son los mismos
 * del design system, a propósito: un token de acá se puede buscar tal cual en
 * los archivos entregados.
 *
 * No incluye los tokens que no son escalares (\`--text-*\` compuestos,
 * \`--shadow-*\`, \`--ring-*\`, \`--transition-control\`) — ver \`sombras.ts\` y
 * doc 09, sección 3.2.
 */

export const VERSION_DESIGN_SYSTEM = '${version.version}';

/** Tema default: clínica y veterinario (lila primario, naranjas de acento). */
export const tokensDefault = {
${serializar(porDefecto, '  ')}
} as const;

/**
 * Tema tutor: naranja primario, lilas de acento. Solo los tokens que redefine —
 * el resto se hereda del default vía merge en el ThemeProvider.
 */
export const tokensTutor = {
${serializar(tutor, '  ')}
} as const;

/**
 * Segundo juego de duraciones, declarado bajo \`@media (prefers-reduced-motion)\`.
 * En nativo se selecciona con \`AccessibilityInfo.isReduceMotionEnabled()\`.
 */
export const tokensReducedMotion = {
${serializar(reducedMotion, '  ')}
} as const;

export type NombreToken = keyof typeof tokensDefault;
export type Tokens = Record<NombreToken, string>;
`;

  writeFileSync(salida, contenido);
  const fuentes = generarFuentesWeb();
  console.log(`fuentes web: ${fuentes} archivos copiados a public/fonts/.`);
  console.log(
    `tokens.generated.ts regenerado desde design-system v${version.version}: ` +
      `${Object.keys(porDefecto).length} tokens default, ${Object.keys(tutor).length} del tutor, ` +
      `${Object.keys(reducedMotion).length} de reduced-motion.`,
  );
}

main();
