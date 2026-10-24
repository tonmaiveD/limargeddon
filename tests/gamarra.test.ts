import { describe, expect, it } from 'vitest';
import { startPort, stepPort } from './harness/port';
import { seedRandom } from './harness/rng';
import { STAGES } from '../src/stages';
import type { DiffKey, ItemDef, StageConfig } from '../src/core/config';
import type { Game } from '../src/core/state';

/* Etapa 5 Gamarra (ADR 0022): cables que castigan acelerar, rollos de tela que caen del camión y el Rollo de tela como objeto. */

const DT = 1 / 60;
const ga = STAGES.gamarra.cfg;
function withSeed<T>(seed: number, fn: () => T): T { const r = seedRandom(seed); try { return fn(); } finally { r(); } }
function game(dk: DiffKey = 'normal', items: ItemDef[] = []): Game {
  const cfg = structuredClone(ga) as StageConfig; cfg.player.items = items;
  const G = startPort(dk, cfg);
  for (let i = 0; i < 400 && G.b.state === 'enter'; i++) stepPort(G, DT);
  G.p.pw.soat = 0; G.b.act = 99; G.obstacles = []; G.traffic = []; return G;
}
// pone los cables justo sobre el Tico y avanza un cuadro, acelerando o no
function underCables(G: Game, up: boolean): number {
  const i = ga.obstacles!.findIndex((o) => o.k === 'cables');
  const o = ga.obstacles![i];
  G.obstacles.push({ i, x: G.p.x, y: G.p.y, w: o.lanes * ga.road.laneWidth, h: o.h, hit: false }); G.obsT = G.obsT.map(() => 99);
  const hp = G.p.hp; G.keys.up = up; stepPort(G, DT); return hp - G.p.hp;
}

describe('Etapa 5 Gamarra', () => {
  it('va después de la Javier Prado', () => expect(ga.number).toBe(5));

  it('los cables solo hacen daño si se pasan acelerando', () => withSeed(1, () => {
    expect(underCables(game(), false)).toBe(0);
    expect(underCables(game(), true)).toBe(ga.obstacles!.find((o) => o.k === 'cables')!.dmg);
  }));

  it('los rollos caen desde atrás del camión, hacia abajo y en abanico', () => withSeed(2, () => {
    const G = game(), T = ga.boss.phases[0].throw!;
    G.b.state = 'teleThrow'; G.b.st = 0.01;
    for (let i = 0; i < 5 && !G.foes.length; i++) stepPort(G, DT);
    expect(G.foes.length).toBe(T.count);
    expect(G.foes.every((f) => f.look === 'rollo' && f.vy > 0 && f.y > G.b.y + G.b.h / 2 - 10)).toBe(true);
    const vx = G.foes.map((f) => f.vx);
    expect(Math.min(...vx)).toBeLessThan(0); expect(Math.max(...vx)).toBeGreaterThan(0);
  }));

  it('el Rollo de tela perdona el primer obstáculo', () => withSeed(3, () => {
    expect(underCables(game('normal', [ga.rewards.item!]), true)).toBe(0);
  }));

  it('textos sin dos puntos, punto y coma ni guiones largos', () => {
    const texts = [ga.tip, ga.rewards.defeatTip!, ga.rewards.item!.desc, ...Object.values(ga.boss.lines).flat(), ...Object.values(ga.boss.quips),
      ...ga.boss.phases.map((p) => p.name), ...ga.boss.phases.map((p) => p.throw?.text ?? ''), ...(ga.obstacles ?? []).map((o) => o.label ?? '')];
    for (const t of texts) expect(t).not.toMatch(/[:;—]/);
  });
});
