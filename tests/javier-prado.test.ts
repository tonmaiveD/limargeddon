import { describe, expect, it } from 'vitest';
import { startPort, stepPort } from './harness/port';
import { seedRandom } from './harness/rng';
import { STAGES } from '../src/stages';
import type { DiffKey, ItemDef, StageConfig } from '../src/core/config';
import type { Game } from '../src/core/state';

/* Etapa 4 Javier Prado: la Combi Asesina lanza monedas (ataque 'throw', ADR 0021) y se detiene a recoger pasajeros. */

const DT = 1 / 60;
const jp = STAGES['javier-prado'].cfg;
function withSeed<T>(seed: number, fn: () => T): T { const r = seedRandom(seed); try { return fn(); } finally { r(); } }
function game(dk: DiffKey = 'normal', items: ItemDef[] = []): Game {
  const cfg = structuredClone(jp) as StageConfig; cfg.player.items = items;
  const G = startPort(dk, cfg);
  for (let i = 0; i < 400 && G.b.state === 'enter'; i++) stepPort(G, DT);
  G.p.pw.soat = 0; return G;
}
// fuerza un lanzamiento y avanza hasta que salen las monedas
function throwNow(G: Game): void {
  G.b.state = 'teleThrow'; G.b.st = 0.01; G.b.act = 99;
  for (let i = 0; i < 5 && !G.foes.length; i++) stepPort(G, DT);
}

describe('Etapa 4 Javier Prado', () => {
  it('va después del Centro y declara su jefe, obstáculos y objeto', () => {
    expect(jp.number).toBe(4);
    expect(jp.boss.phases.every((p) => p.throw && p.attacks?.some((a) => a.k === 'throw'))).toBe(true);
    expect(jp.obstacles!.map((o) => o.k)).toEqual(['crater', 'camion-obra', 'bypass']);
    expect(jp.rewards.item!.effect).toBe('shotHit');
  });

  it('las monedas salen en abanico hacia el Tico y luego la combi se detiene', () => withSeed(1, () => {
    const G = game(), T = jp.boss.phases[0].throw!;
    throwNow(G);
    expect(G.foes.length).toBe(T.count);
    expect(G.foes.every((f) => f.vy > 0)).toBe(true); // el Tico va abajo
    expect(G.b.state).toBe('park');
  }));

  it('una moneda que toca al Tico le quita su daño, y el Casco perdona la primera', () => withSeed(2, () => {
    const hit = (items: ItemDef[]) => {
      const G = game('normal', items);
      G.foes.push({ x: G.p.x, y: G.p.y, vx: 0, vy: 0, r: 5, dmg: 7, col: '#fff' });
      const hp = G.p.hp; G.b.act = 99; stepPort(G, DT); return hp - G.p.hp;
    };
    expect(hit([])).toBe(7);
    expect(hit([jp.rewards.item!])).toBe(0);
  }));

  it('el claxon corta el aviso del lanzamiento', () => withSeed(3, () => {
    const G = game(); G.b.state = 'teleThrow'; G.b.st = 1;
    G.ai.interrupt(G);
    expect(G.b.state).toBe('return');
  }));

  it('textos sin dos puntos, punto y coma ni guiones largos', () => {
    const texts = [jp.tip, jp.rewards.defeatTip!, jp.rewards.item!.desc, ...Object.values(jp.boss.lines).flat(), ...Object.values(jp.boss.quips),
      ...jp.boss.phases.map((p) => p.name), ...jp.boss.phases.map((p) => p.throw?.text ?? ''), ...(jp.obstacles ?? []).map((o) => o.label ?? '')];
    for (const t of texts) expect(t).not.toMatch(/[:;—]/);
  });
});
