Avance de una tarea larga. Dentro de una subida va **adentro de `UploadItem`**, nunca suelta.

```jsx
<ProgressBar value={45} showValue />
<ProgressBar indeterminate />
```

Determinada cuando el peso del archivo se conoce y la subida dura lo suficiente para que el numero
signifique algo; indeterminada cuando no (un PDF chico llega antes de poder dibujar el 30 %).
`tone="danger"` solo para congelar la barra en el punto donde fallo, junto al mensaje de error.
