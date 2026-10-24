import { describe, expect, it } from 'vitest';
import { startPort, stepPort } from './harness/port';
import { seedRandom } from './harness/rng';
import { STAGES } from '../src/stages';
import { overlap } from '../src/core/util';
import { spawnSwarm } from '../src/core/world';
import type { DiffKey, ObstacleDef, StageConfig } from '../src/core/config';
import type { Game } from '../src/core/state';

const DT = 1 / 60;
const base = STAGES['san-isidro'].cfg;
function withSeed<T>(seed: number, fn: () => T): T { const r = seedRandom(seed); try { return fn(); } finally { r(); } }
function game(dk: DiffKey = 'normal', cfg: StageConfig = base): Game {
  const G = startPort(dk, cfg);
  for (let i = 0; i < 400 && G.b.state === 'enter'; i++) stepPort(G, DT);
  G.p.pw.soat = 0; return G;
}

describe('vehículos declarativos', () => {
  it('las motos Delivery reemplazan al scooter y zigzaguean desde el JSON', () => {
    const t = base.traffic.types.find((x) => x.k === 'delivery')!;
    expect(t.look?.kind).toBe('moto');
    expect(t.move?.zigzag).toBeTruthy();
    expect(base.traffic.types.some((x) => x.k === 'scooter')).toBe(false);
  });
});

describe('enjambres', () => {
  it('solo aparecen en las dificultades declaradas', () => withSeed(5, () => {
    expect(game('normal').swarmT.every((t) => !isFinite(t))).toBe(true);
    expect(game('dificil').swarmT.some((t) => isFinite(t))).toBe(true);
  }));

  it('llegan en grupo, con el tipo y la cantidad del JSON', () => withSeed(5, () => {
    const G = game('dificil'), S = base.swarms![0], before = G.traffic.length;
    spawnSwarm(G, 0);
    const added = G.traffic.slice(before);
    expect(added.length).toBeGreaterThanOrEqual(S.count[0]);
    expect(added.length).toBeLessThanOrEqual(S.count[1]);
    expect(added.every((c) => c.k === S.type)).toBe(true);
  }));
});

describe('obstáculos', () => {
  const hueco: ObstacleDef = { k: 'hueco', kind: 'hueco', style: 'crater', first: 999, every: [999, 999], lanes: 1, h: 20, col: '#15121a', dmg: 5 };
  const cfgConHueco = { ...base, obstacles: [...(base.obstacles ?? []), hueco] } as StageConfig;

  it('un bloque empuja al Tico y hace daño una sola vez', () => withSeed(7, () => {
    const G = game(); const o = base.obstacles![0];
    G.obstacles.push({ i: 0, x: G.p.x, y: G.p.y - 40, w: 55, h: o.h, hit: false });
    const hp0 = G.p.hp;
    for (let i = 0; i < 30; i++) stepPort(G, DT);
    expect(hp0 - G.p.hp).toBe(o.dmg);
    expect(G.obstacles.every((ob) => !overlap(G.p, ob))).toBe(true);
  }));

  it('un hueco hace daño al pasar, y con turbo se vuela', () => withSeed(7, () => {
    const G = game('normal', cfgConHueco), i = cfgConHueco.obstacles!.length - 1;
    G.obstacles.push({ i, x: G.p.x, y: G.p.y - 30, w: 55, h: 20, hit: false });
    const hp0 = G.p.hp;
    for (let k = 0; k < 20; k++) stepPort(G, DT);
    expect(hp0 - G.p.hp).toBe(5);
    G.p.pw.turbo = 3; const hp1 = G.p.hp;
    G.obstacles.push({ i, x: G.p.x, y: G.p.y - 30, w: 55, h: 20, hit: false });
    for (let k = 0; k < 20; k++) stepPort(G, DT);
    expect(G.p.hp).toBe(hp1);
  }));

  it('el tráfico no queda encima de un bloque', () => withSeed(9, () => {
    const G = game(); const o = base.obstacles![0];
    for (let n = 0; n < 60 * 30; n++) {
      if (n % 90 === 0) G.obstacles.push({ i: 0, x: base.road.left + 32 + 65 * (n / 90 % 4), y: -20, w: 55, h: o.h, hit: false });
      stepPort(G, DT);
      if (G.mode !== 'play') break;
      for (const ob of G.obstacles) for (const c of G.traffic) if (!(c.k === 'valet' && c.enter! > 0)) expect(overlap(c, ob)).toBe(false);
    }
  }));
});
