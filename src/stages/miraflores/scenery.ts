import type { StageConfig } from '../../core/config';
import { drawRoad, drawSides } from '../../core/road';
import { FONT, type Gfx, type Painter } from '../../core/gfx';
import type { Game } from '../../core/state';
import { C, hash } from '../../core/util';
import { CanvasPainter } from '../../core/art/canvas-painter';

/*
 * Paisaje de Miraflores: a la izquierda el malecón con parques, el Parque del Amor y el faro; más allá el acantilado
 * y el mar (pantallas anchas). A la derecha, edificios frente al mar de cuatro tipos, tiendas de Av. Larco y un hito
 * cada doce tramos (ADR 0066).
 */

function drawPark(g: Painter, x0: number, y: number, w: number, seg: number, idx: number): void {
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

function drawCliff(g: Painter, x0: number, y: number, w: number, seg: number, idx: number): void {
  g.fillStyle = '#7a5a3a'; g.fillRect(x0, y, w, seg);
  g.fillStyle = '#5e4429';
  for (let i = 0; i < 5; i++) g.fillRect(x0 + hash(idx + i * 3) * (w - 14), y + i * 22 + 4, 14, 3); // estratos
  g.fillStyle = '#3e2c1c'; g.fillRect(x0, y, 3, seg);
}

function drawSea(g: Painter, x0: number, y: number, w: number, seg: number, idx: number): void {
  g.fillStyle = '#1b3a5c'; g.fillRect(x0 - 2, y, w + 6, seg);
  g.fillStyle = 'rgba(127,212,255,.35)';
  for (let i = 0; i < 4; i++) g.fillRect(x0 + hash(idx * 2.1 + i) * (w - 16), y + 10 + i * 26, 16, 2); // espuma
}

/*
 * Edificios del lado derecho (ADR 0066): cuatro tipos y las tiendas de Larco, elegidos por semilla. Los tramos pares
 * sacan de un grupo y los impares de otro, así ningún tipo sale dos veces seguidas. Cada doce tramos, en la columna junto
 * a la pista, va un hito del distrito que se reconoce.
 */
export type BuildingKind = 'claro' | 'ladrillo' | 'tiendas' | 'vidrio' | 'casona' | 'kennedy' | 'huaca' | 'pizzas';
export const HITO_EVERY = 12;
const HITOS: BuildingKind[] = ['kennedy', 'huaca', 'pizzas'];
const mod = (a: number, n: number) => ((a % n) + n) % n;
export function buildingKind(idx: number, side: number): BuildingKind {
  if (side === 1 && mod(idx, HITO_EVERY) === HITO_EVERY / 2) return HITOS[mod(Math.floor(idx / HITO_EVERY), HITOS.length)];
  const h = hash(idx * 4.7 + side * 13.1);
  if (mod(idx, 2) === 0) return side === 1 && h < 0.25 ? 'tiendas' : h < 0.62 ? 'claro' : 'ladrillo';
  return h < 0.55 ? 'vidrio' : 'casona';
}

const asCanvas = (g: Painter) => (g instanceof CanvasPainter ? g : null);
// cuerpo del edificio con luz desde la izquierda, como los vehículos
function body(g: Painter, x: number, y: number, w: number, h: number, light: string, dark: string): void {
  const cp = asCanvas(g);
  if (cp) cp.linear(x, y, x + w, y + h, [[0, light], [1, dark]]); else g.fillStyle = light;
  g.fillRect(x, y, w, h);
}
function label(g: Painter, x: number, y: number, text: string, col = 'rgba(255,225,77,.85)'): void {
  g.save(); g.translate(x, y); g.rotate(Math.PI / 2); g.fillStyle = col; g.font = FONT(6); g.textAlign = 'center'; g.fillText(text, 0, 2); g.restore();
}

function drawBuilding(g: Painter, x0: number, y: number, w: number, seg: number, idx: number, side: number): void {
  const h = hash(idx * 4.7 + side * 13.1), v = hash(idx * 9.3 + side), bx = x0 + 2, by = y + 4, bw = w - 4, bh = seg - 8;
  switch (buildingKind(idx, side)) {
    case 'tiendas': { // tiendas de Larco con toldo
      g.fillStyle = '#2a2238'; g.fillRect(bx, by, bw, bh);
      const toldo = h < 0.08 ? C.pink : h < 0.16 ? C.orange : '#3a7bff';
      for (let i = 0; i < 3; i++) { g.fillStyle = i % 2 ? '#f4f1e6' : toldo; g.fillRect(bx, y + 10 + i * 34, bw, 6); }
      label(g, x0 + w / 2, y + seg / 2, 'LARCO', 'rgba(255,225,77,.7)');
      return;
    }
    case 'claro': { // frente al mar, claro, con balcones
      const [l, d] = v < 0.33 ? ['#e6e1d4', '#bdb6a6'] : v < 0.66 ? ['#cdd7e0', '#9eabb8'] : ['#efe3d0', '#c9b79c'];
      body(g, bx, by, bw, bh, l, d);
      for (let wy = y + 12; wy < y + seg - 12; wy += 14) {
        g.fillStyle = 'rgba(30,40,60,.5)'; g.fillRect(x0 + 5, wy, w - 10, 6);
        g.fillStyle = hash(wy * 0.7 + idx) > 0.7 ? 'rgba(255,225,77,.7)' : 'rgba(127,212,255,.35)'; g.fillRect(x0 + 7, wy + 1, 6, 4);
        g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(x0 + 4, wy + 7, w - 8, 1); // baranda del balcón
      }
      return;
    }
    case 'ladrillo': { // terracota con terrazas escalonadas y jardineras
      body(g, bx, by, bw, bh, '#c27450', '#8e4a2e');
      for (let i = 0; i < 3; i++) {
        const ty = by + 6 + i * (bh / 3);
        g.fillStyle = 'rgba(255,230,200,.16)'; g.fillRect(bx + 3, ty, bw - 6, bh / 3 - 10);
        g.fillStyle = '#3f8f4f'; g.roundRect(bx + 4, ty + bh / 3 - 14, bw - 8, 3, 1.5); g.fill(); // jardinera
      }
      return;
    }
    case 'vidrio': { // torre de vidrio con reflejo
      body(g, bx, by, bw, bh, v < 0.5 ? '#6f9fc6' : '#7fb3b0', v < 0.5 ? '#264766' : '#2a5552');
      g.fillStyle = 'rgba(255,255,255,.14)'; for (let wy = by + 8; wy < by + bh - 4; wy += 9) g.fillRect(bx, wy, bw, 1);
      g.fillStyle = 'rgba(255,255,255,.1)';
      g.beginPath(); g.moveTo(bx, by + bh * 0.3); g.lineTo(bx + bw, by + bh * 0.1); g.lineTo(bx + bw, by + bh * 0.22); g.lineTo(bx, by + bh * 0.42); g.closePath(); g.fill();
      g.fillStyle = '#2b2f3a'; g.fillRect(bx + bw / 2 - 6, by + bh / 2 - 5, 12, 10); // equipos en la azotea
      return;
    }
    case 'casona': { // casona con patio al centro y borde de tejas
      body(g, bx, by, bw, bh, '#ece0c4', '#cbb994');
      g.fillStyle = '#a8452f'; g.fillRect(bx, by, bw, 2); g.fillRect(bx, by + bh - 2, bw, 2);
      g.fillStyle = '#3f7a46'; g.roundRect(bx + 8, by + 18, bw - 16, bh - 36, 3); g.fill(); // patio
      g.fillStyle = '#e8b04a'; g.beginPath(); g.arc(bx + bw / 2, by + bh / 2, 3, 0, 7); g.fill(); // pileta
      return;
    }
    case 'kennedy': { // Parque Kennedy, con sus gatos
      g.fillStyle = '#2f6a3c'; g.fillRect(bx, by, bw, bh);
      g.fillStyle = '#c8b48a'; g.fillRect(bx + bw / 2 - 2, by, 4, bh); g.fillRect(bx, by + bh / 2 - 2, bw, 4); // senderos
      for (let i = 0; i < 5; i++) {
        const cx = bx + 6 + hash(idx * 3.1 + i) * (bw - 12), cy = by + 10 + i * 19, col = ['#f2a65a', '#d9d4c7', '#3b3640', '#c98a4a', '#9a9aa6'][i];
        g.fillStyle = col; g.beginPath(); g.arc(cx, cy, 2.4, 0, 7); g.fill();
        g.beginPath(); g.moveTo(cx - 2.2, cy - 1); g.lineTo(cx - 1.4, cy - 4); g.lineTo(cx - 0.2, cy - 1.6); g.closePath(); g.fill();
        g.beginPath(); g.moveTo(cx + 2.2, cy - 1); g.lineTo(cx + 1.4, cy - 4); g.lineTo(cx + 0.2, cy - 1.6); g.closePath(); g.fill();
      }
      label(g, x0 + w - 7, y + seg / 2, 'PARQUE KENNEDY');
      return;
    }
    case 'huaca': { // Huaca Pucllana, la pirámide de adobe
      g.fillStyle = '#7a5a3a'; g.fillRect(bx, by, bw, bh);
      for (let i = 0; i < 4; i++) {
        const m = 3 + i * 5;
        body(g, bx + m, by + m, bw - 2 * m, bh - 2 * m, i % 2 ? '#c9a26b' : '#b48a55', i % 2 ? '#a07a48' : '#8e6a3e');
        g.fillStyle = 'rgba(60,40,20,.25)'; for (let yy = by + m + 3; yy < by + bh - m; yy += 4) g.fillRect(bx + m, yy, bw - 2 * m, 0.6); // adobes
      }
      label(g, x0 + 5, y + seg / 2, 'HUACA PUCLLANA');
      return;
    }
    case 'pizzas': { // la Calle de las Pizzas, con sombrillas y toldos
      g.fillStyle = '#4a3a3a'; g.fillRect(bx, by, bw, bh);
      g.fillStyle = '#8a7b6a'; g.fillRect(bx + bw / 2 - 5, by, 10, bh);
      for (let i = 0; i < 5; i++) {
        const col = [C.pink, '#3dbf7a', C.orange, '#3a7bff', C.yellow][i], sy = by + 10 + i * 20;
        g.fillStyle = col; g.beginPath(); g.arc(bx + bw / 2, sy, 5, 0, 7); g.fill();
        g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.arc(bx + bw / 2, sy, 1.5, 0, 7); g.fill();
        g.fillStyle = i % 2 ? '#d93b3b' : '#f4f1e6'; g.fillRect(bx, sy - 3, 4, 6); g.fillRect(bx + bw - 4, sy - 3, 4, 6);
      }
      label(g, x0 + w - 6, y + seg / 2, 'CALLE DE LAS PIZZAS');
      return;
    }
  }
}

export function drawSide(g: Painter, x0: number, y: number, w: number, seg: number, idx: number, side: number): void {
  if (side === 0) drawPark(g, x0, y, w, seg, idx);
  else if (side === 2) drawCliff(g, x0, y, w, seg, idx);
  else if (side % 2 === 0) drawSea(g, x0, y, w, seg, idx);
  else drawBuilding(g, x0, y, w, seg, idx, side);
}

export function drawWorld(g: Gfx, cfg: StageConfig, scroll: number, G: Game | null): void {
  drawSides(g, cfg, scroll, drawSide, '#16243a');
  drawRoad(g, cfg, scroll, G);
}
