import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { load } from 'js-yaml';
import ts from 'typescript';

/**
 * Lectura del contrato OpenAPI y de los tipos escritos a mano, para poder
 * compararlos.
 *
 * El cliente de la API se tipa a mano y sin generación (doc 08, sección 7): no
 * hay nada que detecte si un tipo se desalinea del contrato. Los tests del
 * backend lo prueban contra sí mismo y los del frontend contra sus propios
 * tipos, así que un tipo equivocado deja las dos suites en verde y rompe la app.
 * Esto cubre exactamente ese hueco.
 */

/**
 * El contrato vive en el repo del backend, que es un repo aparte: `docs/` y
 * `openapi.yaml` no se duplican acá a propósito (CLAUDE.md de la raíz — ya
 * estuvieron duplicados y divergieron).
 */
const RUTA_DEL_CONTRATO = join(__dirname, '..', '..', '..', 'backend', 'openapi', 'openapi.yaml');

export function hayContratoDisponible(): boolean {
  return existsSync(RUTA_DEL_CONTRATO);
}

interface EsquemaOpenAPI {
  properties?: Record<string, unknown>;
  required?: string[];
  enum?: string[];
}

export function leerEsquemas(): Record<string, EsquemaOpenAPI> {
  const spec = load(readFileSync(RUTA_DEL_CONTRATO, 'utf8')) as {
    components: { schemas: Record<string, EsquemaOpenAPI> };
  };
  return spec.components.schemas;
}

/**
 * Campos de una interfaz TypeScript, leídos con el compilador y no con una
 * expresión regular: un comentario con llaves o un tipo anidado rompen el
 * regex, y un chequeo de contrato que falla por su propio parser no sirve.
 */
export function camposDeInterfaz(rutaRelativa: string, nombre: string): Set<string> {
  const ruta = join(__dirname, '..', '..', rutaRelativa);
  const fuente = ts.createSourceFile(
    ruta,
    readFileSync(ruta, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );

  const campos = new Set<string>();
  fuente.forEachChild((nodo) => {
    if (!ts.isInterfaceDeclaration(nodo) || nodo.name.text !== nombre) return;
    for (const miembro of nodo.members) {
      if (ts.isPropertySignature(miembro) && ts.isIdentifier(miembro.name)) {
        campos.add(miembro.name.text);
      }
    }
  });

  if (campos.size === 0) {
    throw new Error(`No se encontró la interfaz ${nombre} en ${rutaRelativa}`);
  }
  return campos;
}

function fuenteDe(rutaRelativa: string): ts.SourceFile {
  const ruta = join(__dirname, '..', '..', rutaRelativa);
  return ts.createSourceFile(ruta, readFileSync(ruta, 'utf8'), ts.ScriptTarget.Latest, true);
}

/**
 * Valores de un enum del cliente, venga como unión de literales
 * (`'dni' | 'pasaporte'`) o como objeto `as const` con su tipo derivado, que es
 * la forma que usa la mayoría de los módulos.
 *
 * Lanza si no encuentra ninguno: un chequeo que no encuentra qué comparar tiene
 * que fallar, no pasar en verde sin haber verificado nada.
 */
export function valoresDeEnum(
  rutaRelativa: string,
  nombre: string,
  constante?: string,
): Set<string> {
  const valores = new Set([
    ...valoresDeUnion(rutaRelativa, nombre),
    ...(constante ? valoresDeConstante(rutaRelativa, constante) : []),
  ]);
  if (valores.size === 0) {
    throw new Error(
      `No se pudo leer ningún valor de ${nombre} en ${rutaRelativa}: ` +
        'sin valores el chequeo de contrato no compara nada.',
    );
  }
  return valores;
}

/** Valores de cadena de un `export const X = { A: 'a' } as const`. */
export function valoresDeConstante(rutaRelativa: string, nombre: string): Set<string> {
  const valores = new Set<string>();
  fuenteDe(rutaRelativa).forEachChild((nodo) => {
    if (!ts.isVariableStatement(nodo)) return;
    for (const declaracion of nodo.declarationList.declarations) {
      if (!ts.isIdentifier(declaracion.name) || declaracion.name.text !== nombre) continue;
      const inicial = declaracion.initializer;
      const objeto = inicial && ts.isAsExpression(inicial) ? inicial.expression : inicial;
      if (!objeto || !ts.isObjectLiteralExpression(objeto)) continue;
      for (const propiedad of objeto.properties) {
        if (ts.isPropertyAssignment(propiedad) && ts.isStringLiteral(propiedad.initializer)) {
          valores.add(propiedad.initializer.text);
        }
      }
    }
  });
  return valores;
}

/** Valores de una unión de literales de cadena, ej. `'dni' | 'pasaporte'`. */
export function valoresDeUnion(rutaRelativa: string, nombre: string): Set<string> {
  const ruta = join(__dirname, '..', '..', rutaRelativa);
  const fuente = ts.createSourceFile(
    ruta,
    readFileSync(ruta, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );

  const valores = new Set<string>();
  fuente.forEachChild((nodo) => {
    if (!ts.isTypeAliasDeclaration(nodo) || nodo.name.text !== nombre) return;
    const tipos = ts.isUnionTypeNode(nodo.type) ? nodo.type.types : [nodo.type];
    for (const tipo of tipos) {
      if (ts.isLiteralTypeNode(tipo) && ts.isStringLiteral(tipo.literal)) {
        valores.add(tipo.literal.text);
      }
    }
  });
  return valores;
}
