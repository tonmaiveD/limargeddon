import type { ObstacleDef } from '../config';
import { FONT, parseColor, type Gfx, type Painter } from '../gfx';
import type { Foe, Game, Obstacle, Pickup, Shot } from '../state';
import { C } from '../util';
import { gateClosed } from '../world';
import { ensure } from './cache';
import { paint } from './canvas-painter';
import { ART_SCALE } from './vehicles';

/*
 * Obstáculos, bonus y proyectiles en nivel B (ADR 0044): cada uno se dibuja con su mismo código sobre un canvas, con
 * relieve, y se usa como sprite. Lo que cambia cada cuadro (barreras del peaje, peatones que se mueven, el halo del bonus,
 * el giro de los proyectiles) se dibuja o se aplica en vivo.
 */

const S = ART_SCALE;

// Hornea un sprite centrado de w por h con margen m, dibujado con origen en su centro.
function sprite(g: Gfx, key: string, w: number, h: number, m: number, draw: (p: Painter) => void): string {
  return ensure(g.textures, key, () => paint(w + 2 * m, h + 2 * m, S, m + w / 2, m + h / 2, draw));
}

/* ---------- obstáculos ---------- */

// Dibujo fijo de un obstáculo, centrado en (0, 0). El peaje y los peatones tienen partes en vivo (drawObstacle).
function paintObstacle(g: Painter, o: ObstacleDef, w: number, h: number): void {
  const x0 = -w / 2, y0 = -h / 2;
  if (o.style === 'rampa') { // rampa de tierra con franjas: el lado oscuro es la subida
    g.fillStyle = o.col; g.fillRect(x0, y0, w, h);
    g.fillStyle = o.col2 ?? '#15111d'; for (let i = 0; i < 4; i++) g.fillRect(x0, y0 + h - (i + 1) * (h / 5), w, 2);
    g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x0, y0, w, 2);
  } else if (o.style === 'cables') { // cables colgando de poste a poste: pasar por debajo acelerando te engancha
    g.fillStyle = '#15111d'; g.fillRect(x0 - 3, -8, 4, 16); g.fillRect(x0 + w - 1, -8, 4, 16);
    g.strokeStyle = o.col; g.lineWidth = 1.4;
    for (let i = 0; i < 4; i++) {
      const sag = 4 + i * 2.5, yy = -5 + i * 3;
      g.beginPath(); g.moveTo(x0, yy);
      for (let k = 1; k <= 8; k++) { const u = k / 8; g.lineTo(x0 + w * u, yy + sag * 4 * u * (1 - u)); }
      g.stroke();
    }
  } else if (o.style === 'crater') {
    g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(0, 2, w / 2, h / 2, 0, 0, 7); g.fill();
    g.fillStyle = o.col; g.beginPath(); g.ellipse(0, 0, w / 2 - 3, h / 2 - 3, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(0, -1.5, w / 2 - 6, h / 2 - 5, 0, 0, 7); g.fill(); // hondo
    g.strokeStyle = o.col2 ?? '#4a4452'; g.lineWidth = 1.2; g.beginPath();
    for (let i = 0; i < 4; i++) { const a = i * 1.7; g.moveTo(Math.cos(a) * w * 0.3, Math.sin(a) * h * 0.3); g.lineTo(Math.cos(a) * w * 0.55, Math.sin(a) * h * 0.55); }
    g.stroke();
  } else if (o.style === 'conos') {
    const n = Math.max(2, Math.floor(w / 18)), stepX = w / n;
    g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(x0 + stepX / 2, -1, w - stepX, 2); // cinta
    for (let i = 0; i < n; i++) {
      const cx = x0 + stepX * (i + 0.5);
      g.fillStyle = o.col; g.beginPath(); g.moveTo(cx, -8); g.lineTo(cx + 6, 6); g.lineTo(cx - 6, 6); g.closePath(); g.fill();
      g.fillStyle = o.col2 ?? '#fff'; g.fillRect(cx - 3, -1, 6, 2);
    }
  } else if (o.style === 'scooter') { // scooter eléctrico tirado en la pista
    g.save(); g.rotate(0.6);
    g.fillStyle = o.col; g.fillRect(-12, -2, 24, 4); g.fillRect(9, -8, 3, 10);
    g.fillStyle = '#111'; g.beginPath(); g.arc(-11, 3, 3, 0, 7); g.fill(); g.beginPath(); g.arc(11, 3, 3, 0, 7); g.fill();
    g.restore();
  } else if (o.style === 'barrera') {
    g.fillStyle = o.col; g.fillRect(x0, y0, w, h);
    g.fillStyle = o.col2 ?? '#111';
    for (let x = x0; x < x0 + w; x += 12) g.fillRect(x, y0, Math.min(6, x0 + w - x), h);
    g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x0, y0, w, 1.5);
  } else if (o.style !== 'peatones' && o.style !== 'peaje') { // caja
    g.fillStyle = o.col; g.roundRect(x0, y0, w, h, 4); g.fill();
    g.fillStyle = o.col2 ?? 'rgba(0,0,0,.25)'; g.fillRect(x0 + 4, y0 + 4, w - 8, 6);
    g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x0 + 2, y0 + 1, w - 4, 1.5);
  }
  if (o.label && o.style !== 'peatones' && o.style !== 'peaje') {
    g.font = FONT(o.style === 'conos' || o.style === 'cables' || o.style === 'rampa' ? 6 : 7); g.textAlign = 'center';
    if (o.style === 'barrera') { // sobre las franjas, el rótulo va en una placa para que se lea
      const tw = g.measureText(o.label).width + 6;
      const c = parseColor(o.labelCol ?? '#fff').c, lum = ((c >> 16) & 255) * 0.3 + ((c >> 8) & 255) * 0.59 + (c & 255) * 0.11;
      g.fillStyle = lum > 128 ? 'rgba(14,10,22,.75)' : 'rgba(244,246,251,.85)'; g.roundRect(-tw / 2, -5, tw, 10, 2); g.fill(); // contraste con el texto
    }
    g.fillStyle = o.labelCol ?? '#fff';
    g.fillText(o.label, 0, o.style === 'conos' ? -11 : o.style === 'cables' ? -9 : o.style === 'rampa' ? 3 : 4);
  }
}

