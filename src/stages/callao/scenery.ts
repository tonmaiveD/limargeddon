import type { StageConfig } from '../../core/config';
import { drawRoad, drawSides } from '../../core/road';
import { FONT, type Gfx, type Painter } from '../../core/gfx';
import type { Game } from '../../core/state';
import { C, hash } from '../../core/util';

/* Paisaje del Callao: patios de contenedores apilados, grúas del puerto, almacenes y, de vez en cuando, el mar con un barco. */

const CONTENEDORES = ['#d93b3b', '#3a7bff', '#1f9e5a', '#ff8a1f', '#c9ccd3', '#8a5a3a'];

function drawPatio(g: Painter, x0: number, y: number, w: number, seg: number, idx: number, side: number): void {
  g.fillStyle = '#2f2a36'; g.fillRect(x0, y, w, seg);
  for (let r = 0; r < 5; r++) for (let c = 0; c < 2; c++) {
    const hh = hash(idx * 3.7 + r * 1.9 + c * 5.3 + side);
    if (hh < 0.15) continue; // hueco en la ruma
    g.fillStyle = CONTENEDORES[Math.floor(hh * CONTENEDORES.length)];
    const cx = x0 + 4 + c * ((w - 8) / 2), cy = y + 4 + r * 21;
    g.fillRect(cx, cy, (w - 8) / 2 - 2, 18);
    g.fillStyle = 'rgba(0,0,0,.2)'; for (let k = 3; k < (w - 8) / 2 - 4; k += 4) g.fillRect(cx + k, cy + 2, 1, 14);
  }
}

// Grúa pórtico vista desde arriba: dos rieles, la viga y un contenedor colgando.
function drawGrua(g: Painter, x0: number, y: number, w: number, seg: number): void {
  g.fillStyle = '#2f2a36'; g.fillRect(x0, y, w, seg);
  g.fillStyle = '#ffe14d'; g.fillRect(x0 + 4, y + 6, 4, seg - 12); g.fillRect(x0 + w - 8, y + 6, 4, seg - 12);
  g.fillRect(x0 + 4, y + seg / 2 - 4, w - 8, 8);
  g.fillStyle = '#15111d'; for (let x = x0 + 6; x < x0 + w - 6; x += 6) g.fillRect(x, y + seg / 2 - 4, 2, 8);
  g.fillStyle = '#3a7bff'; g.fillRect(x0 + w / 2 - 7, y + seg / 2 + 8, 14, 22);
  g.save(); g.translate(x0 + w / 2 + 1, y + 20); g.rotate(-Math.PI / 2); g.fillStyle = C.yellow; g.font = FONT(5); g.textAlign = 'center'; g.fillText('GRÚA', 0, 2); g.restore();
}

// El mar con un barco de carga, solo en las columnas pegadas a la pista.
function drawMar(g: Painter, x0: number, y: number, w: number, seg: number, idx: number): void {
  g.fillStyle = '#16324a'; g.fillRect(x0, y, w, seg);
  g.fillStyle = 'rgba(127,212,255,.25)'; for (let i = 0; i < 6; i++) g.fillRect(x0 + 4 + hash(idx + i) * (w - 12), y + 8 + i * 17, 8, 1.5);
  g.fillStyle = '#4a4452'; g.fillRect(x0 + w / 2 - 9, y + 14, 18, seg - 28);
  g.fillStyle = '#d93b3b'; g.fillRect(x0 + w / 2 - 7, y + 24, 14, 16); g.fillStyle = '#1f9e5a'; g.fillRect(x0 + w / 2 - 7, y + 44, 14, 16);
  g.fillStyle = '#f4f1e6'; g.fillRect(x0 + w / 2 - 6, y + seg - 30, 12, 10); // puente del barco
}

function drawSide(g: Painter, x0: number, y: number, w: number, seg: number, idx: number, side: number): void {
  const k = ((idx % 36) + 36) % 36, h = hash(idx * 2.1 + side * 17.3);
  if (side === 1 && k >= 14 && k <= 16) drawMar(g, x0, y, w, seg, idx);
  else if (h < 0.18) drawGrua(g, x0, y, w, seg);
  else drawPatio(g, x0, y, w, seg, idx, side);
}

export function drawWorld(g: Gfx, cfg: StageConfig, scroll: number, G: Game | null): void {
  drawSides(g, cfg, scroll, drawSide, '#1d1a24');
  drawRoad(g, cfg, scroll, G);
}
