/*
 * Complemento del bot para el balance y la campaña (no se usa en la paridad): esquiva el cuerpo de la serpiente de la
 * Costa Verde. Si un segmento le queda cerca por delante, suelta el acelerador y se corre. En las demás etapas no hay
 * cadenas y no cambia nada.
 */
export function evitaCuerpo(G: any, k: any): void {
  const p = G.p;
  for (const ch of G.chains ?? []) for (const s of [...ch.segs, ...(ch.lead ? [ch.lead] : [])]) {
    if (Math.abs(s.x - p.x) < (s.w + p.w) / 2 + 14 && s.y < p.y + 20 && p.y - s.y < 110) {
      k.up = false; const away = p.x >= s.x ? 1 : -1; k.right = away > 0; k.left = away < 0; return;
    }
  }
}
