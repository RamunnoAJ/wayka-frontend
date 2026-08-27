import {
  camposDeInterfaz,
  hayContratoDisponible,
  leerEsquemas,
  valoresDeEnum,
} from '../pruebas/contrato';

/**
 * Deriva entre los tipos escritos a mano y el contrato del backend.
 *
 * No reemplaza a los tests de integración del backend, que ya prueban que la API
 * se comporta bien: cubre lo que ninguna de las dos suites ve, que es un tipo de
 * este lado que dejó de coincidir con el esquema. Con un tipo equivocado las dos
 * suites pasan en verde y la app falla igual.
 *
 * **Se saltea si el repo del backend no está al lado.** El contrato no se
 * duplica acá a propósito (ya estuvo duplicado y divergió), y la contrapartida
 * es que en un CI que solo clona el frontend esto no protege nada: ahí hay que
 * clonar los dos repos o el chequeo es decorativo.
 */
const describeSiHayContrato = hayContratoDisponible() ? describe : describe.skip;

describeSiHayContrato('los tipos del cliente no derivaron del contrato', () => {
  const esquemas = leerEsquemas();

  const entidades: [string, string, string][] = [
    ['Paciente', 'src/api/paciente.ts', 'Paciente'],
    ['Tutor', 'src/api/tutor.ts', 'Tutor'],
    ['Veterinario', 'src/api/veterinario.ts', 'Veterinario'],
    ['Clinica', 'src/api/clinica.ts', 'Clinica'],
    ['Cita', 'src/api/cita.ts', 'Cita'],
    ['Medicacion', 'src/api/medicacion.ts', 'Medicacion'],
    ['EventoClinico', 'src/api/evento-clinico.ts', 'EventoClinico'],
    ['Adjunto', 'src/api/adjunto.ts', 'Adjunto'],
  ];

  it.each(entidades)('%s tiene los mismos campos que su esquema', (_, ruta, esquema) => {
    const delContrato = new Set(Object.keys(esquemas[esquema]?.properties ?? {}));
    const delCliente = camposDeInterfaz(ruta, esquema);

    // Se comparan los dos sentidos: un campo que el contrato agregó y el cliente
    // no lee es una funcionalidad perdida en silencio, y uno que el cliente
    // manda y el contrato no tiene es un request que el backend va a rechazar.
    expect([...delCliente].sort()).toEqual([...delContrato].sort());
  });

  // La mayoría de los enums del cliente son un objeto `as const` con su tipo
  // derivado, así que se nombra la constante además del alias.
  const enumerados: [string, string, string, string | undefined][] = [
    ['TipoDeCita', 'src/api/cita.ts', 'TipoDeCita', 'TIPO_DE_CITA'],
    ['EstadoDeCita', 'src/api/cita.ts', 'EstadoDeCita', 'ESTADO_DE_CITA'],
    ['TipoDeEventoClinico', 'src/api/evento-clinico.ts', 'TipoDeEvento', 'TIPO_DE_EVENTO'],
    ['TipoDeAdjunto', 'src/api/adjunto.ts', 'TipoDeAdjunto', 'TIPO_DE_ADJUNTO'],
    ['TipoDocumento', 'src/api/veterinario.ts', 'TipoDocumento', undefined],
  ];

  it.each(enumerados)(
    '%s cubre todos los valores del contrato',
    (esquema, ruta, alias, constante) => {
      const delContrato = esquemas[esquema]?.enum ?? [];
      const delCliente = valoresDeEnum(ruta, alias, constante);

      expect(delContrato.length).toBeGreaterThan(0);
      expect(delContrato.filter((valor) => !delCliente.has(valor))).toEqual([]);
    },
  );
});
