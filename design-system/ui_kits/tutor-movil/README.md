# UI kit — App del tutor (móvil)

Único acceso del tutor; no existe versión web. Reutiliza `../clinica-web/data.js`.

`TutorScreens.jsx`: `TutorLogin`, `TutorPets`, `TutorPetDetail`, `TutorAgenda`, `TutorProfile`.

Diferencias deliberadas con la app del vet:
- Cabecera violeta plena: contexto emocional, no herramienta de trabajo.
- Aviso permanente de permisos en la ficha ("Podés verla, no modificarla").
- Todo dato clínico con candado; solo peso, alimento y contacto propio son editables (naranja).
- Las citas ofrecen confirmar y reagendar, nunca crear ni cancelar sin la clínica.
