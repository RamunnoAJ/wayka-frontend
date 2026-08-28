Punto de entrada de un adjunto. **Web** (veterinario, formulario de evento): zona de arrastre + selector
clásico. **Nativo** (tutor): `dragDrop={false}` y queda un botón `size="touch"` con la misma etiqueta de
límite debajo.

```jsx
<FileDropzone type="estudio" maxSizeMB={10} onPick={abrirSelector} />
<FileDropzone type="foto" state="over" />
<FileDropzone type="pdf" state="rejected" rejectedReason="Solo PDF acá. Para una foto usá “Adjuntar foto”." />
<FileDropzone type="foto" dragDrop={false} title="Tomar o elegir una foto" onPick={abrirCamara} />
```

**Una zona por tipo declarado.** `type` es lo que se le declara al backend; el backend valida el MIME real
contra ese valor, así que no hay zona "cualquier archivo" que infiera el tipo. Cuando hacen falta varios
tipos, la composición pone el selector de tipo arriba (ver el bloque de adjuntos en clinica-web).

**El límite se lee antes de elegir.** `maxSizeMB` está siempre a la vista en reposo — el 413 del backend no
puede ser el primer lugar donde el usuario se enteró de cuánto pesa demasiado. `state="rejected"` es para lo
que se puede detectar en el cliente (extensión, peso del `File`); el fallo del servidor se muestra en el
`UploadItem`, no acá.

Estados: reposo / arrastre encima (borde y tinte primarios, "Soltá para adjuntar") / rechazado (borde y
tinte danger, motivo en lugar del título, con el límite todavía visible).
