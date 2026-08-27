# Wayka — Estándares de Desarrollo del Frontend

MVP — Testing y filosofía de código del cliente
Versión 1.0 · Complementa a Arquitectura del Frontend (08)

## 1. Alcance

Este documento define cómo se prueba el frontend y qué criterio rige sus comentarios. Es el análogo de [Estándares de Desarrollo del backend](../../backend/docs/06-estandares-de-desarrollo.md), sección 3, y comparte su filosofía; lo que cambia son las herramientas y qué tiene sentido probar de este lado.

Se escribió recién ahora, con las pantallas del alcance ya construidas. El documento 08 lo dejó pendiente a propósito: un estándar de testing definido antes de tener código tiende a no ajustarse a lo que el código termina necesitando, y este fija lo que las pantallas reales pidieron.

## 2. Herramientas

| Qué | Con qué | Por qué |
|---|---|---|
| Corredor | `jest` con el preset `jest-expo` | Es el que mantiene Expo con cada SDK: trae el mapeo de módulos nativos y la lista de paquetes a transpilar, que cambian con cada versión. |
| Aserciones sobre componentes | `@testing-library/react-native` | Consulta el árbol por lo que ve el usuario (texto, rol, estado accesible), no por estructura interna. Un test que busca por `testID` de un `View` se rompe con cualquier refactor de layout. |
| Lectura del contrato | `js-yaml` + el compilador de `typescript` | Para el chequeo de deriva (3.2). Ambos ya estaban en el árbol; `js-yaml` se declara explícito para que no desaparezca en un bump de dependencias. |

Se descarta **Vitest**: es más rápido, pero el preset de React Native es de Jest y replicarlo a mano deja al proyecto manteniendo infraestructura que Expo ya mantiene.

Se descartan los **snapshots**: registran lo que el componente rinde hoy, no lo que debería. Un snapshot que cambia se actualiza sin leerlo, y a partir de ahí no verifica nada.

### 2.1 Configuración que no es obvia

Tres ajustes en `package.json` y `jest.setup.ts` que existen por un motivo concreto:

- **`moduleNameMapper` de `lucide-react-native`** — el paquete publica su build ESM bajo la condición `react-native`, que es la que resuelve el preset, y Jest no parsea ese `.mjs`. Se lo apunta a su build CJS, idéntico en contenido, solo en las pruebas.
- **`overrides` de `@react-native/jest-preset`** — `jest-expo` pide `^0.86.3` y React Native declara `0.86.2` como peer *opcional*. Es un salto de patch en un preset que solo se usa en tests: se fija la versión que pide `jest-expo` en vez de aflojar la resolución entera con `--legacy-peer-deps`.
- **Mocks de `expo-secure-store` y `expo-font`** — el primero guarda el token de refresco y no existe fuera de un build nativo; el segundo arrastra el cargador de assets. Ninguno cambia un comportamiento que se pruebe.

**No se define un `transformIgnorePatterns` propio.** El del preset se actualiza con cada SDK, y reemplazarlo dejaba afuera dependencias transitivas de `expo-router` que se publican en ESM sin compilar.

### 2.2 La API de la librería es asíncrona

Desde su v14, tanto `render` como `fireEvent` de `@testing-library/react-native` devuelven promesas. **Hay que esperarlas**: sin `await`, la aserción corre sobre un árbol que todavía no se actualizó y el test falla por un motivo que no tiene nada que ver con lo que quería verificar.

## 3. Qué se prueba

El frontend **no es la barrera de seguridad** y no aplica reglas de negocio: las valida el backend. Probar acá que "un tutor no puede editar el historial" sería probar el backend desde el lugar equivocado. Lo que se prueba es lo que este proyecto sí decide:

1. **Lógica pura de presentación.** Formato de fechas, edad, peso, y la aritmética de la grilla de turnos. Es donde vive el grueso del riesgo real: una zona horaria mal manejada corre un turno de día, y nadie lo nota hasta que un tutor llega el día equivocado.
2. **Reglas que la interfaz refleja para no ofrecer lo que va a fallar.** El selector de turnos no muestra horas fuera de la grilla; el alta de paciente no deja elegir un tutor sin consentimiento. El backend las rechaza igual — lo que se verifica es que el usuario no llegue a intentarlo.
3. **Estados que no son el feliz.** Vacío, error, sin permiso, bloqueado. Son los que se rompen en silencio, porque nadie los mira al desarrollar.
4. **Deriva entre los tipos escritos a mano y el contrato** — ver 3.2.

Lo que **no** se prueba: que un componente se vea de determinada manera, que un token de color sea el correcto, ni que una pantalla llame a tal endpoint. Lo primero es del design system, lo último es implementación.

