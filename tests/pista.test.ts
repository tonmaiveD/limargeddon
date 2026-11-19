import { describe, expect, it } from 'vitest';
import { STAGES } from '../src/stages';
import { ROAD_PAINT, roadPaint } from '../src/core/road';
import { drawFx } from '../src/core/fx';
import { startPort, stepPort } from './harness/port';
import { seedRandom } from './harness/rng';
import type { Gfx } from '../src/core/gfx';

/* Pista por distrito y efectos de contacto (ADR 0064). */

// un lienzo que no dibuja: acepta cualquier propiedad y cualquier llamada
const nullGfx = (): Gfx => new Proxy({}, { get: () => () => {}, set: () => true }) as unknown as Gfx;

describe('pista por distrito', () => {
  it('sin paleta en el JSON la pista queda como antes', () => {
    expect(ROAD_PAINT).toEqual({ asphalt: '#2a2632', wear: 1, line: '#f7f1ff', edge: '#ffe14d' });
    const cfg = { ...STAGES.centro.cfg, road: { ...STAGES.centro.cfg.road, paint: undefined } };
    expect(roadPaint(cfg)).toEqual(ROAD_PAINT);
  });

  it('las diez etapas declaran su paleta, todas distintas y legibles', () => {
    const ids = Object.keys(STAGES);
    expect(ids).toHaveLength(10);
    const tones = new Set<string>();
    for (const id of ids) {
      const P = STAGES[id].cfg.road.paint;
      expect(P, id).toBeDefined();
      for (const c of [P!.asphalt, P!.line, P!.edge]) expect(c, id).toMatch(/^#[0-9a-f]{6}$/);
      expect(P!.wear, id).toBeGreaterThanOrEqual(0); expect(P!.wear, id).toBeLessThanOrEqual(1.5);
      // el asfalto oscuro, para que el tráfico, el jefe y los avisos se lean encima
      const n = parseInt(P!.asphalt.slice(1), 16), lum = 0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
      expect(lum, id).toBeLessThan(70);
      tones.add(P!.asphalt);
    }
    expect(tones.size).toBe(10);
  });
});

describe('efectos de contacto y velocidad', () => {
  it('solo dibujan: la pelea sigue igual con o sin ellos', () => {
    const run = (fx: boolean) => {
      const restore = seedRandom(7);
      try {
        const G = startPort('normal', STAGES['san-isidro'].cfg); G.p.pw.turbo = 99; G.keys.up = true;
        const g = nullGfx();
        for (let i = 0; i < 600; i++) {
          G.keys.left = i % 60 < 30; G.keys.right = !G.keys.left;
          stepPort(G, 1 / 60);
          if (fx) drawFx(g, G);
        }
        return JSON.stringify({ t: G.t, p: G.p, b: G.b, hp: G.b.hp, shots: G.shots.length, traffic: G.traffic.map((c) => [c.x, c.y]) });
      } finally { restore(); }
    };
    expect(run(true)).toBe(run(false));
  });
});