// Una persona de la marcha o de los turistas, vista desde arriba.
function paintPerson(g: Painter, col: string, camera: boolean): void {
  g.fillStyle = col; g.roundRect(-3, -3, 6, 8, 2); g.fill();
  g.fillStyle = '#e8c4a0'; g.beginPath(); g.arc(0, -6, 3, 0, 7); g.fill();
  g.fillStyle = '#2a2238'; g.beginPath(); g.arc(0, -6.8, 2.6, Math.PI, 2 * Math.PI); g.fill();
  if (camera) { g.fillStyle = '#111'; g.fillRect(2, -4, 4, 3); }
}

// Casetas del peaje entre carriles (lo fijo); las barreras suben y bajan en vivo.
function paintBooths(g: Painter, o: ObstacleDef, h: number, lanes: number, laneWidth: number): void {
  const half = (lanes * laneWidth) / 2;
  for (let l = 0; l <= lanes; l++) {
    const bx = -half + l * laneWidth;
    g.fillStyle = o.col; g.roundRect(bx - 5, -h / 2 - 4, 10, h + 8, 2); g.fill();
    g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(bx - 4, -h / 2 - 3, 8, 1.5);
    g.fillStyle = o.col2 ?? '#15111d'; g.fillRect(bx - 3, -3, 6, 4);
  }
  if (o.label) { g.fillStyle = o.labelCol ?? '#fff'; g.font = FONT(7); g.textAlign = 'center'; g.fillText(o.label, 0, -h / 2 - 8); }
}

