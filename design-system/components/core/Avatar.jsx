import React from 'react';
import { Icon } from './Icon.jsx';
const S={ sm:32, md:40, lg:56, xl:80 };
export function Avatar({ name='', src, size='md', species, tone='accent' }) {
  const d=S[size]||S.md;
  const initials = name.split(' ').filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase();
  const bg = tone==='brand' ? 'var(--color-accent-soft)' : 'var(--color-primary-soft)';
  const fg = tone==='brand' ? 'var(--color-accent-strong)' : 'var(--color-primary-strong)';
  return (
    <span style={{ width:d, height:d, flex:'0 0 auto', borderRadius: species ? 'var(--radius-md)' : '50%',
      overflow:'hidden', display:'grid', placeItems:'center', background:bg, color:fg,
      font:`var(--fw-bold) ${Math.round(d*0.36)}px/1 var(--font-sans)` }}>
      {src ? <img src={src} alt={name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        : species ? <Icon name={species==='felino'?'cat':species==='canino'?'dog':'paw-print'} size={Math.round(d*0.5)} />
        : initials}
    </span>
  );
}
