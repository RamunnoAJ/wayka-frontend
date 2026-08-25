# DatePicker / Calendar

Fecha en ISO `YYYY-MM-DD`, sin libreria de fechas.

```jsx
<DatePicker label="Fecha del control" value={f} onChange={setF} min="2026-01-01" />
<Calendar value={f} onChange={setF} />
```

Reglas:
- La semana arranca en lunes; los meses van en minuscula.
- El dia de hoy se marca con borde, el elegido con relleno primario.
- `Calendar` suelto para agenda o paneles; `DatePicker` para formularios.