// Un obstáculo en el juego (se llama dentro de g.rigid, en la capa del asfalto).
export function drawObstacle(g: Gfx, G: Game, ob: Obstacle): void {
  const o = G.cfg.obstacles![ob.i], id = G.cfg.id;
  if (o.style === 'peaje') {
    const { left, laneWidth, lanes } = G.cfg.road, half = (lanes * laneWidth) / 2;
    for (let l = 0; l < lanes; l++) { // barreras en vivo
      const lx = left + l * laneWidth, closed = gateClosed(G, ob, l);
      if (closed) { for (let x = lx + 6, i = 0; x < lx + laneWidth - 6; x += 8, i++) { g.fillStyle = i % 2 ? '#f4f6fb' : '#ff3355'; g.fillRect(x, ob.y - 2, 8, 4); } }
      else { g.fillStyle = '#ff3355'; g.fillRect(lx + 6, ob.y - 2, 4, 4); g.fillStyle = '#f4f6fb'; g.fillRect(lx + 6, ob.y - 10, 3, 8); }
      if (o.payLanes && !closed) { g.fillStyle = C.yellow; g.font = FONT(6); g.textAlign = 'center'; g.fillText('PAGO S/' + (o.toll ?? 0), lx + laneWidth / 2, ob.y + 14); }
    }
    const key = sprite(g, `obs|${id}|${ob.i}|booths|${lanes}`, half * 2 + 12, ob.h + 30, 6, (p) => paintBooths(p, o, ob.h, lanes, laneWidth));
    g.image(key, left + half, ob.y, 1 / S);
    return;
  }
  if (o.style === 'peatones') {
    const n = Math.max(2, Math.floor(ob.w / 14)), stepX = ob.w / n, x0 = ob.x - ob.w / 2;
    for (let i = 0; i < n; i++) {
      const col = [o.col, o.col2 ?? '#7fd4ff', '#ffe14d'][i % 3], cam = i % 2 === 0;
      const key = sprite(g, `persona|${col}|${cam}`, 12, 16, 4, (p) => paintPerson(p, col, cam));
      g.image(key, x0 + stepX * (i + 0.5) + Math.sin(G.t * 6 + i) * 1.5, ob.y, 1 / S);
    }
    return;
  }
  const key = sprite(g, `obs|${id}|${ob.i}|${ob.w}|${ob.h}`, ob.w, ob.h, 16, (p) => paintObstacle(p, o, ob.w, ob.h));
  g.image(key, ob.x, ob.y, 1 / S);
}

/* ---------- bonus ---------- */

// Bonus: rombo horneado que se mece, con el halo que late y la letra en vivo.
export function drawPickupB(g: Gfx, G: Game, u: Pickup): void {
  const P = G.cfg.powers[u.k];
  g.save(); g.translate(u.x, u.y);
  g.fillStyle = P.col; g.globalAlpha = 0.25 + Math.sin(G.t * 6) * 0.1; g.beginPath(); g.arc(0, 0, 18, 0, 7); g.fill(); g.globalAlpha = 1;
  const key = sprite(g, `bonus|${P.col}`, 30, 30, 4, (p) => {
    p.rotate(Math.PI / 4); p.fillStyle = P.col; p.roundRect(-10, -10, 20, 20, 3); p.fill();
    p.fillStyle = 'rgba(255,255,255,.35)'; p.fillRect(-8, -8, 16, 3);
  });
  g.image(key, 0, 0, 1 / S, Math.sin(u.rot) * 0.2);
  g.fillStyle = '#0e0a16'; g.font = FONT(12); g.textAlign = 'center'; g.fillText(P.L, 0, 5);
  g.restore();
}

/* ---------- proyectiles del jefe y del Tico ---------- */

