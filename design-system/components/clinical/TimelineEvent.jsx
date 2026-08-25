import React from 'react';
import { Icon } from '../core/Icon.jsx';
const KIND = {
  consulta:['stethoscope','var(--color-primary-strong)','var(--surface-accent-soft)'],
  vacuna:['syringe','var(--success-600)','var(--success-50)'],
  cirugia:['scissors','var(--danger-600)','var(--danger-50)'],
  estudio:['microscope','var(--info-600)','var(--info-50)'],
  peso:['scale','var(--wayka-naranja-oscuro)','var(--surface-brand-soft)'],
  nota:['notebook-pen','var(--text-muted)','var(--neutral-100)'],
};
export function TimelineEvent({ kind='consulta', title, date, author, children, attachments=0, last }) {
  const [icon,fg,bg] = KIND[kind] || KIND.nota;
  return (
    <div style={{ display:'flex', gap:14 }}>
      <div style={{ display:'grid', justifyItems:'center', gap:4 }}>
        <span style={{ width:34, height:34, borderRadius:'50%', display:'grid', placeItems:'center', background:bg, color:fg, flex:'0 0 auto' }}>
          <Icon name={icon} size={16} />
        </span>
        {!last && <span style={{ width:1, flex:1, background:'var(--border-default)' }} />}
      </div>
      <div style={{ paddingBottom: last ? 0 : 22, flex:1, minWidth:0 }}>
        <div style={{ display:'flex', gap:10, alignItems:'baseline', flexWrap:'wrap' }}>
          <span style={{ font:'var(--text-body-strong)', color:'var(--text-strong)' }}>{title}</span>
          <span style={{ font:'var(--fs-caption) var(--font-sans)', color:'var(--text-subtle)' }}>{date}</span>
        </div>
        {author && <div style={{ font:'var(--fs-caption) var(--font-sans)', color:'var(--text-subtle)', marginTop:2 }}>{author}</div>}
        {children && <div style={{ font:'var(--text-body)', color:'var(--text-body)', marginTop:8 }}>{children}</div>}
        {attachments > 0 && (
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, marginTop:10,
            font:'var(--fw-medium) var(--fs-caption) var(--font-sans)', color:'var(--text-accent)' }}>
            <Icon name="paperclip" size={13} />{attachments} adjunto{attachments>1?'s':''}
          </div>
        )}
      </div>
    </div>
  );
}
