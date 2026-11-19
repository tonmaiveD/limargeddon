import { describe, expect, it } from 'vitest';
import { STAGES } from '../src/stages';
import { nightGlows, nightPosts } from '../src/core/night';
import { startPort, stepPort } from './harness/port';
import { seedRandom } from './harness/rng';

/* Noche en la Costa Verde (ADR 0065). */

const CV = STAGES['costa-verde'].cfg;

describe('noche', () => {
  it('la Costa Verde la declara y las demás etapas siguen de día', () => {
    expect(CV.night).toEqual({ dark: expect.any(Number), posts: expect.any(Number) });
    expect(CV.night!.dark).toBeGreaterThan(0); expect(CV.night!.dark).toBeLessThan(0.8);
    for (const [id, s] of Object.entries(STAGES)) if (id !== 'costa-verde') expect(s.cfg.night, id).toBeUndefined();
  });

  it('los postes van alternados a cada lado y bajan con la pista', () => {
    const G = startPort('normal', CV), every = CV.night!.posts!;
    const a = nightPosts(G, 0), b = nightPosts(G, 30);
    expect(a.length).toBeGreaterThan(4);
    expect(new Set(a.map((q) => q.side))).toEqual(new Set([-1, 1]));
    for (const q of a) expect(q.x).toBe(q.side < 0 ? CV.road.left - 12 : CV.road.right + 12);
    const lefts = a.filter((q) => q.side < 0).map((q) => q.y);
    expect(lefts[1] - lefts[0]).toBe(every);
    const rights = a.filter((q) => q.side > 0).map((q) => q.y);
    expect(rights.some((y) => lefts.some((l) => y - l === every / 2))).toBe(true); // alternados, no enfrentados
    // con 30 más de recorrido, cada poste está 30 más abajo
    expect(b.filter((q) => q.side < 0).map((q) => q.y)).toEqual(expect.arrayContaining(lefts.slice(0, -1).map((y) => y + 30)));
  });

  it('ilumina al Tico y a todo lo que hay que esquivar o recoger en la pista', () => {
    const restore = seedRandom(3);
    try {
      const G = startPort('normal', CV);
      for (let i = 0; i < 900 && !(G.traffic.length && G.obstacles.length); i++) stepPort(G, 1 / 60);
      expect(G.traffic.length).toBeGreaterThan(0); expect(G.obstacles.length).toBeGreaterThan(0);
      G.pickups.push({ k: 'turbo', x: 200, y: 300, r: 10, rot: 0 });
      const L = nightGlows(G, 0), near = (x: number, y: number) => L.some((l) => l.r && Math.hypot(l.x - x, l.y - y) < 1);
      expect(near(G.p.x, G.p.y)).toBe(true);
      expect(L.some((l) => l.beam && l.x === G.p.x)).toBe(true);
      for (const c of G.traffic) expect(near(c.x, c.y)).toBe(true);
      for (const o of G.obstacles) expect(near(o.x, o.y)).toBe(true);
      expect(near(200, 300)).toBe(true);
    } finally { restore(); }
  });

  it('solo dibuja: la pelea sigue igual calculando las luces o no', () => {
    const run = (night: boolean) => {
      const restore = seedRandom(9);
      try {
        const G = startPort('normal', CV); G.keys.up = true;
        for (let i = 0; i < 600; i++) {
          G.keys.left = i % 80 < 40; G.keys.right = !G.keys.left;
          stepPort(G, 1 / 60);
          if (night) nightGlows(G, i * 5);
        }
        return JSON.stringify({ t: G.t, p: G.p, b: G.b, traffic: G.traffic.map((c) => [c.x, c.y]), obs: G.obstacles.map((o) => [o.x, o.y]) });
      } finally { restore(); }
    };
    expect(run(true)).toBe(run(false));
  });
});
