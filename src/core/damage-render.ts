import type { Gfx } from './gfx';
import { C, clamp, hash } from './util';

/*
 * Deformación procedural por daño, portada de carPath/drawCar del prototipo.
 * 15% abolladuras y hollín, 30% parabrisas trizado, 45% se apaga un faro, 60% capó levantado y parachoques colgando,
 * 75% se apaga el segundo faro, 70%+ vibración del chasis. El humo (50%) y el fuego (80%) los emite world.ts.
 */

export interface CarLook {
  body: string; roof?: string; ang?: number; dmg?: number; seed?: number; flash?: number;
  brake?: boolean; rev?: boolean; hazard?: boolean;
  extra?: (g: Gfx, w: number, h: number) => void;
}

// Carrocería que se abolla con el daño: capó hundido, laterales con golpes, parachoques torcido
export function carPath(g: Gfx, w: number, h: number, d: number, sd: number, ox = 0, oy = 0): void {
  if (d < 0.06) { g.roundRect(-w / 2 + ox, -h / 2 + oy, w, h, 7); return; }
  const j = (i: number) => Math.abs(hash(sd + i * 13.7) - 0.5) * 2;
  const top = -h / 2 + d * h * 0.12, bot = h / 2 - d * h * 0.05, cin = d * 5, dent = d * 7, P: [number, number][] = [];
  for (let i = 0; i <= 6; i++) P.push([-w / 2 + cin + ((w - 2 * cin) * i) / 6, top + j(i) * d * 9]);
  for (let i = 1; i < 8; i++) P.push([w / 2 - j(i + 20) * dent, top + ((bot - top) * i) / 8]);
  for (let i = 0; i <= 3; i++) P.push([w / 2 - cin * 0.6 - ((w - cin * 1.2) * i) / 3, bot - j(i + 40) * d * 4]);
  for (let i = 7; i > 0; i--) P.push([-w / 2 + j(i + 60) * dent, top + ((bot - top) * i) / 8]);
  g.beginPath(); P.forEach(([px, py], i) => (i ? g.lineTo(px + ox, py + oy) : g.moveTo(px + ox, py + oy))); g.closePath();
}

export function drawCar(g: Gfx, t: number, c: { x: number; y: number; w: number; h: number }, o: CarLook): void {
  const { x, y, w, h } = c, d = clamp(o.dmg || 0, 0, 1), sd = o.seed || 0, fr = d * h * 0.12;
  g.save(); g.translate(x, y); g.rotate((o.ang || 0) + (d > 0.7 ? Math.sin(t * 30 + sd) * 0.025 : 0));
  g.fillStyle = 'rgba(0,0,0,.35)'; carPath(g, w, h, d, sd, 3, 4); g.fill();
  g.fillStyle = o.body; carPath(g, w, h, d, sd); g.fill();
  g.fillStyle = o.roof || 'rgba(255,255,255,.08)'; g.roundRect(-w / 2 + 4, -h / 2 + h * 0.34 + fr * 0.4, w - 8, h * 0.34 - fr * 0.3, 4); g.fill();
  g.fillStyle = '#10131c'; g.roundRect(-w / 2 + 4, -h / 2 + h * 0.18 + fr, w - 8, h * 0.16, 3); g.fill();
  g.roundRect(-w / 2 + 5, -h / 2 + h * 0.7, w - 10, h * 0.1, 2); g.fill();
  g.fillStyle = '#fff6c8';
  if (d < 0.75) g.fillRect(-w / 2 + 3 + d * 4, -h / 2 + 1 + fr, 6, 3);
  if (d < 0.45) g.fillRect(w / 2 - 9 - d * 4, -h / 2 + 1 + fr, 6, 3);
  if (d > 0.15) { // abolladuras y hollín
    g.fillStyle = 'rgba(0,0,0,.28)';
    for (let i = 0; i < Math.floor(d * 7); i++) {
      g.beginPath();
      g.ellipse((hash(sd + i * 3.3) - 0.5) * w * 0.8, (hash(sd + i * 7.1) - 0.5) * h * 0.8, 2 + hash(sd + i) * 4 * d, 2 + hash(sd + i * 2) * 5 * d, hash(sd + i * 5) * 3, 0, 7);
      g.fill();
    }
  }
  if (d > 0.3) { // parabrisas trizado
    g.strokeStyle = 'rgba(230,240,255,.75)'; g.lineWidth = 0.7;
    const cx = (hash(sd + 9) - 0.5) * (w - 14), cy = -h / 2 + h * 0.26 + fr;
    g.beginPath(); for (let i = 0; i < 5; i++) { const a = i * 1.3 + sd; g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * w * 0.3, cy + Math.sin(a) * h * 0.07); } g.stroke();
  }
  if (d > 0.6) { // capó levantado y parachoques colgando
    g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(-w / 2 + 4, -h / 2 + fr + h * 0.16); g.lineTo(w / 2 - 6, -h / 2 + fr + h * 0.1); g.stroke();
    g.fillStyle = '#55505e'; g.save(); g.translate(-w / 2 + 2, h / 2 - 1); g.rotate(0.25 + Math.sin(t * 9 + sd) * 0.08); g.fillRect(0, 0, w * 0.5, 2.5); g.restore();
  }
  // luces traseras: el aviso del jefe (freno rojo, reversa blanca) brilla con un halo
  const { brake, rev } = o, lit = rev ? '#ffffff' : brake ? '#ff3355' : '#8a1d2c';
  if (brake || rev) {
    const halo = rev ? 'rgba(255,255,255,' : 'rgba(255,51,85,';
    [[7, 0.12], [4, 0.22], [2, 0.35]].forEach(([s, a]) => {
      g.fillStyle = halo + a + ')'; g.fillRect(-w / 2 + 3 - s, h / 2 - 4 - s, 7 + 2 * s, 3 + 2 * s); g.fillRect(w / 2 - 10 - s, h / 2 - 4 - s, 7 + 2 * s, 3 + 2 * s);
    });
  }
  g.fillStyle = lit; g.fillRect(-w / 2 + 3, h / 2 - 4, 7, 3); g.fillRect(w / 2 - 10, h / 2 - 4, 7, 3);
  if (o.hazard && Math.floor(t * 6) % 2 === 0) {
    g.fillStyle = C.orange; g.fillRect(-w / 2 - 1, -h / 2, 3, 4); g.fillRect(w / 2 - 2, -h / 2, 3, 4); g.fillRect(-w / 2 - 1, h / 2 - 4, 3, 4); g.fillRect(w / 2 - 2, h / 2 - 4, 3, 4);
  }
  if (o.extra) o.extra(g, w, h);
  if (o.flash && o.flash > 0) { g.fillStyle = 'rgba(255,255,255,.7)'; carPath(g, w, h, d, sd); g.fill(); }
  g.restore();
}
