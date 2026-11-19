import type { StageConfig } from '../../core/config';
import { drawRoad, drawSides, SIDE_SEG } from '../../core/road';
import { FONT, type Gfx, type Painter } from '../../core/gfx';
import { CanvasPainter } from '../../core/art/canvas-painter';
import type { Game } from '../../core/state';
import { C, hash } from '../../core/util';

/*
 * Paisaje de la Costa Verde de noche (ADR 0066, piloto de arte interno): el acantilado a la izquierda y el mar a la
 * derecha, con el acabado suave de los vehículos.
 * - El acantilado tiene estratos ondulados que siguen de un tramo al otro, rocas con luz y sombra, cables verticales de
 *   la malla en vez de la trama cruzada, y matorrales.
 * - El mar horneado es solo agua. La arena, la espuma y los letreros de playa se dibujan en vivo, punto a punto sobre la
 *   curva, así el borde del mar no queda en escalones (los tramos horneados se cortan en franjas que se corren enteras).
 */

const STRATA = 26; // paso de los estratos, en unidades de pista
const top = (idx: number) => -(idx + 1) * SIDE_SEG; // dónde empieza el tramo en la pista, igual para todos los tramos
const asCanvas = (g: Painter) => (g instanceof CanvasPainter ? g : null);

function drawAcantilado(g: Painter, x0: number, y: number, w: number, seg: number, idx: number, far: boolean): void {
  const cp = asCanvas(g), wt = top(idx);
  // la ladera: más clara junto a la pista, más oscura hacia arriba del acantilado
  if (cp) cp.linear(x0, 0, x0 + w, 0, far ? [[0, '#211b14'], [1, '#2c251b']] : [[0, '#2a2319'], [1, '#463b2b']]);
  else g.fillStyle = '#3b3326';
  g.fillRect(x0, y, w, seg);
  // estratos ondulados: cada uno es una franja de la pista, así siguen de un tramo al otro sin cortes
  for (let n = Math.floor(wt / STRATA) - 1; n * STRATA < wt + seg + STRATA; n++) {
    const yb = y + n * STRATA - wt, th = 6 + hash(n * 3.1) * 4, ph = hash(n * 1.7) * 6;
    g.fillStyle = n % 2 ? 'rgba(18,14,10,.32)' : 'rgba(110,92,64,.22)';
    g.beginPath();
    for (let x = 0; x <= w; x += 3) g.lineTo(x0 + x, yb + Math.sin(x * 0.11 + ph) * 3);
    for (let x = w; x >= 0; x -= 3) g.lineTo(x0 + x, yb + th + Math.sin(x * 0.11 + ph + 0.8) * 2);
    g.closePath(); g.fill();
  }
  // cables de la malla antiderrumbe: verticales y tenues, siguen de un tramo al otro
  g.fillStyle = 'rgba(170,170,185,.09)';
  for (let x = 6; x < w; x += 13) g.fillRect(x0 + x, y, 1, seg);
  // rocas con luz arriba a la izquierda, como los vehículos
  for (let i = 0; i < 3; i++) {
    if (hash(idx * 5.3 + i * 2.2) > 0.6) continue;
    const r = 3.5 + hash(idx * 2.7 + i) * 3.5, rx = x0 + r + 2 + hash(idx * 9.1 + i) * (w - 2 * r - 4), ry = y + 14 + i * 34 + hash(idx * 4.4 + i) * 12;
    g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(rx + 1.5, ry + 2, r, r * 0.8, 0, 0, 7); g.fill();
    if (cp) cp.radial(rx, ry, 0, r, [[0, '#7a6a52'], [0.6, '#4d4232'], [1, '#2b241a']], rx - r * 0.4, ry - r * 0.4);
    else g.fillStyle = '#4d4232';
    g.beginPath(); g.ellipse(rx, ry, r, r * 0.8, 0, 0, 7); g.fill();
  }
  if (hash(idx * 2.9) < 0.14) { // matorral
    const bx = x0 + w * (0.3 + hash(idx * 6.1) * 0.4), by = y + seg / 2;
    if (cp) cp.radial(bx, by, 0, 11, [[0, '#4f9a5c'], [0.7, '#2f6b3f'], [1, 'rgba(31,74,43,0)']], bx - 3, by - 3);
    else g.fillStyle = '#2f6b3f';
    g.beginPath(); g.arc(bx, by, 11, 0, 7); g.fill();
  }
}

