import React from 'react';
import { Icon } from '../core/Icon.jsx';
const LOGO_FILTER = 'brightness(0) invert(1)';
export function SidebarNav({ items=[], value, onChange, clinic, user, logoSrc='../../assets/wayka-logo.svg' }) {
  return (
    <nav style={{ width:'var(--sidebar-w)', flex:'0 0 var(--sidebar-w)', height:'100%',
      background:'var(--surface-nav)', color:'var(--text-on-nav)', display:'flex', flexDirection:'column',
      padding:'22px 14px' }}>
      <div style={{ padding:'0 8px 22px' }}>
        <img src={logoSrc} alt="Wayka" style={{ width:112, filter:LOGO_FILTER }} />
        {clinic && <div style={{ font:'var(--fs-caption) var(--font-sans)', color:'var(--text-on-nav-muted)', marginTop:8 }}>{clinic}</div>}
      </div>
      <div style={{ display:'grid', gap:2, alignContent:'start', flex:1 }}>
        {items.map(it => {
          const on = it.value === value;
          return (
            <button key={it.value} onClick={()=>onChange && onChange(it.value)}
              style={{ display:'flex', alignItems:'center', gap:11, width:'100%', padding:'10px 12px',
                border:0, borderRadius:'var(--radius-control)', cursor:'pointer', textAlign:'left',
                background: on ? 'var(--surface-nav-item)' : 'transparent',
                color: on ? 'var(--text-on-nav)' : 'var(--text-on-nav-muted)',
                font:`${on?'var(--fw-semibold)':'var(--fw-medium)'} var(--fs-body)/1.3 var(--font-sans)`,
                transition:'var(--transition-control)' }}>
              <Icon name={it.icon} size={18} />
              {it.label}
              {it.badge != null && <span style={{ marginLeft:'auto', background:'var(--nav-accent)', color:'var(--surface-nav-deep)',
                borderRadius:'var(--radius-pill)', padding:'1px 7px', font:'var(--fw-bold) var(--fs-overline) var(--font-sans)' }}>{it.badge}</span>}
            </button>
          );
        })}
      </div>
      {user && (
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 10px', marginTop:12,
          borderTop:'1px solid var(--border-on-nav)' }}>
          <span style={{ width:32, height:32, borderRadius:'50%', background:'var(--surface-nav-item)', display:'grid', placeItems:'center',
            font:'var(--fw-bold) 12px var(--font-sans)', color:'#fff' }}>
            {user.name.split(' ').slice(0,2).map(w=>w[0]).join('')}
          </span>
          <div style={{ minWidth:0 }}>
            <div style={{ font:'var(--fw-semibold) var(--fs-body-sm) var(--font-sans)', color:'var(--text-on-nav)' }}>{user.name}</div>
            <div style={{ font:'var(--fs-overline) var(--font-sans)', color:'var(--text-on-nav-muted)' }}>{user.role}</div>
          </div>
        </div>
      )}
    </nav>
  );
}
