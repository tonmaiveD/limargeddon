import type { Gfx } from './gfx';
import type { Game } from './state';
import type { Box } from './util';
import { CART } from './hazards';
import { fuselage } from './physics';
import { jetZone } from '../bosses/phase-boss';
import { rampBox } from '../bosses/route-ai';

/*
 * Vista de colisiones (ADR 0045): con ?colisiones en la dirección se dibuja encima de todo el contorno de cada zona de
 * choque, tal como la usa la simulación. Sirve para ver si un dibujo nuevo dice algo distinto de lo que golpea. Cada
 * contorno se ubica sobre la curva igual que su dibujo (rígido en su centro). No cambia nada del juego.
 */

export const HITBOXES = typeof location !== 'undefined' && new URLSearchParams(location.search).has('colisiones');

const COL = { me: '#3dff9a', hurt: '#ff2e88', solid: '#ffffff', good: '#ffe14d', shot: '#5ad1ff' };

function box(g: Gfx, b: Box | null, col: string): void {
  if (!b) return;
  g.rigid(b.x, b.y, () => {
    g.strokeStyle = col; g.beginPath();
    g.moveTo(b.x - b.w / 2, b.y - b.h / 2); g.lineTo(b.x + b.w / 2, b.y - b.h / 2); g.lineTo(b.x + b.w / 2, b.y + b.h / 2); g.lineTo(b.x - b.w / 2, b.y + b.h / 2);
    g.closePath(); g.stroke();
  });
}
function circle(g: Gfx, x: number, y: number, r: number, col: string): void {
  g.rigid(x, y, () => { g.strokeStyle = col; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.closePath(); g.stroke(); });
}

export function drawHitboxes(g: Gfx, G: Game): void {
  g.save(); g.lineWidth = 1; g.globalAlpha = 0.9;
  for (const ob of G.obstacles) box(g, ob, G.cfg.obstacles?.[ob.i]?.kind === 'bloque' ? COL.solid : COL.hurt);
  for (const c of G.traffic) box(g, c, COL.solid);
  for (const a of G.allies) if (!a.dead) box(g, a, COL.good);
  for (const ch of G.chains) { for (const s of ch.segs) box(g, s, COL.hurt); box(g, ch.lead, COL.hurt); }
  if (G.b.state !== 'enter' && !G.cfg.route) box(g, G.b, COL.hurt);
  box(g, jetZone(G), COL.hurt); box(g, fuselage(G), COL.solid); box(g, rampBox(G), COL.good);
  if (G.cart.on) box(g, { x: G.cart.x, y: G.cart.y, ...CART }, COL.hurt);
  for (const f of G.foes) if (!f.dead) circle(g, f.x, f.y, f.r, COL.hurt);
  for (const u of G.pickups) if (!u.dead) circle(g, u.x, u.y, u.r, COL.good);
  for (const s of G.shots) if (!s.dead) circle(g, s.x, s.y, s.r, COL.shot);
  box(g, G.p, COL.me);
  g.restore();
}
