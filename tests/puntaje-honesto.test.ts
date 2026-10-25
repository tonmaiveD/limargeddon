import { describe, expect, it } from 'vitest';
import { startPort, stepPort } from './harness/port';
import { seedRandom } from './harness/rng';
import { STAGES } from '../src/stages';
import { dmgBoss } from '../src/core/state';
import { scoreParts } from '../src/core/score';
import { summarize } from '../src/core/world';

/* Puntaje y resultados honestos (ADR 0036, auditoría N07 y N08). */

const DT = 1 / 60;
function withSeed<T>(seed: number, fn: () => T): T { const r = seedRandom(seed); try { return fn(); } finally { r(); } }

describe('Puntaje y resultados honestos', () => {
  it('el golpe final cuenta solo la vida que le quedaba al jefe', () => withSeed(1, () => {
    const G = startPort('normal', STAGES.centro.cfg);
    dmgBoss(G, 40, false); // 40 por la izquierda
    G.b.hp = 1;
    dmgBoss(G, 24, true); // muestra 24 (o más con el multiplicador), pero solo quitó 1
    expect(G.b.hp).toBe(0);
    expect(G.stats.effTotal).toBe(41);
    expect(G.stats.effRight).toBe(1);
    expect(G.stats.right).toBeGreaterThan(1); // la cuenta del prototipo no cambia (paridad)
    G.result = { win: true };
    expect(scoreParts(G).right).toBeCloseTo(1 / 41);
    expect(summarize(G).rightPct).toBe(2);
  }));

  it('el resumen de la ruta trae intentos, marea y peajes', () => withSeed(2, () => {
    const G = startPort('normal', STAGES['linea-amarilla'].cfg); stepPort(G, DT);
    G.tolls = 6; G.route.tideHits = 2; G.route.attempts = 2;
    const s = summarize(G);
    expect([s.tolls, s.tideHits, s.attemptsLeft]).toEqual([6, 2, 2]);
    expect(s.pay).toBe(Math.max(0, s.gross - s.fines - 6));
  }));
});
