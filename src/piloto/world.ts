import type { StageConfig } from '../core/config';
import { H, W, view } from '../core/constants';
import type { Gfx } from '../core/gfx';
import { drawRoad } from '../core/road';
import { SKIN_SCALE } from '../core/art/skin';
import type { Game } from '../core/state';

/*
 * Costados de la Costa Verde con el arte entregado (ADR 0067). Las columnas van donde las pone el motor: la cercana de
 * cada lado junto a la vereda y las exteriores cada 46, de 42 de ancho. Cada tramo es una imagen de 42 × 110 que sigue
 * la curva en franjas de 4 (el juego usa 8, pero sus tramos traen un margen que tapa los bordes y estos no). Siempre va
 * al menos una columna exterior, porque la curva corre la cercana hasta 30 y dejaría ver el fondo en el borde de la
 * pantalla, y cada exterior se repite 4 más adentro, detrás, para tapar la junta. La orilla va aparte, en franjas de 2.
 *
 * Recorrido de doce tramos, como en la prueba del paquete: mar, transición a la arena, Agua Dulce entre arena, vuelta
 * al mar y el muelle. A la izquierda, el acantilado con la bajada, y en la columna exterior el Morro Solar.
 */

const COAST = ['mar_01', 'mar_02', 'transicion_mar_arena', 'arena_base', 'hito_agua_dulce', 'arena_base', 'transicion_arena_mar', 'mar_03', 'mar_01', 'hito_muelle', 'mar_02', 'mar_03'];
const CLIFF = [1, 3, 2, 4, 2, 1, 4, 3]; // ninguna variante se repite seguida, tampoco al dar la vuelta
const mod = (a: number, n: number) => ((a % n) + n) % n;

// El índice de tramo del motor crece hacia arriba de la pantalla; las listas se leen de arriba hacia abajo, como en la
// prueba del paquete, así cada transición tiene el mar y la arena del lado que corresponde.
const at = (idx: number, n: number) => mod(-idx, n);
export const coastAt = (idx: number): string => COAST[at(idx, 12)];
export const cliffAt = (idx: number): string => (at(idx, 12) === 9 ? 'hito_bajada' : `acantilado_0${CLIFF[at(idx, 8)]}`);
export const farCliffAt = (idx: number, c: number): string => (c === 1 && at(idx, 12) === 4 ? 'hito_morro_solar' : 'acantilado_alto');
// la orilla de cada tramo de costa: piedra junto al mar, arena junto a la playa, y en las transiciones una que cambia a mitad
export function shoreAt(idx: number): string {
  const c = coastAt(idx);
  if (c === 'transicion_mar_arena') return 'orilla_mar_arena';
  if (c === 'transicion_arena_mar') return 'orilla_arena_mar';
  return c === 'arena_base' || c === 'hito_agua_dulce' ? 'orilla_arena' : 'orilla_piedra';
}

// alto de cada tramo de costado, el mismo SEG de road.ts y el alto de los tramos entregados
export const SIDE_SEG = 110;
const COL = 42, GAP = 4, SHORE = 14;
const CLIFF_BG = '#5d4f3d', SEA_BG = '#0f4a52';

export function drawWorld(g: Gfx, cfg: StageConfig, scroll: number, G: Game | null): void {
  const b = g.under ?? g, L = cfg.road.left, R = cfg.road.right, ex = view.extra, cols = Math.max(1, Math.ceil((ex + 32) / (COL + GAP)));
  // fondo del color de cada lado: tapa las juntas entre columnas y los bordes de las franjas sobre la curva
  b.fillStyle = CLIFF_BG; b.fillRect(-ex - 80, 0, L + ex + 80, H);
  b.fillStyle = SEA_BG; b.fillRect(R, 0, W + ex + 80 - R, H);
  const base = Math.floor(scroll / SIDE_SEG), off = scroll % SIDE_SEG;
  const tile = (key: string, x: number, y: number, w = COL, step = 4, layer = b) => layer.tile(key, x, y, w, SIDE_SEG, 0, SKIN_SCALE, step);
  for (let k = -1; k < H / SIDE_SEG + 2; k++) {
    const y = off + k * SIDE_SEG - SIDE_SEG, idx = base - k;
    for (let c = cols; c >= 1; c--) { // de afuera hacia adentro: cada una tapa la junta con la siguiente
      const xl = -c * (COL + GAP), xr = R + 8 + c * (COL + GAP);
      tile(farCliffAt(idx, c), xl + GAP, y); tile(farCliffAt(idx, c), xl, y);
      tile('mar_lejano', xr - GAP, y); tile('mar_lejano', xr, y);
    }
    tile(cliffAt(idx), 0, y);
    tile(coastAt(idx), R + 8, y);
  }
  // la orilla, en la capa de la pista, sobre el borde del mar
  for (let k = -1; k < H / SIDE_SEG + 2; k++) {
    const y = off + k * SIDE_SEG - SIDE_SEG, idx = base - k;
    tile(shoreAt(idx), R + 8, y, SHORE, 2, g);
  }
  drawRoad(g, cfg, scroll, G);
}
