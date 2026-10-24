import type { StageConfig } from '../../core/config';
import { drawRoad, drawSides } from '../../core/road';
import { FONT, type Gfx } from '../../core/gfx';
import type { Game } from '../../core/state';
import { C, hash } from '../../core/util';

/* Paisaje de Gamarra: galerías de varios pisos llenas de carteles, maniquíes en la vereda y cables cruzando entre postes. */

const CARTELES = ['OFERTA', 'POR MAYOR', 'JEANS', 'LIQUIDACIÓN', 'TODO A 10', 'POLOS', 'REMATE'];
const FACHADAS = ['#3a3346', '#45324a', '#2f3a4a', '#4a3a2e'];

function drawGaleria(g: Gfx, x0: number, y: number, w: number, seg: number, idx: number, side: number): void {
  const h = hash(idx * 1.7 + side * 23.3);
  g.fillStyle = FACHADAS[Math.floor(h * FACHADAS.length)]; g.fillRect(x0 + 2, y + 4, w - 4, seg - 8);
  // pisos con vitrinas iluminadas
  for (let f = 0; f < 4; f++) {
    const fy = y + 10 + f * 24;
    g.fillStyle = hash(idx + f * 3.1 + side) > 0.35 ? 'rgba(255,225,77,.35)' : 'rgba(127,212,255,.2)'; g.fillRect(x0 + 6, fy, w - 12, 14);
  }
  // cartel vertical de colores
  const cart = CARTELES[Math.floor(hash(idx * 4.3 + side) * CARTELES.length)];
  g.save(); g.translate(x0 + w / 2 + 1, y + seg / 2); g.rotate(-Math.PI / 2);
  g.fillStyle = [C.pink, C.yellow, C.green, '#3a7bff'][Math.floor(h * 4)]; g.fillRect(-34, -7, 68, 13);
  g.fillStyle = '#15111d'; g.font = FONT(6); g.textAlign = 'center'; g.fillText(cart, 0, 2); g.restore();
}

// Vereda con maniquíes y fardos en la puerta de una galería.
function drawVereda(g: Gfx, x0: number, y: number, w: number, seg: number, idx: number): void {
  g.fillStyle = '#2a2438'; g.fillRect(x0, y, w, seg);
  for (let i = 0; i < 3; i++) {
    const mx = x0 + 8 + i * ((w - 16) / 2), my = y + 22 + (i % 2) * 30;
    g.fillStyle = '#e8e2d0'; g.beginPath(); g.arc(mx, my, 3, 0, 7); g.fill();
    g.fillStyle = [C.pink, '#3a7bff', C.green][(((i + idx) % 3) + 3) % 3]; g.fillRect(mx - 4, my + 3, 8, 12);
  }
  g.fillStyle = '#c9a35a'; g.fillRect(x0 + 6, y + seg - 26, 16, 12); g.fillRect(x0 + w - 22, y + seg - 30, 16, 16);
  g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x0 + 6, y + seg - 21, 16, 1.5);
}

function drawSide(g: Gfx, x0: number, y: number, w: number, seg: number, idx: number, side: number): void {
  if (side <= 1 && hash(idx * 5.9 + side * 13.1) < 0.22) drawVereda(g, x0, y, w, seg, idx);
  else drawGaleria(g, x0, y, w, seg, idx, side);
  // cables entre postes que cruzan las cuadras
  g.strokeStyle = 'rgba(10,8,14,.7)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(x0, y + 8); g.lineTo(x0 + w, y + 14); g.moveTo(x0, y + 12); g.lineTo(x0 + w, y + 10); g.stroke();
}

export function drawWorld(g: Gfx, cfg: StageConfig, scroll: number, G: Game | null): void {
  drawSides(g, cfg, scroll, drawSide, '#1e1826');
  drawRoad(g, cfg, scroll, G);
}
