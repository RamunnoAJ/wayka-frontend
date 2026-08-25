# Skeleton

Estado de carga. Reemplaza el contenido con bloques de la misma medida, nunca un spinner centrado.

```jsx
<Skeleton circle height={40} />
<SkeletonText lines={2} />
<Skeleton height={180} radius="var(--radius-lg)" />
```

Reglas:
- Mismas medidas y misma cantidad de elementos que el contenido real, para que no salte el layout.
- Como maximo 3-4 filas repetidas en una lista; mas es ruido.
- Nunca combinar skeleton y contenido real en el mismo bloque.
