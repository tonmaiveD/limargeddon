import { hash } from '../util';

/*
 * Prueba de gráficos, nivel B (ADR 0041, en evaluación): cada vehículo se dibuja una vez con Canvas 2D completo
 * (degradados, sombra difusa, contorno, brillos y reflejos) a varias veces su tamaño, y el juego lo usaría como imagen.
 * El daño sigue siendo procedural: se hornea una imagen por etapa de daño con el mismo contorno abollado que hoy
 * (carPath) y las mismas marcas (abolladuras, parabrisas trizado, capó levantado). Todavía no reemplaza nada del juego.
 */

export type ArtKind = 'tico' | 'sedan' | 'combi';
export interface CarArt {
  kind: ArtKind; w: number; h: number; body: string;
  roof?: string; band?: string; label?: string; labelCol?: string; taxi?: boolean;
}

export const BAKE_SCALE = 4; // píxeles de la imagen por unidad del juego
const PAD = 8; // margen para la sombra

// Aclara (k > 0) u oscurece (k < 0) un color #rrggbb.
export function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16), ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const out = ch.map((c) => Math.round(k >= 0 ? c + (255 - c) * k : c * (1 + k)));
  return '#' + out.map((c) => c.toString(16).padStart(2, '0')).join('');
}

// Proporciones de cada carrocería, de adelante (0) hacia atrás (1): capó, parabrisas, techo, luneta.
const SHAPE: Record<ArtKind, { hood: number; shield: number; roof: number; rear: number; front: number; back: number }> = {
  tico: { hood: 0.17, shield: 0.31, roof: 0.76, rear: 0.88, front: 9, back: 6 },
  sedan: { hood: 0.25, shield: 0.39, roof: 0.65, rear: 0.76, front: 9, back: 7 },
  combi: { hood: 0.07, shield: 0.17, roof: 0.94, rear: 0.98, front: 6, back: 3 },
};

// Contorno de la carrocería: redondeado sin daño; con daño, el mismo abollado de carPath (damage-render.ts).
function bodyPath(c: CanvasRenderingContext2D, a: CarArt, d: number, sd: number): void {
  const { w, h } = a, S = SHAPE[a.kind];
  c.beginPath();
  if (d < 0.06) {
    const x0 = -w / 2, y0 = -h / 2, rf = S.front, rb = S.back;
    c.moveTo(x0 + rf, y0); c.lineTo(-x0 - rf, y0); c.quadraticCurveTo(-x0, y0, -x0, y0 + rf);
    c.lineTo(-x0 + 0.6, 0); c.lineTo(-x0, -y0 - rb); c.quadraticCurveTo(-x0, -y0, -x0 - rb, -y0);
    c.lineTo(x0 + rb, -y0); c.quadraticCurveTo(x0, -y0, x0, -y0 - rb); c.lineTo(x0 - 0.6, 0);
    c.lineTo(x0, y0 + rf); c.quadraticCurveTo(x0, y0, x0 + rf, y0); c.closePath();
    return;
  }
  const j = (i: number) => Math.abs(hash(sd + i * 13.7) - 0.5) * 2;
  const top = -h / 2 + d * h * 0.12, bot = h / 2 - d * h * 0.05, cin = d * 5, dent = d * 7, P: [number, number][] = [];
  for (let i = 0; i <= 6; i++) P.push([-w / 2 + cin + ((w - 2 * cin) * i) / 6, top + j(i) * d * 9]);
  for (let i = 1; i < 8; i++) P.push([w / 2 - j(i + 20) * dent, top + ((bot - top) * i) / 8]);
  for (let i = 0; i <= 3; i++) P.push([w / 2 - cin * 0.6 - ((w - cin * 1.2) * i) / 3, bot - j(i + 40) * d * 4]);
  for (let i = 7; i > 0; i--) P.push([-w / 2 + j(i + 60) * dent, top + ((bot - top) * i) / 8]);
  P.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath();
}

function rrect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  c.beginPath(); c.roundRect(x, y, w, h, r);
}

