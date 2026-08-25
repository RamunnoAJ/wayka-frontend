# Sheet

Panel que entra desde un borde. Se posiciona sobre el contenedor mas cercano con `position:relative`, asi funciona dentro del marco del telefono.

```jsx
<Sheet open={o} title="Filtrar agenda" onClose={close}
  footer={<Button block size="touch">Aplicar</Button>}>…</Sheet>
<Sheet open={o} side="right" title="Detalle" onClose={close}>…</Sheet>
```

Reglas:
- Movil: siempre `side="bottom"`, con la barra de arrastre visible y el boton principal a ancho completo.
- Web: `side="right"` para detalle o filtros; para confirmar una accion usar Dialog.
- Nunca anidar un Sheet dentro de otro.
