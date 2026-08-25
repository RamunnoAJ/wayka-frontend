# DataTable

Solo cabecera y contenedor: las filas siguen siendo componentes propios, para que cada dominio decida como se ve la suya.

```jsx
<Card padded={false}>
  <DataTable columns={[{width:40},{label:'Paciente',grow:'1 1 200px'},{label:'Última visita',width:110,align:'right'}]}
    empty={<EmptyState title="Sin resultados" />}>
    {list.map(p => <PatientRow key={p.id} {...p} />)}
  </DataTable>
</Card>
```

Reglas:
- Los anchos de las columnas y los de la fila tienen que coincidir; usar los mismos valores flex.
- Sin franjas alternas ni bordes verticales: separa la hairline entre filas.
- Siempre pasar `empty`.
