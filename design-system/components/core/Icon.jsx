import React from 'react';
// Lucide (CDN, lucide-static) via CSS mask so the glyph inherits currentColor.
// SUSTITUCION: Wayka no aporto set de iconos propio.
const BASE = 'https://unpkg.com/lucide-static@0.446.0/icons/';
export function Icon({ name, size = 20, strokeWidth, style, ...rest }) {
  const url = `url("${BASE}${name}.svg")`;
  return (
    <span aria-hidden="true" {...rest} style={{
      display:'inline-block', width:size, height:size, flex:'0 0 auto',
      backgroundColor:'currentColor', WebkitMaskImage:url, maskImage:url,
      WebkitMaskRepeat:'no-repeat', maskRepeat:'no-repeat',
      WebkitMaskSize:'contain', maskSize:'contain',
      WebkitMaskPosition:'center', maskPosition:'center', ...style }} />
  );
}
