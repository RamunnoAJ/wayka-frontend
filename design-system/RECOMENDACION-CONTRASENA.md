# Wayka — Cambio de contraseña: dónde vive

Recomendación pedida en el punto 4 del pedido de v1.3.0. **No hay componentes nuevos para esto todavía**:
el endpoint existe, ninguna pantalla del alcance lo usa, y hasta que el documento de alcance lo ubique
no tiene sentido diseñarlo.

## Recomendación: sección dentro de la pantalla de cuenta, no pantalla propia

En los dos roles que hoy tienen pantalla de cuenta, el cambio de contraseña va como **sección** — no como
pantalla de primer nivel:

- **Tutor** — dentro de "Mis datos", como una fila más abajo de teléfono y dirección, que abre un `Sheet`
  desde abajo con los tres campos (actual, nueva, repetir). El `Sheet` es la capa correcta: es una tarea
  puntual, con foco atrapado, y al cerrarse devuelve al mismo lugar sin perder contexto.
- **clinica_admin** — dentro del panel, en el bloque de cuenta, abriendo un `Dialog` con los mismos campos.

Por qué sección y no pantalla:

1. **Frecuencia.** Es una tarea de una vez cada varios meses. Una pantalla de primer nivel se paga en
   navegación permanente (una entrada más en el menú, una más para leer cada vez) a cambio de una tarea que
   casi nadie hace. La sección se paga solo cuando se usa.
2. **Es un campo de "mis datos", no un área.** La contraseña es un atributo de la cuenta, igual que el
   teléfono. Ponerla junto al resto de los datos editables es donde el usuario ya la va a buscar.
3. **La navegación no aguanta más entradas.** El tutor tiene tres pestañas y el criterio del sistema es que
   la barra no crece. Una pantalla de contraseña competiría por un lugar que corresponde a mascotas, citas
   y perfil.

## El caso que sí necesita decisión de alcance: el veterinario

El veterinario **no tiene hoy ninguna pantalla de cuenta**, así que no hay sección donde meter esto. Las tres
opciones, ordenadas por lo que recomiendo:

1. **(Recomendada) Una pantalla mínima "Mi cuenta" para el rol vet**, alcanzable desde el avatar del
   `PageHeader` o del `SidebarNav`. Trae nombre, matrícula, email y contraseña, y nada más. Es media jornada
   de diseño, resuelve el cambio de contraseña y le deja lugar a lo que va a venir después (firma, horario
   de agenda, preferencia de avisos) sin volver a abrir la discusión.
2. **Un `Dialog` colgado directamente del menú del avatar**, sin pantalla intermedia. Más barato, pero deja
   al rol vet sin ningún lugar donde vivan sus propios datos: el próximo dato de cuenta reabre el problema.
3. **No exponerlo para el veterinario en el MVP** y que la clínica gestione el reseteo. Solo si la vet no
   administra su propia credencial, lo que hay que confirmar con el modelo de usuarios.

**Lo que necesito de vos para diseñarlo:** cuál de las tres para el rol vet, y si el flujo de "olvidé mi
contraseña" (reset por email, sin sesión) entra en el mismo pedido — es otra pantalla y otro estado de
error, y conviene diseñarlos juntos porque comparten los mensajes de validación.

## Cuando se diseñe, no hacen falta componentes nuevos

`Sheet` / `Dialog` + `Input type="password"` + `InlineError` para el error del servidor (contraseña actual
incorrecta) + `Toast tone="success"` al confirmar. La única regla a fijar es que la contraseña nueva se
valida **antes** de enviar, con el requisito a la vista desde el principio — el mismo criterio que el límite
de tamaño en los adjuntos: la restricción del backend se muestra, no se descubre.

## Nota sobre Google y contraseña

Una cuenta de tutor puede tener las dos credenciales a la vez (ver `SocialButton.prompt.md`: un email
existente que se vincula con Google conserva su contraseña). La sección de contraseña, entonces, **no
desaparece** cuando hay Google vinculado, y la pantalla de cuenta tiene que mostrar los dos métodos activos
con la posibilidad de desvincular Google. Eso también entra en el alcance a confirmar.
