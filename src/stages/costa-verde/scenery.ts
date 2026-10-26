import type { StageConfig } from '../../core/config';
import { drawRoad, drawSides } from '../../core/road';
import { FONT, type Gfx, type Painter } from '../../core/gfx';
import type { Game } from '../../core/state';
import { C, hash } from '../../core/util';

/* Paisaje de la Costa Verde de noche: el acantilado con sus mallas a la izquierda y el mar con la playa a la derecha. */

function drawAcantilado(g: Painter, x0: number, y: number, w: number, seg: number, idx: number): void {
  g.fillStyle = '#3b3326'; g.fillRect(x0, y, w, seg);
  for (let i = 0; i < 5; i++) { // estratos de tierra y piedra
    g.fillStyle = i % 2 ? '#4a4030' : '#2f281e'; g.fillRect(x0, y + i * 22 + hash(idx + i) * 6, w, 8);
  }
  g.strokeStyle = 'rgba(160,160,170,.35)'; g.lineWidth = 1; g.beginPath(); // malla antiderrumbe
  for (let x = x0; x < x0 + w; x += 10) { g.moveTo(x, y); g.lineTo(x + 10, y + seg); g.moveTo(x + 10, y); g.lineTo(x, y + seg); }
  g.stroke();
  if (hash(idx * 2.9) < 0.12) { g.fillStyle = '#2f6b3f'; g.beginPath(); g.arc(x0 + w / 2, y + seg / 2, 10, 0, 7); g.fill(); } // matorral
}

function drawPlaya(g: Painter, x0: number, y: number, w: number, seg: number, idx: number, near: boolean): void {
  g.fillStyle = '#0d2236'; g.fillRect(x0, y, w, seg); // mar de noche
  g.fillStyle = 'rgba(127,212,255,.18)'; for (let i = 0; i < 5; i++) g.fillRect(x0 + 6 + hash(idx * 1.3 + i) * (w - 18), y + 8 + i * 21, 10, 1.5);
  if (!near) return;
  g.fillStyle = '#5a4e3a'; g.fillRect(x0, y, 12, seg);        // arena oscura
  g.fillStyle = 'rgba(244,246,251,.45)'; g.fillRect(x0 + 12, y, 2, seg); // espuma
  if (hash(idx * 4.7) < 0.14) { // letrero de playa
    g.save(); g.translate(x0 + w / 2 + 4, y + seg / 2); g.rotate(-Math.PI / 2);
    g.fillStyle = C.yellow; g.font = FONT(6); g.textAlign = 'center'; g.fillText('PLAYA AGUA DULCE', 0, 2); g.restore();
  }
}

function drawSide(g: Painter, x0: number, y: number, w: number, seg: number, idx: number, side: number): void {
  if (side % 2 === 0) drawAcantilado(g, x0, y, w, seg, idx);
  else drawPlaya(g, x0, y, w, seg, idx, side === 1);
}

export function drawWorld(g: Gfx, cfg: StageConfig, scroll: number, G: Game | null): void {
  drawSides(g, cfg, scroll, drawSide, '#15121c');
  drawRoad(g, cfg, scroll, G);
}
