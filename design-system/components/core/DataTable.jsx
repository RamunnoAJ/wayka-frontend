import React from 'react';
/** Cabecera y cuerpo de una tabla en flex. Las filas las pone quien la usa
 *  (PatientRow y similares), asi que las columnas solo definen ancho y alineacion. */
export function DataTable({ columns=[], children, empty }) {
  return (
    <div>
      <div role="row" style={{ display:'flex', gap:14, padding:'10px 16px',
        borderBottom:'1px solid var(--border-subtle)',
        font:'var(--fw-bold) var(--fs-overline) var(--font-sans)', letterSpacing:'var(--ls-overline)',
        textTransform:'uppercase', color:'var(--text-subtle)' }}>
        {columns.map((c, i) => (
          <span key={c.key || i} role="columnheader"
            style={{ flex: c.width ? `0 0 ${typeof c.width === 'number' ? c.width + 'px' : c.width}` : (c.grow || '1 1 auto'),
              textAlign: c.align || 'left' }}>{c.label}</span>
        ))}
      </div>
      {React.Children.count(children) ? children : empty}
    </div>
  );
}
