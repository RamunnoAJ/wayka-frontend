const { PageHeader, Button, Tabs, Card, AppointmentCard, StatusDot, IconButton } = window.WaykaDesignSystem_51ee47;

const DIAS = ['Lun 13','Mar 14','Mié 15','Jue 16','Vie 17','Sáb 18'];
const SLOTS = ['08:00','09:00','10:00','11:00','12:00','13:00'];
const GRID = {
  'Lun 13': { '09:00': ['cumplido','Vacunación · Rocco'] },
  'Mar 14': { '10:00': ['pendiente','Dermatología · Tobi'], '12:00': ['pendiente','Peso · Kira'] },
  'Mié 15': { '08:00': ['vencido','Control · Mora'], '11:00': ['pendiente','Extracción · Nube'] },
  'Jue 16': { '09:00': ['pendiente','Consulta · Rocco'] },
  'Vie 17': { '10:00': ['pendiente','Retiro de puntos · Mora'], '13:00': ['cumplido','Control · Tobi'] },
  'Sáb 18': {},
};
// Celda sobria: fondo neutro y barra de color; solo lo vencido conserva tinte.
const C = { pendiente:['var(--surface-sunken)','var(--appt-pending)'], cumplido:['var(--surface-sunken)','var(--appt-done)'], vencido:['var(--appt-overdue-surface)','var(--appt-overdue)'] };

function AgendaScreen() {
  const [view, setView] = React.useState('semana');
  const agenda = window.WaykaData.agenda;
  return (
    <div>
      <PageHeader title="Agenda" subtitle="Semana del 13 al 18 de abril"
        actions={<><Button variant="secondary" iconLeft="calendar">Hoy</Button><Button iconLeft="plus">Nueva cita</Button></>}>
        <div style={{ display:'flex', gap:20, alignItems:'center', flexWrap:'wrap' }}>
          <Tabs variant="pill" value={view} onChange={setView} items={[{value:'dia',label:'Día'},{value:'semana',label:'Semana'}]} />
          <div style={{ display:'flex', gap:14 }}>
            <StatusDot status="pendiente" label="Pendiente" />
            <StatusDot status="cumplido" label="Cumplido" />
            <StatusDot status="vencido" label="Vencido" />
          </div>
          <div style={{ marginLeft:'auto', display:'flex', gap:4 }}>
            <IconButton icon="chevron-left" label="Semana anterior" variant="outline" size="sm" />
            <IconButton icon="chevron-right" label="Semana siguiente" variant="outline" size="sm" />
          </div>
        </div>
      </PageHeader>

      {view === 'semana' ? (
        <Card padded={false}>
          <div style={{ display:'grid', gridTemplateColumns:'64px repeat(6,1fr)' }}>
            <div style={{ borderBottom:'1px solid var(--border-subtle)' }} />
            {DIAS.map(d => (
              <div key={d} style={{ padding:'12px 10px', textAlign:'center',
                borderBottom:'1px solid var(--border-subtle)',
                font:'var(--fw-semibold) var(--fs-body-sm) var(--font-sans)', color:'var(--text-muted)' }}>{d}</div>
            ))}
            {SLOTS.map(s => (
              <React.Fragment key={s}>
                <div style={{ padding:'10px 8px', textAlign:'right', borderBottom:'1px solid var(--border-subtle)',
                  font:'var(--fs-caption) var(--font-sans)', color:'var(--text-subtle)', fontVariantNumeric:'tabular-nums' }}>{s}</div>
                {DIAS.map(d => {
                  const cell = GRID[d][s];
                  return (
                    <div key={d+s} style={{ minHeight:62, padding:6, borderBottom:'1px solid var(--border-subtle)', borderLeft:'1px solid var(--border-subtle)' }}>
                      {cell && (
                        <div style={{ height:'100%', borderRadius:'var(--radius-sm)', padding:'7px 9px',
                          background:C[cell[0]][0], borderLeft:`3px solid ${C[cell[0]][1]}`,
                          font:'var(--fw-semibold) var(--fs-caption)/1.35 var(--font-sans)', color:'var(--text-strong)' }}>{cell[1]}</div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
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
