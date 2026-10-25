import { beforeEach, describe, expect, it } from 'vitest';
import { startPort } from './harness/port';
import { seedRandom } from './harness/rng';
import { STAGES, stageNumber } from '../src/stages';
import { fine, hurt } from '../src/core/state';
import { scoreFight, scoreParts } from '../src/core/score';
import {
  DEFAULT_NAME, cleanName, getGarage, getPlayerName, ranking, recordFight, recordScore, resetProgress, setPlayerName, unlockNext, unlockedStage,
} from '../src/core/save';
import type { StageConfig } from '../src/core/config';

/* Jugador, puntaje, ranking local y empezar de nuevo (ADR 0029). */

function withSeed<T>(seed: number, fn: () => T): T { const r = seedRandom(seed); try { return fn(); } finally { r(); } }
function memStorage(): void {
  const mem = new Map<string, string>();
  (globalThis as any).localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => mem.set(k, v) };
}
const won = (id: string, set: (G: ReturnType<typeof startPort>) => void) => withSeed(1, () => {
  const G = startPort('normal', structuredClone(STAGES[id].cfg) as StageConfig);
  G.result = { win: true }; set(G); return G;
});

describe('nombre del jugador', () => {
  beforeEach(memStorage);
  it('deja hasta 12 letras o números, con tildes y ñ', () => {
    expect(cleanName('Peñaló 2026!!')).toBe('Peñaló2026');
    expect(cleanName('abcdefghijklmnop')).toBe('abcdefghijkl');
    expect(cleanName('<b>x</b>')).toBe('bxb');
  });
  it('vacío queda como JUGADOR y se recuerda', () => {
    expect(getPlayerName()).toBeNull();
    expect(setPlayerName(' ;; ')).toBe(DEFAULT_NAME);
    setPlayerName('Rosa'); expect(getPlayerName()).toBe('Rosa');
  });
});

describe('puntaje', () => {
  it('una pelea perfecta y rápida en Normal vale 10.000', () => {
    const G = won('centro', (G) => { G.t = 60; G.stats.effTotal = 100; G.stats.effRight = 100; G.combo.best = 9; });
    expect(scoreFight(G)).toBe(10000);
  });
  it('la falta cuenta aunque un objeto la perdone, y la reparación no borra el daño recibido', () => withSeed(2, () => {
    const cfg = structuredClone(STAGES.centro.cfg) as StageConfig;
    cfg.player.items = [STAGES['san-isidro'].cfg.rewards.item!]; // el Bolso perdona la papeleta
    const G = startPort('normal', cfg); G.p.pw.soat = 0;
    fine(G, 0, 0, 50, 'PAPELETA'); expect(G.fines).toBe(0);
    hurt(G, 30); G.p.hp = G.p.max; G.result = { win: true };
    const k = scoreParts(G);
    expect(k.clean).toBeCloseTo(2 / 3);
    expect(k.goal).toBeCloseTo(0.7);
  }));
  it('la dificultad pesa, para que no convenga farmear en Fácil', () => {
    const perfect = (G: ReturnType<typeof startPort>) => { G.t = 60; G.stats.effTotal = 1; G.stats.effRight = 1; G.combo.best = 8; };
    const f = withSeed(3, () => { const G = startPort('facil', STAGES.centro.cfg); G.result = { win: true }; perfect(G); return scoreFight(G); });
    const d = withSeed(3, () => { const G = startPort('dificil', STAGES.centro.cfg); G.result = { win: true }; perfect(G); return scoreFight(G); });
    expect([f, d]).toEqual([7000, 12500]);
  });
  it('perder no da puntaje', () => withSeed(4, () => {
    const G = startPort('normal', STAGES.centro.cfg); G.result = { win: false };
    expect(scoreFight(G)).toBe(0);
  }));
});

describe('ranking local', () => {
  beforeEach(memStorage);
  it('guarda solo la mejor pelea de cada etapa: repetir igual no suma', () => {
    expect(recordScore('Rosa', 'centro', 8000)).toEqual({ best: 8000, record: true });
    expect(recordScore('Rosa', 'centro', 8000)).toEqual({ best: 8000, record: false });
    expect(recordScore('Rosa', 'centro', 7000)).toEqual({ best: 8000, record: false });
    recordScore('Rosa', 'miraflores', 9000);
    expect(ranking()).toEqual([{ name: 'Rosa', total: 17000, stages: 2 }]);
  });
  it('ordena por total y muestra a los 12 mejores', () => {
    for (let i = 1; i <= 15; i++) recordScore('J' + i, 'centro', i * 100);
    const r = ranking();
    expect(r.length).toBe(12);
    expect(r[0]).toEqual({ name: 'J15', total: 1500, stages: 1 });
    expect(r.at(-1)!.name).toBe('J4');
  });
});

describe('empezar de nuevo', () => {
  beforeEach(memStorage);
  it('vuelve a la Etapa 1 sin plata ni mejoras, y conserva nombre y ranking', () => {
    setPlayerName('Rosa'); recordScore('Rosa', 'centro', 8000);
    recordFight({ stage: 'centro', dk: 'normal', win: true, t: 90 }); unlockNext(3, stageNumber);
    resetProgress();
    expect(unlockedStage(stageNumber)).toBe(1); // aunque el registro de peleas tenga victorias
    expect(getGarage()).toEqual({ wallet: 0, levels: {} });
    expect(getPlayerName()).toBe('Rosa');
    expect(ranking()[0].total).toBe(8000);
  });
});

describe('textos', () => {
  it('sin dos puntos, punto y coma ni guiones largos en los diálogos', async () => {
    const src = await import('node:fs').then((fs) => fs.readFileSync('src/scenes/player-dialogs.ts', 'utf8'));
    const strings = [...src.matchAll(/'([^'\n]*[a-záéíóúñ][^'\n]*)'/g)].map((m) => m[1]).filter((t) => /\s/.test(t));
    for (const t of strings) expect(t).not.toMatch(/[:;—]/);
  });
});

