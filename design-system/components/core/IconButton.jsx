import React from 'react';
import { Icon } from './Icon.jsx';
const S = { sm:32, md:40, lg:48 };
export function IconButton({ icon, label, size='md', variant='ghost', disabled, ...rest }) {
  const [h,setH]=React.useState(false); const d=S[size]||S.md;
  const solid = variant==='solid'; const onDark = variant==='on-dark';
  return (
    <button type="button" aria-label={label} title={label} disabled={disabled}
      onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} {...rest}
      style={{ width:d, height:d, display:'inline-grid', placeItems:'center',
        borderRadius:'var(--radius-control)',
        border:'1px solid '+(variant==='outline'?'var(--border-default)':'transparent'),
        background: solid ? (h?'var(--color-primary-fill-hover)':'var(--color-primary-fill)')
          : onDark ? (h?'var(--surface-nav-item)':'transparent') : (h?'var(--surface-hover)':'transparent'),
        color: solid ? '#fff' : onDark ? 'var(--text-on-nav)' : (disabled?'var(--text-subtle)':'var(--text-muted)'),
        cursor:disabled?'not-allowed':'pointer', transition:'var(--transition-control)', ...rest.style }}>
      <Icon name={icon} size={size==='sm'?16:20} />
    </button>
  );
}
