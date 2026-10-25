/*
 * Complemento del bot para el balance y la campaña (no se usa en la paridad): esquiva el cuerpo de la serpiente de la
 * Costa Verde. Si un segmento le queda cerca por delante, suelta el acelerador y se corre, y si el cuerpo se enrosca
 * sale por el hueco. En las demás etapas no hay cadenas y no cambia nada.
 */
export function evitaCuerpo(G: any, k: any): void {
  const p = G.p, c = G.coil;
  // enrosque (ADR 0034): si quedó dentro del anillo, sale derecho por el hueco
  if (c && (c.st === 'tele' || c.st === 'hold') && Math.hypot(p.x - c.cx, p.y - c.cy) < c.r + 30) {
    const tx = c.cx + Math.cos(c.gap) * (c.r + 50), ty = c.cy + Math.sin(c.gap) * (c.r + 50);
    k.left = tx < p.x - 4; k.right = tx > p.x + 4; k.up = ty < p.y - 4; return;
  }
  for (const ch of G.chains ?? []) for (const s of [...ch.segs, ...(ch.lead ? [ch.lead] : [])]) {
    if (Math.abs(s.x - p.x) < (s.w + p.w) / 2 + 14 && s.y < p.y + 20 && p.y - s.y < 110) {
      k.up = false; const away = p.x >= s.x ? 1 : -1; k.right = away > 0; k.left = away < 0; return;
    }
  }
}

/*
 * Bot de ruta (Línea Amarilla): en los peajes busca un carril de pago abierto, mantiene el acelerador contra la marea
 * y en la pista se alinea con la rampa del carguero y acelera a fondo. En las demás etapas no hace nada.
 */
export function rutaBot(G: any, k: any): void {
  const R = G.cfg.route;
  if (!R) return;
  const p = G.p, road = G.cfg.road, lane = (x: number) => Math.max(0, Math.min(road.lanes - 1, Math.floor((x - road.left) / road.laneWidth)));
  const steer = (tx: number) => { k.left = tx < p.x - 6; k.right = tx > p.x + 6; };
  k.up = true;
  const pl = G.route.plane, P = R.plane;
  if (P && pl.phase !== 'off') { steer(pl.x); if (pl.phase === 'in') k.up = p.y > 300; return; }
  const toll = G.obstacles.find((o: any) => G.cfg.obstacles[o.i].kind === 'peaje' && o.y < p.y && p.y - o.y < 220);
  if (toll) {
    const o = G.cfg.obstacles[toll.i], ph = Math.floor((toll.ph ?? 0) * 10);
    let best = lane(p.x), dist = Infinity;
    for (let l = 0; l < road.lanes; l++) if ((l + ph) % road.lanes < (o.payLanes ?? road.lanes)) { const d = Math.abs(l - lane(p.x)); if (d < dist) { dist = d; best = l; } }
    steer(road.left + road.laneWidth * (best + 0.5));
  }
}
