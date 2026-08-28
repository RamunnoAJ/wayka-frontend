const { Button, Card, Icon, FileDropzone, UploadItem, PermissionCard, Badge } = window.WaykaDesignSystem_51ee47;

const PASOS = ['elegir','subiendo','listo','fallo'];
const PASO_CAP = { elegir:'1 · Elegir', subiendo:'2 · Subiendo', listo:'3 · Listo', fallo:'4 · Falló (413)' };

/** Subida de un adjunto de punta a punta. Un archivo por vez, tipo declarado, límite a la vista. */
function TutorUpload({ paso='elegir' }) {
  const subiendo = paso === 'subiendo';
  return (
    <div style={{ padding:'var(--gutter-mobile)', display:'grid', gap:'var(--space-5)', alignContent:'start' }}>
      <div style={{ display:'flex', gap:10, alignItems:'center' }}>
        <span style={{ width:38, height:38, borderRadius:'var(--radius-md)', display:'grid', placeItems:'center',
          background:'var(--color-primary-soft)', color:'var(--color-primary-strong)' }}><Icon name="dog" size={19} /></span>
        <div>
          <div style={{ font:'var(--text-body-strong)', color:'var(--text-strong)' }}>Subir a la ficha de Mora</div>
          <div style={{ font:'var(--fs-caption) var(--font-sans)', color:'var(--text-muted)' }}>Un archivo por vez</div>
        </div>
      </div>

      {paso === 'elegir' && (
        <div style={{ display:'grid', gap:10 }}>
          {/* Dos entradas = dos tipos declarados. El backend valida el MIME contra lo declarado. */}
          <FileDropzone type="foto" dragDrop={false} maxSizeMB={10} title="Tomar o elegir una foto" onPick={()=>{}} />
          <FileDropzone type="pdf" dragDrop={false} maxSizeMB={10} title="Adjuntar un PDF" onPick={()=>{}} />
        </div>
      )}

      {subiendo && (
        <div style={{ display:'grid', gap:10 }}>
          <UploadItem name="ficha-vacunacion.jpg" size="1,8 MB" type="foto" status="subiendo" progress={45} onRemove={()=>{}} />
          <FileDropzone type="foto" dragDrop={false} title="Tomar o elegir una foto" disabled />
        </div>
      )}

      {paso === 'listo' && (
        <div style={{ display:'grid', gap:10 }}>
          <UploadItem name="ficha-vacunacion.jpg" size="1,8 MB" type="foto" status="listo" onRemove={()=>{}} />
          {/* Adjunto de la clínica: se ve completo, con autoría, y sin acción de retirar. */}
          <UploadItem name="radiografia-torax.jpg" size="3,0 MB" type="foto" owner="other" ownerName="Dra. A. Rossi" />
          <div style={{ display:'flex', gap:9, alignItems:'flex-start', padding:'10px 12px', borderRadius:'var(--radius-md)',
            background:'var(--clinical-surface)', border:'1px solid var(--clinical-border)' }}>
            <Icon name="info" size={14} style={{ color:'var(--clinical-accent)', marginTop:2 }} />
            <span style={{ font:'var(--fs-caption)/1.5 var(--font-sans)', color:'var(--text-muted)' }}>
              Tu veterinaria lo ve en la ficha. Un adjunto no se edita: si te equivocaste, retiralo y subí otro.
            </span>
          </div>
          <Button block size="touch">Volver a la ficha</Button>
        </div>
      )}

      {paso === 'fallo' && (
        <div style={{ display:'grid', gap:10 }}>
          <UploadItem name="estudio-completo.pdf" size="14 MB" type="pdf" status="fallo"
            errorMessage="Supera el límite de 10 MB" onRetry={()=>{}} onRemove={()=>{}} />
          <FileDropzone type="pdf" dragDrop={false} maxSizeMB={10} title="Adjuntar otro PDF" onPick={()=>{}} />
        </div>
      )}
    </div>
  );
}

/** Pantalla Avisos: informativa, con la PermissionCard como única acción. */
function TutorAvisos({ permiso='sin-preguntar' }) {
  return (
    <div style={{ padding:'var(--gutter-mobile)', display:'grid', gap:'var(--space-5)', alignContent:'start' }}>
      <PermissionCard status={permiso} onAsk={()=>{}} onDismiss={()=>{}} onOpenSettings={()=>{}} />
      <Card title="Recordatorio de turno">
        <div style={{ display:'grid', gap:8 }}>
          <span style={{ font:'var(--text-body)', color:'var(--text-body)' }}>
            El día anterior a cada turno, a las 18 h. Si la clínica reprograma, te llega el aviso del cambio.
          </span>
          <div><Badge tone="neutral" icon="clock">1 día antes</Badge></div>
        </div>
      </Card>
      <Card title="Novedades en la ficha">
        <div style={{ display:'grid', gap:8 }}>
          <span style={{ font:'var(--text-body)', color:'var(--text-body)' }}>
            Cuando tu veterinaria carga una consulta, una vacuna o un estudio en la ficha de tu mascota.
          </span>
          <div><Badge tone="neutral" icon="stethoscope">Al cargarse</Badge></div>
        </div>
      </Card>
      <p style={{ font:'var(--fs-caption)/1.5 var(--font-sans)', color:'var(--text-subtle)' }}>
        Los avisos los manda el sistema. No hay lista de avisos enviados.
      </p>
    </div>
  );
}
Object.assign(window, { TutorUpload, TutorAvisos, PASOS, PASO_CAP });
