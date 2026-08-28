Autenticación con Google. Solo móvil, tema tutor, en login y registro.

```jsx
<SocialButton onClick={entrarConGoogle} />
<SocialButton mode="signup" onClick={registrarmeConGoogle} />
```

**Marca ajena, cromía ajena.** El logo va en sus cuatro colores, sin teñir, sin recortar y sin meterlo en un
círculo. El botón usa la superficie neutra de la guía de Google (`#FFFFFF` / borde `#DADCE0` / texto
`#3C4043`) y **no** toma `--color-primary`: es la única excepción declarada a la regla de no escribir
hexadecimales en componentes, porque no son colores de Wayka y no deben cambiar con el tema. Lo único que
hereda del sistema es el radio, la tipografía y la altura táctil.

**Composición: Google va arriba del formulario.** En el kit tutor-movil el orden es Google → separador
"o con tu correo" → email + contraseña → botón primario "Entrar".

Por qué arriba: es el camino más corto y el que menos escribe, y ponerlo abajo obliga a leer el formulario
completo antes de descubrirlo — el usuario que hubiera elegido Google ya tipeó su mail. Arriba también
resuelve la jerarquía: el botón de Google es neutro (blanco con borde), así que el único botón con relleno
primario de la pantalla sigue siendo "Entrar", abajo. Si fuera al revés habría dos bloques de peso alto
compitiendo, o habría que degradar "Entrar" a secundario para que Google no lo tapara.

**Email existente sin Google vinculado.** No es un error: el vínculo se hace en ese mismo paso y se entra.
Pero el usuario tiene que enterarse, porque cambia cómo va a ingresar la próxima vez — se muestra un `Toast`
`tone="info"` al aterrizar en la app, no un `Dialog` que pida confirmar:

```jsx
<Toast tone="info" title="Vinculamos tu cuenta de Google"
  description="Ya podés entrar con Google o con tu contraseña, las dos siguen funcionando." />
```
