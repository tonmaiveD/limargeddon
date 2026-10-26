import { H, W } from './constants';
import { drawCarretilla } from './hazards';
import { BODY, FONT, type Gfx } from './gfx';
import { burst, floatText, laneX, type Game } from './state';
import { C, clamp, hash } from './util';
import { Sfx } from './audio/sfx';

/*
 * Animaciones de cierre (ADR 0038): al ganar una etapa con `ending` en su JSON, antes de los resultados se juega una
 * escena corta que un toque salta. "carretilla": la carretilla Don Frío cruza la meta antes que el Tico. "carguero":
 * el Tico dentro del avión, con Lima alejándose por las ventanillas. Mientras dura, el mundo no se simula.
 */

export function startEnding(G: Game): void {
  G.ending = { t: 0, crossed: false };
  G.announce = null; G.bubble = null; G.hint = null; // la pelea terminó: sin carteles de fase, globos ni ayudas
  if (G.cfg.ending?.kind === 'carretilla') {
    // la pista queda libre: solo la carretilla, el Tico y la meta
    G.traffic = []; G.foes = []; G.obstacles = []; G.shots = []; G.pickups = []; G.chains = []; G.allies = [];
    G.cart.on = false; G.b.y = -900;
  }
}

// Un paso del cierre. Devuelve true cuando terminó.
export function updateEnding(G: Game, dt: number): boolean {
  const E = G.cfg.ending!, e = G.ending!, p = G.p;
  e.t += dt;
  for (const q of G.parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.96; q.vy *= 0.96; q.life -= dt; }
  G.parts = G.parts.filter((q) => q.life > 0);
  for (const f of G.floats) { f.y -= 40 * dt; f.life -= dt; } G.floats = G.floats.filter((f) => f.life > 0);
  if (E.kind === 'carretilla') {
    const cart = cartPos(G), line = finishY(e.t);
    p.x += (laneX(G.cfg, 2) - p.x) * Math.min(1, dt * 3); p.y = Math.max(p.y - 95 * dt, 330);
    if (!e.crossed && cart.y < line) {
      e.crossed = true; Sfx.play('pickup');
      for (const col of [C.yellow, '#d93b3b', '#1f4fbf', '#fff']) burst(G, cart.x, line, col, 14, 220);
      floatText(G, W / 2, line - 30, '¡DON FRÍO LLEGA PRIMERO!', C.yellow, 13);
    }
  }
  return e.t >= E.dur;
}

const finishY = (t: number) => Math.min(250, -20 + 210 * t);
const cartPos = (G: Game) => ({ x: laneX(G.cfg, 1), y: H + 40 - 185 * G.ending!.t });

// Lo que se dibuja sobre la pista (capa de entidades): la meta y la carretilla subiendo.
export function drawEndingWorld(g: Gfx, G: Game): void {
  if (!G.ending || G.cfg.ending?.kind !== 'carretilla') return;
  const { left, right } = G.cfg.road, y = finishY(G.ending.t), sq = 10;
  for (let x = left, i = 0; x < right; x += sq, i++) for (let r = 0; r < 2; r++) {
    g.fillStyle = (i + r) % 2 ? '#15111d' : '#f4f6fb'; g.fillRect(x, y - sq + r * sq, Math.min(sq, right - x), sq);
  }
  g.fillStyle = '#d93b3b'; g.fillRect(left - 8, y - 46, 6, 56); g.fillRect(right + 2, y - 46, 6, 56);
  g.fillStyle = '#ffd400'; g.fillRect(left - 8, y - 52, right - left + 16, 14);
  g.fillStyle = '#15111d'; g.font = FONT(8); g.textAlign = 'center'; g.fillText('META · AGUA DULCE', W / 2, y - 42);
  const c = cartPos(G);
  g.rigid(c.x, c.y, () => { g.save(); g.translate(c.x, c.y); g.rotate(-Math.PI / 2); drawCarretilla(g, 0, 0, 1); g.restore(); });
}

