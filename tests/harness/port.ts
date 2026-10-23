import { createGame, newKeys, type Game } from '../../src/core/state';
import type { DiffKey, StageConfig } from '../../src/core/config';
import { update } from '../../src/core/world';
import { STAGES } from '../../src/stages';
import prototipo from '../fixtures/san-isidro-prototipo.json';

// Config del prototipo v3 tal cual (números y modos originales), para la prueba de paridad.
export const PROTOTYPE_CFG = prototipo as unknown as StageConfig;

export function startPort(dk: DiffKey, cfg: StageConfig = STAGES['san-isidro'].cfg): Game {
  return createGame(cfg, dk, newKeys(), STAGES['san-isidro'].ai);
}
export const stepPort = (G: Game, dt: number) => update(G, dt);
