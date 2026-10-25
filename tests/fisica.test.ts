import { describe, expect, it } from 'vitest';
import { startPort, stepPort } from './harness/port';
import { seedRandom } from './harness/rng';
import { bot } from './harness/bot';
import { evitaCuerpo, rutaBot } from './harness/evita';
import { STAGES, STAGE_ORDER } from '../src/stages';
import { fuselage } from '../src/core/physics';
import { PROTOTYPE_CFG } from './harness/port';
import type { Game } from '../src/core/state';

/* Física sólida (ADR 0031): vehículos, bloques, jefe y avión no se superponen ni pasan uno por debajo del otro. */

const ov = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) =>
  Math.abs(a.x - b.x) < (a.w + b.w) / 2 - 1 && Math.abs(a.y - b.y) < (a.h + b.h) / 2 - 1;

function overlaps(G: Game): number {
  const defs = G.cfg.obstacles ?? [], cars = G.traffic.filter((c) => !(c.enter !== undefined && c.enter > 0) && c.y > -40 && c.y < 680);
  const blocks = G.obstacles.filter((o) => defs[o.i].kind === 'bloque' || defs[o.i].kind === 'peaje'), f = fuselage(G);
  let n = 0;
  for (let a = 0; a < cars.length; a++) for (let b = a + 1; b < cars.length; b++) if (ov(cars[a], cars[b])) n++;
  for (const c of cars) { for (const o of blocks) if (ov(c, o)) n++; if (f && ov(c, f)) n++; }
  if (!G.cfg.route && G.b.state !== 'enter') for (const o of blocks) if (defs[o.i].kind === 'bloque' && ov(G.b, o)) n++;
  return n;
}

describe('física sólida', () => {
  it('ninguna etapa deja vehículos o bloques superpuestos (menos de 1 cuadro en 1000)', () => {
    for (const id of STAGE_ORDER) {
      let frames = 0, bad = 0;
      for (const seed of [11, 29]) {
        const r = seedRandom(seed);
        try {
          const G = startPort('dificil', STAGES[id].cfg); G.fireMode = 'toque';
          for (let i = 0; i < 60 * 40 && G.mode === 'play'; i++) {
            bot(G as never, G.keys as never); evitaCuerpo(G, G.keys); rutaBot(G, G.keys);
            if (G.keys.cone) G.keys.cone = i % 6 === 0;
            stepPort(G, 1 / 60); frames++; bad += overlaps(G) ? 1 : 0;
          }
        } finally { r(); }
      }
      expect(bad / frames, id).toBeLessThan(0.001);
    }
  });

  it('la réplica del prototipo no usa la física sólida (paridad)', () => {
    expect(PROTOTYPE_CFG.traffic.solid).toBeUndefined();
    for (const id of STAGE_ORDER) expect(STAGES[id].cfg.traffic.solid, id).toBe(true);
  });
});
