import { describe, expect, it } from 'vitest';
import { startPort, stepPort } from './harness/port';
import { seedRandom } from './harness/rng';
import { STAGES } from '../src/stages';
import { makeCar } from '../src/core/world';
import { swingZone } from '../src/bosses/phase-boss';
import { overlap } from '../src/core/util';
import type { DiffKey, ItemDef, StageConfig } from '../src/core/config';
import type { Game } from '../src/core/state';

/* Etapa 7 Vía Expresa (ADR 0024): rampas que hacen saltar si se pasan acelerando, autos que frenan en seco y el coletazo del bus. */

const DT = 1 / 60;
const ve = STAGES['via-expresa'].cfg;
function withSeed<T>(seed: number, fn: () => T): T { const r = seedRandom(seed); try { return fn(); } finally { r(); } }
function game(dk: DiffKey = 'normal', items: ItemDef[] = []): Game {
  const cfg = structuredClone(ve) as StageConfig; cfg.player.items = items;
  const G = startPort(dk, cfg);
  for (let i = 0; i < 400 && G.b.state === 'enter'; i++) stepPort(G, DT);
  G.p.pw.soat = 0; G.b.act = 99; G.traffic = []; G.obstacles = []; G.obsT = G.obsT.map(() => 99); G.trafficT = 99; G.bumpT = 99; return G;
}
const put = (G: Game, k: string, dy = 0) => {
  const i = ve.obstacles!.findIndex((o) => o.k === k), o = ve.obstacles![i];
  G.obstacles.push({ i, x: G.p.x, y: G.p.y + dy, w: o.lanes * ve.road.laneWidth, h: o.h, hit: false });
};

describe('Etapa 7 Vía Expresa', () => {
  it('va después del Callao y pinta el carril exclusivo', () => {
    expect(ve.number).toBe(7);
    expect(ve.road.exclusive?.label).toBe('SOLO BUS');
  });

  it('la rampa hace saltar solo si se pasa acelerando', () => withSeed(1, () => {
    const a = game(); put(a, 'rampa'); a.keys.up = false; stepPort(a, DT);
    expect(a.p.air).toBe(0);
    const b = game(); put(b, 'rampa'); b.keys.up = true; stepPort(b, DT);
    expect(b.p.air).toBeGreaterThan(0.8);
  }));

  it('en el aire no lo tocan los huecos ni el tráfico, y al aterrizar vuelve todo', () => withSeed(2, () => {
    const G = game(); put(G, 'rampa'); G.keys.up = true; stepPort(G, DT);
    put(G, 'crater');
    const car = makeCar(ve.traffic.types.find((t) => t.k === 'taxi')!, G.p.x, G.p.y); car.vy = 0; G.traffic.push(car);
    const hp = G.p.hp; G.keys.up = false; stepPort(G, DT);
    expect(G.p.hp).toBe(hp);
    for (let i = 0; i < 120 && G.p.air > 0; i++) { G.traffic = []; G.obstacles = []; stepPort(G, DT); }
    expect(G.p.air).toBe(0);
    put(G, 'crater'); stepPort(G, DT);
    expect(G.p.hp).toBeLessThan(hp);
  }));

  it('los autos de aplicación frenan en seco y bajan con la pista', () => withSeed(3, () => {
    const G = game(), t = ve.traffic.types.find((x) => x.k === 'app')!;
    const c = makeCar(t, 100, 200); c.brakeT = 0.5; G.traffic.push(c);
    const y = c.y; stepPort(G, DT);
    expect(c.y - y).toBeCloseTo((ve.road.speed - c.vy + c.vy) * DT, 0);
  }));

  it('el coletazo barre hacia el lado del Tico y la Tarjeta del Expreso perdona el primero', () => withSeed(4, () => {
    const hitBy = (items: ItemDef[]) => {
      const G = game('normal', items);
      G.p.x = G.b.x + G.b.w / 2 + 30; G.p.y = G.cfg.player.minY;
      G.b.state = 'teleSwing'; G.b.st = 0.01; G.b.swing = 1;
      let hit = false, dmg = 0;
      for (let i = 0; i < 60 && !hit; i++) {
        G.p.x = G.b.x + G.b.w / 2 + 30; G.p.y = G.cfg.player.minY; G.p.hitCd = 99;
        const z = swingZone(G), hp = G.p.hp; stepPort(G, DT);
        if (z && overlap(G.p, z)) hit = true;
        dmg += hp - G.p.hp;
      }
      return { hit, dmg };
    };
    const plain = hitBy([]);
    expect(plain.hit).toBe(true);
    expect(plain.dmg).toBeGreaterThan(0);
    expect(hitBy([ve.rewards.item!]).dmg).toBe(0);
  }));

  it('textos sin dos puntos, punto y coma ni guiones largos', () => {
    const texts = [ve.tip, ve.rewards.defeatTip!, ve.rewards.item!.desc, ...Object.values(ve.boss.lines).flat(), ...Object.values(ve.boss.quips),
      ...ve.boss.phases.map((p) => p.name), ...(ve.obstacles ?? []).map((o) => o.label ?? '')];
    for (const t of texts) expect(t).not.toMatch(/[:;—]/);
  });
});
