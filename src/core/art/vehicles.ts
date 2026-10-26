import { ZOOM } from '../constants';
import type { VehicleLook } from '../config';
import type { Gfx } from '../gfx';
import type { Car } from '../state';
import { C } from '../util';
import { SIREN_Y, bakeCar, sirenHalf, damageStep, isSmall, type ArtKind, type CarArt } from './bake';

/*
 * Vehículos en nivel B (ADR 0042): traduce cada auto del juego a su dibujo horneado, lo guarda como textura (una por
 * carrocería, color, etapa de daño y variante de abolladuras) y dibuja encima, cada cuadro, lo que cambia: luces de
 * freno, circulina, balizas y el destello del golpe.
 */

export const ART_SCALE = ZOOM; // la imagen tiene la resolución real de la pantalla

const artCache = new WeakMap<object, CarArt>();

// Carrocería según el tamaño y el aspecto declarados en el JSON (no hace falta cambiar ninguna etapa).
export function artFor(k: string, w: number, h: number, col: string, L: VehicleLook | undefined): CarArt {
  let kind: ArtKind;
  if (L?.kind && L.kind !== 'auto') kind = L.kind;
  else if (h >= 80) kind = 'bus';
  else if (h >= 66) kind = 'truck';
  else if (h >= 58) kind = 'combi';
  else if (L?.siren || L?.panel) kind = 'patrol';
  else if (k === 'carcocha') kind = 'old';
  else if (w >= 32) kind = 'suv';
  else kind = 'sedan';
  return {
    kind, w, h, body: col, roof: L?.roof, band: L?.band, panel: L?.panel, label: L?.label, labelCol: L?.labelCol,
    labelSize: L?.labelSize, labelY: L?.labelY, shades: L?.shades, siren: L?.siren, box: L?.box,
  };
}

function carArt(c: Car): CarArt {
  let a = artCache.get(c);
  if (!a || a.body !== c.col) { a = artFor(c.k, c.w, c.h, c.col, c.look); artCache.set(c, a); }
  return a;
}

// Textura horneada para un dibujo y un daño; se crea la primera vez que se pide y queda en caché.
const keys = new Map<string, string>();
export function texture(g: Gfx, a: CarArt, d: number, seed: number): string {
  const step = isSmall(a.kind) ? 0 : damageStep(d), variant = Math.floor(Math.abs(seed)) % 2;
  const id = JSON.stringify(a) + '|' + step + '|' + variant;
  let key = keys.get(id);
  if (!key) { key = 'veh' + keys.size; keys.set(id, key); }
  if (!g.textures.exists(key)) g.textures.addCanvas(key, bakeCar(a, step, variant ? 7 : 3, ART_SCALE));
  return key;
}

// Vehículo del tráfico: imagen en `img` y luces que cambian en `fx` (la capa de encima). Se llama dentro de g.rigid.
export function drawVehicle(img: Gfx, fx: Gfx, t: number, c: Car): void {
  const a = carArt(c), d = c.max && !c.invulnerable ? Math.max(0, 1 - c.hp / c.max) : 0;
  const sway = { moto: 0.25, bici: 0.15, mototaxi: 0.12 } as Record<string, number>;
  const ang = isSmall(a.kind) ? (c.zz !== undefined ? Math.sin(c.zz) * (sway[a.kind] ?? 0) : 0)
    : (c.spin > 0 ? Math.sin(t * 14) * 0.5 : 0) + (d > 0.7 ? Math.sin(t * 30 + c.seed) * 0.025 : 0);
  img.image(texture(img, a, d, c.seed), c.x, c.y, 1 / ART_SCALE, ang, c.flash && c.flash > 0 ? 0xffffff : undefined);
  if (isSmall(a.kind)) return;
  fx.save(); fx.translate(c.x, c.y); fx.rotate(ang);
  lights(fx, t, a, d, (c.brakeT ?? 0) > 0, false, false);
  fx.restore();
}

/*
 * Luces que cambian cada cuadro, en coordenadas del vehículo (centro en 0,0): freno o reversa con halo, circulina
 * roja y azul, y balizas. Coinciden con las luces apagadas que trae la imagen.
 */
export function lights(g: Gfx, t: number, a: CarArt, d: number, brake: boolean, rev: boolean, hazard: boolean, fast = false): void {
  const { w, h } = a, fr = d * h * 0.12, ty = h / 2 - 3 - d * h * 0.05;
  if (brake || rev) {
    const halo = rev ? 'rgba(255,255,255,' : 'rgba(255,51,85,';
    for (const [s, al] of [[6, 0.12], [3.5, 0.22], [1.8, 0.35]]) {
      g.fillStyle = halo + al + ')';
      for (const sx of [-1, 1]) g.fillRect(sx * (w / 2 - 4.5) - 2.5 - s, ty - s, 5 + 2 * s, 2 + 2 * s);
    }
    g.fillStyle = rev ? '#ffffff' : '#ff3355';
    for (const sx of [-1, 1]) g.fillRect(sx * (w / 2 - 4.5) - 2.5, ty, 5, 2);
  }
  if (a.siren) {
    const blink = Math.floor(t * (fast ? 14 : 8)) % 2, y = -h / 2 + h * SIREN_Y + fr * (1 - SIREN_Y), sh = sirenHalf(w);
    g.fillStyle = blink ? '#ff3355' : '#3a7bff'; g.fillRect(-sh, y, sh - 1, 4);
    g.fillStyle = blink ? '#3a7bff' : '#ff3355'; g.fillRect(1, y, sh - 1, 4);
    g.fillStyle = blink ? 'rgba(255,51,85,.25)' : 'rgba(58,123,255,.25)'; g.fillRect(-sh - 5, y - 3, sh * 2 + 10, 10);
  }
  if (hazard && Math.floor(t * 6) % 2 === 0) {
    g.fillStyle = C.orange;
    for (const sx of [-1, 1]) { g.fillRect(sx * (w / 2 - 0.5) - 1.5, -h / 2 + fr, 3, 4); g.fillRect(sx * (w / 2 - 0.5) - 1.5, h / 2 - 4, 3, 4); }
  }
}

// El Tico del jugador, con sus mejoras visibles (parachoques de fierro y blindaje lateral).
export function ticoArt(look?: { bumper?: boolean; plates?: boolean }): CarArt {
  return { kind: 'tico', w: 28, h: 48, body: '#f2c230', taxi: true, bumper: look?.bumper, plates: look?.plates };
}
