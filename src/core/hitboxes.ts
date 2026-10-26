import { FONT, type Gfx } from './gfx';
import { laneOf, type Game } from './state';
import type { Box } from './util';
import { CART } from './hazards';
import { fuselage } from './physics';
import { gateClosed } from './world';
import { jetZone } from '../bosses/phase-boss';
import { rampBox } from '../bosses/route-ai';

/*
 * Vista de colisiones (ADR 0045 y 0046): con ?colisiones en la dirección se dibuja encima de todo cada zona de choque
 * con la forma que usa la regla que la resuelve, para ver si un dibujo dice algo distinto de lo que golpea.
 * - El Tico tiene tres formas. La caja choca con tráfico, obstáculos, jefe y peligros. El círculo de radio w/2 recibe
 *   los proyectiles del jefe. El de radio h/2 recoge los bonus. Dos formas se tocan justo cuando la regla se cumple.
 * - Los conos del jugador chocan como una raya horizontal de ancho 2r (la regla compara el centro con la caja
 *   ensanchada por r de cada lado).
 * - En el enrosque el anillo choca por casilleros: un sector por auto con su ancho de banda. La regla mira el ángulo del
 *   centro del Tico y, a lo largo del radio, su caja.
 * - Cada contorno se proyecta punto a punto sobre la curva, como el área lógica (no rígido como los dibujos), así la
 *   diferencia entre dibujo y choque queda a la vista.
 * - Lo que en este cuadro no puede chocar (en el aire, ya golpeado, barrera abierta) se ve tenue.
 * No cambia nada del juego.
 */

export const HITBOXES = typeof location !== 'undefined' && new URLSearchParams(location.search).has('colisiones');

export const HIT_COL = { me: '#3dff9a', hurt: '#ff2e88', solid: '#ffffff', good: '#ffe14d', shot: '#5ad1ff' };
const STEP = 4; // largo máximo de cada tramo del contorno, para que siga la curva
const DIM = 0.3;

// contorno cerrado, con cada lado cortado en tramos cortos para que cada punto se proyecte sobre la curva
function poly(g: Gfx, pts: [number, number][], col: string, on: boolean): void {
  g.strokeStyle = col; g.globalAlpha = on ? 0.95 : DIM; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i <= pts.length; i++) {
    const [px, py] = pts[i - 1], [x, y] = pts[i % pts.length], n = Math.max(1, Math.ceil(Math.hypot(x - px, y - py) / STEP));
    for (let k = 1; k <= n; k++) g.lineTo(px + ((x - px) * k) / n, py + ((y - py) * k) / n);
  }
  g.closePath(); g.stroke();
}
export function box(g: Gfx, b: Box | null, col: string, on = true): void {
  if (!b) return;
  const l = b.x - b.w / 2, r = b.x + b.w / 2, t = b.y - b.h / 2, d = b.y + b.h / 2;
  poly(g, [[l, t], [r, t], [r, d], [l, d]], col, on);
}
function circle(g: Gfx, x: number, y: number, r: number, col: string, on = true): void {
  g.strokeStyle = col; g.globalAlpha = on ? 0.95 : DIM; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.closePath(); g.stroke();
}
function line(g: Gfx, x: number, y: number, half: number, col: string): void {
  g.strokeStyle = col; g.globalAlpha = 0.95; g.beginPath(); g.moveTo(x - half, y); g.lineTo(x + half, y); g.stroke();
}
// sector del anillo: de a0 a a1 en ángulo y de r0 a r1 en radio
function sector(g: Gfx, cx: number, cy: number, r0: number, r1: number, a0: number, a1: number, col: string): void {
  const pts: [number, number][] = [], n = Math.max(2, Math.ceil(((a1 - a0) * r1) / STEP));
  for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; pts.push([cx + Math.cos(a) * r1, cy + Math.sin(a) * r1]); }
  for (let i = n; i >= 0; i--) { const a = a0 + ((a1 - a0) * i) / n; pts.push([cx + Math.cos(a) * r0, cy + Math.sin(a) * r0]); }
  poly(g, pts, col, true);
}

export function drawHitboxes(g: Gfx, G: Game): void {
  const p = G.p, ground = p.air <= 0, defs = G.cfg.obstacles ?? [];
  g.save(); g.lineWidth = 1;
  for (const ob of G.obstacles) {
    const o = defs[ob.i];
    if (!o) continue;
    if (o.kind === 'rampa') box(g, ob, HIT_COL.good, ground && !ob.hit);
    else if (o.kind === 'bloque') box(g, ob, HIT_COL.solid, ground);
    // peaje: daña si la barrera del carril del Tico está cerrada; si no, cobra
    else if (o.kind === 'peaje') box(g, ob, gateClosed(G, ob, laneOf(G.cfg, p.x)) ? HIT_COL.hurt : HIT_COL.good, ground && !ob.hit);
    else box(g, ob, HIT_COL.hurt, ground && !ob.hit && (!o.accelOnly || G.keys.up));
  }
  for (const c of G.traffic) box(g, c, HIT_COL.solid, ground);
  for (const a of G.allies) if (!a.dead) box(g, a, HIT_COL.good);
  const c = G.coil, body = G.cfg.boss.body;
  if (c.st !== 'off' && body) {
    const reach = (body.h / 2) / c.r + ((p.w / 2) / c.r) * 0.7;
    for (const s of c.slots) sector(g, c.cx, c.cy, c.r - body.w / 2, c.r + body.w / 2, s - reach, s + reach, HIT_COL.hurt);
  } else for (const ch of G.chains) { for (const s of ch.segs) box(g, s, HIT_COL.hurt, ground); box(g, ch.lead, HIT_COL.hurt, ground); }
  if (G.b.state !== 'enter' && !G.cfg.route) box(g, G.b, HIT_COL.hurt, ground);
  box(g, jetZone(G), HIT_COL.hurt, ground && !G.b.jetHit); box(g, fuselage(G), HIT_COL.solid, ground); box(g, rampBox(G), HIT_COL.good);
  if (G.cart.on) box(g, { x: G.cart.x, y: G.cart.y, ...CART }, HIT_COL.hurt, ground && !G.cart.hit);
  for (const f of G.foes) if (!f.dead) circle(g, f.x, f.y, f.r, HIT_COL.hurt);
  for (const u of G.pickups) if (!u.dead) circle(g, u.x, u.y, u.r, HIT_COL.good);
  for (const s of G.shots) if (!s.dead) line(g, s.x, s.y, s.r, HIT_COL.shot);
  // el Tico: caja de contacto, círculo de daño de proyectiles y círculo de recogida
  box(g, p, HIT_COL.me, ground);
  circle(g, p.x, p.y, p.w / 2, HIT_COL.hurt);
  circle(g, p.x, p.y, p.h / 2, HIT_COL.good);
  g.restore();
}

// Leyenda de la vista, en la capa del HUD.
export function drawHitboxLegend(g: Gfx): void {
  g.save(); g.font = FONT(7); g.textAlign = 'left'; let x = 8;
  for (const [t, col] of [['CONTACTO', HIT_COL.me], ['DAÑO', HIT_COL.hurt], ['SÓLIDO', HIT_COL.solid], ['RECOGE', HIT_COL.good], ['CONO', HIT_COL.shot]] as const) {
    g.fillStyle = col; g.fillText(t, x, 132); x += g.measureText(t).width + 10;
  }
  g.restore();
}
