import { describe, expect, it } from 'vitest';
import { startPort, stepPort } from './harness/port';
import { seedRandom } from './harness/rng';
import { evitaCuerpo } from './harness/evita';
import { STAGES } from '../src/stages';
import type { StageConfig } from '../src/core/config';
import type { Game } from '../src/core/state';
import { SnakeBoss } from '../src/bosses/snake-boss';

/* Enrosque de la serpiente (ADR 0034): anillo alrededor del Tico con un solo hueco, en la fase final. */

const DT = 1 / 60;
const cv = STAGES['costa-verde'].cfg;
const K = cv.boss.phases.find((p) => p.id === 3)!.coil!;
function withSeed<T>(seed: number, fn: () => T): T { const r = seedRandom(seed); try { return fn(); } finally { r(); } }
function game(phase3 = true): Game {
  const G = startPort('normal', structuredClone(cv) as StageConfig);
  for (let i = 0; i < 400 && G.b.state === 'enter'; i++) stepPort(G, DT);
  stepPort(G, DT);
  calm(G);
  if (phase3) { G.b.hp = G.b.max * 0.3; stepPort(G, DT); calm(G); }
  return G;
}
// sin tráfico, peligros ni ataques de la cabeza: solo el enrosque
function calm(G: Game): void {
  G.p.pw.soat = 0; G.b.act = 99; G.b.hornT = 99; G.traffic = []; G.obstacles = []; G.obsT = G.obsT.map(() => 99); G.trafficT = 99;
  G.slide.t = 99; G.flock.t = 99; G.cart.t = 99; G.fog.t = 99; G.foes = [];
}
function coil(G: Game): void { G.coil.cd = 0.001; G.b.state = 'cruise'; stepPort(G, DT); }
function run(G: Game, secs: number, drive?: (G: Game) => void): void {
  for (let i = 0; i < secs * 60; i++) { G.keys.left = G.keys.right = G.keys.up = false; drive?.(G); G.b.act = 99; G.b.hornT = 99; stepPort(G, DT); }
}

