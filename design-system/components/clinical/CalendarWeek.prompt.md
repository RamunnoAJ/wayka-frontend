# CalendarWeek / CalendarEvent

Vista de semana en columnas por dia, sin franjas horarias: las citas se apilan en orden y llevan su rango horario adentro. Es la vista por defecto de la agenda web.

```jsx
<Card padded={false}>
  <CalendarWeek onEventClick={open} days={[
    { date:12, events:[] },
    { date:13, events:[{ title:'Vacunación · Rocco', time:'10:00 — 10:30', status:'cumplido' }] },
    { date:14, today:true, events:[{ title:'Dermatología · Tobi', time:'11:00 — 11:30' }] },
    …7 en total, de domingo a sabado
  ]} />
</Card>
```

Reglas:
- **El tinte es el estado**: pendiente en lila, cumplido en neutro, vencido en rojo. Sin barras laterales, sin iconos, sin punto — esta es la excepcion declarada a la regla "punto + tipografia", porque en el calendario el bloque entero es el marcador.
- Titulo "Tipo · Mascota"; el horario va adentro del bloque, en tabular-nums.
- Hoy se marca solo en el numero del dia (pastilla llena), nunca tintando la columna.
- Semana de domingo a sabado. Para la vista de un dia usar AppointmentCard en lista.
