import type { StageConfig } from '../../core/config';
import { H, W } from '../../core/constants';
import { FONT, type Gfx } from '../../core/gfx';
import type { Game } from '../../core/state';
import { C, hash } from '../../core/util';

/* Paisaje de San Isidro: Huaca Huallamarca, Lima Golf, Bosque El Olivar y torres de vidrio; cruces y rompemuelles. */

function drawSide(g: Gfx, x0: number, y: number, w: number, seg: number, idx: number, side: number): void {
  const h = hash(idx * 3.1 + side * 91.7);
  if (side === 0 && ((idx % 64) + 64) % 64 === 22) { // Huaca Huallamarca, adobe escalonado
    g.fillStyle = '#3b2a1e'; g.fillRect(x0, y, w, seg);
    for (let s = 0; s < 5; s++) { const i = s * 3.5; g.fillStyle = s % 2 ? '#b98a5a' : '#a87a4c'; g.fillRect(x0 + 3 + i, y + 8 + s * 8, w - 6 - 2 * i, seg - 16 - s * 16); }
    g.save(); g.translate(x0 + w / 2 + 1, y + seg / 2); g.rotate(-Math.PI / 2); g.fillStyle = C.yellow; g.font = FONT(6); g.textAlign = 'center'; g.fillText('HUACA HUALLAMARCA', 0, 2); g.restore();
    return;
  }
  if (side === 1 && h < 0.22) { // Lima Golf: green, bandera y búnker
    g.fillStyle = '#1d4a2c'; g.fillRect(x0, y, w, seg);
    g.fillStyle = '#2f6b3f'; g.beginPath(); g.ellipse(x0 + w / 2, y + seg / 2, w / 2 - 4, seg / 3, 0, 0, 7); g.fill();
    g.fillStyle = '#d9c48a'; g.beginPath(); g.ellipse(x0 + w / 2 - 6, y + seg - 22, 8, 5, 0, 0, 7); g.fill();
    g.strokeStyle = '#eee'; g.lineWidth = 1; g.beginPath(); g.moveTo(x0 + w / 2 + 4, y + seg / 2); g.lineTo(x0 + w / 2 + 4, y + seg / 2 - 18); g.stroke();
    g.fillStyle = C.pink; g.beginPath(); g.moveTo(x0 + w / 2 + 4, y + seg / 2 - 18); g.lineTo(x0 + w / 2 + 13, y + seg / 2 - 14); g.lineTo(x0 + w / 2 + 4, y + seg / 2 - 10); g.fill();
    return;
  }
  if (h < 0.3) { // Bosque El Olivar
    g.fillStyle = '#14281f'; g.fillRect(x0, y, w, seg);
    for (let t = 0; t < 3; t++) {
      const tx = x0 + 8 + hash(idx + t * 7 + side) * (w - 16), ty = y + 16 + t * 34;
      g.fillStyle = '#46604a'; g.beginPath(); g.arc(tx, ty, 11, 0, 7); g.fill();
      g.fillStyle = '#7d9a74'; g.beginPath(); g.arc(tx - 3, ty - 3, 6, 0, 7); g.fill();
    }
    return;
  }
  // torres de vidrio del centro financiero
  g.fillStyle = h < 0.6 ? '#232a3d' : '#2a2238'; g.fillRect(x0 + 2, y + 4, w - 4, seg - 8);
  g.fillStyle = h < 0.45 ? 'rgba(61,255,154,.45)' : h < 0.7 ? 'rgba(255,46,136,.45)' : 'rgba(127,212,255,.45)'; g.fillRect(x0 + 2, y + 4, w - 4, 3);
  for (let wy = y + 12; wy < y + seg - 12; wy += 12) for (let wx = x0 + 7; wx < x0 + w - 8; wx += 9) {
    g.fillStyle = hash(wx * 1.3 + wy * 0.7 + idx) > 0.72 ? 'rgba(255,225,77,.55)' : 'rgba(120,170,220,.18)'; g.fillRect(wx, wy, 5, 6);
  }
}

export function drawWorld(g: Gfx, cfg: StageConfig, scroll: number, G: Game | null): void {
  const L = cfg.road.left, R = cfg.road.right, LW = cfg.road.laneWidth;
  g.fillStyle = '#1a1522'; g.fillRect(0, 0, W, H);
  const seg = 110, base = Math.floor(scroll / seg), off = scroll % seg;
  for (let k = -1; k < H / seg + 2; k++) {
    const y = off + k * seg - seg, idx = base - k;
    drawSide(g, 0, y, L - 8, seg, idx, 0); drawSide(g, R + 8, y, L - 8, seg, idx, 1);
  }
  g.fillStyle = '#3a3445'; g.fillRect(L - 8, 0, 8, H); g.fillRect(R, 0, 8, H);
  // postes de luz
  const poff = scroll % 160;
  for (let y = poff - 160; y < H; y += 160) {
    g.fillStyle = 'rgba(255,225,77,.08)'; g.beginPath(); g.arc(L + 6, y, 26, 0, 7); g.fill(); g.beginPath(); g.arc(R - 6, y + 80, 26, 0, 7); g.fill();
    g.fillStyle = '#8c869a'; g.fillRect(L - 6, y - 2, 4, 4); g.fillRect(R + 2, y + 78, 4, 4);
  }
  g.fillStyle = '#2a2632'; g.fillRect(L, 0, R - L, H);
  g.fillStyle = C.yellow; g.fillRect(L + 2, 0, 3, H); g.fillRect(R - 5, 0, 3, H);
  g.fillStyle = 'rgba(247,241,255,.55)';
  const doff = scroll % 50;
  for (let j = 1; j < cfg.road.lanes; j++) { const x = L + LW * j - 1.5; for (let y = -50 + doff; y < H; y += 50) g.fillRect(x, y, 3, 26); }
  if (G) {
    for (const c of G.cross) { // paso de cebra y calle transversal
      g.fillStyle = 'rgba(247,241,255,.6)'; for (let x = L + 8; x < R - 8; x += 16) g.fillRect(x, c.y, 9, 22);
      g.fillStyle = 'rgba(247,241,255,.28)'; g.font = FONT(11); g.textAlign = 'center'; g.fillText(c.name, W / 2, c.y - 10);
    }
    for (const m of G.bumps) { // rompemuelles amarillo y negro
      for (let x = L + 6, i = 0; x < R - 6; x += 12, i++) { g.fillStyle = i % 2 ? '#111' : C.yellow; g.fillRect(x, m.y - 5, 12, 10); }
    }
  }
  const ly = 120 + scroll;
  if (ly < H + 40) { g.fillStyle = 'rgba(247,241,255,.22)'; g.font = FONT(18); g.textAlign = 'center'; g.fillText(cfg.roadName, W / 2, ly); }
}
