export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
// avanza d hacia cero como máximo m por paso
export const step = (d: number, m: number) => (Math.abs(d) <= m ? d : Math.sign(d) * m);
export const rnd = (a: number, b: number) => a + Math.random() * (b - a);
export const pick = <T>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)];
export const overlap = (a: Box, b: Box) => Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.y - b.y) < (a.h + b.h) / 2;
export function hash(n: number): number { n = Math.sin(n * 127.1) * 43758.5453; return n - Math.floor(n); }

export interface Box { x: number; y: number; w: number; h: number }

export const C = {
  pink: '#ff2e88', yellow: '#ffe14d', green: '#3dff9a', orange: '#ff8a1f',
  ink: '#f7f1ff', muted: '#a99cc0', bg: '#15111d', sky: '#7fd4ff',
} as const;

export const reduceMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
