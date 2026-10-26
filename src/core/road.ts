import type { StageConfig } from './config';
import { H, W, view } from './constants';
import { FONT, type Gfx, type Painter } from './gfx';
import type { Game } from './state';
import { C, hash } from './util';
import { ART_SCALE } from './art/vehicles';
import { ensure, sweep } from './art/cache';
import { grain, paint } from './art/canvas-painter';

/* Piezas comunes del paisaje de una etapa: costados por segmentos (con columnas extra en pantallas anchas) y la pista. */

// Dibuja un segmento de costado. side: 0 izquierda junto a la pista, 1 derecha junto a la pista;
// 2c y 2c+1 son la columna extra número c hacia la izquierda y hacia la derecha (ADR 0012).
export type SideFn = (g: Painter, x0: number, y: number, w: number, seg: number, idx: number, side: number) => void;

// Curva de la pista (road.curve): dos ondas suaves pegadas al asfalto, así las curvas bajan con el scroll.
export function roadWarp(cfg: StageConfig, scroll: number): ((y: number) => number) | null {
  const c = cfg.road.curve;
  if (!c) return null;
  return (y) => c.amp * Math.sin(((scroll - y) / c.len) * Math.PI * 2) + c.amp * 0.4 * Math.sin(((scroll - y) / (c.len * 0.43)) * Math.PI * 2 + 1.3);
}

/*
 * Costados de la pista. Cada tramo se hornea una vez (nivel B, ADR 0044) con su mismo dibujo, con relieve, grano y la
 * sombra que proyecta la vereda, y se dibuja como imagen en la capa de abajo. key distingue el paisaje (etapa y tramo
 * de ruta) para la caché.
 */
const SEG = 110, MX = 4;
export function drawSides(g: Gfx, cfg: StageConfig, scroll: number, drawSide: SideFn, bg = '#1a1522', key: string = cfg.id): void {
  const b = g.under ?? g, L = cfg.road.left, R = cfg.road.right, ex = view.extra, colW = L - 8, cols = Math.ceil(ex / (colW + 4));
  b.fillStyle = bg; b.fillRect(-ex - 80, 0, W + 2 * ex + 160, H); // margen para la pista curva
  const base = Math.floor(scroll / SEG), off = scroll % SEG, S = ART_SCALE;
  const tile = (x0: number, y: number, idx: number, side: number) => {
    const k = `side|${key}|${colW}|${side}|${idx}`;
    ensure(b.textures, k, () => bakeSide(drawSide, colW, idx, side, S), true);
    b.tile(k, x0, y, colW, SEG, MX, S);
  };
  for (let k = -1; k < H / SEG + 2; k++) {
    const y = off + k * SEG - SEG, idx = base - k;
    tile(0, y, idx, 0); tile(R + 8, y, idx, 1);
    for (let c = 1; c <= cols; c++) { tile(-c * (colW + 4), y, idx + c * 37, 2 * c); tile(R + 8 + c * (colW + 4), y, idx + c * 53, 2 * c + 1); }
  }
  sweep(b.textures);
}

