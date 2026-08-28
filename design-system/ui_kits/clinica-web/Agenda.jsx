const { PageHeader, Button, Tabs, Card, AppointmentCard, CalendarWeek, IconButton } = window.WaykaDesignSystem_51ee47;

const SEMANA = [
  { date:12, events:[] },
  { date:13, events:[{ title:'Vacunación · Rocco', time:'10:00 — 10:30', status:'cumplido' }] },
  { date:14, today:true, events:[
    { title:'Dermatología · Tobi', time:'11:00 — 11:30' },
    { title:'Peso · Kira', time:'13:00 — 13:30', status:'cumplido' }] },
  { date:15, events:[
    { title:'Control · Mora', time:'09:00 — 09:30', status:'vencido' },
    { title:'Extracción · Nube', time:'12:00 — 12:45' }] },
  { date:16, events:[{ title:'Consulta · Rocco', time:'10:00 — 10:30' }] },
  { date:17, events:[
    { title:'Retiro de puntos · Mora', time:'11:00 — 11:30' },
    { title:'Control · Tobi', time:'14:00 — 14:30', status:'cumplido' }] },
  { date:18, events:[] },
];

function AgendaScreen() {
  const [view, setView] = React.useState('semana');
  const agenda = window.WaykaData.agenda;
  return (
    <div>
      <PageHeader title="Agenda"
        actions={<Button iconLeft="plus">Nueva cita</Button>}>
        <div style={{ display:'flex', gap:16, alignItems:'center', flexWrap:'wrap' }}>
          <h2 style={{ font:'var(--text-h2)', color:'var(--text-strong)', letterSpacing:'var(--ls-heading)' }}>12 — 18 abr 2026</h2>
          <div style={{ display:'flex', gap:2 }}>
            <IconButton icon="chevron-left" label="Semana anterior" size="sm" />
            <IconButton icon="chevron-right" label="Semana siguiente" size="sm" />
          </div>
          <div style={{ marginLeft:'auto' }}>
            <Tabs variant="segmented" value={view} onChange={setView}
              items={[{value:'dia',label:'Día'},{value:'semana',label:'Semana'},{value:'mes',label:'Mes'}]} />
          </div>
        </div>
      </PageHeader>

      {view !== 'dia' ? (
        <Card padded={false}>
          <CalendarWeek days={SEMANA} minHeight={260} />
        </Card>
      ) : (
        <Card title="Miércoles 15 de abril" action={<Button variant="ghost" size="sm">Imprimir</Button>}>
          <div style={{ display:'grid', gap:10 }}>
            {agenda.map(a => (
              <AppointmentCard key={a.time} status={a.status} time={a.time} title={a.title}
                patient={a.patient} vet={a.vet}
                actions={a.status === 'pendiente'
                  ? <Button size="sm" variant="secondary" iconLeft="check">Marcar cumplida</Button>
                  : a.status === 'vencido'
                    ? <Button size="sm" variant="primary" iconLeft="calendar-clock">Reagendar</Button>
                    : null} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
Object.assign(window, { AgendaScreen });
