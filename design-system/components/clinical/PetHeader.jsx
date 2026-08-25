import React from 'react';
import { Avatar } from '../core/Avatar.jsx';
import { Badge } from '../core/Badge.jsx';
export function PetHeader({ name, species='canino', breed, sex, age, weight, chip, owner, actions, size='lg' }) {
  const meta = [breed, sex, age].filter(Boolean).join(' · ');
  return (
    <header style={{ display:'flex', gap:18, alignItems:'flex-start', flexWrap:'wrap' }}>
      <Avatar name={name} species={species} size={size === 'lg' ? 'xl' : 'lg'} />
      <div style={{ flex:1, minWidth:200 }}>
        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          <h1 style={{ font: size==='lg' ? 'var(--text-h1)' : 'var(--text-h2)', color:'var(--text-strong)' }}>{name}</h1>
          {chip && <Badge tone="neutral" icon="scan-line">{chip}</Badge>}
        </div>
        <div style={{ font:'var(--text-body)', color:'var(--text-muted)', marginTop:4 }}>{meta}</div>
        <div style={{ display:'flex', gap:18, marginTop:12, flexWrap:'wrap' }}>
          {weight && <div><div style={{ font:'var(--fs-overline) var(--font-sans)', letterSpacing:'var(--ls-overline)', textTransform:'uppercase', color:'var(--text-subtle)', fontWeight:700 }}>Peso</div>
            <div style={{ font:'var(--fw-semibold) var(--fs-h3) var(--font-sans)', color:'var(--text-strong)', fontVariantNumeric:'tabular-nums' }}>{weight}</div></div>}
          {owner && <div><div style={{ font:'var(--fs-overline) var(--font-sans)', letterSpacing:'var(--ls-overline)', textTransform:'uppercase', color:'var(--text-subtle)', fontWeight:700 }}>Tutor</div>
            <div style={{ font:'var(--fw-semibold) var(--fs-body-lg) var(--font-sans)', color:'var(--text-strong)' }}>{owner}</div></div>}
        </div>
      </div>
      {actions && <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>{actions}</div>}
    </header>
  );
}