Tampoco se prueba **que la API se comporte bien**. Eso ya lo cubren los tests de integración del backend, que atraviesan el router real contra un Postgres real y verifican códigos de estado, alcances por rol y validaciones. Reescribir eso desde el frontend sería duplicarlo desde el lugar equivocado, y más lento.

### 3.2 Deriva de contrato

El cliente de la API se tipa a mano, sin generación desde el YAML (doc 08, sección 7). El trade-off aceptado ahí es que nada detecta automáticamente si un tipo se desalinea del contrato — y ese hueco no lo ve **ninguna** de las dos suites: el backend se prueba contra sí mismo y el frontend contra sus propios tipos, así que un tipo equivocado deja las dos en verde y rompe la app igual.

`src/api/contrato.test.ts` cubre exactamente eso: lee `backend/openapi/openapi.yaml` y compara, para cada entidad, los campos de la interfaz del cliente contra las propiedades de su esquema. En los dos sentidos — un campo que el contrato agregó y el cliente no lee es una funcionalidad perdida en silencio, y uno que el cliente manda y el contrato no tiene es un request que el backend va a rechazar. Los enums se comparan igual.

Los tipos se leen con el compilador de TypeScript y no con expresiones regulares: un comentario con llaves o un tipo anidado rompen el regex, y un chequeo de contrato que falla por su propio parser no sirve para nada.

> **Se saltea si el repo del backend no está al lado.** El contrato no se duplica en este repo a propósito: ya estuvo duplicado en los dos y divergieron (CLAUDE.md de la raíz). La contrapartida es que en un CI que solo clona el frontend este chequeo no protege nada — ahí hay que clonar los dos repos, o es decorativo.
>
> Es la alternativa barata a montar pruebas de integración propias contra un backend levantado: corre en menos de un segundo, sin base ni servidor, y cubre el único hueco que las suites existentes dejan.

### 3.3 Cobertura

No hay porcentaje mínimo, a diferencia del backend. La cobertura obligatoria del backend cubre su capa de negocio, que es donde vive la única aplicación real de las reglas; acá el equivalente sería una métrica que se cumple renderizando pantallas sin afirmar nada sobre ellas.

Lo que sí es obligatorio: **toda función de `src/features/**/formato.ts` y de aritmética de calendario tiene test**, y todo bug que se corrige se reproduce primero con un test en rojo.

## 4. Cómo se escribe un test

- **Nombrado por el comportamiento**, en castellano y en la voz del dominio: `marca los turnos que ya pasaron en vez de esconderlos`, no `test turnosDelDia 3`.
- **Consultas por lo que ve el usuario**: `getByText`, `getByLabelText`, `getByRole`. Si hace falta un `testID`, casi siempre es que al elemento le falta un nombre accesible, y eso es un problema del componente y no del test.
- **Un `QueryClient` por prueba**, desde el helper `src/pruebas/render.tsx`. Uno compartido filtra la caché de una prueba a la siguiente y las vuelve dependientes del orden.
- **Sin reintentos de TanStack Query en pruebas**: reintentar un error esperado solo hace que la aserción llegue tarde.
- **El reloj se congela cuando el comportamiento depende de la hora.** El selector de turnos arranca en el día de hoy: sin congelarlo, la prueba pasa a la mañana y falla a la tarde, cuando ya no queda ningún turno disponible.

### 4.1 Ciclo de trabajo

Rige el mismo **rojo, verde, refactor** del backend (doc 06, sección 3.1), con una salvedad honesta: la primera tanda de tests se escribió sobre pantallas que ya existían, así que caracteriza lo que hay en vez de haberlo guiado. De acá en adelante el ciclo aplica sin excepción, y la deuda es esa primera tanda, no el criterio.

## 5. Comentarios

Mismo criterio que el backend (doc 06, sección 4): **el comentario explica el porqué, nunca el qué**. Nombres descriptivos y tests bien nombrados documentan el comportamiento.

En este proyecto hay un tipo de comentario que sí vale siempre: **el que ata una decisión de interfaz a la regla que la origina**. "Un turno pasado se muestra deshabilitado en vez de desaparecer" es una decisión que alguien va a querer revertir en seis meses; el comentario dice por qué no.

## 6. Fuera de alcance de este documento

- **Pruebas de punta a punta con el backend levantado** (navegador contra API real). El chequeo de deriva de contrato (3.2) cubre lo que se rompía en silencio; lo que quedaría afuera es que un flujo completo falle por cómo se encadenan varias pantallas. Con 83 tests de integración del lado del backend y el chequeo de contrato de este lado, el costo de montar y mantener un entorno completo no se justifica hoy. Si aparece un bug que ninguna de las dos suites hubiera podido atrapar, ese es el momento de reevaluarlo.
- **Pruebas de accesibilidad automatizadas.**
- **Pruebas visuales o de regresión de imagen.**
