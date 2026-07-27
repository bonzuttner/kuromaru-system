import type { CSSProperties } from 'react';

// Converts a "border-bottom:1px solid #eee;padding:3px 8px" CSS string into
// a React style object. Several view-model helpers (ported near-verbatim
// from the original prototype) build style strings this way; this keeps
// that logic unchanged instead of re-deriving style objects everywhere.
export function css(str: string | undefined): CSSProperties {
  if (!str) return {};
  const out: Record<string, string> = {};
  str.split(';').forEach((decl) => {
    const idx = decl.indexOf(':');
    if (idx < 0) return;
    const prop = decl.slice(0, idx).trim();
    const val = decl.slice(idx + 1).trim();
    if (!prop || !val) return;
    const camel = prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    out[camel] = val;
  });
  return out as CSSProperties;
}

export function mergeCss(...parts: (string | CSSProperties | undefined)[]): CSSProperties {
  return parts.reduce<CSSProperties>((acc, p) => {
    if (!p) return acc;
    return { ...acc, ...(typeof p === 'string' ? css(p) : p) };
  }, {});
}
