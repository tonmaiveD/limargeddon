import { describe, expect, it } from 'vitest';
import { loadPrototype } from './harness/prototype';
import { startPort, stepPort } from './harness/port';
import { seedRandom } from './harness/rng';
import { bot } from './harness/bot';

const DT = 1 / 60;
const snap = (G: any) => [G.t, G.b.hp, G.p.hp, G.b.x, G.b.y, G.b.state, G.b.phase, G.p.x, G.p.y, G.traffic.length, G.shots.length, G.pickups.length, G.fines, G.bonus, G.stats.right];

// Misma semilla, mismo bot, mismo dt: el port debe reproducir el prototipo cuadro a cuadro.
describe('paridad con prototipo/san-isidro-v3.html', () => {
  for (const dk of ['facil', 'normal', 'dificil'] as const) {
    for (const seed of [1, 7, 42]) {
      it(`${dk}, semilla ${seed}: trayectoria idéntica`, () => {
        const proto = loadPrototype();
        let restore = seedRandom(seed);
        const a: unknown[][] = [];
        try {
          proto.start(dk);
          for (let i = 0; i < 60 * 180 && proto.G.mode === 'play'; i++) { bot(proto.G, proto.keys as any); proto.update(DT); a.push(snap(proto.G)); }
        } finally { restore(); }
        restore = seedRandom(seed);
        const b: unknown[][] = [];
        try {
          const G = startPort(dk);
          for (let i = 0; i < 60 * 180 && G.mode === 'play'; i++) { bot(G, G.keys); stepPort(G, DT); b.push(snap(G)); }
        } finally { restore(); }
        console.log(dk, seed, 'cuadros', a.length, 'gana', (a.at(-1) as any[])[1] === 0, 't', (a.at(-1) as any[])[0].toFixed(1));
        expect(a.length).toBeGreaterThan(600);
        expect(b.length).toBe(a.length);
        for (let i = 0; i < a.length; i++) if (JSON.stringify(a[i]) !== JSON.stringify(b[i])) {
          expect({ frame: i, port: b[i] }).toEqual({ frame: i, port: a[i] });
        }
      });
    }
  }
});
