import { DialogoDeConfirmacion } from '../../components';

/**
 * Confirmación de una revocación.
 *
 * El copy **dice la verdad sobre el efecto** en vez de prometer un corte
 * instantáneo: en el servidor es inmediato, pero un teléfono sin señal sigue
 * mostrando lo que ya descargó hasta que se conecte, con un techo de una semana
 * (Sincronización sin Conexión, 8). Ocultarlo sería peor que el problema — quien
 * revoca merece saber qué queda expuesto y por cuánto.
 *
 * Con una veterinaria no hace falta la aclaración: la copia local es del tutor,
 * y el veterinario trabaja siempre contra el servidor.
 */
export function ConfirmarRevocacion({
  nombre,
  nombreDeLaMascota,
  esPersona,
  enviando,
  onConfirmar,
  onCancelar,
}: {
  nombre: string;
  nombreDeLaMascota: string;
  esPersona: boolean;
  enviando: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  return (
    <DialogoDeConfirmacion
      titulo={esPersona ? `¿Quitarle el acceso a ${nombre}?` : `¿${nombre} deja de atenderla?`}
      descripcion={
        esPersona
          ? `Va a dejar de ver a ${nombreDeLaMascota} apenas su teléfono se conecte. Si está sin señal, puede seguir viendo lo que ya descargó, hasta una semana.`
          : `Va a dejar de ver la ficha y el historial de ${nombreDeLaMascota}. Lo que ya escribió queda donde está, con su firma.`
      }
      etiquetaConfirmar={esPersona ? 'Quitar el acceso' : 'Quitar la veterinaria'}
      enviando={enviando}
      onConfirmar={onConfirmar}
      onCancelar={onCancelar}
    />
  );
}
