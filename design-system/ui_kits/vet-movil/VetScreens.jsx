const { MobileHeader, MobileTabBar, SearchField, PatientRow, CriticalPanel, AllergyChip, MedicationItem,
  TimelineEvent, PetHeader, Button, IconButton, Card, Tabs, AppointmentCard, StatusDot, Badge, EmptyState,
  Input, Textarea, Icon, Toast, DataField } = window.WaykaDesignSystem_51ee47;

const TABS=[{value:'agenda',label:'Agenda',icon:'calendar-days'},{value:'pacientes',label:'Pacientes',icon:'paw-print'},{value:'cargar',label:'Cargar',icon:'plus-circle'},{value:'perfil',label:'Perfil',icon:'user'}];

function VetAgenda({ onOpen }) {
  const agenda = window.WaykaData.agenda;
  return (
    <div style={{ padding:'var(--gutter-mobile)', display:'grid', gap:'var(--space-5)' }}>
      <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
        <StatusDot status="pendiente" label="3 pendientes" />
        <StatusDot status="vencido" label="1 vencida" />
      </div>
      <div style={{ display:'grid', gap:10 }}>
        {agenda.map(a => (
          <AppointmentCard key={a.time} status={a.status} time={a.time} title={a.title} patient={a.patient} vet={a.vet}
            actions={<IconButton icon="chevron-right" label="Abrir" size="sm" onClick={()=>onOpen('p1')} />} />
        ))}
      </div>
    </div>
  );
}

