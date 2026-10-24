import { Sfx } from './audio/sfx';
import { H, W } from './constants';
import type { Gfx } from './gfx';
import { FONT } from './gfx';
import { burst, fine, floatText, hurt, laneX, usePerk, type Game } from './state';
import { C, clamp, overlap, rnd } from './util';

/*
 * Peligros de la Costa Verde (ADR 0026): derrumbes del acantilado, bandadas que manchan la pantalla y la carretilla
 * de helados que cruza la pista y no se toca. Cada uno se activa solo si la etapa lo declara en `hazards`.
 */

export function updateHazards(G: Game, dt: number): void {
  updateSlide(G, dt); updateFlock(G, dt); updateCart(G, dt);
  if (G.splat.t > 0) G.splat.t -= dt;
}

// Derrumbe: espera, aviso con polvo sobre los carriles del acantilado y luego piedras rodando un rato.
function updateSlide(G: Game, dt: number): void {
  const R = G.cfg.hazards?.rockslide, s = G.slide;
  if (!R) return;
  if (s.phase === 0) {
    s.t -= dt;
    if (s.t <= 0) {
      const n = Math.round(rnd(R.lanes[0], R.lanes[1] + 0.99) - 0.49), lanes = G.cfg.road.lanes;
      s.lanes = Array.from({ length: clamp(n, 1, lanes - 1) }, (_, i) => (R.side === 'izquierda' ? i : lanes - 1 - i));
      s.phase = 1; s.st = R.warn; floatText(G, W / 2, 96, '¡DERRUMBE!', C.orange, 13); Sfx.play('skid');
    }
  } else if (s.phase === 1) {
    s.st -= dt; if (s.st <= 0) { s.phase = 2; s.st = R.dur; s.spawnT = 0; }
  } else {
    s.st -= dt; s.spawnT -= dt;
    if (s.spawnT <= 0) {
      s.spawnT = 1 / R.rate;
      const lane = s.lanes[Math.floor(Math.random() * s.lanes.length)];
      G.foes.push({ x: laneX(G.cfg, lane) + rnd(-18, 18), y: 50, vx: rnd(-20, 20), vy: R.speed, r: 7, dmg: R.dmg, col: '#8a7a5a', look: 'piedra' });
    }
    if (s.st <= 0) { s.phase = 0; s.t = rnd(...R.every); }
  }
}

// Bandada: baja hacia el carril donde estaba el Tico. Si lo alcanza sin haber sido espantada, mancha la pantalla.
function updateFlock(G: Game, dt: number): void {
  const B = G.cfg.hazards?.birds, f = G.flock, p = G.p;
  if (!B) return;
  if (!f.on) {
    f.t -= dt;
    if (f.t <= 0) { f.on = true; f.scared = false; f.hit = false; f.x = p.x; f.y = 40; f.vy = (p.y - 40) / B.dur; f.t = rnd(...B.every); Sfx.play('say'); }
    return;
  }
  f.y += f.vy * dt;
  if (f.scared) f.x += 260 * dt;
  if (!f.scared && !f.hit && f.y >= p.y - 6 && Math.abs(f.x - p.x) < B.w / 2 + p.w / 2) {
    f.hit = true;
    if (!usePerk(G, 'birdHit')) {
      G.splat = { t: B.splat, max: B.splat, blots: Array.from({ length: 6 }, () => ({ x: rnd(40, W - 40), y: rnd(120, H - 160), r: rnd(18, 34) })) };
      floatText(G, p.x, p.y - 46, '¡PLOP!', '#f4f6fb', 12); Sfx.play('hit');
    }
  }
  if (f.y > H + 30 || f.x > W + 60) f.on = false;
}

// El claxon espanta a la bandada si todavía no llegó.
export function scareFlock(G: Game): void {
  const f = G.flock;
  if (f.on && !f.scared && !f.hit) { f.scared = true; floatText(G, f.x, f.y - 20, '¡FUERA, GAVIOTAS!', C.yellow, 10); }
}

const CART = { w: 30, h: 22 };
// Carretilla de helados: cruza la pista de un lado al otro. No se toca, ni con el Tico ni con los conos.
function updateCart(G: Game, dt: number): void {
  const K = G.cfg.hazards?.cart, c = G.cart, p = G.p;
  if (!K) return;
  if (!c.on) {
    c.t -= dt;
    if (c.t <= 0) {
      c.on = true; c.hit = false; c.dir = Math.random() < 0.5 ? 1 : -1;
      c.x = c.dir > 0 ? G.cfg.road.left - 30 : G.cfg.road.right + 30; c.y = rnd(300, 400); c.t = rnd(...K.every);
      floatText(G, W / 2, 110, K.label, C.yellow, 11); Sfx.play('whistle');
    }
    return;
  }
  c.x += c.dir * K.speed * dt; c.y += 18 * dt;
  const box = { x: c.x, y: c.y, ...CART };
  if (!c.hit && p.air <= 0 && overlap(p, box)) {
    c.hit = true; c.hits++; hurt(G, K.dmg); fine(G, c.x, c.y, K.fine, '¡AL HELADERO NO!'); burst(G, c.x, c.y, C.yellow, 10);
  }
  for (const s of G.shots) if (!s.dead && Math.abs(s.x - c.x) < CART.w / 2 + s.r && Math.abs(s.y - c.y) < CART.h / 2) {
    s.dead = true; if (!c.hit) { c.hit = true; c.hits++; fine(G, c.x, c.y, K.fine, '¡AL HELADERO NO!'); }
  }
  if (c.x < G.cfg.road.left - 40 || c.x > G.cfg.road.right + 40) c.on = false;
}

