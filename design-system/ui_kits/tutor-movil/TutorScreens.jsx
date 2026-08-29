const { Button, Input, Card, Icon, Badge, CriticalPanel, AllergyChip, MedicationItem, TimelineEvent,
  DataField, AppointmentCard, EmptyState, Avatar, Tabs, PetHeader, StatusDot, SocialButton } = window.WaykaDesignSystem_51ee47;

const TUTOR_TABS=[{value:'mascotas',label:'Mis mascotas',icon:'paw-print'},{value:'agenda',label:'Citas',icon:'calendar-days'},{value:'perfil',label:'Perfil',icon:'user'}];

function TutorLogin({ onLogin }) {
  return (
    <div style={{ height:'100%', display:'grid', gridTemplateRows:'1fr auto', background:'var(--surface-nav)' }} data-surface="brand">
      <div style={{ display:'grid', placeItems:'center', padding:'32px', position:'relative', overflow:'hidden' }}>
        <img src="../../assets/wayka-isotipo.svg" alt="" style={{ position:'absolute', width:420, opacity:.12, bottom:-60, right:-120, filter:'var(--logo-on-nav-filter)' }} />
        <div style={{ display:'grid', gap:14, justifyItems:'center', textAlign:'center', zIndex:1 }}>
          <img src="../../assets/wayka-logo.svg" alt="Wayka" style={{ width:150, filter:'var(--logo-on-nav-filter)' }} />
          <p style={{ font:'var(--fw-medium) var(--fs-body-lg)/1.5 var(--font-sans)', color:'var(--text-on-nav-muted)', maxWidth:250 }}>
            La salud de tus mascotas, siempre a mano.
          </p>
        </div>
      </div>
      <div style={{ background:'var(--surface-card)', borderRadius:'26px 26px 0 0', padding:'26px var(--gutter-mobile) 30px', display:'grid', gap:'var(--space-5)' }}>
        <h1 style={{ font:'var(--text-h3)', color:'var(--text-strong)' }}>Ingresá a tu cuenta</h1>
        {/* Google arriba: camino mas corto primero, y deja "Entrar" como unico boton de relleno primario. */}
        <SocialButton onClick={onLogin} />
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          <span style={{ flex:1, height:1, background:'var(--border-default)' }} />
          <span style={{ font:'var(--fs-caption) var(--font-sans)', color:'var(--text-subtle)' }}>o con tu correo</span>
          <span style={{ flex:1, height:1, background:'var(--border-default)' }} />
        </div>
        <Input label="Correo" defaultValue="julia.fernandez@mail.com" icon="mail" />
        <Input label="Contraseña" type="password" defaultValue="········" icon="lock" />
        <Button block size="touch" onClick={onLogin}>Entrar</Button>
        <Button block size="touch" variant="ghost">Crear una cuenta</Button>
      </div>
    </div>
  );
}

function TutorPets({ onOpen }) {
  const pets = window.WaykaData.patients.slice(0,2);
  return (
    <div style={{ padding:'var(--gutter-mobile)', display:'grid', gap:'var(--space-5)' }}>
      <p style={{ font:'var(--text-body)', color:'var(--text-muted)' }}>Hola Julia 👋 acá está el resumen de tus mascotas.</p>
      {pets.map(p => {
        const activos = p.meds.filter(m=>m.status==='activo').length;
        return (
          <div key={p.id} onClick={()=>onOpen(p.id)} style={{ background:'var(--surface-card)', border:'1px solid var(--border-default)',
            borderRadius:'var(--radius-card)', padding:16, boxShadow:'var(--shadow-sm)', display:'grid', gap:14, cursor:'pointer' }}>
            <div style={{ display:'flex', gap:14, alignItems:'center' }}>
              <Avatar name={p.name} species={p.species} size="lg" />
              <div style={{ flex:1 }}>
                <div style={{ font:'var(--text-h4)', color:'var(--text-strong)' }}>{p.name}</div>
                <div style={{ font:'var(--fs-body-sm) var(--font-sans)', color:'var(--text-muted)' }}>{p.breed} · {p.age}</div>
              </div>
              <Icon name="chevron-right" size={20} style={{ color:'var(--text-subtle)' }} />
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {p.allergies.filter(a=>a.severity==='alta').map(a=><Badge key={a.label} tone="danger" icon="triangle-alert">{a.label}</Badge>)}
              {activos>0 && <Badge tone="primary" icon="pill">{activos===1?'1 medicación activa':activos+' medicaciones activas'}</Badge>}
              {!p.allergies.length && !activos && <Badge tone="success" icon="check">Todo al día</Badge>}
            </div>
          </div>
        );
      })}
      <Button block variant="secondary" size="touch" iconLeft="plus">Agregar mascota</Button>
    </div>
  );
}