function VetPatients({ onOpen }) {
  const [q,setQ] = React.useState('');
  const list = window.WaykaData.patients.filter(p => (p.name+p.owner).toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <div style={{ padding:'var(--gutter-mobile)', paddingBottom:12 }}>
        <SearchField size="lg" value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar paciente o tutor" />
      </div>
      <div style={{ background:'var(--surface-card)', borderTop:'1px solid var(--border-subtle)' }}>
        {list.length===0
          ? <EmptyState icon="search-x" title="Sin resultados" />
          : list.map(p => (
            <div key={p.id} onClick={()=>onOpen(p.id)} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px var(--gutter-mobile)', borderBottom:'1px solid var(--border-subtle)' }}>
              <span style={{ width:44, height:44, borderRadius:'var(--radius-md)', background:'var(--surface-accent-soft)', color:'var(--color-primary-strong)', display:'grid', placeItems:'center', flex:'0 0 auto' }}>
                <Icon name={p.species==='felino'?'cat':'dog'} size={22} />
              </span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ font:'var(--text-body-strong)', color:'var(--text-strong)' }}>{p.name}</div>
                <div style={{ font:'var(--fs-caption) var(--font-sans)', color:'var(--text-subtle)' }}>{p.breed} · {p.owner}</div>
              </div>
              <div style={{ display:'flex', gap:5 }}>
                {p.allergies.some(a=>a.severity==='alta') && <Badge tone="danger" size="sm" icon="triangle-alert">Alergia</Badge>}
                {p.meds.some(m=>m.status==='activo') && <Badge tone="primary" size="sm" icon="pill">{p.meds.filter(m=>m.status==='activo').length}</Badge>}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

function VetPatientDetail({ patient }) {
  const [tab,setTab] = React.useState('critico');
  const activos = patient.meds.filter(m=>m.status==='activo');
  return (
    <div style={{ paddingBottom:20 }}>
      <div style={{ padding:'var(--gutter-mobile)', background:'var(--surface-card)', borderBottom:'1px solid var(--border-subtle)' }}>
        <PetHeader size="md" name={patient.name} species={patient.species} breed={patient.breed} sex={patient.sex}
          age={patient.age} weight={patient.weight} owner={patient.owner} />
      </div>
      <div style={{ padding:'var(--gutter-mobile)', display:'grid', gap:'var(--space-5)' }}>
        <CriticalPanel kind="allergy" title="Alergias" compact emptyLabel="Sin alergias registradas"
          items={patient.allergies.length ? [<div key="a" style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {patient.allergies.map(a=><AllergyChip key={a.label} label={a.label} severity={a.severity} />)}</div>] : []} />
        <CriticalPanel kind="medication" title="Medicación activa" compact emptyLabel="Sin medicación activa"
          items={activos.map(m=><MedicationItem key={m.name} {...m} />)} />
        <Tabs value={tab} onChange={setTab} items={[{value:'critico',label:'Historial'},{value:'datos',label:'Datos'}]} />
        {tab==='critico'
          ? <div>{patient.events.map((e,i)=>(
              <TimelineEvent key={i} kind={e.kind} title={e.title} date={e.date} author={e.author}
                attachments={e.attachments} last={i===patient.events.length-1}>{e.text}</TimelineEvent>))}</div>
          : <Card padded={false}><div style={{ padding:'4px 16px' }}>
              <DataField label="Microchip" value={patient.chip} source="clinical" />
              <DataField label="Peso en casa" value={patient.weight.replace(' kg','')} unit="kg" source="owner" editable onEdit={()=>{}} />
              <DataField label="Teléfono" value={patient.ownerPhone} source="owner" editable onEdit={()=>{}} />
            </div></Card>}
      </div>
      <div style={{ position:'sticky', bottom:0, padding:'var(--gutter-mobile)', background:'linear-gradient(to top, var(--surface-page) 65%, transparent)' }}>
        <Button block size="touch" variant="primary" iconLeft="plus">Cargar evento</Button>
      </div>
    </div>
  );
}

function VetQuickForm({ onSave }) {
  const [kind,setKind] = React.useState('consulta');
  return (
    <div style={{ padding:'var(--gutter-mobile)', display:'grid', gap:'var(--space-5)' }}>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {[['consulta','stethoscope','Consulta'],['vacuna','syringe','Vacuna'],['estudio','microscope','Estudio'],['nota','notebook-pen','Nota']].map(([v,ic,l])=>(
          <button key={v} onClick={()=>setKind(v)} style={{ display:'inline-flex', alignItems:'center', gap:7, minHeight:44, padding:'0 16px',
            borderRadius:'var(--radius-pill)', cursor:'pointer',
            border:'1px solid '+(kind===v?'transparent':'var(--border-default)'),
            background: kind===v?'var(--color-primary-strong)':'var(--surface-card)',
            color: kind===v?'#fff':'var(--text-muted)', font:'var(--fw-semibold) var(--fs-body-sm) var(--font-sans)' }}>
            <Icon name={ic} size={15} />{l}
          </button>))}
      </div>
      <Input label="Paciente" defaultValue="Mora · Julia Fernández" icon="paw-print" />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <Input label="Peso" suffix="kg" defaultValue="8,4" />
        <Input label="Temp." suffix="°C" defaultValue="38,9" />
      </div>
      <Textarea label="Observaciones" rows={5} placeholder="Motivo, hallazgos, indicaciones…" />
      <Button block size="touch" variant="primary" iconLeft="check" onClick={onSave}>Guardar evento</Button>
    </div>
  );
}

function VetProfile() {
  return (
    <div style={{ padding:'var(--gutter-mobile)', display:'grid', gap:'var(--space-5)' }}>
      <Card>
        <div style={{ display:'flex', gap:14, alignItems:'center' }}>
          <span style={{ width:56, height:56, borderRadius:'50%', background:'var(--wayka-naranja)', color:'#fff', display:'grid', placeItems:'center', font:'var(--fw-bold) 20px var(--font-sans)' }}>AR</span>
          <div>
            <div style={{ font:'var(--text-h4)', color:'var(--text-strong)' }}>Ana Rossi</div>
            <div style={{ font:'var(--fs-body-sm) var(--font-sans)', color:'var(--text-muted)' }}>Veterinaria · MP 4821</div>
          </div>
        </div>
      </Card>
      <Card title="Veterinaria San Roque" tone="sunken">
        <div style={{ font:'var(--text-body)', color:'var(--text-muted)' }}>Av. Rivadavia 4820, CABA</div>
      </Card>
      <Button block variant="secondary" size="touch" iconLeft="log-out">Cerrar sesión</Button>
    </div>
  );
}
Object.assign(window, { VetAgenda, VetPatients, VetPatientDetail, VetQuickForm, VetProfile, VET_TABS: TABS });