// ¿La carretilla está cruzando a la altura de `y`? (el jefe le cede el paso)
export function cartNear(G: Game, y: number, margin: number): boolean {
  const c = G.cart;
  return c.on && Math.abs(c.y - y) < margin && c.x > G.cfg.road.left - 20 && c.x < G.cfg.road.right + 20;
}

/* ---------- dibujo ---------- */

export function drawHazards(g: Gfx, G: Game): void {
  const s = G.slide, R = G.cfg.hazards?.rockslide;
  if (R && s.phase === 1) { // polvo y piedritas sobre los carriles que se van a cerrar
    for (const l of s.lanes) {
      const x = laneX(G.cfg, l);
      g.fillStyle = 'rgba(168,150,110,.35)'; g.fillRect(x - G.cfg.road.laneWidth / 2 + 4, 44, G.cfg.road.laneWidth - 8, 180);
      g.fillStyle = '#a8966e'; for (let i = 0; i < 6; i++) g.fillRect(x + Math.sin(G.t * 7 + i * 2) * 22, 50 + ((G.t * 200 + i * 37) % 170), 3, 3);
    }
  }
  const f = G.flock, B = G.cfg.hazards?.birds;
  if (B && f.on) {
    if (!f.scared) { g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(f.x, f.y + 30, B.w / 2, 10, 0, 0, 7); g.fill(); } // sombra
    g.strokeStyle = '#f4f6fb'; g.lineWidth = 1.6;
    for (let i = 0; i < 7; i++) { // gaviotas en V
      const bx = f.x + (i - 3) * 9, by = f.y - Math.abs(i - 3) * 6, flap = Math.sin(G.t * 16 + i) * 3;
      g.beginPath(); g.moveTo(bx - 5, by + flap); g.lineTo(bx, by + 2); g.lineTo(bx + 5, by + flap); g.stroke();
    }
  }
  const c = G.cart, K = G.cfg.hazards?.cart;
  if (K && c.on) drawCarretilla(g, c.x, c.y, c.dir);
}

// Carretilla de helados: amarilla, con franjas roja y azul, el toldo y el heladero empujando.
export function drawCarretilla(g: Gfx, x: number, y: number, dir: number): void {
  const w = CART.w, h = CART.h;
  g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(x - w / 2 + 2, y - h / 2 + 3, w, h);
  g.fillStyle = '#ffd400'; g.fillRect(x - w / 2, y - h / 2, w, h);
  g.fillStyle = '#d93b3b'; g.fillRect(x - w / 2, y - h / 2 + 4, w, 3);
  g.fillStyle = '#1f4fbf'; g.fillRect(x - w / 2, y + h / 2 - 6, w, 3);
  g.fillStyle = '#f4f6fb'; g.fillRect(x - w / 2 + 3, y - 2, w - 6, 4);
  g.fillStyle = '#15111d'; g.beginPath(); g.arc(x - w / 2 + 5, y + h / 2, 3, 0, 7); g.fill(); g.beginPath(); g.arc(x + w / 2 - 5, y + h / 2, 3, 0, 7); g.fill();
  const hx = x - dir * (w / 2 + 6); // el heladero, detrás de la carretilla
  g.fillStyle = '#f4f6fb'; g.fillRect(hx - 4, y - 3, 8, 10);
  g.fillStyle = '#e8c4a0'; g.beginPath(); g.arc(hx, y - 6, 3.4, 0, 7); g.fill();
  g.fillStyle = '#ffd400'; g.fillRect(hx - 4, y - 10, 8, 2.5); // gorra
  g.fillStyle = '#d93b3b'; g.font = FONT(4.5); g.textAlign = 'center'; g.fillText('DON FRÍO', x, y + 2);
}

// Manchas de las gaviotas: sobre el juego y bajo el HUD, se borran de a poco.
export function drawSplat(g: Gfx, G: Game): void {
  const s = G.splat;
  if (s.t <= 0) return;
  const a = clamp(s.t / s.max, 0, 1);
  for (const b of s.blots) {
    g.fillStyle = `rgba(236,238,228,${(0.92 * a).toFixed(3)})`; g.beginPath(); g.ellipse(b.x, b.y, b.r, b.r * 0.8, 0, 0, 7); g.fill();
    g.fillStyle = `rgba(200,204,190,${(0.9 * a).toFixed(3)})`;
    for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(b.x + Math.cos(i * 1.7) * b.r * 0.9, b.y + Math.sin(i * 1.7) * b.r * 0.8, b.r * 0.3, b.r * 0.25, 0, 0, 7); g.fill(); }
  }
}
