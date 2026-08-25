import React from 'react';
import { Avatar } from '../core/Avatar.jsx';
import { Icon } from '../core/Icon.jsx';
import { AllergyChip } from './AllergyChip.jsx';
export function PatientRow({ name, species='canino', breed, age, owner, lastVisit, allergies=[], medications=0, selected, onClick }) {
  const [h,setH]=React.useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', cursor:'pointer',
        background: selected ? 'var(--surface-selected)' : h ? 'var(--surface-hover)' : 'var(--surface-card)',
        borderBottom:'1px solid var(--border-subtle)', transition:'var(--transition-control)' }}>
      <Avatar name={name} species={species} size="md" />
      <div style={{ flex:'1 1 200px', minWidth:0 }}>
        <div style={{ font:'var(--text-body-strong)', color:'var(--text-strong)' }}>{name}</div>
        <div style={{ font:'var(--fs-caption) var(--font-sans)', color:'var(--text-subtle)' }}>{[breed, age].filter(Boolean).join(' · ')}</div>
      </div>
      <div style={{ flex:'1 1 160px', minWidth:0, font:'var(--fs-body-sm) var(--font-sans)', color:'var(--text-muted)' }}>{owner}</div>
      <div style={{ flex:'0 0 auto', display:'flex', gap:6, alignItems:'center' }}>
        {allergies.slice(0,1).map(a => <AllergyChip key={a} label={a} severity="alta" />)}
        {allergies.length > 1 && (
          <span style={{ font:'var(--fs-caption) var(--font-sans)', color:'var(--text-subtle)' }}>+{allergies.length-1}</span>
        )}
        {medications > 0 && (
          <span style={{ display:'inline-flex', alignItems:'center', gap:5, color:'var(--text-muted)',
            font:'var(--fw-medium) var(--fs-body-sm) var(--font-sans)' }}>
            <Icon name="pill" size={14} />{medications}
          </span>
        )}
      </div>
      <div style={{ flex:'0 0 110px', textAlign:'right', font:'var(--fs-caption) var(--font-sans)', color:'var(--text-subtle)' }}>{lastVisit}</div>
    </div>
  );
}
