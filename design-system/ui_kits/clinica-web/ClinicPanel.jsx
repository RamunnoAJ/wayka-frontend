const { PageHeader, Button, Card, Badge, Avatar, IconButton, Input, Switch, DataField } = window.WaykaDesignSystem_51ee47;

function ClinicPanel() {
  const staff = window.WaykaData.staff;
  const [notif, setNotif] = React.useState(true);
  return (
    <div>
      <PageHeader title="Panel de clínica" subtitle="Veterinaria San Roque · datos administrativos y equipo"
        actions={<Button iconLeft="user-plus">Invitar veterinario</Button>} />
      <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:'var(--space-7)', alignItems:'start' }}>
        <Card title="Equipo" padded={false} action={<Badge tone="neutral">{staff.filter(s=>s.active).length} activos</Badge>}>
          {staff.map(s => (
            <div key={s.email} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px',
              borderBottom:'1px solid var(--border-subtle)', opacity: s.active ? 1 : .55 }}>
              <Avatar name={s.name} size="md" />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ font:'var(--text-body-strong)', color:'var(--text-strong)' }}>{s.name}</div>
                <div style={{ font:'var(--fs-caption) var(--font-sans)', color:'var(--text-subtle)' }}>{s.email}</div>
              </div>
              <span style={{ flex:'0 0 90px', font:'var(--fs-body-sm) var(--font-sans)', color:'var(--text-muted)' }}>{s.matricula}</span>
              <Badge tone={s.role === 'Clínica admin' ? 'accent' : 'neutral'}>{s.role}</Badge>
              {!s.active && <Badge tone="warning" size="sm">Inactivo</Badge>}
              <IconButton icon="more-horizontal" label="Acciones" size="sm" />
            </div>
          ))}
        </Card>
        <div style={{ display:'grid', gap:'var(--space-5)' }}>
          <Card title="Datos de la clínica">
            <div style={{ display:'grid', gap:'var(--space-5)' }}>
              <Input label="Razón social" defaultValue="Veterinaria San Roque S.R.L." />
              <Input label="CUIT" defaultValue="30-71234567-9" />
              <Input label="Dirección" defaultValue="Av. Rivadavia 4820, CABA" icon="map-pin" />
            </div>
          </Card>
          <Card title="Preferencias">
            <div style={{ display:'grid', gap:14 }}>
              <Switch checked={notif} onChange={setNotif} label="Avisar al tutor al cargar un evento" />
              <Switch checked onChange={()=>{}} label="Recordatorio de cita 24 h antes" />
            </div>
          </Card>
          <Card title="Plan" tone="sunken">
            <DataField label="Plan" value="Wayka Clínica · mensual" source="clinical" />
            <DataField label="Próxima facturación" value="01 may 2026" source="clinical" />
          </Card>
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { ClinicPanel });
