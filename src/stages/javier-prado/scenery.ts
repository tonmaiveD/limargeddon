import type { StageConfig } from '../../core/config';
import { drawRoad, drawSides } from '../../core/road';
import { FONT, type Gfx, type Painter } from '../../core/gfx';
import type { Game } from '../../core/state';
import { C, hash } from '../../core/util';

/* Paisaje de la Javier Prado: torres de oficinas, el cerco eterno del by-pass, semáforos y paraderos donde para cualquiera. */

function drawTorre(g: Painter, x0: number, y: number, w: number, seg: number, h: number, idx: number): void {
  g.fillStyle = h < 0.55 ? '#2b3346' : '#33293f'; g.fillRect(x0 + 2, y + 4, w - 4, seg - 8);
  g.fillStyle = h < 0.4 ? 'rgba(127,212,255,.5)' : 'rgba(255,138,31,.45)'; g.fillRect(x0 + 2, y + 4, w - 4, 3);
  for (let wy = y + 12; wy < y + seg - 10; wy += 10) for (let wx = x0 + 6; wx < x0 + w - 7; wx += 8) {
    g.fillStyle = hash(wx * 0.9 + wy * 1.1 + idx) > 0.7 ? 'rgba(255,225,77,.5)' : 'rgba(140,180,220,.16)'; g.fillRect(wx, wy, 5, 5);
  }
}

// Cerco de la obra del by-pass, con su cartel de siempre.
function drawObra(g: Painter, x0: number, y: number, w: number, seg: number): void {
  g.fillStyle = '#3a3226'; g.fillRect(x0, y, w, seg);
  g.fillStyle = '#5a4a32'; for (let i = 0; i < 3; i++) g.fillRect(x0 + 6 + i * 12, y + 20 + i * 18, 18, 10); // tierra removida
  g.fillStyle = C.orange; g.fillRect(x0 + 2, y, 4, seg); g.fillRect(x0 + w - 6, y, 4, seg);
  g.fillStyle = '#15111d'; for (let yy = y; yy < y + seg; yy += 12) { g.fillRect(x0 + 2, yy, 4, 5); g.fillRect(x0 + w - 6, yy + 6, 4, 5); }
  g.save(); g.translate(x0 + w / 2 + 1, y + seg / 2); g.rotate(-Math.PI / 2);
  g.fillStyle = C.yellow; g.fillRect(-46, -8, 92, 15);
  g.fillStyle = '#15111d'; g.font = FONT(5); g.textAlign = 'center'; g.fillText('PRONTO, PARA TU COMODIDAD', 0, 2); g.restore();
}

// Paradero con su techito, el poste del semáforo y gente esperando.
function drawParadero(g: Painter, x0: number, y: number, w: number, seg: number, h: number, side: number): void {
  g.fillStyle = '#2a2438'; g.fillRect(x0, y, w, seg);
  const px = side ? x0 + 4 : x0 + w - 12;
  g.fillStyle = '#4a4452'; g.fillRect(px, y + 14, 8, 44); // techito
  g.fillStyle = C.green; g.fillRect(px, y + 14, 8, 3);
  for (let i = 0; i < 3; i++) { g.fillStyle = ['#e59aa8', '#7fb6d9', '#9cc59a'][(i + Math.floor(h * 3)) % 3]; g.beginPath(); g.arc(px + 4, y + 26 + i * 11, 3, 0, 7); g.fill(); }
  // semáforo: la ola nunca coincide, cada uno en su color
  const sx = side ? x0 + w - 10 : x0 + 6, lit = Math.floor(h * 3);
  g.fillStyle = '#15111d'; g.fillRect(sx, y + 70, 6, 18);
  ['#ff3355', '#ffe14d', '#3dff9a'].forEach((c, i) => { g.fillStyle = i === lit ? c : 'rgba(255,255,255,.12)'; g.beginPath(); g.arc(sx + 3, y + 73 + i * 6, 2, 0, 7); g.fill(); });
  g.save(); g.translate(x0 + w / 2 + 1, y + seg - 16); g.rotate(-Math.PI / 2); g.fillStyle = C.yellow; g.font = FONT(5); g.textAlign = 'center'; g.fillText('PARADERO', 0, 2); g.restore();
}

function drawSide(g: Painter, x0: number, y: number, w: number, seg: number, idx: number, side: number): void {
  const h = hash(idx * 2.3 + side * 41.9), k = ((idx % 40) + 40) % 40;
  if (side <= 1 && (k === 6 || k === 7 || k === 8)) drawObra(g, x0, y, w, seg); // el by-pass ocupa varias cuadras
  else if (side <= 1 && h < 0.2) drawParadero(g, x0, y, w, seg, h, side);
  else drawTorre(g, x0, y, w, seg, h, idx);
}

export function drawWorld(g: Gfx, cfg: StageConfig, scroll: number, G: Game | null): void {
  drawSides(g, cfg, scroll, drawSide, '#201b2a');
  drawRoad(g, cfg, scroll, G);
}
