import { describe, expect, it } from 'vitest';
import { startPort, stepPort } from './harness/port';
import { seedRandom } from './harness/rng';
import { STAGES } from '../src/stages';
import type { StageConfig } from '../src/core/config';
import type { Game } from '../src/core/state';

/* Correcciones de la segunda auditoría (ADR 0028): cada prueba usa lo que emite el juego, no estado fabricado. */

const DT = 1 / 60;
function withSeed<T>(seed: number, fn: () => T): T { const r = seedRandom(seed); try { return fn(); } finally { r(); } }
function game(id: string): Game {
  const G = startPort('normal', structuredClone(STAGES[id].cfg) as StageConfig);
  for (let i = 0; i < 400 && G.b.state === 'enter'; i++) stepPort(G, DT);
  stepPort(G, DT);
  G.p.pw.soat = 0; G.b.act = 99; G.traffic = []; G.obstacles = []; G.obsT = G.obsT.map(() => 99); G.trafficT = 99;
  return G;
}

describe('segunda auditoría', () => {
  it('el rompellantas que lanza el Comandante lleva su aturdimiento y lo aplica', () => withSeed(1, () => {
    const G = game('panamericana'), T = STAGES.panamericana.cfg.boss.phases[0].throw!;
    G.b.state = 'teleThrow'; G.b.st = 0.01;
    for (let i = 0; i < 5 && !G.foes.length; i++) stepPort(G, DT);
    const f = G.foes[0];
    expect(f.stun).toBe(T.stun);
    f.x = G.p.x; f.y = G.p.y; f.vx = 0; f.vy = 0; G.b.act = 99; stepPort(G, DT);
    expect(G.p.stun).toBeGreaterThan(T.stun! - 0.05);
  }));

  it('un cono al cuerpo de la serpiente conserva la racha sin subirla', () => withSeed(2, () => {
    const G = game('costa-verde'), seg = G.chains[0].segs[2];
    G.combo.n = 3; G.combo.best = 3; G.slide.t = 99; G.flock.t = 99; G.cart.t = 99;
    G.shots.push({ k: 'cone', x: seg.x, y: seg.y, vx: 0, vy: 0, r: 6 });
    G.b.act = 99; stepPort(G, DT);
    expect(G.shots.length).toBe(0);
    expect(G.combo.n).toBe(3);
  }));

  it('el primer claxon de cada fase respeta hornFirst aunque la fase no traiga escoltas', () => withSeed(3, () => {
    const G = game('via-expresa'), P = STAGES['via-expresa'].cfg.boss.phases[2];
    expect(P.escorts).toBeUndefined();
    G.b.hp = Math.round(G.b.max * 0.3); G.b.act = 99; stepPort(G, DT);
    expect(G.b.phase).toBe(3);
    expect(G.b.hornT).toBeCloseTo(P.hornFirst ?? 2, 1);
  }));

  it('Gamarra y la Vía Expresa enseñan su regla nueva con una ayuda antes de exigirla', () => {
    const ga = STAGES.gamarra.cfg, ve = STAGES['via-expresa'].cfg;
    expect(ga.hints![0].at).toBeLessThan(ga.obstacles!.find((o) => o.k === 'cables')!.first);
    expect(ve.hints![0].at).toBeLessThan(ve.obstacles!.find((o) => o.k === 'rampa')!.first);
    for (const t of [...ga.hints!, ...ve.hints!].map((h) => h.text).concat(ve.rewards.defeatTip!, ve.tip)) expect(t).not.toMatch(/[:;—]/);
    expect(ve.rewards.defeatTip).not.toMatch(/nada te toca/);
  });
});
