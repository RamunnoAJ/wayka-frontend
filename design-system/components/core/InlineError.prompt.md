# InlineError

Error dentro del bloque que fallo, no un cartel global.

```jsx
<InlineError description="La agenda no respondio." onRetry={reload} />
<InlineError compact title="Sin conexion" />
```

Reglas:
- Reemplaza solo el bloque afectado; el resto de la pantalla sigue usable.
- Siempre decir que paso; ofrecer reintento cuando la accion se puede repetir.
- Para confirmaciones y avisos que se van solos, usar Toast.
