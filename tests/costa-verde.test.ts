import { describe, expect, it } from 'vitest';
import { startPort, stepPort } from './harness/port';
import { seedRandom } from './harness/rng';
import { STAGES } from '../src/stages';
import { roadWarp } from '../src/core/road';
import { scareFlock } from '../src/core/hazards';
import type { DiffKey, ItemDef, StageConfig } from '../src/core/config';
import type { Game } from '../src/core/state';

/* Etapa 9 Costa Verde (ADR 0026): pista curva, derrumbes, gaviotas, la carretilla Don Frío y la serpiente de doble fila. */

const DT = 1 / 60;
const cv = STAGES['costa-verde'].cfg;
function withSeed<T>(seed: number, fn: () => T): T { const r = seedRandom(seed); try { return fn(); } finally { r(); } }
function game(dk: DiffKey = 'normal', items: ItemDef[] = []): Game {
  const cfg = structuredClone(cv) as StageConfig; cfg.player.items = items;
  const G = startPort(dk, cfg);
  for (let i = 0; i < 400 && G.b.state === 'enter'; i++) stepPort(G, DT);
  stepPort(G, DT); // la serpiente arma su cuerpo al salir de la entrada
  G.p.pw.soat = 0; G.b.act = 99; G.traffic = []; G.obstacles = []; G.obsT = G.obsT.map(() => 99); G.trafficT = 99;
  G.slide.t = 99; G.flock.t = 99; G.cart.t = 99; G.fog.t = 99;
  return G;
}
const freeze = (G: Game) => { G.b.act = 99; G.slide.t = Math.max(G.slide.t, 99); G.flock.t = Math.max(G.flock.t, 99); };

describe('Etapa 9 Costa Verde', () => {
  it('es la última etapa y la pista es curva', () => {
    expect(cv.number).toBe(9);
    const w = roadWarp(cv, 0)!;
    const xs = Array.from({ length: 20 }, (_, i) => w(i * 32));
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(10);
    expect(roadWarp(STAGES.centro.cfg, 0)).toBeNull();
  });

  it('la serpiente arma su cuerpo y, al romper un segmento del medio, se parte en dos', () => withSeed(1, () => {
    const G = game();
    expect(G.chains.length).toBe(1);
    expect(G.chains[0].segs.length).toBe(cv.boss.body!.count);
    const seg = G.chains[0].segs[1], hp = G.b.hp;
    seg.hp = 1;
    G.shots.push({ k: 'cone', x: seg.x, y: seg.y, vx: 0, vy: 0, r: 6 });
    freeze(G); stepPort(G, DT);
    expect(G.chains.length).toBe(2);
    expect(G.chains[0].segs.length).toBe(1);
    expect(G.chains[1].lead).not.toBeNull();
    expect(G.b.hp).toBeLessThan(hp); // el daño al cuerpo baja la vida del jefe
  }));

  it('la carretilla no se toca y, mientras cruza a la altura de la fila, el jefe se detiene', () => withSeed(2, () => {
    const G = game();
    G.cart = { ...G.cart, on: true, x: G.p.x, y: G.p.y, dir: 1, hit: false };
    const hp = G.p.hp; freeze(G); stepPort(G, DT);
    expect(G.p.hp).toBeLessThan(hp);
    expect(G.fines).toBe(cv.hazards!.cart!.fine);
    expect(G.stars).toBe(1);
    const H = game(); H.cart = { ...H.cart, on: true, x: 180, y: H.chains[0].segs[0].y, dir: 1, hit: false };
    const bx = H.b.x, by = H.b.y; H.b.state = 'cruise'; H.b.tx = bx + 100; H.b.act = 0;
    stepPort(H, DT);
    expect([H.b.x, H.b.y, H.b.flash]).toEqual([bx, by, 'hazard']);
  }));

  it('un cono que pega en la carretilla también es papeleta', () => withSeed(3, () => {
    const G = game(); G.cart = { ...G.cart, on: true, x: 180, y: 380, dir: 1, hit: false };
    G.shots.push({ k: 'cone', x: 180, y: 382, vx: 0, vy: 0, r: 6 });
    freeze(G); stepPort(G, DT);
    expect(G.fines).toBe(cv.hazards!.cart!.fine);
  }));

  it('las gaviotas manchan si llegan, el claxon las espanta y la Corneta perdona la primera', () => withSeed(4, () => {
    const arrive = (G: Game, scare: boolean) => {
      G.flock = { ...G.flock, on: true, x: G.p.x, y: G.p.y - 60, vy: 300, scared: false, hit: false };
      if (scare) scareFlock(G);
      for (let i = 0; i < 30; i++) { freeze(G); stepPort(G, DT); }
      return G.splat.t > 0;
    };
    expect(arrive(game(), false)).toBe(true);
    expect(arrive(game(), true)).toBe(false);
    expect(arrive(game('normal', [cv.rewards.item!]), false)).toBe(false);
  }));

  it('el derrumbe avisa y después caen piedras por los carriles del acantilado', () => withSeed(5, () => {
    const G = game(), R = cv.hazards!.rockslide!;
    G.slide.t = 0.01; freeze(G); G.slide.t = 0.01; stepPort(G, DT);
    expect(G.slide.phase).toBe(1);
    expect(G.slide.lanes.every((l) => l < 2)).toBe(true); // el acantilado está a la izquierda
    for (let i = 0; i < 60 * (R.warn + 1); i++) { G.b.act = 99; G.flock.t = 99; stepPort(G, DT); }
    expect(G.foes.some((f) => f.look === 'piedra')).toBe(true);
  }));

  it('textos sin dos puntos, punto y coma ni guiones largos', () => {
    const texts = [cv.tip, cv.rewards.defeatTip!, cv.rewards.item!.desc, cv.hazards!.cart!.label, ...Object.values(cv.boss.lines).flat(), ...Object.values(cv.boss.quips),
      ...cv.boss.phases.map((p) => p.name)];
    for (const t of texts) expect(t).not.toMatch(/[:;—]/);
  });
});