// Dibujo fijo de un proyectil del jefe, centrado en (0, 0). frame: vuelta del rollo (0 a 3).
function paintFoe(g: Painter, look: Foe['look'], r: number, col: string, frame: number): void {
  if (look === 'piedra') { // piedra del acantilado
    g.fillStyle = col; g.beginPath(); g.ellipse(0, 0, r, r * 0.85, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(-r / 2, -r / 2, r / 2, 2);
    g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(r * 0.25, r * 0.3, r * 0.4, r * 0.25, 0.5, 0, 7); g.fill();
  } else if (look === 'rompellantas') { // tira de clavos
    const rw = r * 3.2, rh = r * 0.9;
    g.fillStyle = '#2a2632'; g.fillRect(-rw / 2, -rh / 2, rw, rh);
    g.fillStyle = '#c9ccd3';
    for (let x = -rw / 2 + 2; x < rw / 2 - 1; x += 4) { g.beginPath(); g.moveTo(x, -rh / 2); g.lineTo(x + 2, -rh / 2 - 4); g.lineTo(x + 4, -rh / 2); g.fill(); }
  } else if (look === 'contenedor') { // contenedor con nervaduras
    const cw = r * 1.6, chh = r * 3;
    g.fillStyle = col; g.fillRect(-cw / 2, -chh / 2, cw, chh);
    g.fillStyle = 'rgba(0,0,0,.22)'; for (let y = -chh / 2 + 3; y < chh / 2 - 2; y += 4) g.fillRect(-cw / 2 + 1, y, cw - 2, 1.5);
    g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(-cw / 2, -chh / 2, cw, 2);
  } else if (look === 'rollo') { // rollo de tela rodando
    const rw = r * 2.4, rh = r * 1.4, roll = frame;
    g.fillStyle = col; g.roundRect(-rw / 2, -rh / 2, rw, rh, 3); g.fill();
    g.fillStyle = 'rgba(0,0,0,.22)'; for (let i = 0; i < 3; i++) g.fillRect(-rw / 2 + 1, -rh / 2 + ((i * 4 + roll) % rh), rw - 2, 1.5);
    g.fillStyle = '#e8e2d0'; g.fillRect(-rw / 2 - 2, -2, 3, 4); g.fillRect(rw / 2 - 1, -2, 3, 4);
  } else { // moneda u otro proyectil redondo
    g.fillStyle = col; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(-r / 2, -r / 2, r / 2, r / 2);
    g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 0.6; g.beginPath(); g.arc(0, 0, r * 0.7, 0, 7); g.stroke();
  }
}

export function drawFoe(g: Gfx, G: Game, f: Foe): void {
  const frame = f.look === 'rollo' ? Math.floor((G.t * 10 + f.x) % 4) : 0;
  const size = Math.max(f.r * 3.4, 12);
  const key = sprite(g, `foe|${f.look ?? 'bola'}|${f.r}|${f.col}|${frame}`, size, size, 8, (p) => paintFoe(p, f.look, f.r, f.col, frame));
  const ang = f.look === 'piedra' ? G.t * 4 + f.x : f.look === 'contenedor' ? Math.sin(G.t * 3 + f.x) * 0.12 : 0;
  g.image(key, f.x, f.y, 1 / S, ang);
}

// Conos, aceite y picarones del Tico; la cancha es tan chica que se dibuja en vivo.
export function drawShot(g: Gfx, G: Game, s: Shot): void {
  if (s.k === 'kernel') { g.fillStyle = '#fff3c2'; g.beginPath(); g.arc(s.x, s.y, 2.6, 0, 7); g.fill(); g.fillStyle = '#e6b64a'; g.fillRect(s.x - 1, s.y, 2, 2); return; }
  const key = sprite(g, `shot|${s.k}`, 20, 20, 4, (p) => {
    if (s.k === 'cone') { p.fillStyle = C.orange; p.beginPath(); p.moveTo(0, -7); p.lineTo(5, 5); p.lineTo(-5, 5); p.closePath(); p.fill(); p.fillStyle = '#fff'; p.fillRect(-3, 0, 6, 2); }
    else if (s.k === 'picaron') {
      p.strokeStyle = '#c87a35'; p.lineWidth = 5; p.beginPath(); p.arc(0, 0, 7, 0, 7); p.closePath(); p.stroke();
      p.strokeStyle = 'rgba(120,60,20,.8)'; p.lineWidth = 1.5; p.beginPath(); p.arc(0, 0, 7, 0, 3); p.stroke();
      p.fillStyle = 'rgba(255,230,150,.35)'; p.beginPath(); p.arc(-2, -4, 2, 0, 7); p.fill(); // miel
    } else { p.fillStyle = '#3b2f17'; p.beginPath(); p.ellipse(0, 0, 8, 6, 0, 0, 7); p.fill(); p.fillStyle = 'rgba(61,255,154,.5)'; p.beginPath(); p.arc(-2, -2, 2, 0, 7); p.fill(); }
  });
  g.image(key, s.x, s.y, 1 / S, s.k === 'picaron' ? G.t * 14 : 0);
}
