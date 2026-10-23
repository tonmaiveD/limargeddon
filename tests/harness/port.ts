import { createGame, newKeys, type Game } from '../../src/core/state';
import type { DiffKey } from '../../src/core/config';
import { update } from '../../src/core/world';
import { STAGES } from '../../src/stages';

export function startPort(dk: DiffKey): Game {
  const def = STAGES['san-isidro'];
  return createGame(def.cfg, dk, newKeys(), def.ai);
}
export const stepPort = (G: Game, dt: number) => update(G, dt);
