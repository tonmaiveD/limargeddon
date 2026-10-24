import { beforeEach, describe, expect, it } from 'vitest';
import { startPort, stepPort } from './harness/port';
import { seedRandom } from './harness/rng';
import { STAGES, stageNumber } from '../src/stages';
import { makeCar, summarize, updateWorld } from '../src/core/world';
import { exportFights, fightStats, recordFight, settleFight } from '../src/core/save';
import type { StageConfig } from '../src/core/config';

/* Correcciones de la auditoría de octubre de 2026: recompensa por tipo, ayudas del tutorial y registro con contexto. */

const DT = 1 / 60;
function withSeed<T>(seed: number, fn: () => T): T { const r = seedRandom(seed); try { return fn(); } finally { r(); } }
function memStorage(): void {
  const mem = new Map<string, string>();
  (globalThis as any).localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => mem.set(k, v) };
}

describe('recompensa por tipo de vehículo', () => {
  it('ciclistas y Delivery no pagan, los autos sí', () => withSeed(3, () => {
    const cfg = STAGES.miraflores.cfg, G = startPort('normal', cfg);
    const kill = (k: string) => {
      const c = makeCar(cfg.traffic.types.find((t) => t.k === k)!, 180, 200); c.hp = 0;
      G.traffic = [c]; const before = G.bonus; updateWorld(G, DT); return G.bonus - before;
    };
    expect(kill('ciclista')).toBe(0);
    expect(kill('delivery')).toBe(0);
    const car = cfg.traffic.types.find((t) => !t.invulnerable && t.killBonus === undefined)!;
    expect(kill(car.k)).toBe(cfg.traffic.killBonus);
  }));

  it('en ninguna etapa se cobra por sacar a un ciclista o a un Delivery', () => {
    for (const { cfg } of Object.values(STAGES))
      for (const t of cfg.traffic.types) if (t.k === 'ciclista' || t.k === 'delivery') expect(t.killBonus).toBe(0);
  });
});

describe('ayudas del tutorial', () => {
  it('aparecen en orden en Miraflores y se apagan solas', () => withSeed(4, () => {
    const G = startPort('normal', STAGES.miraflores.cfg as StageConfig), seen: string[] = [];
    for (let i = 0; i < 60 * 12 && !G.result; i++) { stepPort(G, DT); if (G.hint && seen.at(-1) !== G.hint.text) seen.push(G.hint.text); }
    expect(seen).toEqual(STAGES.miraflores.cfg.hints!.map((h) => h.text));
    expect(G.hint).toBeNull();
  }));

  it('los textos no usan dos puntos, punto y coma ni guiones largos', () => {
    for (const { cfg } of Object.values(STAGES)) for (const h of cfg.hints ?? []) expect(h.text).not.toMatch(/[:;—]/);
  });
});

describe('resultados y registro', () => {
  beforeEach(memStorage);

  it('el resumen informa la vida que le quedó al jefe', () => withSeed(6, () => {
    const G = startPort('normal', STAGES.centro.cfg);
    G.b.hp = Math.round(G.b.max * 0.234);
    expect(summarize(G).bossPct).toBe(24);
  }));

  it('la mediana usa el mismo truncado que la pantalla y promedia con número par', () => {
    recordFight({ stage: 'centro', dk: 'normal', win: true, t: 112.96 });
    expect(fightStats('centro', 'normal').median).toBe(112.9);
    recordFight({ stage: 'centro', dk: 'normal', win: true, t: 100 });
    expect(fightStats('centro', 'normal').median).toBeCloseTo(106.45);
    recordFight({ stage: 'centro', dk: 'normal', win: true, t: 130 });
    expect(fightStats('centro', 'normal').median).toBe(112.9);
  });

  it('cada pelea guarda lo cobrado y si era repetida', () => {
    settleFight({ stage: 'miraflores', dk: 'normal', win: true, t: 70, gross: 700, fines: 100 }, 1, 600, stageNumber);
    settleFight({ stage: 'miraflores', dk: 'normal', win: true, t: 70, gross: 700, fines: 100 }, 1, 600, stageNumber);
    const [a, b] = exportFights();
    expect([a.earned, a.replay, b.earned, b.replay]).toEqual([600, false, 300, true]);
    expect(a.fines).toBe(100);
  });
});
