import { describe, expect, it } from 'vitest';
import { startPort, stepPort } from './harness/port';
import { seedRandom } from './harness/rng';
import { bot } from './harness/bot';
import { STAGES } from '../src/stages';

const DT = 1 / 60;
const ce = STAGES.centro.cfg;
function withSeed<T>(seed: number, fn: () => T): T { const r = seedRandom(seed); try { return fn(); } finally { r(); } }

describe('etapa Centro', () => {
  it('está registrada como etapa 3 con el Rochabús y sus peligros', () => {
    expect(ce.number).toBe(3);
    expect(ce.boss.title).toBe('El Rochabús');
    expect(ce.obstacles!.map((o) => o.k)).toEqual(['reja', 'carretilla', 'desvio', 'marcha']);
  });

  it('una pelea completa con el bot termina sin errores', () => withSeed(31, () => {
    const G = startPort('normal', ce);
    for (let i = 0; i < 60 * 300 && G.mode === 'play'; i++) { bot(G as never, G.keys); stepPort(G, DT); }
    expect(G.mode).toBe('over');
  }));
});

describe('chorro del jefe', () => {
  it('apunta al carril del Tico, lo empuja de lado y le hace daño una sola vez', () => withSeed(2, () => {
    const G = startPort('normal', ce);
    for (let i = 0; i < 400 && G.b.state === 'enter'; i++) stepPort(G, DT);
    G.b.act = 99; G.p.pw.soat = 0; G.p.hp = 100;
    G.b.state = 'teleJet'; G.b.st = 0.01; G.b.tx = G.b.x; G.b.jetHit = false;
    G.p.x = G.b.x + 4; G.p.y = 500;
    const x0 = G.p.x;
    for (let i = 0; i < 60; i++) { G.p.y = 500; stepPort(G, DT); }
    expect(G.p.hp).toBe(100 - ce.boss.phases[0].jet!.dmg);
    expect(G.p.x).toBeGreaterThan(x0 + 20);
  }));
});

describe('el chorro no llega a las personas', () => {
  it('se corta en el primer grupo de peatones que tenga delante', () => withSeed(8, () => {
    const G = startPort('normal', ce), i = ce.obstacles!.findIndex((o) => o.k === 'marcha');
    for (let k = 0; k < 400 && G.b.state === 'enter'; k++) stepPort(G, DT);
    G.b.act = 99; G.b.state = 'jet'; G.b.st = 1; G.b.jetHit = false;
    G.obstacles.push({ i, x: G.b.x, y: 400, w: 185, h: 16, hit: false, bx: G.b.x, ph: 0 });
    G.p.x = G.b.x; G.p.y = 540; G.p.pw.soat = 0; G.p.hp = 100;
    stepPort(G, DT);
    expect(G.p.hp).toBe(100); // el Tico detrás de la marcha queda a salvo
  }));
});

describe('marchas que se desplazan', () => {
  it('el obstáculo con vaivén se mueve de lado sin salirse de la pista', () => withSeed(4, () => {
    const G = startPort('normal', ce), i = ce.obstacles!.findIndex((o) => o.k === 'marcha');
    for (let k = 0; k < 400 && G.b.state === 'enter'; k++) stepPort(G, DT);
    G.obsT[i] = 0.001; stepPort(G, DT);
    const ob = G.obstacles.find((o) => o.i === i)!;
    const xs: number[] = [];
    for (let k = 0; k < 120; k++) { stepPort(G, DT); xs.push(ob.x); }
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(5);
    for (const x of xs) { expect(x - ob.w / 2).toBeGreaterThanOrEqual(ce.road.left - 0.01); expect(x + ob.w / 2).toBeLessThanOrEqual(ce.road.right + 0.01); }
  }));
});
