import { hash } from '../util';

/*
 * Gráficos nivel B (ADR 0041 y 0042): cada vehículo se dibuja una vez con Canvas 2D completo (degradados, sombra
 * difusa, contorno, brillos y reflejos) a varias veces su tamaño, y el juego lo usa como imagen. El daño sigue siendo
 * procedural: se hornea una imagen por etapa de daño con el mismo contorno abollado de siempre (carPath) y las mismas
 * marcas (abolladuras, parabrisas trizado, capó levantado). Lo que cambia cada cuadro (frenos, balizas, circulina,
 * destello del golpe) se dibuja encima en art/vehicles.ts.
 */

export type ArtKind = 'tico' | 'sedan' | 'old' | 'patrol' | 'suv' | 'combi' | 'truck' | 'bus' | 'moto' | 'bici' | 'mototaxi' | 'triciclo';
export interface CarArt {
  kind: ArtKind; w: number; h: number; body: string;
  roof?: string; band?: string; panel?: string; label?: string; labelCol?: string; labelSize?: number; labelY?: number;
  taxi?: boolean; shades?: boolean; siren?: boolean; box?: string; bumper?: boolean; plates?: boolean;
}

export const PAD = 8; // margen alrededor del vehículo para la sombra
export const SIREN_Y = 0.395; // altura de la circulina, en fracción del largo (la imagen trae la base; las luces van encima)

// Aclara (k > 0) u oscurece (k < 0) un color #rrggbb. Otros formatos se devuelven igual.
export function shade(hex: string, k: number): string {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return hex;
  const n = parseInt(hex.slice(1), 16), ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const out = ch.map((c) => Math.round(k >= 0 ? c + (255 - c) * k : c * (1 + k)));
  return '#' + out.map((c) => c.toString(16).padStart(2, '0')).join('');
}

