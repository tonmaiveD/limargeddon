import { describe, expect, it } from 'vitest';
import { startPort, stepPort } from './harness/port';
import { seedRandom } from './harness/rng';
import { bot } from './harness/bot';
import { STAGES } from '../src/stages';
import type { Game } from '../src/core/state';

const DT = 1 / 60;
const mf = STAGES.miraflores.cfg;
function withSeed<T>(seed: number, fn: () => T): T { const r = seedRandom(seed); try { return fn(); } finally { r(); } }

describe('etapa Miraflores', () => {
  it('está registrada como etapa 1 con su jefe y sus peligros', () => {
    expect(mf.number).toBe(1);
    expect(mf.boss.title).toBe('La Camioneta del Serenazgo');
    expect(mf.obstacles!.map((o) => o.k)).toEqual(['turistas', 'fin-ciclovia', 'scooter']);
    expect(mf.traffic.types.some((t) => t.look?.kind === 'bici')).toBe(true);
  });

  it('una pelea completa con el bot termina sin errores', () => withSeed(21, () => {
    const G = startPort('normal', mf);
    for (let i = 0; i < 60 * 300 && G.mode === 'play'; i++) { bot(G as never, G.keys); stepPort(G, DT); }
    expect(G.mode).toBe('over');
  }));
});

describe('jefe genérico por fases', () => {
  function toPhase(G: Game, ratio: number): void {
    for (let i = 0; i < 400 && G.b.state === 'enter'; i++) stepPort(G, DT);
    G.b.hp = Math.floor(G.b.max * ratio); G.p.pw.soat = 999; G.p.hp = 999;
  }

  it('en la fase 2 invoca serenos que entran desde el costado', () => withSeed(3, () => {
    const G = startPort('normal', mf); toPhase(G, 0.5);
    stepPort(G, DT);
    expect(G.b.phase).toBe(2);
    expect(G.traffic.some((c) => c.k === 'sereno' && c.enter !== undefined)).toBe(true);
  }));

  it('combina ataques con peso dentro de una fase', () => withSeed(4, () => {
    const G = startPort('normal', mf); toPhase(G, 0.5);
    const seen = new Set<string>();
    for (let i = 0; i < 60 * 120; i++) { stepPort(G, DT); seen.add(G.b.state); G.b.hp = Math.max(G.b.hp, Math.floor(G.b.max * 0.5)); }
    expect(seen.has('teleBrake')).toBe(true);
    expect(seen.has('teleRam')).toBe(true);
  }));

  it('la fase 3 usa el pitazo del JSON y trae escoltas en moto', () => withSeed(5, () => {
    const G = startPort('normal', mf); toPhase(G, 0.2); G.p.pw.soat = 0;
    let pitazo = false;
    for (let i = 0; i < 60 * 4; i++) {
      G.p.x = G.b.x; G.p.y = G.b.y + 100; G.p.hp = 999;
      stepPort(G, DT);
      if (G.floats.some((f) => f.text === '¡PITAZO!')) pitazo = true;
    }
    expect(G.b.phase).toBe(3);
    const escoltas = G.traffic.filter((c) => c.k === 'amiga');
    expect(escoltas.length).toBeGreaterThan(0);
    expect(escoltas.every((c) => c.look?.kind === 'moto')).toBe(true);
    expect(pitazo).toBe(true);
  }));

  it('el multiplicador de daño por dificultad se aplica', () => withSeed(6, () => {
    const G = startPort('dificil', mf); toPhase(G, 0.9); G.p.pw.soat = 0; G.p.hp = 100;
    const before = G.p.hp;
    G.p.hitCd = 0;
    // un choque contra un sedán (6 de daño) en Difícil x1.7 = 10
    G.traffic.push({ k: 'sedan', x: G.p.x, y: G.p.y - 20, w: 28, h: 50, vy: 0, hp: 36, max: 36, col: '#fff', spin: 0, seed: 1, contactDmg: 6, selfDmg: 10 });
    stepPort(G, DT);
    expect(before - G.p.hp).toBe(Math.round(6 * mf.difficulties.dificil.dmgMult!));
  }));
});
