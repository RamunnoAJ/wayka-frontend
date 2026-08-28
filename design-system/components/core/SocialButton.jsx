import React from 'react';

/** Logo de Google. Marca ajena: se usa tal cual, sin teñir con tokens de Wayka. */
function GoogleG({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false" style={{ flex:'0 0 auto' }}>
      <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.09c4.15-3.82 6.58-9.45 6.58-16.17z" />
      <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.09-5.52c-1.97 1.32-4.49 2.1-7.47 2.1-5.74 0-10.6-3.88-12.34-9.09H4.34v5.71C7.96 41.07 15.4 46 24 46z" />
      <path fill="#FBBC05" d="M11.66 28.16c-.44-1.32-.69-2.73-.69-4.16s.25-2.84.69-4.16v-5.71H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.87l7.32-5.71z" />
      <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.29-6.29C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.13l7.32 5.71z" />
    </svg>
  );
}

const H = { md:44, touch:52 };
/**
 * Autenticación con un proveedor externo. La cromía la dicta la guía del proveedor,
 * no los tokens de Wayka: los hex de acá abajo son de Google (superficie neutra
 * #FFFFFF / borde #DADCE0 / texto #3C4043) y son la excepción declarada a la regla
 * de "sin hexadecimales" — no son colores de marca de Wayka ni themeables.
 */
export function SocialButton({ provider='google', mode='login', size='touch', block=true, label, disabled=false, onClick, ...rest }) {
  const h = H[size] || H.touch;
  const text = label || (mode === 'signup' ? 'Registrarme con Google' : 'Continuar con Google');
  return (
    <button type="button" onClick={onClick} disabled={disabled} {...rest}
      style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', gap:12,
        width: block ? '100%' : 'auto', height:h, padding:'0 16px', cursor: disabled ? 'not-allowed' : 'pointer',
        background:'#FFFFFF', border:'1px solid #DADCE0', borderRadius:'var(--radius-md)',
        color:'#3C4043', font:'var(--fw-medium) var(--fs-body) var(--font-sans)',
        opacity: disabled ? .5 : 1, transition:'var(--transition-control)', ...rest.style }}>
      <GoogleG size={18} />
      {text}
    </button>
  );
}
