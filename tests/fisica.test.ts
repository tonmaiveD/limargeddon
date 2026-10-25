import { describe, expect, it } from 'vitest';
import { startPort, stepPort } from './harness/port';
import { seedRandom } from './harness/rng';
import { bot } from './harness/bot';
import { evitaCuerpo, rutaBot } from './harness/evita';
import { STAGES, STAGE_ORDER } from '../src/stages';
import { fuselage } from '../src/core/physics';
import { PROTOTYPE_CFG } from './harness/port';
import type { Game } from '../src/core/state';
import { makeCar } from '../src/core/world';
import { laneX } from '../src/core/state';

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

  it('los autos no se apilan detrás de uno lento: adelantan por un carril libre', () => {
    const r = seedRandom(5);
    try {
      const G = startPort('normal', STAGES.centro.cfg);
      for (let i = 0; i < 400 && G.b.state === 'enter'; i++) stepPort(G, 1 / 60);
      G.traffic = []; G.trafficT = 99; G.obstacles = []; G.obsT = G.obsT.map(() => 99); G.swarmT = G.swarmT.map(() => 99);
      G.p.x = laneX(G.cfg, 3); G.p.pw.soat = 999; G.b.act = 99; G.b.x = G.b.tx = laneX(G.cfg, 3);
      const types = STAGES.centro.cfg.traffic.types, slow = makeCar(types.find((t) => t.k === 'patrullero')!, laneX(G.cfg, 0), 330);
      slow.vy = 100; G.traffic.push(slow);
      for (let k = 0; k < 5; k++) { const c = makeCar(types.find((t) => t.k === 'taxi')!, laneX(G.cfg, 0), 250 - k * 60); c.vy = 170; G.traffic.push(c); }
      let worst = 0;
      for (let i = 0; i < 60 * 4; i++) {
        G.b.act = 99; stepPort(G, 1 / 60);
        const lane0 = G.traffic.filter((c) => Math.abs(c.x - laneX(G.cfg, 0)) < 20 && c.y > 0 && c.y < 640).sort((a, b) => a.y - b.y);
        let run = 1, best = 1;
        for (let j = 1; j < lane0.length; j++) { run = lane0[j].y - lane0[j - 1].y - (lane0[j].h + lane0[j - 1].h) / 2 < 12 ? run + 1 : 1; best = Math.max(best, run); }
        if (i > 60 * 2) worst = Math.max(worst, best); // a los 2 s ya tuvieron tiempo de adelantar
      }
      expect(worst).toBeLessThanOrEqual(2);
    } finally { r(); }
  });

  it('la réplica del prototipo no usa la física sólida (paridad)', () => {
    expect(PROTOTYPE_CFG.traffic.solid).toBeUndefined();
    for (const id of STAGE_ORDER) expect(STAGES[id].cfg.traffic.solid, id).toBe(true);
  });
});
