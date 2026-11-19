import { H } from './constants';
import type { Gfx } from './gfx';
import type { Game } from './state';
import { reduceMotion } from './util';

/*
 * Efectos de contacto y velocidad (ADR 0064, G5): humo de escape, marcas de frenada al girar, chispas cuando el Tico se
 * golpea o roza, y líneas de velocidad con Turbo. Solo dibujo: leen el estado de la pelea y nunca lo cambian, así la
 * simulación, la paridad y el balance quedan igual. Sus partículas viven aquí, aparte del estado, y avanzan con el
 * tiempo de la pelea (en pausa o en el congelamiento de impacto no se mueven). Van en la capa del asfalto, debajo del
 * tráfico, del jefe, de sus avisos y de los proyectiles, así nunca los tapan. Con movimiento reducido no hay líneas de
 * velocidad y hay menos humo y chispas.
 */

interface Puff { x: number; y: number; r: number; life: number; max: number }
interface Mark { x: number; y: number; life: number }
interface Spark { x: number; y: number; vx: number; vy: number; life: number }
interface Fx { t: number; hp: number; puffT: number; puffs: Puff[]; marks: Mark[]; sparks: Spark[]; streaks: number[] }

const store = new WeakMap<Game, Fx>();
// su propio azar: Math.random es el de la simulación, y gastarlo al dibujar cambiaría la pelea
let seed = 0x9e3779b9;
const rand = () => { seed = (Math.imul(seed ^ (seed >>> 15), 0x2c1b3c6d) + 0x6d2b79f5) >>> 0; return seed / 4294967296; };
const MAX_PUFFS = 24, MAX_MARKS = 80, MAX_SPARKS = 28, MARK_LIFE = 1.4;

function state(G: Game): Fx {
  let f = store.get(G);
  if (!f) { f = { t: G.t, hp: G.p.hp, puffT: 0, puffs: [], marks: [], sparks: [], streaks: [] }; store.set(G, f); }
  return f;
}

// Avanza las partículas con el tiempo de la pelea y crea las nuevas según lo que hace el Tico.
function step(G: Game, f: Fx): void {
  const dt = Math.min(0.05, Math.max(0, G.t - f.t)); f.t = G.t;
  const p = G.p, k = G.keys, down = G.speed * dt; // lo que baja la pista en este cuadro
  const hit = p.hp < f.hp; f.hp = p.hp;
  if (dt <= 0) return;
  const play = G.mode === 'play' && !G.ending, ground = p.air <= 0;
  // humo de escape: más seguido acelerando o con Turbo
  if (play) {
    f.puffT -= dt;
    const every = (p.pw.turbo > 0 ? 0.05 : k.up ? 0.08 : 0.18) * (reduceMotion ? 2 : 1);
    if (f.puffT <= 0 && f.puffs.length < MAX_PUFFS) {
      f.puffT = every;
      f.puffs.push({ x: p.x - 6 + rand() * 3, y: p.y + p.h / 2 + 2, r: 2.5, life: 0.45, max: 0.45 });
    }
  }
  for (const q of f.puffs) { q.life -= dt; q.y += down * 0.8 + 18 * dt; q.r += 9 * dt; q.x += (rand() - 0.5) * 6 * dt; }
  f.puffs = f.puffs.filter((q) => q.life > 0);
  // marcas de frenada: al girar en el piso, las llantas traseras dejan dos rayas que bajan con la pista
  const turning = play && ground && (k.left || k.right || Math.abs(p.vx) > 120);
  if (turning && f.marks.length < MAX_MARKS) {
    const rear = p.y + p.h * 0.32;
    f.marks.push({ x: p.x - p.w * 0.36, y: rear, life: MARK_LIFE }, { x: p.x + p.w * 0.36, y: rear, life: MARK_LIFE });
  }
  for (const m of f.marks) { m.life -= dt; m.y += down; }
  f.marks = f.marks.filter((m) => m.life > 0 && m.y < H + 20);
  // chispas: cuando el Tico pierde vida, por un golpe o un roce
  if (hit && play) {
    const n = reduceMotion ? 4 : 10;
    for (let i = 0; i < n && f.sparks.length < MAX_SPARKS; i++) {
      const a = rand() * Math.PI * 2, v = 80 + rand() * 120;
      f.sparks.push({ x: p.x + (rand() - 0.5) * p.w, y: p.y + (rand() - 0.5) * p.h * 0.6, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.35 });
    }
  }
  for (const s of f.sparks) { s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt + down; s.vy += 260 * dt; }
  f.sparks = f.sparks.filter((s) => s.life > 0);
  // líneas de velocidad con Turbo: a los costados de la pista, bajando rápido
  if (play && p.pw.turbo > 0 && !reduceMotion) {
    if (f.streaks.length < 10) f.streaks.push(rand() * H);
    f.streaks = f.streaks.map((y) => y + (down * 2.4 + 300 * dt)).filter((y) => y < H + 60);
  } else f.streaks = [];
}

export function drawFx(g: Gfx, G: Game): void {
  const f = state(G);
  step(G, f);
  // marcas de frenada
  g.fillStyle = '#0b0910';
  for (const m of f.marks) { g.globalAlpha = 0.32 * Math.min(1, m.life / MARK_LIFE * 1.6); g.fillRect(m.x - 1.5, m.y - 3, 3, 7); }
  // humo
  g.fillStyle = '#cfc8da';
  for (const q of f.puffs) { g.globalAlpha = 0.24 * (q.life / q.max); g.beginPath(); g.arc(q.x, q.y, q.r, 0, 7); g.fill(); }
  // chispas
  for (const s of f.sparks) {
    g.globalAlpha = Math.min(1, s.life * 4); g.fillStyle = s.life > 0.2 ? '#fff3b0' : '#ff9d2e';
    g.fillRect(s.x - 1, s.y - 1, 2.5, 2.5);
  }
  // líneas de velocidad, en los costados del asfalto, lejos del centro donde va la acción
  if (f.streaks.length) {
    const L = G.cfg.road.left, R = G.cfg.road.right;
    g.fillStyle = '#ffffff';
    f.streaks.forEach((y, i) => {
      const x = i % 2 ? R - 10 - (i % 3) * 6 : L + 8 + (i % 3) * 6;
      g.globalAlpha = 0.22; g.fillRect(x, y - 46, 2, 46);
    });
  }
  g.globalAlpha = 1;
}
