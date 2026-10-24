import { beforeEach, describe, expect, it } from 'vitest';
import { UPGRADES, applyUpgrades, isLocked, nextGoal, recommended } from '../src/garage/upgrades';
import { addEarnings, buyUpgrade, getGarage, settleFight, unlockedStage } from '../src/core/save';
import { stageNumber } from '../src/stages';
import { STAGES } from '../src/stages';
import { startPort, stepPort } from './harness/port';
import { seedRandom } from './harness/rng';

const base = STAGES.miraflores.cfg;
const DT = 1 / 60;

describe('mejoras aplicadas a la config', () => {
  it('sin mejoras la config no cambia', () => {
    expect(applyUpgrades(base, {})).toEqual(base);
  });

  it('cada nivel suma sus efectos y no toca la config original', () => {
    const cfg = applyUpgrades(base, { conos: 2, blindaje: 1, parachoques: 1, motor: 2 });
    expect(cfg.weapons.cone.ammo).toBe((base.weapons.cone.ammo ?? 0) + 2);
    expect(cfg.player.hp).toBe(base.player.hp + 15);
    expect(cfg.player.armor).toBeCloseTo(0.13);
    expect(cfg.player.look).toEqual({ bumper: true, plates: true });
    expect(cfg.player.accelY).toBeCloseTo(base.player.accelY * 1.08 * 1.08);
    expect(base.player.armor).toBeUndefined();
  });

  it('el catálogo cuesta más de lo que se gana fácil, y lo primero es barato', () => {
    const total = UPGRADES.reduce((a, u) => a + u.levels.reduce((b, l) => b + l.price, 0), 0);
    const cheapest = Math.min(...UPGRADES.map((u) => u.levels[0].price));
    expect(total).toBeGreaterThan(10000);
    expect(cheapest).toBeLessThanOrEqual(base.rewards.win);
  });
});

describe('billetera y compras', () => {
  beforeEach(() => {
    const mem = new Map<string, string>();
    (globalThis as any).localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => mem.set(k, v) };
  });

  it('cobra, compra el siguiente nivel y no deja comprar sin plata ni pasar del máximo', () => {
    addEarnings(700);
    expect(buyUpgrade('soat', 1500, 1)).toBeNull();
    const g = buyUpgrade('llantas', 250, 2)!;
    expect(g.wallet).toBe(450);
    expect(g.levels.llantas).toBe(1);
    expect(buyUpgrade('llantas', 550, 2)).toBeNull();
    addEarnings(1000);
    buyUpgrade('llantas', 550, 2);
    expect(buyUpgrade('llantas', 999, 2)).toBeNull();
    expect(getGarage()).toEqual({ wallet: 900, levels: { llantas: 2 } });
  });

  it('la primera victoria cobra completo, repetirla cobra la mitad y desbloquea la siguiente', () => {
    const f = { stage: 'miraflores', dk: 'normal' as const, win: true, t: 70 };
    expect(settleFight(f, 1, 800, stageNumber)).toEqual({ earned: 800, replay: false, wallet: 800 });
    expect(unlockedStage(stageNumber)).toBe(2);
    expect(settleFight(f, 1, 800, stageNumber)).toEqual({ earned: 400, replay: true, wallet: 1200 });
    expect(settleFight({ ...f, stage: 'san-isidro', win: false }, 2, 60, stageNumber)).toEqual({ earned: 60, replay: false, wallet: 1260 });
  });

  it('recomienda lo más barato que alcanza y muestra la meta más cercana', () => {
    expect(recommended({}, 260)).toBe('llantas');
    expect(nextGoal({}, 260)).toEqual({ name: 'Motor repotenciado', missing: 40 });
  });
});

describe('efectos en la pista', () => {
  function play(levels: Record<string, number>, fn: (G: ReturnType<typeof startPort>) => void): void {
    const r = seedRandom(12);
    try { const G = startPort('normal', applyUpgrades(base, levels)); for (let i = 0; i < 400 && G.b.state === 'enter'; i++) stepPort(G, DT); fn(G); } finally { r(); }
  }

  it('el blindaje reduce el daño recibido', () => play({ blindaje: 1 }, (G) => {
    G.p.pw.soat = 0; const hp0 = G.p.hp;
    G.traffic.push({ k: 'sedan', x: G.p.x, y: G.p.y - 20, w: 28, h: 50, vy: 0, hp: 36, max: 36, col: '#fff', spin: 0, seed: 1, contactDmg: 10, selfDmg: 10 });
    stepPort(G, DT);
    expect(hp0 - G.p.hp).toBe(Math.round(10 * (1 - 0.08)));
  }));

  it('la reparación devuelve vida con el tiempo', () => play({ reparacion: 2 }, (G) => {
    G.p.hp = 50; G.p.pw.soat = 999; G.b.act = 99;
    for (let i = 0; i < 60 * 4; i++) stepPort(G, DT);
    expect(G.p.hp).toBeGreaterThanOrEqual(53.9);
  }));

  it('el SOAT de verdad salva una vez', () => play({ soat: 1 }, (G) => {
    G.p.pw.soat = 0; G.p.hp = 0;
    stepPort(G, DT);
    expect(G.mode).toBe('play');
    expect(G.p.hp).toBeGreaterThan(0);
    expect(G.p.lives).toBe(0);
    G.p.pw.soat = 0; G.p.hp = 0; stepPort(G, DT);
    expect(G.mode).toBe('over');
  }));
});

describe('mejoras de lujo', () => {
  function play(levels: Record<string, number>, stage: 'miraflores' | 'san-isidro', fn: (G: ReturnType<typeof startPort>) => void): void {
    const r = seedRandom(14);
    try { const G = startPort('normal', applyUpgrades(STAGES[stage].cfg, levels)); for (let i = 0; i < 400 && G.b.state === 'enter'; i++) stepPort(G, DT); fn(G); } finally { r(); }
  }

  it('quedan bloqueadas hasta la etapa requerida y no se recomiendan antes', () => {
    const lujo = UPGRADES.filter((u) => u.cat === 'lujo');
    expect(lujo.map((u) => u.id)).toEqual(['sticker', 'socio-combi']);
    expect(lujo.every((u) => isLocked(u, 2) && !isLocked(u, 3))).toBe(true);
    expect(['sticker', 'socio-combi']).not.toContain(recommended({}, 99999, 2));
  });

  it('con el sticker no hay papeletas y el serenazgo abre paso', () => play({ sticker: 1 }, 'miraflores', (G) => {
    G.p.pw.soat = 999; G.b.act = 99; G.p.hitCd = 0;
    G.traffic.push({ k: 'sereno', x: G.p.x, y: G.p.y - 51, w: 30, h: 52, vy: 0, hp: 999, max: 999, col: '#1f4fbf', spin: 0, seed: 1, invulnerable: true, contactDmg: 0 });
    const sereno = G.traffic[G.traffic.length - 1], x0 = sereno.x;
    for (let i = 0; i < 30; i++) stepPort(G, DT);
    expect(G.fines).toBe(0);
    expect(Math.abs(sereno.x - x0)).toBeGreaterThan(10);
  }));

  it('el Socio de la Combi manda una combi que embiste al jefe', () => play({ 'socio-combi': 1 }, 'san-isidro', (G) => {
    G.p.pw.soat = 999; G.p.hp = 999;
    const hp0 = G.b.hp; let llego = false;
    for (let i = 0; i < 60 * 16; i++) { stepPort(G, DT); if (G.allies.length) llego = true; }
    expect(llego).toBe(true);
    expect(hp0 - G.b.hp).toBeGreaterThanOrEqual(80);
  }));
});
