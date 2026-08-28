Un archivo adjunto, en curso o terminado. **La barra de progreso va acá adentro**, nunca suelta en la pantalla.

```jsx
<UploadItem name="ecografia-mora.pdf" size="2,4 MB" type="estudio" status="subiendo" progress={45} />
<UploadItem name="herida-dia3.jpg" size="1,1 MB" type="foto" status="listo" onRemove={retirar} />
<UploadItem name="analisis.pdf" size="14 MB" type="pdf" status="fallo"
  errorMessage="Supera el límite de 10 MB" onRetry={reintentar} onRemove={descartar} />
<UploadItem name="radiografia.jpg" size="3,0 MB" type="foto" owner="other" ownerName="Dra. A. Rossi" />
```

**Tipo declarado.** `type` es lo que la UI le declara al backend (foto / pdf / estudio); el backend valida
el MIME real contra ese valor. El ícono sigue el criterio del catálogo clínico: foto `image`, pdf `file-text`,
estudio `microscope`.

**No hay reemplazar.** Un adjunto se retira y se sube otro. `onRemove` es la única mutación; mientras
`status="subiendo"` la misma acción cancela.

**Adjunto ajeno.** Con `owner="other"` el ítem se ve completo — mismo fondo, mismo contraste de texto — y
lo único que cambia es que no hay acción de retirar y aparece la autoría. No se baja la opacidad ni se
tiñe de gris: eso lo haría leer como deshabilitado por error en lugar de "no es tuyo".
