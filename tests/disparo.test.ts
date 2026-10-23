import { describe, expect, it } from 'vitest';
import { startPort, stepPort } from './harness/port';
import { seedRandom } from './harness/rng';
import type { Game } from '../src/core/state';

const DT = 1 / 60;
const cones = (G: Game) => G.shots.filter((s) => s.k === 'cone').length;
function run(seed: number, fn: (G: Game) => void, mode: 'toque' | 'acelerar' = 'toque'): void {
  const restore = seedRandom(seed);
  try {
    const G = startPort('normal');
    G.fireMode = mode; G.p.ammo = G.cfg.weapons.cone.ammo ?? 0;
    fn(G);
  } finally { restore(); }
}

describe('disparo por toque', () => {
  it('mantener el botón lanza un solo cono', () => run(1, (G) => {
    G.keys.cone = true;
    for (let i = 0; i < 30; i++) stepPort(G, DT);
    expect(cones(G)).toBe(1);
  }));

  it('la reserva de 3 se agota y se recarga de a uno', () => run(1, (G) => {
    const tap = () => { G.keys.cone = true; stepPort(G, DT); G.keys.cone = false; for (let i = 0; i < 5; i++) stepPort(G, DT); };
    tap(); tap(); tap();                 // 3 toques en 0.3 s: se gasta la reserva, todavía sin recargar
    expect(G.p.ammo).toBe(0);
    const shotsBefore = G.shots.filter((s) => s.k === 'cone').length;
    tap();                               // sin reserva no sale nada
    expect(G.shots.filter((s) => s.k === 'cone').length).toBe(shotsBefore);
    for (let i = 0; i < 30; i++) stepPort(G, DT); // ~0.5 s más: se recarga uno
    expect(G.p.ammo).toBe(1);
  }));
});

describe('acelerar es atacar', () => {
  it('sin acelerar no hay conos; acelerando dispara a cadencia fija', () => run(2, (G) => {
    G.keys.cone = true;
    for (let i = 0; i < 60; i++) stepPort(G, DT);
    expect(cones(G)).toBe(0);
    G.keys.up = true;
    for (let i = 0; i < 60; i++) stepPort(G, DT);
    expect(cones(G)).toBeGreaterThanOrEqual(2);
  }, 'acelerar'));
});

describe('combo de punto ciego', () => {
  it('conos seguidos por la derecha suben el multiplicador y uno por la izquierda lo corta', () => run(3, (G) => {
    for (let i = 0; i < 200 && G.b.state === 'enter'; i++) stepPort(G, DT);
    G.b.state = 'cruise'; G.b.act = 99; G.b.slip = 0;
    const hit = (dx: number) => {
      const before = G.b.hp;
      G.shots.push({ k: 'cone', x: G.b.x + dx, y: G.b.y, vx: 0, vy: 0, r: 6 });
      stepPort(G, DT);
      return before - G.b.hp;
    };
    const base = G.cfg.weapons.cone.dmg * G.cfg.boss.weakSideMult;
    expect(hit(8)).toBe(base);                       // primer golpe: x1
    expect(hit(8)).toBe(Math.round(base * 1.1));     // combo 2
    expect(hit(8)).toBe(Math.round(base * 1.2));     // combo 3
    expect(G.combo.n).toBe(3);
    expect(G.hitstop).toBeGreaterThan(0);
    hit(-8);                                         // por la izquierda: se corta
    expect(G.combo.n).toBe(0);
    expect(G.combo.best).toBe(3);
  }));
});
