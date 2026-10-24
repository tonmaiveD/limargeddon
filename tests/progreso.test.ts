import { beforeEach, describe, expect, it } from 'vitest';
import { recordFight, unlockNext, unlockedStage } from '../src/core/save';
import { STAGE_ORDER, nextStage, stageForUnlocked, stageNumber } from '../src/stages';

describe('etapas en orden', () => {
  beforeEach(() => {
    const mem = new Map<string, string>();
    (globalThis as any).localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => mem.set(k, v) };
  });

  it('el orden de juego sigue el número de cada etapa', () => {
    expect(STAGE_ORDER).toEqual(['miraflores', 'san-isidro', 'centro', 'javier-prado', 'gamarra', 'callao', 'via-expresa', 'panamericana']);
    expect(nextStage('miraflores')).toBe('san-isidro');
    expect(nextStage('centro')).toBe('javier-prado');
    expect(nextStage('javier-prado')).toBe('gamarra');
    expect(nextStage('gamarra')).toBe('callao');
    expect(nextStage('callao')).toBe('via-expresa');
    expect(nextStage('via-expresa')).toBe('panamericana');
    expect(nextStage('panamericana')).toBeNull();
  });

  it('sin progreso se empieza en la etapa 1', () => {
    expect(unlockedStage(stageNumber)).toBe(1);
    expect(stageForUnlocked(1)).toBe('miraflores');
  });

  it('ganar desbloquea la siguiente y repetir una etapa anterior no retrocede', () => {
    unlockNext(1, stageNumber);
    expect(unlockedStage(stageNumber)).toBe(2);
    unlockNext(2, stageNumber);
    expect(stageForUnlocked(unlockedStage(stageNumber))).toBe('centro');
    unlockNext(1, stageNumber);
    expect(unlockedStage(stageNumber)).toBe(3);
  });

  it('se reconstruye desde las victorias ya registradas', () => {
    recordFight({ stage: 'san-isidro', dk: 'normal', win: true, t: 100 });
    recordFight({ stage: 'centro', dk: 'normal', win: false, t: 60 });
    expect(unlockedStage(stageNumber)).toBe(3);
  });

  it('si se desbloquea una etapa que aún no existe, se queda en la última disponible', () => {
    expect(stageForUnlocked(9)).toBe('panamericana');
  });
});