// Lo que va encima de todo (capa de interfaz): el interior del carguero, el texto final y el aviso para saltar.
export function drawEndingUI(g: Gfx, G: Game, drawTico: (g: Gfx, box: { x: number; y: number; w: number; h: number }) => void): void {
  const e = G.ending, E = G.cfg.ending;
  if (!e || !E) return;
  if (E.kind === 'carguero') drawCargoBay(g, G, drawTico);
  const a = clamp((e.t - (E.kind === 'carguero' ? 1.2 : 2.2)) * 1.5, 0, 1);
  if (a > 0) {
    g.globalAlpha = a; g.font = FONT(15); g.textAlign = 'center';
    g.fillStyle = 'rgba(14,10,22,.8)'; g.roundRect(20, H - 150, W - 40, 44, 8); g.fill();
    g.fillStyle = C.yellow; g.fillText(E.text, W / 2, H - 122); g.globalAlpha = 1;
  }
  if (e.t > 0.8) { g.globalAlpha = 0.7; g.fillStyle = '#fff'; g.font = BODY(700, 11); g.textAlign = 'center'; g.fillText('Toca para seguir', W / 2, H - 70); g.globalAlpha = 1; }
}

function drawCargoBay(g: Gfx, G: Game, drawTico: (g: Gfx, box: { x: number; y: number; w: number; h: number }) => void): void {
  const t = G.ending!.t;
  g.fillStyle = '#1c1824'; g.fillRect(-200, -50, W + 400, H + 100);
  g.fillStyle = '#2b2535'; g.fillRect(70, -50, W - 140, H + 100); // piso de carga
  g.fillStyle = '#3a3346'; for (let y = 10 + ((t * 6) % 40); y < H; y += 40) g.fillRect(70, y, W - 140, 3); // costillas del fuselaje
  g.fillStyle = '#ffe14d'; for (let y = 30; y < H; y += 80) { g.fillRect(78, y, 4, 24); g.fillRect(W - 82, y, 4, 24); } // rieles
  g.fillStyle = '#4a4452'; g.font = FONT(9); g.textAlign = 'center'; g.fillText('GALAXIA CARGO · BODEGA', W / 2, 60);
  // ventanillas: Lima de noche, cada vez más chica y más abajo
  for (const [wx, wy] of [[38, 190], [38, 330], [W - 38, 190], [W - 38, 330]]) {
    const r = 26, k = 1 / (1 + t * 0.7);
    g.fillStyle = '#0d1b3a'; g.beginPath(); g.arc(wx, wy, r, 0, 7); g.fill();
    for (let i = 0; i < 26; i++) {
      const lx = (hash(i * 3.3 + wx) - 0.5) * 2 * r * k, ly = r * 0.25 + (hash(i * 7.1 + wy) * r * 0.9 + t * 6) * k;
      if (lx * lx + ly * ly > (r - 3) * (r - 3)) continue;
      g.fillStyle = i % 3 ? '#ffd27a' : '#fff'; g.fillRect(wx + lx, wy + ly, 2 * k + 0.6, 2 * k + 0.6);
    }
    g.strokeStyle = '#8a8f99'; g.lineWidth = 4; g.beginPath(); g.arc(wx, wy, r, 0, 7); g.closePath(); g.stroke();
  }
  // el Tico amarrado en la bodega, con una luz roja que parpadea
  g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(W / 2 - 18, 300, 40, 64);
  drawTico(g, { x: W / 2, y: 330, w: 32, h: 56 });
  // las correas cruzan el Tico, que es una imagen, así que van en la capa de encima (ADR 0045)
  const o = g.over ?? g;
  o.fillStyle = '#6c717c'; o.fillRect(W / 2 - 26, 316, 52, 3); o.fillRect(W / 2 - 26, 344, 52, 3);
  if (Math.floor(t * 2) % 2) { g.fillStyle = '#ff3355'; g.beginPath(); g.arc(W / 2, 110, 5, 0, 7); g.fill(); }
}