describe('Enrosque de la serpiente', () => {
  it('solo existe en la fase final', () => withSeed(1, () => {
    const G = game(false);
    run(G, 6);
    expect(G.coil.st).toBe('off');
    expect(G.coil.cd).toBe(Infinity);
    const H = game();
    expect(H.b.phase).toBe(3);
    expect(H.coil.cd).toBeLessThanOrEqual(K.first);
  }));

  it('rodea al Tico con un auto por casillero y deja un hueco que da a la pista', () => withSeed(2, () => {
    const G = game(); coil(G);
    const c = G.coil;
    expect(c.st).toBe('tele');
    expect(c.slots.length).toBe(cv.boss.body!.count);
    run(G, K.tele);
    expect(c.st).toBe('hold');
    const segs = G.chains[0].segs;
    for (const s of segs) expect(Math.abs(Math.hypot(s.x - c.cx, s.y - c.cy) - c.r)).toBeLessThan(2);
    // la salida queda dentro de la pista y no más abajo de la línea de crucero
    const ex = c.cx + Math.cos(c.gap) * (c.r + 40), ey = c.cy + Math.sin(c.gap) * (c.r + 40);
    expect(ex).toBeGreaterThan(cv.road.left); expect(ex).toBeLessThan(cv.road.right);
    expect(ey).toBeLessThanOrEqual(Math.max(cv.player.y, c.cy) + 40);
  }));

  it('si el Tico se queda adentro, el anillo aprieta, quita vida y aturde', () => withSeed(3, () => {
    const G = game(); coil(G);
    const hp = G.p.hp;
    run(G, K.tele + K.hold + 0.1);
    expect(G.p.hp).toBe(hp - Math.round(K.dmg * G.d.dmgMult!));
    expect(G.lastHit).toBe('ENROSQUE');
    expect(G.coil.exposed).toBe(0);
    run(G, K.release + 0.1);
    expect(G.coil.st).toBe('off');
    expect(G.chains[0].segs.every((s) => !s.ang)).toBe(true);
  }));

  it('el anillo es sólido fuera del hueco', () => withSeed(4, () => {
    const G = game(); coil(G); run(G, K.tele);
    const c = G.coil, away = Math.cos(c.gap) > 0 ? 'left' : 'right';
    run(G, K.hold * 0.8, (g) => { g.keys[away] = true; });
    expect(Math.hypot(G.p.x - c.cx, G.p.y - c.cy)).toBeLessThan(c.r);
  }));

  it('al escapar por el hueco no hay daño y la cabeza queda expuesta y quieta', () => withSeed(5, () => {
    const G = game(); coil(G);
    const hp = G.p.hp;
    run(G, K.tele + K.hold, (g) => evitaCuerpo(g, g.keys));
    expect(G.p.hp).toBe(hp);
    expect(G.coil.st === 'release' || G.coil.st === 'off').toBe(true);
    expect(G.coil.exposed).toBeGreaterThan(0);
    const bx = G.b.x; G.b.tx = bx + 80; G.b.state = 'cruise';
    run(G, 0.5);
    expect(G.b.x).toBe(bx);
    expect(G.b.flash).toBe('hazard');
  }));

  it('con autos de menos el hueco crece, y bajo el mínimo no se enrosca', () => withSeed(6, () => {
    const G = game(); coil(G); const full = G.coil.half;
    const H = game(); H.chains[0].segs.length = K.minSegs; coil(H);
    expect(H.coil.half).toBeGreaterThan(full);
    const J = game(); J.chains[0].segs.length = K.minSegs - 1; coil(J);
    expect(J.coil.st).toBe('off');
  }));

  it('con la cabeza expuesta no hay claxon ni daño por contacto, solo empuje (auditoría N03)', () => withSeed(7, () => {
    const G = game(); coil(G);
    for (let i = 0; i < 60 * (K.tele + K.hold) && G.coil.exposed <= 0; i++) { G.keys.left = G.keys.right = G.keys.up = false; evitaCuerpo(G, G.keys); G.b.act = 99; stepPort(G, DT); }
    expect(G.coil.exposed).toBeGreaterThan(2.5);
    const hp = G.p.hp, b = G.b;
    G.b.hornT = 0.01; G.p.hitCd = 0; // claxon pendiente y Tico pegado a la cabeza
    for (let i = 0; i < 60 * 2.5; i++) {
      b.y = G.p.y; G.p.x = b.x - b.w / 2 - G.p.w / 2 + 3; G.p.hitCd = 0; // la cabeza pegada al Tico
      G.keys.left = G.keys.right = G.keys.up = false; G.b.act = 99; stepPort(G, DT);
    }
    expect(G.p.hp).toBe(hp);
    expect(G.p.stun).toBeLessThanOrEqual(0);
    expect(G.coil.exposed).toBeGreaterThan(0);
  }));

  it('romper un auto del anillo abre hueco en el mismo cuadro (auditoría N04)', () => withSeed(8, () => {
    const G = game(); coil(G); run(G, K.tele);
    const c = G.coil, main = G.chains[0], last = main.segs[main.segs.length - 1], a = c.slots[c.slots.length - 1];
    // se rompe el último auto de la fila (no suelta cola) y el Tico sale por su casillero
    last.hp = 1; G.shots.push({ k: 'cone', x: last.x, y: last.y, vx: 0, vy: 0, r: 6 });
    stepPort(G, DT);
    expect(main.segs.length).toBe(cv.boss.body!.count - 1);
    expect(c.slots.length).toBe(main.segs.length);
    expect(c.st).toBe('hold');
    G.p.x = c.cx + Math.cos(a) * (c.r + 30); G.p.y = c.cy + Math.sin(a) * (c.r + 30);
    const px = G.p.x, py = G.p.y;
    stepPort(G, DT);
    expect(Math.hypot(G.p.x - px, G.p.y - py)).toBeLessThan(15); // nada lo devolvió adentro
    expect(G.coil.exposed).toBeGreaterThan(0);
  }));

  it('con menos autos que el mínimo el anillo se deshace y no queda barrera (auditoría N04)', () => withSeed(9, () => {
    const G = game(); coil(G); run(G, K.tele);
    const main = G.chains[0], mid = main.segs[1];
    mid.hp = 1; G.shots.push({ k: 'cone', x: mid.x, y: mid.y, vx: 0, vy: 0, r: 6 });
    stepPort(G, DT);
    expect(main.segs.length).toBeLessThan(K.minSegs);
    expect(G.coil.st).toBe('release');
    run(G, K.release + 0.1);
    expect(G.coil.st).toBe('off');
    expect(G.chains.flatMap((ch) => [...ch.segs, ...(ch.lead ? [ch.lead] : [])]).every((s) => !s.ang)).toBe(true);
    expect(G.b.hp).toBeGreaterThan(0);
    void SnakeBoss;
  }));
});
