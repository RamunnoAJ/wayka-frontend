const { Button, Input, Checkbox } = window.WaykaDesignSystem_51ee47;

function LoginScreen({ onLogin }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', height:'100%', background:'var(--surface-card)' }}>
      <div style={{ display:'grid', placeItems:'center', padding:'40px' }}>
        <div style={{ width:'100%', maxWidth:360, display:'grid', gap:'var(--space-7)' }}>
          <img src="../../assets/wayka-logo.svg" alt="Wayka" style={{ width:140, color:'var(--wayka-violeta-oscuro)' }} />
          <div style={{ display:'grid', gap:6 }}>
            <h1 style={{ font:'var(--text-h1)', color:'var(--text-strong)' }}>Entrá a tu clínica</h1>
            <p style={{ font:'var(--text-body-lg)', color:'var(--text-muted)' }}>Historial y agenda de Veterinaria San Roque.</p>
          </div>
          <div style={{ display:'grid', gap:'var(--space-5)' }}>
            <Input label="Correo profesional" defaultValue="a.rossi@sanroque.vet" icon="mail" />
            <Input label="Contraseña" type="password" defaultValue="········" icon="lock" />
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <Checkbox label="Mantener sesión" checked onChange={()=>{}} />
              <a href="#" style={{ font:'var(--fw-semibold) var(--fs-body-sm) var(--font-sans)' }}>Olvidé mi contraseña</a>
            </div>
            <Button block size="lg" onClick={onLogin}>Ingresar</Button>
          </div>
          <p style={{ font:'var(--fs-caption) var(--font-sans)', color:'var(--text-subtle)' }}>
            ¿Sos tutor de una mascota? Wayka para tutores está disponible solo en la app móvil.
          </p>
        </div>
      </div>
      <div style={{ background:'var(--wayka-lila)', display:'grid', placeItems:'center', padding:40, position:'relative', overflow:'hidden' }}>
        <img src="../../assets/wayka-isotipo.svg" alt="" style={{ position:'absolute', width:620, opacity:.14, right:-160, bottom:-120, filter:'brightness(0) invert(1)' }} />
        <blockquote style={{ maxWidth:380, color:'#fff', display:'grid', gap:16, zIndex:1 }}>
          <p style={{ font:'var(--fw-bold) var(--fs-display-md)/1.15 var(--font-display)', letterSpacing:'var(--ls-display)' }}>
            La historia clínica completa, en el momento en que hace falta.
          </p>
          <span style={{ font:'var(--text-body)', color:'rgba(255,255,255,.78)' }}>Alergias y medicación activa, siempre primero.</span>
        </blockquote>
      </div>
    </div>
  );
}
Object.assign(window, { LoginScreen });
