const { PetHeader, Button, IconButton, Card, Tabs, CriticalPanel, AllergyChip, MedicationItem,
  TimelineEvent, DataField, EmptyState } = window.WaykaDesignSystem_51ee47;

function PatientDetail({ patient, onBack, onNewEvent }) {
  const [tab, setTab] = React.useState('historial');
  const activos = patient.meds.filter(m => m.status === 'activo');
  return (
    <div style={{ display:'grid', gap:'var(--space-7)' }}>
      <button onClick={onBack} style={{ justifySelf:'start', display:'inline-flex', alignItems:'center', gap:6, border:0,
        background:'transparent', cursor:'pointer', color:'var(--text-accent)', font:'var(--fw-semibold) var(--fs-body-sm) var(--font-sans)' }}>
        ← Pacientes
      </button>

      <PetHeader name={patient.name} species={patient.species} breed={patient.breed} sex={patient.sex}
        age={patient.age} weight={patient.weight} chip={patient.chip} owner={patient.owner}
        actions={<>
          <Button variant="secondary" iconLeft="calendar-plus">Agendar</Button>
          <Button variant="primary" iconLeft="plus" onClick={onNewEvent}>Cargar evento</Button>
        </>} />

      {/* Datos criticos: siempre por encima del historial */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1.4fr', gap:'var(--space-5)', alignItems:'start' }}>
        <CriticalPanel kind="allergy" title="Alergias" emptyLabel="Sin alergias registradas"
          items={patient.allergies.length ? [
            <div key="a" style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {patient.allergies.map(a => <AllergyChip key={a.label} label={a.label} severity={a.severity} />)}
            </div>] : []} />
        <CriticalPanel kind="medication" title="Medicación activa" emptyLabel="Sin medicación activa"
          items={activos.map(m => (
            <MedicationItem key={m.name} {...m} action={<IconButton icon="more-horizontal" label="Acciones" size="sm" />} />
          ))} />
      </div>

      <Tabs value={tab} onChange={setTab} items={[
        { value:'historial', label:'Historial', count: patient.events.length },
        { value:'medicacion', label:'Medicación', count: patient.meds.length },
        { value:'datos', label:'Datos' },
        { value:'adjuntos', label:'Adjuntos' },
      ]} />

      {tab === 'historial' && (
        <div style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:'var(--space-7)', alignItems:'start' }}>
          <Card title="Historial clínico" action={<Button variant="ghost" size="sm" iconLeft="filter">Filtrar</Button>}>
            {patient.events.length === 0
              ? <EmptyState title="Todavía no hay eventos" description="Cargá la primera consulta de este paciente."
                  action={<Button variant="primary" iconLeft="plus" onClick={onNewEvent}>Cargar evento</Button>} />
              : patient.events.map((e,i) => (
                <TimelineEvent key={i} kind={e.kind} title={e.title} date={e.date} author={e.author}
                  attachments={e.attachments} last={i === patient.events.length-1}>{e.text}</TimelineEvent>
              ))}
          </Card>
          <div style={{ display:'grid', gap:'var(--space-7)', paddingTop:4 }}>
            <section style={{ display:'grid', gap:8 }}>
              <h3 style={{ font:'var(--fw-bold) var(--fs-overline) var(--font-sans)', letterSpacing:'var(--ls-overline)',
                textTransform:'uppercase', color:'var(--text-subtle)' }}>Tutor</h3>
              <div style={{ display:'grid', gap:2 }}>
                <span style={{ font:'var(--text-body-strong)', color:'var(--text-strong)' }}>{patient.owner}</span>
                <span style={{ font:'var(--text-body)', color:'var(--text-muted)' }}>{patient.ownerPhone}</span>
              </div>
              <div style={{ display:'flex', gap:8, marginTop:6 }}>
                <Button size="sm" variant="secondary" iconLeft="message-circle">Mensaje</Button>
                <Button size="sm" variant="ghost" iconLeft="phone">Llamar</Button>
              </div>
            </section>
            <section style={{ display:'grid', gap:8, borderTop:'1px solid var(--border-subtle)', paddingTop:'var(--space-6)' }}>
              <h3 style={{ font:'var(--fw-bold) var(--fs-overline) var(--font-sans)', letterSpacing:'var(--ls-overline)',
                textTransform:'uppercase', color:'var(--text-subtle)' }}>Próxima cita</h3>
              <div style={{ display:'flex', gap:9, alignItems:'baseline' }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--appt-pending)', transform:'translateY(-2px)' }} />
                <span style={{ font:'var(--text-body)', color:'var(--text-body)' }}>Retiro de puntos · 17 mar, 10:00</span>
              </div>
            </section>
          </div>
        </div>
      )}

      {tab === 'medicacion' && (
        <Card title="Todas las medicaciones" action={<Button size="sm" variant="primary" iconLeft="plus">Indicar medicación</Button>}>
          <div style={{ display:'grid', gap:10 }}>
            {patient.meds.map(m => <MedicationItem key={m.name} {...m}
              action={<Badge tone={m.status==='activo'?'success':'neutral'} size="sm">{m.status}</Badge>} />)}
          </div>
        </Card>
      )}

      {tab === 'datos' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-7)', alignItems:'start' }}>
          <Card title="Datos clínicos" tone="default">
            <DataField label="Especie" value={patient.species === 'canino' ? 'Canino' : 'Felino'} source="clinical" />
            <DataField label="Raza" value={patient.breed} source="clinical" />
            <DataField label="Sexo" value={patient.sex} source="clinical" />
            <DataField label="Microchip" value={patient.chip} source="clinical" />
          </Card>
          <Card title="Datos del tutor">
            <DataField label="Peso registrado en casa" value={patient.weight.replace(' kg','')} unit="kg" source="owner" editable onEdit={()=>{}} />
            <DataField label="Teléfono" value={patient.ownerPhone} source="owner" editable onEdit={()=>{}} />
            <DataField label="Alimento habitual" value="Balanceado adulto light" source="owner" editable onEdit={()=>{}} />
          </Card>
        </div>
      )}

      {tab === 'adjuntos' && (
        <Card title="Adjuntos">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
            {['Ecografía abdominal','Hemograma 26/02','Consentimiento quirúrgico','Radiografía tórax'].map(n => (
              <div key={n} style={{ border:'1px solid var(--border-default)', borderRadius:'var(--radius-md)', overflow:'hidden' }}>
                <div style={{ height:96, background:'var(--surface-sunken)', display:'grid', placeItems:'center', color:'var(--text-subtle)' }}>PDF</div>
                <div style={{ padding:'10px 12px', font:'var(--fs-body-sm) var(--font-sans)', color:'var(--text-body)' }}>{n}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
Object.assign(window, { PatientDetail });