// Vidrio con degradado y un reflejo diagonal. narrowTop: el lado más angosto (parabrisas arriba, luneta abajo).
function glass(c: CanvasRenderingContext2D, x0: number, x1: number, y0: number, y1: number, inset: number, narrowTop: boolean): void {
  c.beginPath();
  if (narrowTop) { c.moveTo(x0 + inset, y0); c.lineTo(x1 - inset, y0); c.lineTo(x1, y1); c.lineTo(x0, y1); }
  else { c.moveTo(x0, y0); c.lineTo(x1, y0); c.lineTo(x1 - inset, y1); c.lineTo(x0 + inset, y1); }
  c.closePath();
  const g = c.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, '#3a4d68'); g.addColorStop(0.55, '#1b2638'); g.addColorStop(1, '#0e141f');
  c.fillStyle = g; c.fill();
  c.save(); c.clip();
  c.fillStyle = 'rgba(255,255,255,.22)';
  c.beginPath(); c.moveTo(x0 + (x1 - x0) * 0.15, y1); c.lineTo(x0 + (x1 - x0) * 0.35, y1); c.lineTo(x0 + (x1 - x0) * 0.55, y0); c.lineTo(x0 + (x1 - x0) * 0.42, y0); c.closePath(); c.fill();
  c.restore();
}

