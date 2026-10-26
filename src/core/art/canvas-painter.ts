import { cssFont, FONT, parseColor, type FontSpec, type Painter } from '../gfx';

/*
 * Pintor sobre Canvas 2D con la misma interfaz que Gfx (ADR 0044): el paisaje, los obstáculos y los proyectiles se
 * dibujan una sola vez con su mismo código y se hornean como imagen. Con relieve, cada figura opaca que no es fondo
 * proyecta una sombra suave, y los textos también, lo que da volumen sin redibujar nada a mano.
 */

export interface Relief { area: number; scale: number } // área del lienzo (para reconocer el fondo) y escala de la imagen

export class CanvasPainter implements Painter {
  fillStyle = '#000'; strokeStyle = '#000'; lineWidth = 1; globalAlpha = 1; font: FontSpec = FONT(10); textAlign: Painter['textAlign'] = 'left';
  private stack: { fillStyle: string; strokeStyle: string; lineWidth: number; globalAlpha: number; font: FontSpec; textAlign: Painter['textAlign'] }[] = [];

  constructor(private c: CanvasRenderingContext2D, private relief: Relief | null = null) {}

  save(): void { this.c.save(); this.stack.push({ fillStyle: this.fillStyle, strokeStyle: this.strokeStyle, lineWidth: this.lineWidth, globalAlpha: this.globalAlpha, font: this.font, textAlign: this.textAlign }); }
  restore(): void { this.c.restore(); Object.assign(this, this.stack.pop() ?? {}); }
  translate(x: number, y: number): void { this.c.translate(x, y); }
  rotate(r: number): void { this.c.rotate(r); }

  // sombra suave para figuras opacas que no son fondo (el fondo es lo que cubre buena parte del lienzo)
  private shadow(area: number, text = false): void {
    const R = this.relief, a = parseColor(this.fillStyle).a * this.globalAlpha;
    if (!R || a < 0.5 || area > R.area * 0.45) { this.c.shadowColor = 'transparent'; return; }
    this.c.shadowColor = text ? 'rgba(0,0,0,.55)' : 'rgba(0,0,0,.38)';
    this.c.shadowBlur = (text ? 1.2 : 2) * R.scale; this.c.shadowOffsetX = R.scale * (text ? 0.6 : 1); this.c.shadowOffsetY = R.scale * (text ? 0.8 : 1.4);
  }
  private apply(): void { this.c.fillStyle = this.fillStyle; this.c.strokeStyle = this.strokeStyle; this.c.lineWidth = this.lineWidth; this.c.globalAlpha = this.globalAlpha; }

  fillRect(x: number, y: number, w: number, h: number): void { this.apply(); this.shadow(Math.abs(w * h)); this.c.fillRect(x, y, w, h); this.c.shadowColor = 'transparent'; }
  beginPath(): void { this.c.beginPath(); this.pathArea = 0; }
  moveTo(x: number, y: number): void { this.c.moveTo(x, y); this.track(x, y); }
  lineTo(x: number, y: number): void { this.c.lineTo(x, y); this.track(x, y); }
  closePath(): void { this.c.closePath(); }
  arc(x: number, y: number, r: number, a0: number, a1: number): void { this.c.arc(x, y, r, a0, a1); this.pathArea += Math.PI * r * r; }
  ellipse(x: number, y: number, rx: number, ry: number, rot: number, a0: number, a1: number): void { this.c.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot, a0, a1); this.pathArea += Math.PI * Math.abs(rx * ry); }
  roundRect(x: number, y: number, w: number, h: number, r: number): void { this.c.beginPath(); this.c.roundRect(x, y, w, h, Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2))); this.pathArea = Math.abs(w * h); }
  fill(): void { this.apply(); this.shadow(this.pathArea || 1); this.c.fill(); this.c.shadowColor = 'transparent'; }
  stroke(): void { this.apply(); this.c.shadowColor = 'transparent'; this.c.stroke(); }
  fillText(text: string, x: number, y: number): void {
    this.apply(); this.shadow(1, true);
    this.c.font = cssFont(this.font); this.c.textAlign = this.textAlign; this.c.textBaseline = 'alphabetic';
    this.c.fillText(text, x, y); this.c.shadowColor = 'transparent';
  }
  measureText(text: string): { width: number } { this.c.font = cssFont(this.font); return this.c.measureText(text); }

  // área aproximada de un trazado de líneas (caja que lo contiene), para no darle sombra a un fondo dibujado como polígono
  private pathArea = 0;
  private box: [number, number, number, number] | null = null;
  private track(x: number, y: number): void {
    const b = this.box && this.pathArea > 0 ? this.box : (this.box = [x, y, x, y]);
    b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], y); b[2] = Math.max(b[2], x); b[3] = Math.max(b[3], y);
    this.pathArea = Math.max(1, (b[2] - b[0]) * (b[3] - b[1]));
  }
}

// Grano fino para que las superficies no se vean planas (una sola textura de ruido, reutilizada).
let noise: HTMLCanvasElement | null = null;
export function grain(c: CanvasRenderingContext2D, w: number, h: number, alpha = 0.08): void {
  if (!noise) {
    noise = document.createElement('canvas'); noise.width = noise.height = 64;
    const n = noise.getContext('2d')!, img = n.createImageData(64, 64);
    for (let i = 0; i < img.data.length; i += 4) { const v = 96 + Math.random() * 64; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    n.putImageData(img, 0, 0);
  }
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = alpha; c.globalCompositeOperation = 'overlay';
  c.fillStyle = c.createPattern(noise, 'repeat')!; c.fillRect(0, 0, w, h); c.restore();
}

// Dibuja con el pintor sobre un lienzo nuevo de w por h unidades a la escala dada, con origen en (ox, oy).
export function paint(w: number, h: number, scale: number, ox: number, oy: number, draw: (p: CanvasPainter, c: CanvasRenderingContext2D) => void, relief = true): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = Math.max(1, Math.ceil(w * scale)); cv.height = Math.max(1, Math.ceil(h * scale));
  const c = cv.getContext('2d')!;
  c.scale(scale, scale); c.translate(ox, oy);
  draw(new CanvasPainter(c, relief ? { area: w * h, scale } : null), c);
  return cv;
}
