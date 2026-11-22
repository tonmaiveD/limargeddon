import { FONT, type Gfx } from '../core/gfx';
import type { Game, Seg } from '../core/state';
import { SKIN_SCALE } from '../core/art/skin';
import { lights } from '../core/art/vehicles';
import { drawCoil } from '../bosses/doblefila-render';
import { bossId, rowId } from './skin';

/*
 * La Doble Fila con el arte entregado (ADR 0067). Mismo orden y mismos avisos que drawDobleFila del juego: el enrosque,
 * los autos de la fila y la camioneta al frente, cada uno rígido sobre la curva. Las balizas son las capas entregadas y
 * parpadean al mismo ritmo que las del juego, en la capa de encima, así se ven sobre la noche. Las luces de freno y de
 * reversa siguen siendo las del motor.
 */

function drawSeg(g: Gfx, img: Gfx, G: Game, s: Seg, k: number): void {
  img.save(); img.translate(s.x, s.y); img.rotate(s.ang ?? 0);
  img.image(rowId(G.cfg.boss.body?.cols ?? [], s.col, s.hp, s.max), 0, 0, 1 / SKIN_SCALE, 0, s.flash && s.flash > 0 ? 0xffffff : undefined);
  img.restore();
  if (Math.floor(G.t * 3 + k) % 2 === 0) { g.save(); g.translate(s.x, s.y); g.rotate(s.ang ?? 0); g.image('fila_balizas', 0, 0, 1 / SKIN_SCALE); g.restore(); }
}

function drawHead(g: Gfx, img: Gfx, G: Game): void {
  const b = G.b;
  img.save(); img.translate(b.x, b.y); img.rotate(b.ang ?? 0);
  img.image(bossId(b.hp, b.max), 0, 0, 1 / SKIN_SCALE, 0, b.hitFlash && b.hitFlash > 0 ? 0xffffff : undefined);
  img.restore();
  g.save(); g.translate(b.x, b.y); g.rotate(b.ang ?? 0);
  if (b.flash === 'brake' || b.flash === 'rev') lights(g, G.t, { kind: 'suv', w: b.w, h: b.h, body: '#c9ccd3' }, 0, b.flash === 'brake', b.flash === 'rev', false);
  if (b.flash === 'hazard' || Math.floor(G.t * 3) % 2 === 0) g.image('jefe_balizas', 0, 0, 1 / SKIN_SCALE);
  g.restore();
  if (b.flash === 'horn') { g.fillStyle = '#ffe14d'; g.font = FONT(14); g.textAlign = 'center'; g.fillText('¡PIII PIII!', b.x + b.w / 2 + 26, b.y - b.h / 2); }
}

export function drawBoss(g: Gfx, G: Game, img: Gfx): void {
  drawCoil(g, G);
  let k = 0;
  const seg = (s: Seg) => { const n = k++; img.rigid(s.x, s.y, () => g.rigid(s.x, s.y, () => drawSeg(g, img, G, s, n))); };
  for (const ch of G.chains) {
    for (let i = ch.segs.length - 1; i >= 0; i--) seg(ch.segs[i]);
    if (ch.lead) seg(ch.lead);
  }
  const b = G.b;
  img.rigid(b.x, b.y, () => g.rigid(b.x, b.y, () => drawHead(g, img, G)));
}
