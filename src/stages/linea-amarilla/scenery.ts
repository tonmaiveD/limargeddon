import type { StageConfig } from '../../core/config';
import { drawRoad, drawSides } from '../../core/road';
import { FONT, type Gfx } from '../../core/gfx';
import type { Game } from '../../core/state';
import { C, hash } from '../../core/util';

/*
 * Paisaje de la Línea Amarilla del Terror, uno por tramo: cerros con casitas en la Vía de Evitamiento, paredes del túnel,
 * el río Rímac bajo el puente modular de dos carriles y la pista del aeropuerto. La pista cambia de ancho en cada tramo,
 * así que se dibuja con la config viva de la partida.
 */

function cerro(g: Gfx, x0: number, y: number, w: number, seg: number, idx: number, side: number): void {
  g.fillStyle = '#6a5a44'; g.fillRect(x0, y, w, seg);
  for (let i = 0; i < 5; i++) { // casitas de colores en la ladera
    const h = hash(idx * 3.1 + i * 1.7 + side);
    g.fillStyle = ['#e59aa8', '#7fb6d9', '#e8c35a', '#9cc59a', '#d9d4c7'][Math.floor(h * 5)];
    g.fillRect(x0 + 4 + h * (w - 20), y + 6 + i * 21, 12, 10);
    g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(x0 + 4 + h * (w - 20), y + 6 + i * 21, 12, 2);
  }
  if (hash(idx * 7.3 + side) < 0.12) {
    g.save(); g.translate(x0 + w / 2 + 1, y + seg / 2); g.rotate(-Math.PI / 2);
    g.fillStyle = C.yellow; g.fillRect(-34, -7, 68, 13); g.fillStyle = '#15111d'; g.font = FONT(6); g.textAlign = 'center'; g.fillText('PEAJE A 500 M', 0, 2); g.restore();
  }
}

function tunel(g: Gfx, x0: number, y: number, w: number, seg: number, idx: number): void {
  g.fillStyle = '#2a2632'; g.fillRect(x0, y, w, seg);
  g.fillStyle = '#3a3445'; for (let yy = y; yy < y + seg; yy += 28) g.fillRect(x0, yy, w, 2); // juntas del concreto
  if (((idx % 3) + 3) % 3 === 0) { g.fillStyle = 'rgba(255,225,77,.35)'; g.fillRect(x0 + w / 2 - 6, y + seg / 2 - 3, 12, 6); } // lámpara
}

function rio(g: Gfx, x0: number, y: number, w: number, seg: number, idx: number, near: boolean): void {
  g.fillStyle = '#5a4a32'; g.fillRect(x0, y, w, seg); // el Rímac, color tierra
  g.fillStyle = 'rgba(200,180,140,.25)'; for (let i = 0; i < 5; i++) g.fillRect(x0 + 4 + hash(idx + i) * (w - 14), y + 8 + i * 21, 10, 1.5);
  if (!near) return;
  g.fillStyle = '#8a8f99'; // baranda del puente modular, de acero
  for (let yy = y; yy < y + seg; yy += 14) g.fillRect(x0 + w - 6, yy, 4, 8);
  if (hash(idx * 5.1) < 0.2) {
    g.save(); g.translate(x0 + w / 2, y + seg / 2); g.rotate(-Math.PI / 2);
    g.fillStyle = '#ff8a1f'; g.fillRect(-46, -8, 92, 15); g.fillStyle = '#15111d'; g.font = FONT(5.5); g.textAlign = 'center';
    g.fillText(hash(idx) < 0.5 ? 'PUENTE PROVISIONAL · 2 CARRILES' : 'PUENTE DEFINITIVO, PRONTO', 0, 2); g.restore();
  }
}

function pista(g: Gfx, x0: number, y: number, w: number, seg: number, idx: number, side: number): void {
  g.fillStyle = '#3e3a45'; g.fillRect(x0, y, w, seg);
  g.fillStyle = '#2f6b3f'; g.fillRect(side % 2 ? x0 + w - 10 : x0, y, 10, seg);
  g.fillStyle = (Math.floor(idx / 2) % 2) ? '#7fd4ff' : '#ffe14d'; g.beginPath(); g.arc(x0 + w / 2, y + seg / 2, 3, 0, 7); g.fill(); // luces de pista
}

export function drawWorld(g: Gfx, cfg: StageConfig, scroll: number, G: Game | null): void {
  const live = G?.cfg ?? cfg, id = live.route?.tramos[G?.route.i ?? 0]?.id ?? 'peajes';
  drawSides(g, live, scroll, (g, x0, y, w, seg, idx, side) => {
    if (id === 'tunel') tunel(g, x0, y, w, seg, idx);
    else if (id === 'puente') rio(g, x0, y, w, seg, idx, side <= 1);
    else if (id === 'pista') pista(g, x0, y, w, seg, idx, side);
    else cerro(g, x0, y, w, seg, idx, side);
  }, id === 'tunel' ? '#15121c' : id === 'puente' ? '#5a4a32' : '#3e3a45');
  drawRoad(g, live, scroll, G);
}
