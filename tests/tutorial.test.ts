import { beforeEach, describe, expect, it } from 'vitest';
import { startPort, stepPort } from './harness/port';
import { seedRandom } from './harness/rng';
import { STAGES, STAGE_ORDER } from '../src/stages';
import { hurt } from '../src/core/state';
import { validHintEvent } from '../src/core/hints';
import { earnedMedals, medalsFor } from '../src/core/medals';
import { scoreFight, scorePoints } from '../src/core/score';
import { addMedals, getMedals, getRecord, markTutorial, recordScore, resetProgress, tutorialSeen } from '../src/core/save';

/* Aprender y volver (ADR 0037): tutorial en contexto, medallas y récord con contexto. */

const DT = 1 / 60;
function withSeed<T>(seed: number, fn: () => T): T { const r = seedRandom(seed); try { return fn(); } finally { r(); } }
function memStorage(): void {
  const mem = new Map<string, string>();
  (globalThis as any).localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => mem.set(k, v) };
}

describe('tutorial en contexto', () => {
  it('las diez etapas tienen ayudas válidas, cortas y sin puntuación prohibida', () => {
    for (const id of STAGE_ORDER) {
      const hints = STAGES[id].cfg.hints ?? [];
      expect(hints.length, id).toBeGreaterThan(0);
      for (const h of hints) {
        expect(h.at !== undefined || (h.on !== undefined && validHintEvent(h.on)), `${id}: ${h.on}`).toBe(true);
        expect(h.text.length, h.text).toBeLessThanOrEqual(42);
        expect(h.text).not.toMatch(/[:;—]/);
      }
    }
  });

  it('Miraflores enseña los controles en su momento y según el modo de disparo', () => withSeed(1, () => {
    for (const mode of ['toque', 'acelerar'] as const) {
      const G = startPort('normal', STAGES.miraflores.cfg); G.fireMode = mode; G.p.pw.soat = 999;
      const seen: string[] = [];
      for (let i = 0; i < 60 * 20 && G.mode === 'play'; i++) { stepPort(G, DT); if (G.hint && seen.at(-1) !== G.hint.text) seen.push(G.hint.text); }
      expect(seen.slice(0, 2)).toEqual(['Gira a los lados para cambiar de carril', 'Suelta el acelerador para esquivar']);
      expect(seen).toContain(mode === 'toque' ? 'Toca CONOS para lanzar, se recargan' : 'Mientras aceleras, lanzas conos');
      expect(seen).not.toContain(mode === 'toque' ? 'Mientras aceleras, lanzas conos' : 'Toca CONOS para lanzar, se recargan');
    }
  }));

  it('un aviso de peligro entra al instante y las ayudas se apagan después de la primera pelea', () => withSeed(2, () => {
    const G = startPort('normal', STAGES.centro.cfg);
    for (let i = 0; i < 400 && G.b.state === 'enter'; i++) stepPort(G, DT);
    G.hint = { text: 'otra', life: 3.2 };
    G.b.state = 'teleJet'; G.b.st = 1; stepPort(G, DT);
    expect(G.hint?.text).toBe('Brilla la boquilla, cámbiate de carril');
    const H = startPort('normal', STAGES.centro.cfg); H.hintsOn = false;
    for (let i = 0; i < 400 && H.b.state === 'enter'; i++) stepPort(H, DT);
    H.b.state = 'teleJet'; H.b.st = 1; stepPort(H, DT);
    expect(H.hint).toBeNull();
  }));

  it('se recuerda qué etapas ya enseñaron, y empezar de nuevo las vuelve a mostrar', () => {
    memStorage();
    expect(tutorialSeen('centro')).toBe(false);
    markTutorial('centro'); markTutorial('centro');
    expect(tutorialSeen('centro')).toBe(true);
    resetProgress();
    expect(tutorialSeen('centro')).toBe(false);
  });
});

describe('medallas', () => {
  beforeEach(memStorage);

  it('tres por etapa, con Don Frío en la Costa Verde y la ruta propia en la secreta', () => {
    for (const id of STAGE_ORDER) expect(medalsFor(STAGES[id].cfg)).toHaveLength(3);
    expect(medalsFor(STAGES['costa-verde'].cfg).map((m) => m.id)).toEqual(['racha', 'ciego', 'donfrio']);
    expect(medalsFor(STAGES['linea-amarilla'].cfg).map((m) => m.id)).toEqual(['seco', 'pagado', 'primera']);
    for (const m of STAGE_ORDER.flatMap((id) => medalsFor(STAGES[id].cfg))) expect(m.name + m.desc).not.toMatch(/[:;—]/);
  });

  it('se ganan solo al vencer y cumpliendo cada condición', () => withSeed(3, () => {
    const G = startPort('normal', STAGES.centro.cfg);
    G.combo.best = 8; G.stats.effTotal = 100; G.stats.effRight = 85;
    expect(earnedMedals(G)).toEqual([]); // sin victoria no hay medallas
    G.result = { win: true };
    expect(earnedMedals(G)).toEqual(['racha', 'ciego', 'limpio']);
    G.stats.infractions = 1; G.combo.best = 7; G.stats.effRight = 70;
    expect(earnedMedals(G)).toEqual([]);
  }));

  it('quedan guardadas por jugador y etapa, y una repetida no es nueva', () => {
    expect(addMedals('Rosa', 'centro', ['racha'])).toEqual(['racha']);
    expect(addMedals('Rosa', 'centro', ['racha', 'limpio'])).toEqual(['limpio']);
    expect(getMedals('Rosa', 'centro')).toEqual(['racha', 'limpio']);
    expect(getMedals('Lucho', 'centro')).toEqual([]);
  });
});

describe('récord con contexto', () => {
  beforeEach(memStorage);

  it('el récord guarda con qué se hizo, y un récord sin detalle no hereda el contexto viejo', () => {
    const ctx = { points: 8000, v: 2, mode: 'toque' as const, dk: 'normal' as const, upgrades: { conos: 1 }, parts: { base: 4000 } };
    recordScore('Rosa', 'centro', 8000, ctx);
    expect(getRecord('Rosa', 'centro')).toEqual({ points: 8000, ctx });
    recordScore('Rosa', 'centro', 7000, { ...ctx, points: 7000 }); // no es récord, no cambia nada
    expect(getRecord('Rosa', 'centro')?.ctx?.points).toBe(8000);
    recordScore('Rosa', 'centro', 9000);
    expect(getRecord('Rosa', 'centro')).toEqual({ points: 9000, ctx: undefined });
  });

  it('las partes del puntaje suman el total, y el daño recibido se guarda por fuente', () => withSeed(4, () => {
    const G = startPort('dificil', STAGES.centro.cfg); G.p.pw.soat = 0;
    hurt(G, 5, 'COMBI'); hurt(G, 3, 'COMBI'); hurt(G, 4, 'CHORRO');
    G.t = 90; G.combo.best = 5; G.stats.effTotal = 100; G.stats.effRight = 60; G.result = { win: true };
    const parts = scorePoints(G), sum = Object.values(parts).reduce((a, b) => a + b, 0);
    expect(Math.abs(sum - scoreFight(G))).toBeLessThanOrEqual(3);
    expect(Object.keys(G.stats.dmgBy).sort()).toEqual(['CHORRO', 'COMBI']);
    expect(G.stats.dmgBy.COMBI).toBeGreaterThan(G.stats.dmgBy.CHORRO);
  }));
});
