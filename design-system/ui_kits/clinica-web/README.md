# UI kit — Web de la clínica

Superficie de **clínica_admin + veterinario**. 1440×900, sidebar fija de 248px, contenido a 1160px centrado.

| Archivo | Pantalla |
|---|---|
| `Login.jsx` | Ingreso profesional, con panel de marca a la derecha |
| `Patients.jsx` | Listado + búsqueda + filtros; las alertas viajan en la fila |
| `PatientDetail.jsx` | Ficha: datos críticos arriba, luego historial / medicación / datos / adjuntos |
| `EventForm.jsx` | Modal de carga de evento clínico |
| `Agenda.jsx` | Calendario semanal y agenda del día con los tres estados |
| `ClinicPanel.jsx` | Equipo, datos administrativos, preferencias y plan |
| `data.js` | Datos de ejemplo compartidos con los kits móviles |

Recorrido: Pacientes → tocar *Mora* → ficha → "Cargar evento" → guardar (toast) → Agenda → Panel de clínica. El botón de salir en la barra superior lleva al login.
