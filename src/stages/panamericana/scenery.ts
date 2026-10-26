import type { StageConfig } from '../../core/config';
import { drawRoad, drawSides } from '../../core/road';
import { FONT, type Gfx, type Painter } from '../../core/gfx';
import type { Game } from '../../core/state';
import { C, hash } from '../../core/util';

/* Paisaje de la Panamericana Norte: arenales y dunas, el mar a la derecha, paraderos de comida al paso y carteles de kilómetros. */

function drawArenal(g: Painter, x0: number, y: number, w: number, seg: number, idx: number, side: number): void {
  g.fillStyle = '#8a7a5a'; g.fillRect(x0, y, w, seg);
  for (let i = 0; i < 3; i++) { // dunas
    const dx = x0 + hash(idx * 1.3 + i + side) * w, dy = y + 18 + i * 32;
    g.fillStyle = 'rgba(0,0,0,.12)'; g.beginPath(); g.ellipse(dx, dy + 3, 18, 7, 0, 0, 7); g.fill();
    g.fillStyle = '#a8966e'; g.beginPath(); g.ellipse(dx, dy, 18, 7, 0, 0, 7); g.fill();
  }
}

function drawMar(g: Painter, x0: number, y: number, w: number, seg: number, idx: number): void {
  g.fillStyle = '#8a7a5a'; g.fillRect(x0, y, 10, seg);
  g.fillStyle = '#e8e2d0'; g.fillRect(x0 + 10, y, 4, seg); // orilla
  g.fillStyle = '#16324a'; g.fillRect(x0 + 14, y, w - 14, seg);
  g.fillStyle = 'rgba(127,212,255,.25)'; for (let i = 0; i < 5; i++) g.fillRect(x0 + 16 + hash(idx + i) * (w - 26), y + 10 + i * 20, 9, 1.5);
}

// Restaurante al paso con su cartel, como los de chicharrón en la ruta.
function drawParada(g: Painter, x0: number, y: number, w: number, seg: number, side: number): void {
  g.fillStyle = '#8a7a5a'; g.fillRect(x0, y, w, seg);
  g.fillStyle = '#d93b3b'; g.fillRect(x0 + 6, y + 20, w - 12, 46);
  g.fillStyle = '#f4f1e6'; g.fillRect(x0 + 6, y + 20, w - 12, 5);
  g.save(); g.translate(x0 + w / 2 + 1, y + 43); g.rotate(-Math.PI / 2); g.fillStyle = C.yellow; g.font = FONT(5.5); g.textAlign = 'center'; g.fillText('CHICHARRÓN', 0, 2); g.restore();
  g.fillStyle = '#4a4452'; g.fillRect(side ? x0 + 4 : x0 + w - 18, y + seg - 26, 14, 10); // un auto estacionado
}

// Cartel verde de kilómetro.
function drawKilometro(g: Painter, x0: number, y: number, w: number, seg: number, idx: number): void {
  drawArenal(g, x0, y, w, seg, idx, 0);
  g.fillStyle = '#1f6b3f'; g.fillRect(x0 + w / 2 - 12, y + seg / 2 - 8, 24, 16);
  g.fillStyle = '#f4f6fb'; g.font = FONT(6); g.textAlign = 'center'; g.fillText('KM ' + (40 + ((idx % 60) + 60) % 60), x0 + w / 2, y + seg / 2 + 2);
}

function drawSide(g: Painter, x0: number, y: number, w: number, seg: number, idx: number, side: number): void {
  const h = hash(idx * 3.3 + side * 5.1);
  if (side === 1 || side % 2 === 1) { if (h < 0.15) drawParada(g, x0, y, w, seg, side); else drawMar(g, x0, y, w, seg, idx); return; }
  if (h < 0.15) drawParada(g, x0, y, w, seg, side);
  else if (h < 0.25) drawKilometro(g, x0, y, w, seg, idx);
  else drawArenal(g, x0, y, w, seg, idx, side);
}

export function drawWorld(g: Gfx, cfg: StageConfig, scroll: number, G: Game | null): void {
  drawSides(g, cfg, scroll, drawSide, '#7a6a4a');
  drawRoad(g, cfg, scroll, G);
}
