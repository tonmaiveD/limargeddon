import { describe, expect, it } from 'vitest';
import { startPort, stepPort } from './harness/port';
import { seedRandom } from './harness/rng';
import { STAGES } from '../src/stages';
import { dmgBoss, hurt } from '../src/core/state';
import { makeCar, summarize } from '../src/core/world';
import type { Game } from '../src/core/state';

/* Claridad del combate (ADR 0032): números de daño agrupados, qué te pegó, punto ciego y aviso de reversa. */

const DT = 1 / 60;
function withSeed<T>(seed: number, fn: () => T): T { const r = seedRandom(seed); try { return fn(); } finally { r(); } }
function game(id = 'centro'): Game {
  const G = startPort('normal', STAGES[id].cfg);
  for (let i = 0; i < 400 && G.b.state === 'enter'; i++) stepPort(G, DT);
  G.p.pw.soat = 0; G.b.act = 99; G.traffic = []; G.trafficT = 99; G.obsT = G.obsT.map(() => 99); G.floats = [];
  return G;
}

describe('claridad del combate', () => {
  it('los golpes seguidos al mismo lado se suman en un solo número', () => withSeed(1, () => {
    const G = game();
    dmgBoss(G, 12, true); dmgBoss(G, 12, true); dmgBoss(G, 12, true);
    const nums = G.floats.filter((f) => f.sum !== undefined);
    expect(nums.length).toBe(1);
    expect(nums[0].text).toBe('-' + 12 * 3 * STAGES.centro.cfg.boss.weakSideMult);
    G.floats.forEach((f) => { f.life = 0.5; }); dmgBoss(G, 12, false);
    expect(G.floats.filter((f) => f.sum !== undefined).length).toBe(2); // pasado el instante, número nuevo
  }));

  it('cada golpe al Tico dice qué lo golpeó, y resultados guarda el último', () => withSeed(2, () => {
    const G = game(), c = makeCar(STAGES.centro.cfg.traffic.types.find((t) => t.k === 'combi')!, G.p.x, G.p.y);
    G.traffic = [c]; c.vy = 0; G.p.hitCd = 0; stepPort(G, DT);
    expect(G.floats.some((f) => /COMBI/.test(f.text))).toBe(true);
    hurt(G, 5, 'CHORRO');
    expect(G.lastHit).toBe('CHORRO');
    G.result = { win: false }; expect(summarize(G).lastHit).toBe('CHORRO');
  }));

  it('la marca del punto ciego dura hasta el tercer golpe por la derecha', () => withSeed(3, () => {
    const G = game();
    dmgBoss(G, 1, false); dmgBoss(G, 1, true); dmgBoss(G, 1, true);
    expect(G.stats.rightHits).toBe(2);
    dmgBoss(G, 1, true); expect(G.stats.rightHits).toBe(3);
  }));

  it('la reversa del Q8 en Difícil ya no llega casi sin aviso', () => {
    const P = STAGES['san-isidro'].cfg.boss.phases.find((p) => p.attack === 'reverse')!;
    expect(P.teleOff).toBeGreaterThanOrEqual(0.35);
  });
});