// Proporciones de cada carrocería, de adelante (0) hacia atrás (1): capó, parabrisas, techo y luneta; radios de esquinas.
const SHAPE: Record<string, { hood: number; shield: number; roof: number; rear: number; front: number; back: number }> = {
  tico: { hood: 0.17, shield: 0.31, roof: 0.76, rear: 0.88, front: 9, back: 6 },
  sedan: { hood: 0.25, shield: 0.39, roof: 0.65, rear: 0.76, front: 9, back: 7 },
  old: { hood: 0.27, shield: 0.4, roof: 0.64, rear: 0.74, front: 11, back: 10 },
  patrol: { hood: 0.25, shield: 0.39, roof: 0.65, rear: 0.76, front: 8, back: 7 },
  suv: { hood: 0.22, shield: 0.34, roof: 0.82, rear: 0.9, front: 7, back: 5 },
  combi: { hood: 0.07, shield: 0.17, roof: 0.94, rear: 0.98, front: 6, back: 3 },
  truck: { hood: 0.06, shield: 0.15, roof: 0.27, rear: 0.27, front: 5, back: 2 },
  bus: { hood: 0.03, shield: 0.1, roof: 0.97, rear: 0.99, front: 5, back: 3 },
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
  if (y1 - y0 < 0.5) return;
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

// Degradado horizontal de volumen: oscuro en los bordes, claro al centro.
function volume(c: CanvasRenderingContext2D, w: number, col: string, k = 1): CanvasGradient {
  const g = c.createLinearGradient(-w / 2, 0, w / 2, 0);
  g.addColorStop(0, shade(col, -0.32 * k)); g.addColorStop(0.22, col); g.addColorStop(0.5, shade(col, 0.14 * k));
  g.addColorStop(0.78, col); g.addColorStop(1, shade(col, -0.38 * k));
  return g;
}

function text(c: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, col: string): void {
  c.fillStyle = col; c.font = `${size}px Bungee, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(s, x, y);
}

function canvasFor(a: CarArt, scale: number): { cv: HTMLCanvasElement; c: CanvasRenderingContext2D } {
  const cv = document.createElement('canvas');
  cv.width = Math.ceil((a.w + PAD * 2) * scale); cv.height = Math.ceil((a.h + PAD * 2) * scale);
  const c = cv.getContext('2d')!;
  c.scale(scale, scale); c.translate(PAD + a.w / 2, PAD + a.h / 2);
  return { cv, c };
}

const SMALL: ArtKind[] = ['moto', 'bici', 'mototaxi', 'triciclo'];
export const isSmall = (k: ArtKind) => SMALL.includes(k);

// Dibuja un vehículo horneado con daño d (0..1) y semilla sd para las abolladuras.
export function bakeCar(a: CarArt, d = 0, sd = 0, scale = 4): HTMLCanvasElement {
  if (isSmall(a.kind)) return bakeSmall(a, scale);
  const { cv, c } = canvasFor(a, scale);
  const { w, h, body } = a, S = SHAPE[a.kind];
  const fr = d * h * 0.12, yAt = (t: number) => -h / 2 + h * t + fr * (1 - t); // el frente se hunde con el daño

  // sombra difusa bajo el vehículo
  c.save(); c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = 5 * scale; c.shadowOffsetX = 2 * scale; c.shadowOffsetY = 3 * scale;
  bodyPath(c, a, d, sd); c.fillStyle = '#000'; c.fill(); c.restore();

  // ruedas: con daño se meten junto con el costado abollado, para no quedar por fuera
  c.fillStyle = '#121016';
  const inset = 1.2 + d * 6, axles = a.kind === 'bus' || a.kind === 'truck' ? [-0.34, 0.22, 0.36] : [-0.3, 0.3];
  for (const ay of axles) for (const sx of [-1, 1]) { rrect(c, sx * (w / 2 - inset) - 2, ay * h + (ay < 0 ? fr * 0.7 : 0) - 4.5, 4, 9, 1.5); c.fill(); }

  // carrocería con volumen
  bodyPath(c, a, d, sd);
  c.fillStyle = volume(c, w, body, a.kind === 'old' ? 0.7 : 1); c.fill();
  c.lineWidth = 0.8; c.strokeStyle = shade(body, -0.55); c.stroke();

  c.save(); bodyPath(c, a, d, sd); c.clip();
  c.strokeStyle = 'rgba(0,0,0,.22)'; c.lineWidth = 0.5;
  c.beginPath(); c.moveTo(-w / 2 + 3, yAt(S.hood)); c.lineTo(w / 2 - 3, yAt(S.hood)); c.stroke();
  // brillo largo sobre el costado izquierdo
  const gs = c.createLinearGradient(-w / 2, 0, -w / 2 + 7, 0);
  gs.addColorStop(0, 'rgba(255,255,255,0)'); gs.addColorStop(0.5, `rgba(255,255,255,${a.kind === 'old' ? 0.12 : 0.28})`); gs.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = gs; c.fillRect(-w / 2 + 1, yAt(0.08), 7, h * 0.84);
  if (a.kind === 'old') { // carcocha: óxido y pintura gastada
    for (let i = 0; i < 6; i++) {
      c.fillStyle = `rgba(110,60,30,${0.25 + hash(i * 3.1 + sd) * 0.25})`;
      c.beginPath(); c.ellipse((hash(i * 7.7) - 0.5) * w * 0.8, (hash(i * 5.3) - 0.5) * h * 0.85, 1.5 + hash(i) * 2.5, 1 + hash(i * 2) * 2, i, 0, Math.PI * 2); c.fill();
    }
  }
  c.restore();

  const ix = 4;
  if (a.kind === 'truck') bakeTruck(c, a, yAt);
  else {
    glass(c, -w / 2 + ix, w / 2 - ix, yAt(S.hood), yAt(S.shield), 3, true);
    const roofC = a.roof ?? shade(body, 0.06);
    rrect(c, -w / 2 + ix + 0.5, yAt(S.shield) + 0.6, w - 2 * ix - 1, yAt(S.roof) - yAt(S.shield) - 1.2, 3);
    const gr = c.createLinearGradient(-w / 2, 0, w / 2, 0);
    gr.addColorStop(0, shade(roofC, -0.2)); gr.addColorStop(0.45, shade(roofC, 0.18)); gr.addColorStop(1, shade(roofC, -0.25));
    c.fillStyle = gr; c.fill();
    if (a.kind === 'combi' || a.kind === 'bus') { // ventanas laterales a lo largo
      c.fillStyle = '#16202e';
      for (const sx of [-1, 1]) { rrect(c, sx > 0 ? w / 2 - 3.4 : -w / 2 + 1.4, yAt(S.shield + 0.03), 2, h * (S.roof - S.shield - 0.06), 1); c.fill(); }
    }
    if (a.kind === 'bus') { // aire acondicionado sobre el techo
      rrect(c, -w / 2 + 9, yAt(0.4), w - 18, h * 0.14, 2); c.fillStyle = shade(roofC, 0.25); c.fill();
      c.fillStyle = 'rgba(0,0,0,.25)'; for (let i = 0; i < 4; i++) c.fillRect(-w / 2 + 11, yAt(0.42) + i * 2.6, w - 22, 0.8);
    }
    glass(c, -w / 2 + ix + 1, w / 2 - ix - 1, yAt(S.roof), yAt(S.rear), 2.5, false);
  }

  // franja de color: sobre el techo, de lado a lado, para que se vea desde arriba
  if (a.band) {
    const y = yAt(a.kind === 'bus' ? 0.76 : 0.62);
    c.save(); bodyPath(c, a, d, sd); c.clip();
    c.fillStyle = volume(c, w, a.band, 0.6); c.fillRect(-w / 2, y - 2.2, w, 4.4);
    c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(-w / 2, y - 2.2, w, 0.8);
    c.restore();
  }
  // panel del serenazgo o la policía, con la base de la circulina (las luces que parpadean van encima, cada cuadro)
  if (a.panel) { rrect(c, -w / 2 + ix + 1, yAt(0.46), w - 2 * ix - 2, h * 0.18, 2); c.fillStyle = a.panel; c.fill(); }
  if (a.siren) { rrect(c, -9.5, yAt(SIREN_Y) - 0.5, 19, 5, 1.5); c.fillStyle = '#2a2632'; c.fill(); }
  // lentes oscuros de la conductora
  if (a.shades) { c.fillStyle = '#000'; rrect(c, -w / 4 - 2.5, yAt(S.hood + 0.08), 8, 2.2, 1); c.fill(); }

  // espejos
  c.fillStyle = shade(body, -0.35);
  if (a.kind !== 'bus') for (const sx of [-1, 1]) { rrect(c, sx * (w / 2 + 0.6) - 1.4, yAt(S.hood) + 1, 2.8, 2.2, 1); c.fill(); }

  // faros con halo; las luces traseras se dibujan apagadas (frenar las enciende encima)
  const lights: number[] = [];
  if (d < 0.75) lights.push(-1);
  if (d < 0.45) lights.push(1);
  for (const sx of lights) {
    c.save(); c.shadowColor = 'rgba(255,240,180,.9)'; c.shadowBlur = 2.5 * scale;
    c.fillStyle = '#fff6c8'; c.beginPath(); c.ellipse(sx * (w / 2 - 4.2), yAt(0) + 1.8, 2.6, 1.4, 0, 0, Math.PI * 2); c.fill(); c.restore();
  }
  c.fillStyle = '#7a1424';
  for (const sx of [-1, 1]) { rrect(c, sx * (w / 2 - 4.5) - 2.5, h / 2 - 3 - d * h * 0.05, 5, 2, 0.8); c.fill(); }

  // mejoras visibles del Tico
  if (a.bumper) { rrect(c, -w / 2 - 1, yAt(0) - 3, w + 2, 3.6, 1); c.fillStyle = '#4a4452'; c.fill(); c.fillStyle = '#8c869a'; c.fillRect(-w / 2 + 2, yAt(0) - 2.2, w - 4, 0.8); }
  if (a.plates) { c.fillStyle = '#6c7a8c'; c.fillRect(-w / 2 - 2, -h / 4, 2, h / 2); c.fillRect(w / 2, -h / 4, 2, h / 2); }

  // letrero de taxi y rótulos
  if (a.taxi) {
    const y = (yAt(S.shield) + yAt(S.roof)) / 2;
    rrect(c, -7, y - 2.6, 14, 5.2, 1.2); c.fillStyle = '#15111d'; c.fill();
    text(c, 'TAXI', 0, y + 0.2, 4, '#ffe14d');
  }
  if (a.label) {
    // en el panel si lo hay; si no, sobre una placa oscura para que se lea aunque tenga el color del techo
    const y = a.panel ? yAt(0.55) : yAt(a.labelY ?? 0.52), size = Math.min(a.labelSize ?? 5, ((w - 6) / a.label.length) * 1.25);
    if (!a.panel) { c.font = `${size}px Bungee, sans-serif`; const tw = c.measureText(a.label).width + 3; rrect(c, -tw / 2, y - size * 0.75, tw, size * 1.5, 1.2); c.fillStyle = 'rgba(14,10,22,.55)'; c.fill(); }
    text(c, a.label, 0, y, size, a.labelCol ?? '#fff');
  }

  // daño: abolladuras con relieve, parabrisas trizado y capó levantado
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

// Camión: cabina adelante y la carga atrás, con lona o caja.
function bakeTruck(c: CanvasRenderingContext2D, a: CarArt, yAt: (t: number) => number): void {
  const { w } = a, S = SHAPE.truck;
  glass(c, -w / 2 + 4, w / 2 - 4, yAt(S.hood), yAt(S.shield), 3, true);
  rrect(c, -w / 2 + 4.5, yAt(S.shield) + 0.6, w - 9, yAt(S.roof) - yAt(S.shield) - 1, 2);
  c.fillStyle = volume(c, w, shade(a.body, 0.08)); c.fill();
  const top = yAt(0.3), bot = yAt(0.99), cargo = a.roof ?? '#c9ccd3';
  rrect(c, -w / 2 + 0.5, top, w - 1, bot - top, 2); c.fillStyle = volume(c, w, cargo, 0.8); c.fill();
  c.strokeStyle = shade(cargo, -0.4); c.lineWidth = 0.6; c.stroke();
  c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 0.5;
  for (let y = top + 6; y < bot - 2; y += 6) { c.beginPath(); c.moveTo(-w / 2 + 1.5, y); c.lineTo(w / 2 - 1.5, y); c.stroke(); }
}

// Vehículos chicos (sin etapas de daño): moto, bici, mototaxi y triciclo, con su conductor visto desde arriba.
function bakeSmall(a: CarArt, scale: number): HTMLCanvasElement {
  const { cv, c } = canvasFor(a, scale), { w, h, body } = a;
  c.save(); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 3 * scale; c.shadowOffsetX = 1.5 * scale; c.shadowOffsetY = 2 * scale;
  c.fillStyle = 'rgba(0,0,0,.6)'; rrect(c, -w / 2 + 1, -h / 2 + 1, w - 2, h - 2, 3); c.fill(); c.restore();
  const head = (y: number, helmet: string) => {
    c.fillStyle = volume(c, 7, helmet); c.beginPath(); c.arc(0, y, 3.2, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(-1, y - 1, 1.2, 0, Math.PI * 2); c.fill();
  };
  if (a.kind === 'moto' || a.kind === 'bici') {
    const thin = a.kind === 'bici';
    c.fillStyle = '#16141b'; rrect(c, -1.5, -h / 2, 3, 7.5, 1.5); c.fill(); rrect(c, -1.5, h / 2 - 7.5, 3, 7.5, 1.5); c.fill(); // ruedas
    c.fillStyle = thin ? '#8a8f99' : volume(c, 6, shade(body, -0.2)); c.fillRect(thin ? -0.6 : -2.2, -h / 2 + 5, thin ? 1.2 : 4.4, h - 10); // cuadro
    c.fillStyle = '#1b1b22'; c.fillRect(-5, -h / 2 + 4.2, 10, 1.4); // timón
    if (a.box && !thin) { rrect(c, -5.5, 2, 11, 9, 1.5); c.fillStyle = volume(c, 11, a.box); c.fill(); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(-5.5, 9.5, 11, 1.5); }
    c.fillStyle = volume(c, 8, body); rrect(c, -3.6, -4, 7.2, 8, 2.5); c.fill(); // espalda
    head(-3, thin ? a.box ?? '#ffe14d' : '#15111d');
    return cv;
  }
  if (a.kind === 'mototaxi') {
    c.fillStyle = '#16141b'; rrect(c, -1.8, -h / 2, 3.6, 6, 1.5); c.fill();
    for (const sx of [-1, 1]) { rrect(c, sx * (w / 2 - 1.5) - 2, h / 2 - 7, 4, 7, 1.5); c.fill(); }
    rrect(c, -w / 2 + 1, -h / 2 + 6, w - 2, h - 9, 3); c.fillStyle = volume(c, w, body); c.fill();
    c.strokeStyle = shade(body, -0.5); c.lineWidth = 0.6; c.stroke();
    glass(c, -w / 2 + 3, w / 2 - 3, -h / 2 + h * 0.22, -h / 2 + h * 0.32, 1.5, true);
    const roof = a.roof && a.roof.startsWith('#') ? a.roof : shade(body, -0.35);
    rrect(c, -w / 2 + 2, -h / 2 + h * 0.34, w - 4, h * 0.52, 3); c.fillStyle = volume(c, w, roof, 0.7); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 0.4; for (let x = -w / 2 + 5; x < w / 2 - 3; x += 3) { c.beginPath(); c.moveTo(x, -h / 2 + h * 0.36); c.lineTo(x, -h / 2 + h * 0.84); c.stroke(); }
    if (a.label) text(c, a.label, 0, -h / 2 + h * (a.labelY ?? 0.66), Math.min(a.labelSize ?? 4, ((w - 4) / a.label.length) * 1.3), a.labelCol ?? '#fff');
    return cv;
  }
  // triciclo de carga: plataforma con fardos adelante y el que pedalea atrás
  c.fillStyle = '#16141b';
  for (const sx of [-1, 1]) { rrect(c, sx * (w / 2 - 1.5) - 1.5, -h / 2 + 2, 3, 7, 1.2); c.fill(); }
  rrect(c, -1, h / 2 - 7, 2, 7, 1); c.fill();
  rrect(c, -w / 2 + 1, -h / 2 + 1, w - 2, h * 0.56, 2); c.fillStyle = '#4a4452'; c.fill();
  const box = a.box ?? '#e0954a';
  for (const [y, ins] of [[-h / 2 + 2, 2], [-h / 2 + 2 + h * 0.27, 3]] as const) {
    rrect(c, -w / 2 + ins, y, w - ins * 2, h * 0.24, 1.5); c.fillStyle = volume(c, w, box, 0.8); c.fill();
    c.strokeStyle = shade(box, -0.4); c.lineWidth = 0.5; c.stroke();
  }
  c.fillStyle = volume(c, 7, body); rrect(c, -3.2, h * 0.06, 6.4, 7, 2); c.fill();
  head(h * 0.06 + 1, '#e8c4a0');
  return cv;
}

// Etapas de daño horneadas (cada una es una imagen): 0, 35%, 65% y 90%.
export const DAMAGE_STEPS = [0, 0.35, 0.65, 0.9];
export const damageStep = (d: number) => DAMAGE_STEPS.reduce((best, s) => (d >= s ? s : best), 0);
