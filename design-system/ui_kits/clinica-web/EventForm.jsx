const { Dialog, Button, Input, Select, Textarea, Checkbox, Badge, Icon, FileDropzone, UploadItem } = window.WaykaDesignSystem_51ee47;

const TIPOS_ADJUNTO = [['estudio','microscope','Estudio'],['foto','image','Foto'],['pdf','file-text','PDF']];

/** Bloque de adjuntos del evento clinico. El tipo se DECLARA arriba: una zona por tipo. */
function AttachmentBlock() {
  const [tipo, setTipo] = React.useState('estudio');
  const [drag, setDrag] = React.useState('idle');
  return (
    <div style={{ display:'grid', gap:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
        <span style={{ font:'var(--fw-semibold) var(--fs-body-sm) var(--font-sans)', color:'var(--text-muted)' }}>Adjuntos</span>
        <div style={{ display:'flex', gap:6 }}>
          {TIPOS_ADJUNTO.map(([v,ic,l]) => (
            <button key={v} onClick={()=>{setTipo(v);setDrag('idle');}} style={{ display:'inline-flex', alignItems:'center', gap:6,
              padding:'5px 11px', borderRadius:'var(--radius-pill)', cursor:'pointer',
              border:'1px solid '+(tipo===v?'var(--border-brand)':'var(--border-default)'),
              background: tipo===v ? 'var(--color-primary-soft)' : 'var(--surface-card)',
              color: tipo===v ? 'var(--color-primary-strong)' : 'var(--text-muted)',
              font:'var(--fw-semibold) var(--fs-caption) var(--font-sans)', transition:'var(--transition-control)' }}>
              <Icon name={ic} size={13} />{l}
            </button>
          ))}
        </div>
      </div>
      <div onDragOver={e=>{e.preventDefault();setDrag('over');}} onDragLeave={()=>setDrag('idle')}
        onDrop={e=>{e.preventDefault();setDrag('idle');}}>
        <FileDropzone type={tipo} maxSizeMB={10} state={drag} onPick={()=>{}} />
      </div>
      <div style={{ display:'grid', gap:8 }}>
        <UploadItem name="ecografia-abdominal.pdf" size="2,4 MB" type="estudio" status="subiendo" progress={62} onRemove={()=>{}} />
        <UploadItem name="cicatriz-control.jpg" size="1,1 MB" type="foto" status="listo" onRemove={()=>{}} />
        <UploadItem name="laboratorio-abril.pdf" size="14 MB" type="pdf" status="fallo"
          errorMessage="Supera el límite de 10 MB" onRetry={()=>{}} onRemove={()=>{}} />
        {/* Lo subio el tutor: se ve completo, con autoria, y esta vet no lo puede retirar. */}
        <UploadItem name="ficha-vacunacion.jpg" size="1,8 MB" type="foto" owner="other" ownerName="Julia Fernández (tutora)" />
      </div>
    </div>
  );
}

function EventFormDialog({ open, onClose, onSave, patientName }) {
  const [kind, setKind] = React.useState('consulta');
  const [notify, setNotify] = React.useState(true);
  return (
    <Dialog open={open} onClose={onClose} width={620}
      title="Cargar evento clínico"
      description={`Paciente: ${patientName} · queda firmado a tu nombre`}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" iconLeft="check" onClick={onSave}>Guardar evento</Button>
      </>}>
      <div style={{ display:'grid', gap:'var(--space-5)' }}>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {[['consulta','stethoscope','Consulta'],['vacuna','syringe','Vacuna'],['cirugia','scissors','Cirugía'],['estudio','microscope','Estudio'],['nota','notebook-pen','Nota']].map(([v,ic,l]) => (
            <button key={v} onClick={()=>setKind(v)} style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'8px 14px',
              borderRadius:'var(--radius-pill)', cursor:'pointer',
              border:'1px solid '+(kind===v?'transparent':'var(--border-default)'),
              background: kind===v ? 'var(--color-primary-strong)' : 'var(--surface-card)',
              color: kind===v ? '#fff' : 'var(--text-muted)',
              font:'var(--fw-semibold) var(--fs-body-sm) var(--font-sans)', transition:'var(--transition-control)' }}>
              <Icon name={ic} size={14} />{l}
            </button>
          ))}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-5)' }}>
          <Input label="Título del evento" defaultValue="Control post-quirúrgico" />
          <Input label="Fecha" type="date" defaultValue="2026-04-15" />
          <Input label="Peso" suffix="kg" defaultValue="8,4" icon="scale" />
          <Input label="Temperatura" suffix="°C" defaultValue="38,9" icon="thermometer" />
        </div>
        <Textarea label="Observaciones" rows={4} defaultValue="Cicatriz limpia, sin secreción. Retiro de puntos en 5 días." />
        <Select label="Adjuntar a medicación existente" options={['—','Meloxicam 0,1 mg/kg','Amoxicilina 15 mg/kg']} />
        <div style={{ height:1, background:'var(--border-subtle)' }} />
        <AttachmentBlock />
        <div style={{ display:'flex', gap:10, alignItems:'center', padding:'12px 14px', borderRadius:'var(--radius-md)',
          background:'var(--clinical-surface)', border:'1px solid var(--clinical-border)' }}>
          <Badge tone="primary" icon="shield-check">Dato clínico</Badge>
          <span style={{ font:'var(--fs-body-sm) var(--font-sans)', color:'var(--text-muted)' }}>
            El tutor lo verá en modo lectura, sin poder editarlo.
          </span>
        </div>
        <Checkbox label="Notificar al tutor" description="Julia Fernández recibe un aviso en la app" checked={notify} onChange={()=>setNotify(!notify)} />
      </div>
    </Dialog>
  );
}
Object.assign(window, { EventFormDialog, AttachmentBlock });