function TutorPetDetail({ patient }) {
  const [tab,setTab] = React.useState('salud');
  const activos = patient.meds.filter(m=>m.status==='activo');
  return (
    <div style={{ paddingBottom:24 }}>
      <div data-surface="brand" style={{ background:'var(--surface-nav)', padding:'8px var(--gutter-mobile) 24px', color:'var(--text-on-nav)' }}>
        <div style={{ display:'flex', gap:14, alignItems:'center' }}>
          <span style={{ width:64, height:64, borderRadius:'var(--radius-lg)', background:'var(--surface-nav-item)', display:'grid', placeItems:'center' }}>
            <Icon name={patient.species==='felino'?'cat':'dog'} size={32} />
          </span>
          <div>
            <div style={{ font:'var(--fw-bold) var(--fs-h2) var(--font-display)' }}>{patient.name}</div>
            <div style={{ font:'var(--fs-body-sm) var(--font-sans)', color:'var(--text-on-nav-muted)' }}>{patient.breed} · {patient.sex} · {patient.age}</div>
          </div>
        </div>
      </div>
      <div style={{ padding:'var(--gutter-mobile)', display:'grid', gap:'var(--space-5)', marginTop:-14,
        background:'var(--surface-page)', borderRadius:'20px 20px 0 0', position:'relative' }}>
        <div style={{ display:'flex', gap:8, alignItems:'center', padding:'10px 12px', borderRadius:'var(--radius-md)',
          background:'var(--clinical-surface)', border:'1px solid var(--clinical-border)' }}>
          <Icon name="lock" size={14} style={{ color:'var(--clinical-accent)' }} />
          <span style={{ font:'var(--fs-caption) var(--font-sans)', color:'var(--text-muted)' }}>
            La información clínica la carga tu veterinaria. Podés verla, no modificarla.
          </span>
        </div>
        <CriticalPanel kind="allergy" title="Alergias" compact emptyLabel="Sin alergias registradas"
          items={patient.allergies.length ? [<div key="a" style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {patient.allergies.map(a=><AllergyChip key={a.label} label={a.label} severity={a.severity} />)}</div>] : []} />
        <CriticalPanel kind="medication" title="Medicación activa" compact emptyLabel="Sin medicación activa"
          items={activos.map(m=><MedicationItem key={m.name} {...m} />)} />
        <Tabs value={tab} onChange={setTab} items={[{value:'salud',label:'Historial'},{value:'datos',label:'Mis datos'}]} />
        {tab==='salud'
          ? (patient.events.length
              ? <Card padded={false}><div style={{ padding:16 }}>
                  {patient.events.slice(0,4).map((e,i)=>(
                    <TimelineEvent key={i} kind={e.kind} title={e.title} date={e.date} author={e.author}
                      attachments={e.attachments} last={i===Math.min(3,patient.events.length-1)}>{e.text}</TimelineEvent>))}
                </div></Card>
              : <EmptyState title="Sin eventos todavía" description="Cuando la veterinaria cargue una consulta, la vas a ver acá." />)
          : <Card padded={false}><div style={{ padding:'4px 16px' }}>
              <DataField label="Peso" value={patient.weight.replace(' kg','')} unit="kg" source="owner" editable onEdit={()=>{}} />
              <DataField label="Alimento habitual" value="Balanceado adulto light" source="owner" editable onEdit={()=>{}} />
              <DataField label="Mi teléfono" value={patient.ownerPhone} source="owner" editable onEdit={()=>{}} />
              <DataField label="Microchip" value={patient.chip} source="clinical" />
              <DataField label="Raza" value={patient.breed} source="clinical" />
            </div></Card>}
        <Button block variant="secondary" size="touch" iconLeft="paperclip">Subir un estudio o foto</Button>
      </div>
    </div>
  );
}

function TutorAgenda() {
  return (
    <div style={{ padding:'var(--gutter-mobile)', display:'grid', gap:'var(--space-5)' }}>
      <div style={{ display:'flex', gap:14 }}><StatusDot status="pendiente" label="Pendiente" /><StatusDot status="vencido" label="Vencida" /></div>
      <AppointmentCard status="vencido" time="15 abr · 09:30" title="Control post-quirúrgico" patient="Mora"
        actions={<Button size="sm" iconLeft="calendar-clock">Reagendar</Button>} />
      <AppointmentCard status="pendiente" time="17 abr · 10:00" title="Retiro de puntos" patient="Mora"
        actions={<Button size="sm" variant="secondary" iconLeft="check">Confirmar</Button>} />
      <AppointmentCard status="cumplido" time="12 mar · 11:00" title="Vacuna quíntuple" patient="Mora" />
      <Card>
        <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
          <Icon name="info" size={16} style={{ color:'var(--owner-accent)', marginTop:2 }} />
          <span style={{ font:'var(--text-body)', color:'var(--text-body)' }}>
            Para cancelar una cita con menos de 24 h de anticipación, comunicate con la clínica.
          </span>
        </div>
      </Card>
    </div>
  );
}

function TutorProfile() {
  return (
    <div style={{ padding:'var(--gutter-mobile)', display:'grid', gap:'var(--space-5)' }}>
      <Card>
        <div style={{ display:'flex', gap:14, alignItems:'center' }}>
          <Avatar name="Julia Fernández" size="lg" tone="brand" />
          <div><div style={{ font:'var(--text-h4)', color:'var(--text-strong)' }}>Julia Fernández</div>
            <div style={{ font:'var(--fs-body-sm) var(--font-sans)', color:'var(--text-muted)' }}>julia.fernandez@mail.com</div></div>
        </div>
      </Card>
      <Card title="Mis datos" tone="default" padded={false}>
        <div style={{ padding:'4px 16px' }}>
          <DataField label="Teléfono" value="+54 9 11 5555-2020" source="owner" editable onEdit={()=>{}} />
          <DataField label="Dirección" value="Bulnes 1240, CABA" source="owner" editable onEdit={()=>{}} />
        </div>
      </Card>
      <Card title="Mi veterinaria" tone="sunken">
        <div style={{ font:'var(--text-body-strong)', color:'var(--text-strong)' }}>Veterinaria San Roque</div>
        <div style={{ font:'var(--fs-body-sm) var(--font-sans)', color:'var(--text-muted)' }}>Av. Rivadavia 4820, CABA</div>
      </Card>
      <Button block variant="secondary" size="touch" iconLeft="log-out">Cerrar sesión</Button>
    </div>
  );
}
Object.assign(window, { TutorLogin, TutorPets, TutorPetDetail, TutorAgenda, TutorProfile, TUTOR_TABS });