// El mar: solo agua, más clara cerca de la orilla, con reflejos suaves. La orilla va en vivo (drawShore).
function drawMar(g: Painter, x0: number, y: number, w: number, seg: number, idx: number, near: boolean): void {
  const cp = asCanvas(g);
  if (cp) cp.linear(x0, 0, x0 + w, 0, near ? [[0, '#16395a'], [0.5, '#0f2a44'], [1, '#0b1f33']] : [[0, '#0b1f33'], [1, '#09192a']]);
  else g.fillStyle = '#0d2236';
  g.fillRect(x0 - 2, y, w + 6, seg); // un poco más ancho, para tapar la junta con la columna vecina
  for (let i = 0; i < 5; i++) {
    const len = 8 + hash(idx * 3.7 + i) * 10, wx = x0 + 4 + hash(idx * 1.3 + i) * (w - len - 8), wy = y + 9 + i * 21 + hash(idx * 2.3 + i) * 6;
    g.fillStyle = `rgba(140,214,255,${(0.1 + hash(idx * 7.7 + i) * 0.1).toFixed(2)})`; g.roundRect(wx, wy, len, 2, 1); g.fill();
  }
}

export function drawSide(g: Painter, x0: number, y: number, w: number, seg: number, idx: number, side: number): void {
  if (side % 2 === 0) drawAcantilado(g, x0, y, w, seg, idx, side > 0);
  else drawMar(g, x0, y, w, seg, idx, side === 1);
}

const SAND = 13; // ancho de la arena entre la vereda y la espuma

/*
 * La orilla, en vivo sobre la curva: arena, arena mojada y la espuma que va y viene, y cada tanto un letrero de playa.
 * Va en la capa de la pista, encima de los costados horneados y debajo de la vereda.
 */
export function drawShore(g: Gfx, x: number, scroll: number, t: number): void {
  const xs = x + SAND;
  g.fillStyle = '#5a4e3a'; g.fillRect(x, 0, SAND, 640);
  g.fillStyle = 'rgba(30,24,18,.35)'; g.fillRect(xs - 4, 0, 4, 640); // arena mojada
  // espuma: una franja ondulada que sigue a la pista y respira con el tiempo
  const foam = (y: number) => xs + 1.6 * Math.sin((y - scroll) * 0.045 + t * 1.3) + 1.2 * Math.sin((y - scroll) * 0.013);
  for (const [a, w0, w1] of [[0.16, 0, 7], [0.5, 0, 2.2]] as const) {
    g.fillStyle = `rgba(232,240,252,${a})`; g.beginPath();
    for (let y = -20; y <= 660; y += 10) g.lineTo(foam(y) + w0, y);
    for (let y = 660; y >= -20; y -= 10) g.lineTo(foam(y) + w1, y);
    g.closePath(); g.fill();
  }
  // letreros de playa, rígidos sobre la curva para que el texto no se corte en franjas
  const base = Math.floor(scroll / SIDE_SEG), off = scroll % SIDE_SEG;
  for (let k = -1; k < 640 / SIDE_SEG + 2; k++) {
    const idx = base - k;
    if (hash(idx * 4.7) >= 0.14) continue;
    const sx = x + 27, sy = off + k * SIDE_SEG - SIDE_SEG + SIDE_SEG / 2;
    g.rigid(sx, sy, () => {
      g.save(); g.translate(sx, sy); g.rotate(-Math.PI / 2);
      g.fillStyle = C.yellow; g.font = FONT(6); g.textAlign = 'center'; g.fillText('PLAYA AGUA DULCE', 0, 2); g.restore();
    });
  }
}

export function drawWorld(g: Gfx, cfg: StageConfig, scroll: number, G: Game | null): void {
  drawSides(g, cfg, scroll, drawSide, '#15121c');
  drawShore(g, cfg.road.right + 6, scroll, G?.t ?? 0);
  drawRoad(g, cfg, scroll, G);
}