// Hornea un tramo de costado: su dibujo de siempre con relieve, grano y la sombra de la vereda junto a la pista.
function bakeSide(drawSide: SideFn, w: number, idx: number, side: number, S: number): HTMLCanvasElement {
  return paint(w + 2 * MX, SEG, S, MX, 0, (p, c) => {
    c.save(); c.beginPath(); c.rect(-MX, 0, w + 2 * MX, SEG); c.clip();
    drawSide(p, 0, 0, w, SEG, idx, side);
    c.restore();
    grain(c, (w + 2 * MX) * S, SEG * S, 0.1);
    if (side < 2) { // la pista queda del lado de adentro: sombra suave de la vereda
      const x = side === 0 ? w : 0, gr = c.createLinearGradient(x, 0, side === 0 ? w - 14 : 14, 0);
      gr.addColorStop(0, 'rgba(0,0,0,.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = gr; c.fillRect(side === 0 ? w - 14 : 0, 0, 14, SEG);
    }
  });
}

/*
 * Detalle del asfalto (nivel B, ADR 0044): huellas oscuras de las llantas en cada carril y, por tramo, grietas y manchas
 * de aceite, siempre en el mismo lugar del tramo para que bajen con la pista. Sin parches: parecían cajas en la pista.
 */
function asphalt(g: Gfx, cfg: StageConfig, scroll: number): void {
  const L = cfg.road.left, LW = cfg.road.laneWidth, base = Math.floor(scroll / SEG), off = scroll % SEG;
  g.fillStyle = 'rgba(0,0,0,.1)';
  for (let j = 0; j < cfg.road.lanes; j++) { const cx = L + LW * (j + 0.5); g.fillRect(cx - 11, 0, 5, H); g.fillRect(cx + 6, 0, 5, H); }
  for (let k = -1; k < H / SEG + 2; k++) {
    const y = off + k * SEG - SEG, idx = base - k, r = (i: number) => hash(idx * 7.13 + i * 1.91);
    const lane = Math.floor(r(1) * cfg.road.lanes);
    if (r(7) < 0.5) { // grieta
      g.strokeStyle = 'rgba(14,10,22,.55)'; g.lineWidth = 0.8; g.beginPath();
      let cx = L + LW * Math.floor(r(8) * cfg.road.lanes) + 8 + r(9) * (LW - 16), cy = y + r(10) * 60;
      g.moveTo(cx, cy); for (let i = 0; i < 4; i++) { cx += (r(11 + i) - 0.5) * 12; cy += 6 + r(15 + i) * 10; g.lineTo(cx, cy); }
      g.stroke();
    }
    if (r(20) < 0.3) { g.fillStyle = 'rgba(8,6,12,.22)'; g.beginPath(); g.ellipse(L + LW * (lane + 0.5) + (r(21) - 0.5) * 20, y + r(22) * SEG, 7 + r(23) * 6, 4 + r(24) * 3, r(25) * 3, 0, 7); g.fill(); } // aceite
  }
}

// Veredas, postes, asfalto, líneas, cruces, rompemuelles y el nombre de la vía al inicio.
export function drawRoad(g: Gfx, cfg: StageConfig, scroll: number, G: Game | null): void {
  const L = cfg.road.left, R = cfg.road.right, LW = cfg.road.laneWidth;
  // veredas con cordón: piso, borde claro arriba y el filo oscuro contra la pista (nivel B, ADR 0044)
  g.fillStyle = '#3a3445'; g.fillRect(L - 8, 0, 8, H); g.fillRect(R, 0, 8, H);
  g.fillStyle = '#57506a'; g.fillRect(L - 8, 0, 2, H); g.fillRect(R + 6, 0, 2, H);
  g.fillStyle = '#4a4458'; g.fillRect(L - 3, 0, 3, H); g.fillRect(R, 0, 3, H);
  // postes de luz
  const poff = scroll % 160;
  for (let y = poff - 160; y < H; y += 160) {
    g.fillStyle = 'rgba(255,225,77,.08)'; g.beginPath(); g.arc(L + 6, y, 26, 0, 7); g.fill(); g.beginPath(); g.arc(R - 6, y + 80, 26, 0, 7); g.fill();
    g.fillStyle = '#8c869a'; g.fillRect(L - 6, y - 2, 4, 4); g.fillRect(R + 2, y + 78, 4, 4);
  }
  g.fillStyle = '#2a2632'; g.fillRect(L, 0, R - L, H);
  asphalt(g, cfg, scroll);
  g.fillStyle = C.yellow; g.fillRect(L + 2, 0, 3, H); g.fillRect(R - 5, 0, 3, H);
  g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(L + 5, 0, 1, H); g.fillRect(R - 2, 0, 1, H);
  const doff = scroll % 50, dbase = Math.floor(scroll / 50);
  for (let j = 1; j < cfg.road.lanes; j++) {
    const x = L + LW * j - 1.5;
    for (let y = -50 + doff, n = 0; y < H; y += 50, n++) { // líneas gastadas: cada raya con su desgaste
      g.fillStyle = `rgba(247,241,255,${(0.4 + hash((dbase - n) * 3.7 + j) * 0.25).toFixed(2)})`; g.fillRect(x, y, 3, 26);
    }
  }
  const ex = cfg.road.exclusive;
  if (ex) { // carril exclusivo pintado (que nadie respeta)
    const x = L + LW * ex.lane;
    g.fillStyle = ex.col; g.globalAlpha = 0.18; g.fillRect(x + 3, 0, LW - 6, H); g.globalAlpha = 1;
    g.fillStyle = 'rgba(247,241,255,.35)'; g.font = FONT(8); g.textAlign = 'center';
    const eoff = scroll % 220;
    for (let y = eoff - 220; y < H + 20; y += 220) g.fillText(ex.label, x + LW / 2, y);
  }
  if (G) {
    for (const c of G.cross) { // paso de cebra y calle transversal
      g.fillStyle = 'rgba(247,241,255,.6)'; for (let x = L + 8; x < R - 8; x += 16) g.fillRect(x, c.y, 9, 22);
      g.fillStyle = 'rgba(247,241,255,.28)'; g.font = FONT(11); g.textAlign = 'center'; g.fillText(c.name, W / 2, c.y - 10);
    }
    for (const m of G.bumps) { // rompemuelles amarillo y negro
      for (let x = L + 6, i = 0; x < R - 6; x += 12, i++) { g.fillStyle = i % 2 ? '#111' : C.yellow; g.fillRect(x, m.y - 5, 12, 10); }
    }
  }
  const ly = 120 + scroll;
  if (ly < H + 40) { g.fillStyle = 'rgba(247,241,255,.22)'; g.font = FONT(18); g.textAlign = 'center'; g.fillText(cfg.roadName, W / 2, ly); }
}
