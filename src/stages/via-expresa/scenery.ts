import type { StageConfig } from '../../core/config';
import { drawRoad, drawSides } from '../../core/road';
import { H } from '../../core/constants';
import { FONT, type Gfx } from '../../core/gfx';
import type { Game } from '../../core/state';
import { C, hash } from '../../core/util';

/* Paisaje del Zanjón: muros de concreto a los lados de la pista hundida, la ciudad arriba y puentes que cruzan por encima. */

function drawMuro(g: Gfx, x0: number, y: number, w: number, seg: number, idx: number, side: number): void {
  g.fillStyle = '#4a4655'; g.fillRect(x0, y, w, seg);
  g.fillStyle = '#5a5666'; for (let yy = y; yy < y + seg; yy += 22) g.fillRect(x0 + 2, yy + 1, w - 4, 20); // paneles
  g.fillStyle = '#2f6b3f'; g.fillRect(side ? x0 + w - 8 : x0, y, 8, seg);                                 // talud con pasto
  const h = hash(idx * 2.7 + side * 9.1);
  if (h < 0.3) { // pintas y avisos en el muro
    g.save(); g.translate(x0 + w / 2, y + seg / 2); g.rotate(-Math.PI / 2);
    g.fillStyle = [C.pink, C.yellow, C.green][Math.floor(h * 10) % 3]; g.font = FONT(7); g.textAlign = 'center';
    g.fillText(['NO BOTAR BASURA', 'ZANJÓN', 'VOTA POR NADIE'][Math.floor(h * 10) % 3], 0, 2); g.restore();
  }
}

// La ciudad sobre el zanjón: edificios bajos y parques, en las columnas extra de pantallas anchas.
function drawCiudad(g: Gfx, x0: number, y: number, w: number, seg: number, idx: number): void {
  const h = hash(idx * 4.1);
  if (h < 0.3) { g.fillStyle = '#1d4a2c'; g.fillRect(x0, y, w, seg); g.fillStyle = '#2f6b3f'; g.beginPath(); g.arc(x0 + w / 2, y + seg / 2, 14, 0, 7); g.fill(); return; }
  g.fillStyle = h < 0.65 ? '#33293f' : '#2b3346'; g.fillRect(x0 + 2, y + 4, w - 4, seg - 8);
  for (let wy = y + 12; wy < y + seg - 10; wy += 12) for (let wx = x0 + 7; wx < x0 + w - 8; wx += 9) {
    g.fillStyle = hash(wx + wy + idx) > 0.7 ? 'rgba(255,225,77,.45)' : 'rgba(140,180,220,.15)'; g.fillRect(wx, wy, 5, 6);
  }
}

function drawSide(g: Gfx, x0: number, y: number, w: number, seg: number, idx: number, side: number): void {
  if (side <= 1) drawMuro(g, x0, y, w, seg, idx, side); else drawCiudad(g, x0, y, w, seg, idx);
}

// Puentes que cruzan sobre el zanjón: una franja de sombra y el tablero con el nombre de la avenida.
function drawPuentes(g: Gfx, cfg: StageConfig, scroll: number): void {
  const period = 560, off = scroll % period, base = Math.floor(scroll / period);
  for (let k = -1; k < H / period + 1; k++) {
    const y = off + k * period - 200, name = cfg.streets[(((base - k) % cfg.streets.length) + cfg.streets.length) % cfg.streets.length];
    g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(cfg.road.left - 8, y + 26, cfg.road.right - cfg.road.left + 16, 22);
    g.fillStyle = 'rgba(90,86,102,.5)'; g.fillRect(cfg.road.left - 8, y, cfg.road.right - cfg.road.left + 16, 26);
    g.fillStyle = 'rgba(247,241,255,.4)'; g.font = FONT(9); g.textAlign = 'center'; g.fillText(name, (cfg.road.left + cfg.road.right) / 2, y + 17);
  }
}

export function drawWorld(g: Gfx, cfg: StageConfig, scroll: number, G: Game | null): void {
  drawSides(g, cfg, scroll, drawSide, '#1d1a24');
  drawRoad(g, cfg, scroll, G);
  drawPuentes(g, cfg, scroll);
}
