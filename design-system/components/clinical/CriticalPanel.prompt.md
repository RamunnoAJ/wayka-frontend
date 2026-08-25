Panel de datos criticos (alergias / medicacion activa) que va SIEMPRE arriba de la ficha.

```jsx
<CriticalPanel kind="allergy" title="Alergias" items={[<AllergyChip label="Penicilina" />]} emptyLabel="Sin alergias registradas" />
```

Vacio se degrada a gris neutro: la ausencia de alerta tambien es informacion.
