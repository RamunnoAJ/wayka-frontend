Cámara **dentro** de la app, no el picker del sistema. Existe por una razón concreta: la foto clínica
necesita guía de encuadre y un paso de revisión antes de subir. Es el paso previo a `UploadItem`.

```jsx
<CameraCapture status="listo" mode="foto" title="Herida · Mora"
  onCapture={tomar} onClose={cerrar} onFlip={girar} onGallery={abrirCarrete} onModeChange={setMode} />

<CameraCapture status="revisando" previewSrc={toma} onRetake={volver} onConfirm={adjuntar} />
<CameraCapture status="sin-permiso" onOpenSettings={abrirAjustes} onClose={cerrar} />
```

**Superficie.** El visor es `--surface-nav-deep` con `data-surface="dark"`: la misma superficie oscura que
la navegación y el `Toast`, así que el foco visible pasa a blanco solo. Los controles flotan encima en
blancos translúcidos de la nav (`--surface-nav-item`, `--border-on-nav`) con blur — nada de tarjetas ni
paneles opacos sobre la imagen. Los dos degradados de arriba y abajo salen del propio token de superficie,
no de un negro nuevo.

**El acento hace el trabajo de estado.** El único color saturado es `--nav-accent` (lila en clínica,
naranja claro en tutor): modo activo, esquinas del encuadre, flash encendido, contador del carrete y el
botón "Usar foto". El obturador queda blanco — es la convención de cámara y no compite con el acento.

**Modos.** `foto` no dibuja guía: el encuadre lo decide quien saca la foto. `documento` sí, con **cuatro
esquinas y nada más** — un rectángulo cerrado se lee como recorte ya aplicado. Cada modo trae su propia
ayuda de encuadre en una línea ("Apoyá la ficha en una superficie plana"), reemplazable con `hint`.

**Revisión obligatoria.** Al capturar, el componente pasa a `revisando`: la toma congelada, dos acciones de
igual peso (`Repetir` translúcido, `Usar foto` en acento) y **el selector de modo desaparece** — ya no hay
nada que configurar. `procesando` deja los dos botones visibles pero inertes con el spinner en el de
confirmar: nunca se saca el botón de debajo del dedo.

**Sin permiso.** Mismo criterio que `PermissionCard`: fondo translúcido neutro, **no rojo** — nadie se
equivocó —, nombra la consecuencia real (se puede adjuntar del carrete, no tomar una foto nueva) y ofrece
los ajustes del teléfono como texto, no como botón de relleno. No vuelve a pedir el permiso.

`previewSrc` es el único punto de contacto con la plataforma: en React Native va el fotograma de
`expo-camera`, en web un `<video>` montado por el consumidor en el mismo hueco.
