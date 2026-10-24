import { describe, expect, it } from 'vitest';
import { startPort, stepPort } from './harness/port';
import { seedRandom } from './harness/rng';
import { STAGES } from '../src/stages';
import type { DiffKey, ItemDef, StageConfig } from '../src/core/config';
import type { Game } from '../src/core/state';

/* Etapa 6 Callao (ADR 0023): el tráiler suelta contenedores y la Llanta de remolcador aguanta la primera embestida. */

const DT = 1 / 60;
const ca = STAGES.callao.cfg;
function withSeed<T>(seed: number, fn: () => T): T { const r = seedRandom(seed); try { return fn(); } finally { r(); } }
function game(dk: DiffKey = 'normal', items: ItemDef[] = []): Game {
  const cfg = structuredClone(ca) as StageConfig; cfg.player.items = items;
  const G = startPort(dk, cfg);
  for (let i = 0; i < 400 && G.b.state === 'enter'; i++) stepPort(G, DT);
  G.p.pw.soat = 0; G.b.act = 99; G.traffic = []; G.obstacles = []; G.obsT = G.obsT.map(() => 99); G.trafficT = 99; return G;
}
// el tráiler embiste justo encima del Tico; devuelve el daño del primer choque
function rammed(G: Game): number {
  G.b.state = 'ram'; G.b.st = 0.5; G.b.x = G.p.x; G.b.y = G.p.y - (G.b.h + G.p.h) / 2 + 2; G.p.hitCd = 0;
  const hp = G.p.hp; stepPort(G, DT); return hp - G.p.hp;
}

describe('Etapa 6 Callao', () => {
  it('va después de Gamarra', () => expect(ca.number).toBe(6));

  it('los contenedores caen desde atrás del tráiler', () => withSeed(1, () => {
    const G = game(), T = ca.boss.phases[0].throw!;
    G.b.state = 'teleThrow'; G.b.st = 0.01;
    for (let i = 0; i < 5 && !G.foes.length; i++) stepPort(G, DT);
    expect(G.foes.length).toBe(T.count);
    expect(G.foes.every((f) => f.look === 'contenedor' && f.vy > 0)).toBe(true);
  }));

  it('la Llanta de remolcador aguanta la primera embestida, no la segunda', () => withSeed(2, () => {
    expect(rammed(game())).toBe(ca.boss.chargeContactDmg);
    const G = game('normal', [ca.rewards.item!]);
    expect(rammed(G)).toBe(0);
    for (let i = 0; i < 60; i++) stepPort(G, DT);
    expect(rammed(G)).toBe(ca.boss.chargeContactDmg);
  }));

  it('textos sin dos puntos, punto y coma ni guiones largos', () => {
    const texts = [ca.tip, ca.rewards.defeatTip!, ca.rewards.item!.desc, ...Object.values(ca.boss.lines).flat(), ...Object.values(ca.boss.quips),
      ...ca.boss.phases.map((p) => p.name), ...ca.boss.phases.map((p) => p.throw?.text ?? ''), ...(ca.obstacles ?? []).map((o) => o.label ?? '')];
    for (const t of texts) expect(t).not.toMatch(/[:;—]/);
  });
});
