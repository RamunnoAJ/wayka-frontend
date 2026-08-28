Confirmacion efimera tras guardar, o aviso de algo que ya pasó. Para un error dentro de un bloque va
`InlineError`, no esto.

```jsx
<Toast tone="success" title="Evento guardado" description="Se notificó al tutor." onClose={cerrar} />
<Toast tone="info" title="Vinculamos tu cuenta de Google"
  description="Ya podés entrar con Google o con tu contraseña." action={{label:'Entendido', onClick:cerrar}} />
```

**Barra oscura, no tarjeta.** El toast usa `--surface-inverse` con texto blanco y `data-surface="dark"` — la
misma superficie que la navegación. Es deliberado: un aviso del sistema no debe parecer contenido de la
pantalla, y la tarjeta blanca con ícono y borde de acento a la izquierda es un patrón gastado que además
compite con las cards reales del catálogo. **No hay ícono y no hay borde de acento**: el tono es un punto de
7 px, coherente con la regla del sistema de "punto + tipografía".

`tone` solo pinta el punto — la superficie y la tipografía no cambian, así que un toast de error no grita.
`action` es una sola acción en texto subrayado; si hace falta más de una, era un `Dialog`.

Un toast por vez, abajo en móvil y abajo a la derecha en web, con `--dur-slow` de salida.
