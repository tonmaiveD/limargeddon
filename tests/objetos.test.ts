import { describe, expect, it } from 'vitest';
import { startPort, stepPort } from './harness/port';
import { seedRandom } from './harness/rng';
import { STAGES, wonItems } from '../src/stages';
import { fine } from '../src/core/state';
import type { DiffKey, ItemDef, StageConfig } from '../src/core/config';
import type { Game } from '../src/core/state';

/* Objetos de victoria (ADR 0020): Silbato, Bolso y Poncho protegen una vez por pelea desde que se ganan. */

const DT = 1 / 60;
function withSeed<T>(seed: number, fn: () => T): T { const r = seedRandom(seed); try { return fn(); } finally { r(); } }
const item = (id: string): ItemDef => Object.values(STAGES).map((s) => s.cfg.rewards.item!).find((x) => x?.id === id)!;
function game(stage: string, items: ItemDef[], dk: DiffKey = 'normal'): Game {
  const cfg = structuredClone(STAGES[stage].cfg) as StageConfig;
  cfg.player.items = items;
  const G = startPort(dk, cfg);
  for (let i = 0; i < 400 && G.b.state === 'enter'; i++) stepPort(G, DT);
  G.p.pw.soat = 0; return G;
}

describe('objetos de victoria', () => {
  it('se tienen los de las etapas ganadas', () => {
    expect(wonItems(1)).toEqual([]);
    expect(wonItems(2).map((x) => x.id)).toEqual(['silbato']);
    expect(wonItems(4).map((x) => x.id)).toEqual(['silbato', 'bolso', 'poncho']);
    expect(wonItems(5).map((x) => x.id)).toEqual(['silbato', 'bolso', 'poncho', 'casco']);
  });

  it('el Silbato perdona el primer roce con un intocable, no los disparos', () => withSeed(1, () => {
    const G = game('san-isidro', [item('silbato')]);
    fine(G, 0, 0, 50, 'AGRESIÓN');
    expect(G.fines).toBe(50);
    fine(G, 0, 0, 50, 'PAPELETA', true);
    expect(G.fines).toBe(50);
    fine(G, 0, 0, 50, 'PAPELETA', true);
    expect(G.fines).toBe(100);
  }));

  it('con Silbato y Bolso se perdonan dos papeletas, el Silbato primero en un roce', () => withSeed(2, () => {
    const G = game('centro', [item('silbato'), item('bolso')]);
    fine(G, 0, 0, 50, 'PAPELETA', true);
    expect(G.perks.map((k) => k.used)).toEqual([true, false]);
    fine(G, 0, 0, 50, 'AGRESIÓN');
    fine(G, 0, 0, 50, 'AGRESIÓN');
    expect(G.fines).toBe(50);
  }));

  it('el Poncho evita el daño del primer chorro y solo del primero', () => withSeed(3, () => {
    const G = game('centro', [item('poncho')], 'dificil'), p = G.p, hits: number[] = [];
    let last = p.hp;
    for (let i = 0; i < 60 * 240 && !G.result && hits.length < 2; i++) {
      // el Tico se queda en el carril del jefe para recibir los chorros; se cura para que la pelea siga
      p.x = G.b.x; p.hp = p.max; last = p.hp;
      const before = G.perks[0].used;
      stepPort(G, DT);
      if (G.b.jetHit && G.b.state === 'jet' && hits.length === 0 && G.perks[0].used && !before) hits.push(last - p.hp);
      else if (G.b.jetHit && G.b.state === 'jet' && hits.length === 1 && p.hp < last) hits.push(last - p.hp);
    }
    expect(hits[0]).toBe(0);
    expect(hits[1]).toBeGreaterThan(0);
  }));

  it('cada objeto declara un efecto conocido y textos sin puntuación delatora', () => {
    for (const { cfg } of Object.values(STAGES)) {
      const it = cfg.rewards.item!;
      expect(['contactFine', 'anyFine', 'jetHit', 'shotHit', 'obstacleHit']).toContain(it.effect);
      expect(`${it.name} ${it.desc}`).not.toMatch(/[:;—]/);
    }
  });
});
