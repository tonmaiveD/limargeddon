import type { StageConfig } from '../../core/config';
import { drawRoad, drawSides } from '../../core/road';
import { FONT, type Gfx } from '../../core/gfx';
import type { Game } from '../../core/state';
import { C, hash } from '../../core/util';

/*
 * Paisaje de Miraflores: a la izquierda el malecón con parques, el Parque del Amor y el faro; más allá el acantilado
 * y el mar (pantallas anchas). A la derecha, edificios frente al mar y tiendas de Av. Larco.
 */

function drawPark(g: Gfx, x0: number, y: number, w: number, seg: number, idx: number): void {
  g.fillStyle = '#1d4a2c'; g.fillRect(x0, y, w, seg);
  g.fillStyle = 'rgba(247,241,255,.55)'; g.fillRect(x0 + 1, y, 2, seg); // baranda del malecón
  const k = ((idx % 40) + 40) % 40;
  if (k === 5) { // Parque del Amor: banca ondulada y la escultura del beso
    g.fillStyle = '#e0954a'; for (let i = 0; i < 5; i++) g.fillRect(x0 + 6 + i * 6, y + 70 + (i % 2) * 4, 6, 6);
    g.fillStyle = C.pink; g.beginPath(); g.arc(x0 + w / 2 - 4, y + 40, 7, 0, 7); g.fill(); g.beginPath(); g.arc(x0 + w / 2 + 5, y + 42, 7, 0, 7); g.fill();
    g.save(); g.translate(x0 + w / 2 + 1, y + seg / 2); g.rotate(-Math.PI / 2); g.fillStyle = C.yellow; g.font = FONT(6); g.textAlign = 'center'; g.fillText('PARQUE DEL AMOR', 0, -12); g.restore();
    return;
  }
  if (k === 25) { // faro del malecón, blanco con franjas rojas
    g.fillStyle = '#f4f1e6'; g.fillRect(x0 + w / 2 - 6, y + 20, 12, 60);
    g.fillStyle = '#d93b3b'; for (let i = 0; i < 3; i++) g.fillRect(x0 + w / 2 - 6, y + 30 + i * 18, 12, 6);
    g.fillStyle = 'rgba(255,225,77,.35)'; g.beginPath(); g.arc(x0 + w / 2, y + 22, 14, 0, 7); g.fill();
    g.fillStyle = C.yellow; g.fillRect(x0 + w / 2 - 4, y + 16, 8, 6);
    return;
  }
  // palmeras y bancas
  for (let t = 0; t < 2; t++) {
    const tx = x0 + 10 + hash(idx * 1.7 + t * 5) * (w - 20), ty = y + 25 + t * 50;
    g.fillStyle = '#6b4a2e'; g.fillRect(tx - 1, ty - 2, 3, 12);
    g.fillStyle = '#3f8f4f'; for (let a = 0; a < 5; a++) { g.beginPath(); g.ellipse(tx + Math.cos(a * 1.26) * 6, ty - 3 + Math.sin(a * 1.26) * 4, 6, 2.5, a * 1.26, 0, 7); g.fill(); }
  }
  if (hash(idx * 3.3) < 0.5) { g.fillStyle = '#8c6a4a'; g.fillRect(x0 + 6, y + seg - 18, 14, 4); }
}

function drawCliff(g: Gfx, x0: number, y: number, w: number, seg: number, idx: number): void {
  g.fillStyle = '#7a5a3a'; g.fillRect(x0, y, w, seg);
  g.fillStyle = '#5e4429';
  for (let i = 0; i < 5; i++) g.fillRect(x0 + hash(idx + i * 3) * (w - 14), y + i * 22 + 4, 14, 3); // estratos
  g.fillStyle = '#3e2c1c'; g.fillRect(x0, y, 3, seg);
}

function drawSea(g: Gfx, x0: number, y: number, w: number, seg: number, idx: number): void {
  g.fillStyle = '#1b3a5c'; g.fillRect(x0 - 2, y, w + 6, seg);
  g.fillStyle = 'rgba(127,212,255,.35)';
  for (let i = 0; i < 4; i++) g.fillRect(x0 + hash(idx * 2.1 + i) * (w - 16), y + 10 + i * 26, 16, 2); // espuma
}

function drawBuilding(g: Gfx, x0: number, y: number, w: number, seg: number, idx: number, side: number): void {
  const h = hash(idx * 4.7 + side * 13.1);
  if (side === 1 && h < 0.22) { // tiendas de Larco con toldo
    g.fillStyle = '#2a2238'; g.fillRect(x0 + 2, y + 4, w - 4, seg - 8);
    const toldo = h < 0.08 ? C.pink : h < 0.15 ? C.orange : '#3a7bff';
    for (let i = 0; i < 3; i++) { g.fillStyle = i % 2 ? '#f4f1e6' : toldo; g.fillRect(x0 + 2, y + 10 + i * 34, w - 4, 6); }
    g.save(); g.translate(x0 + w / 2, y + seg / 2); g.rotate(Math.PI / 2); g.fillStyle = 'rgba(255,225,77,.7)'; g.font = FONT(6); g.textAlign = 'center'; g.fillText('LARCO', 0, 2); g.restore();
    return;
  }
  // edificios frente al mar: claros, con balcones
  g.fillStyle = h < 0.5 ? '#d9d4c7' : h < 0.8 ? '#b9c4cf' : '#e8dccb'; g.fillRect(x0 + 2, y + 4, w - 4, seg - 8);
  for (let wy = y + 12; wy < y + seg - 12; wy += 14) {
    g.fillStyle = 'rgba(30,40,60,.55)'; g.fillRect(x0 + 5, wy, w - 10, 6);
    g.fillStyle = hash(wy * 0.7 + idx) > 0.7 ? 'rgba(255,225,77,.7)' : 'rgba(127,212,255,.35)'; g.fillRect(x0 + 7, wy + 1, 6, 4);
    g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(x0 + 4, wy + 7, w - 8, 1); // baranda del balcón
  }
}

function drawSide(g: Gfx, x0: number, y: number, w: number, seg: number, idx: number, side: number): void {
  if (side === 0) drawPark(g, x0, y, w, seg, idx);
  else if (side === 2) drawCliff(g, x0, y, w, seg, idx);
  else if (side % 2 === 0) drawSea(g, x0, y, w, seg, idx);
  else drawBuilding(g, x0, y, w, seg, idx, side);
}

export function drawWorld(g: Gfx, cfg: StageConfig, scroll: number, G: Game | null): void {
  drawSides(g, cfg, scroll, drawSide, '#16243a');
  drawRoad(g, cfg, scroll, G);
}
