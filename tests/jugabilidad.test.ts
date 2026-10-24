import { beforeEach, describe, expect, it } from 'vitest';
import { startPort, stepPort } from './harness/port';
import { seedRandom } from './harness/rng';
import { overlap } from '../src/core/util';
import { exportFights, fightStats, recordFight } from '../src/core/save';

const DT = 1 / 60;

describe('acelerador sin freno', () => {
  it('acelerar sube el Tico; al soltar vuelve solo a la línea de crucero', () => {
    const restore = seedRandom(3);
    try {
      const G = startPort('normal'), cruise = G.cfg.player.y;
      G.keys.up = true;
      for (let i = 0; i < 60; i++) stepPort(G, DT);
      expect(G.p.y).toBeLessThan(cruise - 100);
      G.keys.up = false;
      for (let i = 0; i < 180; i++) stepPort(G, DT);
      expect(Math.abs(G.p.y - cruise)).toBeLessThan(4);
    } finally { restore(); }
  });

  it('la tecla abajo no frena ni hace retroceder', () => {
    const restore = seedRandom(3);
    try {
      const G = startPort('normal'), cruise = G.cfg.player.y;
      G.keys.down = true;
      for (let i = 0; i < 60; i++) stepPort(G, DT);
      expect(Math.abs(G.p.y - cruise)).toBeLessThan(4);
    } finally { restore(); }
  });
});

describe('el tráfico no pasa por debajo del Q8', () => {
  it('ningún auto termina un cuadro superpuesto al jefe', () => {
    const restore = seedRandom(11);
    try {
      const G = startPort('normal');
      let overlaps = 0, checked = 0;
      for (let i = 0; i < 60 * 90 && G.mode === 'play'; i++) {
        G.keys.cone = true;
        stepPort(G, DT);
        if (G.b.state === 'enter') continue;
        for (const c of G.traffic) { if (c.k === 'valet' && c.enter! > 0) continue; checked++; if (overlap(c, G.b)) overlaps++; }
      }
      expect(checked).toBeGreaterThan(500);
      expect(overlaps).toBe(0);
    } finally { restore(); }
  });
});

describe('registro de peleas', () => {
  beforeEach(() => {
    const mem = new Map<string, string>();
    (globalThis as any).localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => mem.set(k, v) };
  });

  it('guarda las peleas y calcula la mediana de las victorias', () => {
    recordFight({ stage: 'san-isidro', dk: 'normal', win: true, t: 100 });
    recordFight({ stage: 'san-isidro', dk: 'normal', win: false, t: 40 });
    recordFight({ stage: 'san-isidro', dk: 'normal', win: true, t: 90 });
    recordFight({ stage: 'san-isidro', dk: 'facil', win: true, t: 60 });
    expect(fightStats('san-isidro', 'normal')).toEqual({ played: 3, wins: 2, median: 100 });
    expect(exportFights()).toHaveLength(4);
  });

  it('sigue funcionando si el almacenamiento falla o tiene otra versión', () => {
    (globalThis as any).localStorage = { getItem: () => { throw new Error('bloqueado'); }, setItem: () => { throw new Error('bloqueado'); } };
    expect(() => recordFight({ stage: 'san-isidro', dk: 'normal', win: true, t: 80 })).not.toThrow();
    expect(fightStats('san-isidro', 'normal')).toEqual({ played: 0, wins: 0, median: null });
    (globalThis as any).localStorage = { getItem: () => JSON.stringify({ v: 99, fights: 'x' }), setItem: () => {} };
    expect(exportFights()).toEqual([]);
  });
});
