import type { StageConfig } from './config';
import { H, W, view } from './constants';
import { FONT, type Gfx } from './gfx';
import type { Game } from './state';
import { C } from './util';

/* Piezas comunes del paisaje de una etapa: costados por segmentos (con columnas extra en pantallas anchas) y la pista. */

// Dibuja un segmento de costado. side: 0 izquierda junto a la pista, 1 derecha junto a la pista;
// 2c y 2c+1 son la columna extra número c hacia la izquierda y hacia la derecha (ADR 0012).
export type SideFn = (g: Gfx, x0: number, y: number, w: number, seg: number, idx: number, side: number) => void;

export function drawSides(g: Gfx, cfg: StageConfig, scroll: number, drawSide: SideFn, bg = '#1a1522'): void {
  const L = cfg.road.left, R = cfg.road.right, ex = view.extra, colW = L - 8, cols = Math.ceil(ex / (colW + 4));
  g.fillStyle = bg; g.fillRect(-ex, 0, W + 2 * ex, H);
  const seg = 110, base = Math.floor(scroll / seg), off = scroll % seg;
  for (let k = -1; k < H / seg + 2; k++) {
    const y = off + k * seg - seg, idx = base - k;
    drawSide(g, 0, y, colW, seg, idx, 0); drawSide(g, R + 8, y, colW, seg, idx, 1);
    for (let c = 1; c <= cols; c++) {
      drawSide(g, -c * (colW + 4), y, colW, seg, idx + c * 37, 2 * c);
      drawSide(g, R + 8 + c * (colW + 4), y, colW, seg, idx + c * 53, 2 * c + 1);
    }
  }
}

// Veredas, postes, asfalto, líneas, cruces, rompemuelles y el nombre de la vía al inicio.
export function drawRoad(g: Gfx, cfg: StageConfig, scroll: number, G: Game | null): void {
  const L = cfg.road.left, R = cfg.road.right, LW = cfg.road.laneWidth;
  g.fillStyle = '#3a3445'; g.fillRect(L - 8, 0, 8, H); g.fillRect(R, 0, 8, H);
  // postes de luz
  const poff = scroll % 160;
  for (let y = poff - 160; y < H; y += 160) {
    g.fillStyle = 'rgba(255,225,77,.08)'; g.beginPath(); g.arc(L + 6, y, 26, 0, 7); g.fill(); g.beginPath(); g.arc(R - 6, y + 80, 26, 0, 7); g.fill();
    g.fillStyle = '#8c869a'; g.fillRect(L - 6, y - 2, 4, 4); g.fillRect(R + 2, y + 78, 4, 4);
  }
  g.fillStyle = '#2a2632'; g.fillRect(L, 0, R - L, H);
  g.fillStyle = C.yellow; g.fillRect(L + 2, 0, 3, H); g.fillRect(R - 5, 0, 3, H);
  g.fillStyle = 'rgba(247,241,255,.55)';
  const doff = scroll % 50;
  for (let j = 1; j < cfg.road.lanes; j++) { const x = L + LW * j - 1.5; for (let y = -50 + doff; y < H; y += 50) g.fillRect(x, y, 3, 26); }
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
