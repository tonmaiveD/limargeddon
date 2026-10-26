import type { StageConfig } from '../../core/config';
import { drawRoad, drawSides } from '../../core/road';
import { FONT, type Gfx, type Painter } from '../../core/gfx';
import type { Game } from '../../core/state';
import { C, hash } from '../../core/util';

/* Paisaje del Centro de Lima: casonas de colores con balcones de celosía, una iglesia de dos torres y una plaza con pileta. */

const FACHADAS = ['#e8c35a', '#7fb6d9', '#e59aa8', '#d9d4c7', '#9cc59a'];

function drawCasona(g: Painter, x0: number, y: number, w: number, seg: number, idx: number, side: number): void {
  const h = hash(idx * 2.9 + side * 7.7);
  g.fillStyle = FACHADAS[Math.floor(h * FACHADAS.length)]; g.fillRect(x0 + 2, y + 4, w - 4, seg - 8);
  g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x0 + 2, y + 4, w - 4, 4); // cornisa
  // balcón de celosía de madera
  const by = y + 22 + Math.floor(h * 3) * 8;
  g.fillStyle = '#5a3a22'; g.fillRect(x0 + 5, by, w - 10, 26);
  g.fillStyle = '#7a5232';
  for (let i = 0; i < 4; i++) g.fillRect(x0 + 7 + i * ((w - 14) / 4), by + 3, (w - 14) / 4 - 2, 20);
  g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x0 + 5, by + 24, w - 10, 3);
  // puerta y ventanas
  g.fillStyle = '#3b2a1e'; g.fillRect(x0 + w / 2 - 5, y + seg - 26, 10, 18);
  g.fillStyle = 'rgba(255,225,77,.45)'; if (h > 0.5) g.fillRect(x0 + 8, y + seg - 40, 6, 8);
}

function drawIglesia(g: Painter, x0: number, y: number, w: number, seg: number): void {
  g.fillStyle = '#e3c27a'; g.fillRect(x0 + 2, y + 4, w - 4, seg - 8);
  g.fillStyle = '#c9a35a'; g.fillRect(x0 + 4, y + 8, 10, 30); g.fillRect(x0 + w - 14, y + 8, 10, 30); // torres
  g.fillStyle = '#8a6a3a'; g.beginPath(); g.arc(x0 + 9, y + 10, 5, 0, 7); g.fill(); g.beginPath(); g.arc(x0 + w - 9, y + 10, 5, 0, 7); g.fill();
  g.fillStyle = '#5a3a22'; g.fillRect(x0 + w / 2 - 6, y + seg - 34, 12, 26);
  g.save(); g.translate(x0 + w / 2 + 1, y + seg / 2 + 6); g.rotate(-Math.PI / 2); g.fillStyle = '#5a3a22'; g.font = FONT(6); g.textAlign = 'center'; g.fillText('IGLESIA', 0, 2); g.restore();
}

function drawPlaza(g: Painter, x0: number, y: number, w: number, seg: number): void {
  g.fillStyle = '#4a4452'; g.fillRect(x0, y, w, seg);
  g.fillStyle = '#2f6b3f'; g.fillRect(x0 + 3, y + 8, w - 6, 18); g.fillRect(x0 + 3, y + seg - 26, w - 6, 18);
  g.fillStyle = '#b9b4c4'; g.beginPath(); g.arc(x0 + w / 2, y + seg / 2, 13, 0, 7); g.fill();
  g.fillStyle = '#7fd4ff'; g.beginPath(); g.arc(x0 + w / 2, y + seg / 2, 9, 0, 7); g.fill(); // pileta
  g.save(); g.translate(x0 + w / 2 + 1, y + seg / 2); g.rotate(-Math.PI / 2); g.fillStyle = C.yellow; g.font = FONT(6); g.textAlign = 'center'; g.fillText('PLAZA', 0, -16); g.restore();
}

function drawSide(g: Painter, x0: number, y: number, w: number, seg: number, idx: number, side: number): void {
  const k = ((idx % 48) + 48) % 48;
  if (side === 1 && k === 10) drawIglesia(g, x0, y, w, seg);
  else if (side === 0 && k === 30) drawPlaza(g, x0, y, w, seg);
  else drawCasona(g, x0, y, w, seg, idx, side);
}

export function drawWorld(g: Gfx, cfg: StageConfig, scroll: number, G: Game | null): void {
  drawSides(g, cfg, scroll, drawSide, '#2a2230');
  drawRoad(g, cfg, scroll, G);
}
