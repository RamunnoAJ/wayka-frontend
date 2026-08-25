const { PageHeader, SearchField, Button, Tabs, Card, DataTable, PatientRow, EmptyState } = window.WaykaDesignSystem_51ee47;

function PatientsScreen({ onOpen }) {
  const [q, setQ] = React.useState('');
  const [tab, setTab] = React.useState('todos');
  const all = window.WaykaData.patients;
  const list = all.filter(p => {
    const hit = (p.name + p.owner + p.breed).toLowerCase().includes(q.toLowerCase());
    if (tab === 'alertas') return hit && (p.allergies.length || p.meds.some(m=>m.status==='activo'));
    if (tab === 'felinos') return hit && p.species === 'felino';
    return hit;
  });
  return (
    <div>
      <PageHeader title="Pacientes" subtitle={`${all.length} pacientes activos en la clínica`}
        actions={<><Button variant="secondary" iconLeft="download">Exportar</Button><Button iconLeft="plus">Nuevo paciente</Button></>}>
        <div style={{ display:'flex', gap:16, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ flex:'1 1 320px', maxWidth:460 }}>
            <SearchField size="lg" value={q} onChange={e=>setQ(e.target.value)} />
          </div>
          <Tabs variant="pill" value={tab} onChange={setTab} items={[
            { value:'todos', label:'Todos', count:all.length },
            { value:'alertas', label:'Con alertas', count:all.filter(p=>p.allergies.length||p.meds.some(m=>m.status==='activo')).length },
            { value:'felinos', label:'Felinos' },
          ]} />
        </div>
      </PageHeader>
      <Card padded={false}>
        <DataTable
          columns={[
            { key:'avatar', width:40 },
            { key:'paciente', label:'Paciente', grow:'1 1 200px' },
            { key:'tutor', label:'Tutor', grow:'1 1 160px' },
            { key:'alertas', label:'Alertas', grow:'0 0 auto' },
            { key:'visita', label:'Última visita', width:110, align:'right' },
          ]}
          empty={<EmptyState icon="search-x" title="Sin resultados" description={`No encontramos pacientes para "${q}".`} />}>
          {list.map(p => (
            <PatientRow key={p.id} name={p.name} species={p.species} breed={p.breed} age={p.age}
              owner={p.owner} lastVisit={p.lastVisit}
              allergies={p.allergies.filter(a=>a.severity==='alta').map(a=>a.label)}
              medications={p.meds.filter(m=>m.status==='activo').length}
              onClick={()=>onOpen(p.id)} />
          ))}
        </DataTable>
      </Card>
    </div>
  );
}
Object.assign(window, { PatientsScreen });
