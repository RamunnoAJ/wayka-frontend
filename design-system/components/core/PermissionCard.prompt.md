Permiso de push: lo pide y muestra el estado cuando ya se resolvió. Vive en la pantalla **Avisos** del
tutor, arriba de las tarjetas explicativas — es lo único accionable de esa pantalla.

```jsx
<PermissionCard status="sin-preguntar" onAsk={pedirPermiso} onDismiss={cerrar} />
<PermissionCard status="concedido" />
<PermissionCard status="denegado" onOpenSettings={abrirAjustes} />
```

Los tres estados tienen **peso visual distinto a propósito**:

- **sin-preguntar** — tarjeta completa, ícono en tinte primario, botón `size="touch"` como única acción
  principal de la pantalla. Es el único momento en que el componente pide algo.
- **concedido** — una línea en verde suave, sin acción. Ya no hay nada que decidir.
- **denegado** — el estado que importa. El sistema operativo no vuelve a preguntar, así que el único camino
  real es los ajustes del teléfono, y la tarjeta lo dice con la consecuencia concreta ("no vas a recibir el
  recordatorio del día anterior a cada turno"). Fondo neutro y no rojo — el tutor no cometió un error —, el
  botón baja a `ghost`, y el bloque queda a la altura de un dato informativo. **No insiste ni vuelve a
  ofrecer el prompt**: si el tutor dijo que no, la tarjeta se hace discreta, no un banner permanente.

En React Native el estado viene de `Notifications.getPermissionsAsync()`; `onOpenSettings` es
`Linking.openSettings()`.