// Dibuja un vehículo horneado con daño d (0..1) y semilla sd para las abolladuras. Devuelve un canvas.
export function bakeCar(a: CarArt, d = 0, sd = 0): HTMLCanvasElement {
  const { w, h, body } = a, S = SHAPE[a.kind], k = BAKE_SCALE;
  const cv = document.createElement('canvas');
  cv.width = Math.ceil((w + PAD * 2) * k); cv.height = Math.ceil((h + PAD * 2) * k);
  const c = cv.getContext('2d')!;
  c.scale(k, k); c.translate(PAD + w / 2, PAD + h / 2);
  const fr = d * h * 0.12, yAt = (t: number) => -h / 2 + h * t + fr * (1 - t); // el frente se hunde con el daño

  // sombra difusa bajo el auto
  c.save(); c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = 5 * k; c.shadowOffsetX = 2 * k; c.shadowOffsetY = 3 * k;
  bodyPath(c, a, d, sd); c.fillStyle = '#000'; c.fill(); c.restore();

  // ruedas que asoman a los costados
  c.fillStyle = '#121016';
  for (const sy of [-1, 1]) for (const sx of [-1, 1]) { rrect(c, sx * (w / 2 - 1.2) - 2, sy * h * 0.3 - 4.5, 4, 9, 1.5); c.fill(); }

  // carrocería con volumen: más oscura en los bordes, más clara al centro
  bodyPath(c, a, d, sd);
  const gb = c.createLinearGradient(-w / 2, 0, w / 2, 0);
  gb.addColorStop(0, shade(body, -0.32)); gb.addColorStop(0.22, body); gb.addColorStop(0.5, shade(body, 0.14));
  gb.addColorStop(0.78, body); gb.addColorStop(1, shade(body, -0.38));
  c.fillStyle = gb; c.fill();
  c.lineWidth = 0.8; c.strokeStyle = shade(body, -0.55); c.stroke();

  c.save(); bodyPath(c, a, d, sd); c.clip();
  // franja de color de la combi
  if (a.band) { c.fillStyle = a.band; c.fillRect(-w / 2, yAt(0.5) - 2.5, w, 5); }
  // líneas de puertas y capó
  c.strokeStyle = 'rgba(0,0,0,.22)'; c.lineWidth = 0.5;
  c.beginPath(); c.moveTo(-w / 2 + 3, yAt(S.hood)); c.lineTo(w / 2 - 3, yAt(S.hood)); c.stroke();
  // brillo largo sobre el costado izquierdo
  const gs = c.createLinearGradient(-w / 2, 0, -w / 2 + 7, 0);
  gs.addColorStop(0, 'rgba(255,255,255,0)'); gs.addColorStop(0.5, 'rgba(255,255,255,.28)'); gs.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = gs; c.fillRect(-w / 2 + 1, yAt(0.08), 7, h * 0.84);
  c.restore();

  // parabrisas, techo y luneta
  const ix = 4;
  glass(c, -w / 2 + ix, w / 2 - ix, yAt(S.hood), yAt(S.shield), 3, true);
  const roofC = a.roof ?? shade(body, 0.06);
  rrect(c, -w / 2 + ix + 0.5, yAt(S.shield) + 0.6, w - 2 * ix - 1, yAt(S.roof) - yAt(S.shield) - 1.2, 3);
  const gr = c.createLinearGradient(-w / 2, 0, w / 2, 0);
  gr.addColorStop(0, shade(roofC, -0.2)); gr.addColorStop(0.45, shade(roofC, 0.18)); gr.addColorStop(1, shade(roofC, -0.25));
  c.fillStyle = gr; c.fill();
  if (a.kind === 'combi') { // ventanas laterales a lo largo
    c.fillStyle = '#16202e';
    for (const sx of [-1, 1]) { rrect(c, sx > 0 ? w / 2 - 2.6 : -w / 2 + 0.6, yAt(0.2), 2, h * 0.66, 1); c.fill(); }
  }
  glass(c, -w / 2 + ix + 1, w / 2 - ix - 1, yAt(S.roof), yAt(S.rear), 2.5, false);

  // espejos
  c.fillStyle = shade(body, -0.35);
  for (const sx of [-1, 1]) { rrect(c, sx * (w / 2 + 0.6) - 1.4, yAt(S.hood) + 1, 2.8, 2.2, 1); c.fill(); }

  // faros con halo y luces traseras
  const lights: [number, string, number][] = [];
  if (d < 0.75) lights.push([-1, '#fff6c8', 1]);
  if (d < 0.45) lights.push([1, '#fff6c8', 1]);
  for (const [sx, col] of lights) {
    c.save(); c.shadowColor = 'rgba(255,240,180,.9)'; c.shadowBlur = 2.5 * k;
    c.fillStyle = col; c.beginPath(); c.ellipse(sx * (w / 2 - 4.2), yAt(0) + 1.8, 2.6, 1.4, 0, 0, Math.PI * 2); c.fill(); c.restore();
  }
  c.fillStyle = '#b3172d';
  for (const sx of [-1, 1]) { rrect(c, sx * (w / 2 - 4.5) - 2.5, h / 2 - 3 - d * h * 0.05, 5, 2, 0.8); c.fill(); }

  // letrero de taxi y rótulos
  if (a.taxi) {
    const y = (yAt(S.shield) + yAt(S.roof)) / 2;
    rrect(c, -7, y - 2.6, 14, 5.2, 1.2); c.fillStyle = '#15111d'; c.fill();
    c.fillStyle = '#ffe14d'; c.font = '600 4px Bungee, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('TAXI', 0, y + 0.2);
  }
  if (a.label) {
    c.fillStyle = a.labelCol ?? '#fff'; c.font = '4px Bungee, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(a.label, 0, (yAt(S.shield) + yAt(S.roof)) / 2);
  }

  // daño: abolladuras, parabrisas trizado y capó levantado, como hoy
  if (d > 0.15) {
    for (let i = 0; i < Math.floor(d * 7); i++) {
      const x = (hash(sd + i * 3.3) - 0.5) * w * 0.8, y = (hash(sd + i * 7.1) - 0.5) * h * 0.8;
      const rx = 2 + hash(sd + i) * 4 * d, ry = 2 + hash(sd + i * 2) * 5 * d, rot = hash(sd + i * 5) * 3;
      const gd = c.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
      gd.addColorStop(0, 'rgba(0,0,0,.42)'); gd.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = gd; c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 0.4; c.beginPath(); c.ellipse(x - 0.5, y - 0.5, rx * 0.8, ry * 0.8, rot, Math.PI, Math.PI * 1.6); c.stroke();
    }
  }
  if (d > 0.3) {
    c.strokeStyle = 'rgba(230,240,255,.8)'; c.lineWidth = 0.35;
    const cx = (hash(sd + 9) - 0.5) * (w - 14), cy = (yAt(S.hood) + yAt(S.shield)) / 2;
    c.beginPath(); for (let i = 0; i < 7; i++) { const an = i * 0.95 + sd; c.moveTo(cx, cy); c.lineTo(cx + Math.cos(an) * w * 0.32, cy + Math.sin(an) * h * 0.08); } c.stroke();
  }
  if (d > 0.6) {
    c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 0.9;
    c.beginPath(); c.moveTo(-w / 2 + 4, yAt(0) + h * 0.04); c.lineTo(w / 2 - 6, yAt(0) - h * 0.02); c.stroke();
  }
  return cv;
}

// Etapas de daño horneadas (cada una es una imagen): 0, 35%, 65% y 90%.
export const DAMAGE_STEPS = [0, 0.35, 0.65, 0.9];
export const damageStep = (d: number) => DAMAGE_STEPS.reduce((best, s) => (d >= s ? s : best), 0);
