import { describe, expect, it } from 'vitest';
import { startPort, stepPort } from './harness/port';
import { seedRandom } from './harness/rng';
import { STAGES } from '../src/stages';
import { gateClosed } from '../src/core/world';
import { fine } from '../src/core/state';
import type { DiffKey, ItemDef, StageConfig } from '../src/core/config';
import type { Game } from '../src/core/state';

/* Etapa 8 Panamericana (ADR 0025): garúa en oleadas, nivel de búsqueda, peajes con barreras y rompellantas. */

const DT = 1 / 60;
const pa = STAGES.panamericana.cfg;
function withSeed<T>(seed: number, fn: () => T): T { const r = seedRandom(seed); try { return fn(); } finally { r(); } }
function game(dk: DiffKey = 'normal', items: ItemDef[] = []): Game {
  const cfg = structuredClone(pa) as StageConfig; cfg.player.items = items;
  const G = startPort(dk, cfg);
  for (let i = 0; i < 400 && G.b.state === 'enter'; i++) stepPort(G, DT);
  G.p.pw.soat = 0; G.b.act = 99; G.traffic = []; G.obstacles = []; G.obsT = G.obsT.map(() => 99); G.trafficT = 99; return G;
}

describe('Etapa 8 Panamericana', () => {
  it('va después de la Vía Expresa', () => expect(pa.number).toBe(8));

  it('la garúa entra en oleadas y se despeja', () => withSeed(1, () => {
    const G = game(); G.fog.t = 0.01;
    let max = 0; for (let i = 0; i < 60 * 3; i++) { G.b.act = 99; stepPort(G, DT); max = Math.max(max, G.fog.k); }
    expect(max).toBeGreaterThan(0.9);
    G.fog.on = 0; G.fog.t = 99; for (let i = 0; i < 60 * 3; i++) { G.b.act = 99; stepPort(G, DT); }
    expect(G.fog.k).toBe(0);
  }));

  it('cada papeleta suma una estrella, trae un patrullero y las estrellas bajan solas', () => withSeed(2, () => {
    const G = game();
    fine(G, 0, 0, 50, 'PAPELETA'); fine(G, 0, 0, 50, 'PAPELETA');
    expect(G.stars).toBe(2);
    G.b.act = 99; stepPort(G, DT);
    expect(G.traffic.filter((c) => c.k === pa.wanted!.chaser && c.life !== undefined).length).toBe(2);
    for (let i = 0; i < 60 * (pa.wanted!.decay * 2 + 1); i++) { G.b.act = 99; G.traffic = []; stepPort(G, DT); }
    expect(G.stars).toBe(0);
  }));

  it('desde cuatro estrellas aparecen bloqueos', () => withSeed(3, () => {
    const G = game(); for (let i = 0; i < 4; i++) fine(G, 0, 0, 50, 'PAPELETA');
    G.b.act = 99; stepPort(G, DT);
    expect(G.obstacles.some((o) => pa.obstacles![o.i].k === pa.wanted!.block)).toBe(true);
  }));

  it('el peaje siempre deja alguna barrera abierta y romper una cerrada suma estrella', () => withSeed(4, () => {
    const G = game(), i = pa.obstacles!.findIndex((o) => o.k === 'peaje');
    G.obstacles.push({ i, x: 180, y: G.p.y, w: 260, h: 14, hit: false, ph: 0.2 });
    const ob = G.obstacles[0];
    for (let t = 0; t < 40; t++) { G.t = t * 0.13; expect([0, 1, 2, 3].some((l) => !gateClosed(G, ob, l))).toBe(true); }
    // busca un momento con el carril del Tico cerrado
    const lane = Math.floor((G.p.x - pa.road.left) / pa.road.laneWidth);
    while (!gateClosed(G, ob, lane)) G.t += 0.05;
    const hp = G.p.hp; G.b.act = 99; stepPort(G, DT);
    expect(G.p.hp).toBeLessThan(hp); expect(G.stars).toBe(1);
  }));

  it('el Brevete vigente perdona la primera estrella', () => withSeed(5, () => {
    const G = game('normal', [pa.rewards.item!]);
    fine(G, 0, 0, 50, 'PAPELETA'); expect(G.stars).toBe(0);
    fine(G, 0, 0, 50, 'PAPELETA'); expect(G.stars).toBe(1);
  }));

  it('los rompellantas aturden al Tico', () => withSeed(6, () => {
    const G = game();
    G.foes.push({ x: G.p.x, y: G.p.y, vx: 0, vy: 0, r: 6, dmg: 3, col: '#000', look: 'rompellantas', stun: 0.6 });
    G.b.act = 99; stepPort(G, DT);
    expect(G.p.stun).toBeGreaterThan(0.5);
  }));

  it('textos sin dos puntos, punto y coma ni guiones largos', () => {
    const texts = [pa.tip, pa.rewards.defeatTip!, pa.rewards.item!.desc, ...Object.values(pa.boss.lines).flat(), ...Object.values(pa.boss.quips),
      ...pa.boss.phases.map((p) => p.name), ...(pa.obstacles ?? []).map((o) => o.label ?? '')];
    for (const t of texts) expect(t).not.toMatch(/[:;—]/);
  });
});
