import type { Gfx } from '../gfx';
import type { Game } from '../state';
import { FONT } from '../gfx';
import { PAD, shade, type CarArt } from './bake';
import { ART_SCALE, lights, texture } from './vehicles';

/*
 * Jefes en nivel B (ADR 0043): la carrocería de cada jefe se hornea como el tráfico (con sus detalles fijos: rótulos,
 * conductor, carga, torreta) y lo que cambia cada cuadro va encima en su capa: luces, circulina, puertas que
 * parpadean, el cobrador, la boquilla. `img` es la capa de imágenes del jefe y `fx` la de encima.
 */

export interface BossLook { brake?: boolean; rev?: boolean; hazard?: boolean; flash?: number; dmg?: number; ang?: number; fastSiren?: boolean }

// Dibuja un vehículo de jefe en (x, y) con su giro: imagen horneada, luces encima y, al final, lo propio de cada jefe.
export function bossCar(img: Gfx, fx: Gfx, G: Game, x: number, y: number, a: CarArt, seed: number, o: BossLook,
  overlay?: (fx: Gfx, w: number, h: number, fr: number) => void): void {
  const d = Math.max(0, Math.min(1, o.dmg ?? 0)), shake = d > 0.7 ? Math.sin(G.t * 30 + seed) * 0.025 : 0, ang = (o.ang ?? 0) + shake;
  img.save(); img.translate(x, y); img.rotate(ang);
  img.image(texture(img, a, d, seed), 0, 0, 1 / ART_SCALE, 0, o.flash && o.flash > 0 ? 0xffffff : undefined);
  img.restore();
  fx.save(); fx.translate(x, y); fx.rotate(ang);
  lights(fx, G.t, a, d, !!o.brake, !!o.rev, !!o.hazard, o.fastSiren);
  overlay?.(fx, a.w, a.h, d * a.h * 0.12);
  fx.restore();
}

// Grito del claxon del jefe, al costado.
export function hornText(fx: Gfx, G: Game, text: string, col: string, dx = 20): void {
  const b = G.b;
  if (b.flash !== 'horn') return;
  fx.fillStyle = col; fx.font = FONT(14); fx.textAlign = 'center'; fx.fillText(text, b.x + b.w / 2 + dx, b.y - b.h / 2);
}

// Puerta de atrás: cerrada en gris; abierta, parpadea antes de soltar la carga.
export function rearDoor(fx: Gfx, t: number, w: number, h: number, open: boolean, closed = '#6c717c'): void {
  fx.fillStyle = open ? (Math.floor(t * 12) % 2 ? '#ffe14d' : '#ffffff') : closed;
  fx.fillRect(-w / 2 + 3, h / 2 - (open ? 3 : 6), w - 6, open ? 3 : 5);
}

// Carrocería común de un jefe a partir de su tamaño en el juego.
export const bossArt = (G: Game, a: Omit<CarArt, 'w' | 'h'>): CarArt => ({ ...a, w: G.b.w, h: G.b.h, blind: a.blind ?? true });

/* ---------- avión carguero de la Línea Amarilla ---------- */

// Carguero gigante tipo C-5 visto desde arriba: alas en flecha, cuatro motores, cola en T y fuselaje con volumen.
export function bakePlane(w: number, h: number, label: string, scale: number): HTMLCanvasElement {
  const span = w * 2.1, cv = document.createElement('canvas');
  cv.width = Math.ceil((span * 2 + PAD * 2) * scale); cv.height = Math.ceil((h + PAD * 2) * scale);
  const c = cv.getContext('2d')!;
  c.scale(scale, scale); c.translate(PAD + span, PAD + h / 2);
  const top = -h / 2;
  const wing = (sx: number) => {
    c.beginPath(); c.moveTo(sx * w / 2, top + h * 0.34); c.lineTo(sx * span, top + h * 0.52); c.lineTo(sx * span, top + h * 0.6); c.lineTo(sx * w / 2, top + h * 0.5); c.closePath();
  };
  // sombra de todo el avión
  c.save(); c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = 8 * scale; c.shadowOffsetX = 10 * scale; c.shadowOffsetY = 14 * scale;
  c.fillStyle = '#000'; wing(-1); c.fill(); wing(1); c.fill(); c.beginPath(); c.roundRect(-w / 2, top, w, h, w / 2); c.fill(); c.restore();
  // alas con degradado de borde de ataque a borde de fuga
  for (const sx of [-1, 1]) {
    wing(sx);
    const g = c.createLinearGradient(0, top + h * 0.34, 0, top + h * 0.6);
    g.addColorStop(0, '#a9aeb8'); g.addColorStop(1, '#6f747e'); c.fillStyle = g; c.fill();
    c.strokeStyle = '#4a4e58'; c.lineWidth = 0.8; c.stroke();
  }
  // motores con toma de aire
  for (const k of [-1.55, -0.95, 0.95, 1.55]) {
    const x = k * w, y = top + h * 0.44 + Math.abs(k) * 8;
    c.beginPath(); c.roundRect(x - 6, y, 12, 26, 5); c.fillStyle = shade('#4a4452', 0.1); c.fill();
    c.fillStyle = '#15111d'; c.beginPath(); c.ellipse(x, y + 2.5, 4.5, 2.2, 0, 0, Math.PI * 2); c.fill();
  }
  // fuselaje con volumen
  c.beginPath(); c.roundRect(-w / 2, top, w, h, w / 2);
  const gf = c.createLinearGradient(-w / 2, 0, w / 2, 0);
  gf.addColorStop(0, '#8d929c'); gf.addColorStop(0.3, '#c9ced8'); gf.addColorStop(0.5, '#e4e8ef'); gf.addColorStop(0.75, '#c3c8d2'); gf.addColorStop(1, '#7e838d');
  c.fillStyle = gf; c.fill(); c.strokeStyle = '#5c616b'; c.lineWidth = 1; c.stroke();
  // cabina, ventanillas y cola en T
  c.fillStyle = '#10131c'; c.beginPath(); c.roundRect(-w / 4, top + 10, w / 2, 8, 3); c.fill();
  c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(-w / 4 + 3, top + 11, w / 6, 2);
  c.fillStyle = '#4a4e58'; for (let i = 0; i < 9; i++) { c.beginPath(); c.roundRect(-w / 2 + 6, top + 30 + i * (h / 12), 3, 5, 1); c.fill(); }
  c.beginPath(); c.roundRect(-w * 0.9, top + h - 34, w * 1.8, 10, 3);
  const gt = c.createLinearGradient(0, top + h - 34, 0, top + h - 24); gt.addColorStop(0, '#a9aeb8'); gt.addColorStop(1, '#6f747e');
  c.fillStyle = gt; c.fill();
  c.fillStyle = '#15111d'; c.font = '7px Bungee, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(label, 0, top + h * 0.3);
  return cv;
}
