import type { ItemDef, StageConfig } from '../core/config';
import type { Gfx } from '../core/gfx';
import type { BossAI, Game } from '../core/state';
import { PhaseBoss } from '../bosses/phase-boss';
import { drawQ8 } from '../bosses/q8-render';
import { drawSerenazgo } from '../bosses/serenazgo-render';
import { drawRochabus } from '../bosses/rochabus-render';
import { drawCombiAsesina } from '../bosses/combi-render';
import centroConfig from './centro/config.json';
import { drawWorld as centroWorld } from './centro/scenery';
import javierPradoConfig from './javier-prado/config.json';
import { drawWorld as javierPradoWorld } from './javier-prado/scenery';
import mirafloresConfig from './miraflores/config.json';
import { drawWorld as mirafloresWorld } from './miraflores/scenery';
import sanIsidroConfig from './san-isidro/config.json';
import { drawWorld as sanIsidroWorld } from './san-isidro/scenery';

// Registro de etapas: datos (JSON) + jefe + paisaje. El motor de Stage no conoce ninguna etapa en particular.
export interface StageDef {
  cfg: StageConfig;
  ai: BossAI;
  drawBoss: (g: Gfx, G: Game) => void;
  drawWorld: (g: Gfx, cfg: StageConfig, scroll: number, G: Game | null) => void;
}

export const STAGES: Record<string, StageDef> = {
  centro: { cfg: centroConfig as unknown as StageConfig, ai: PhaseBoss, drawBoss: drawRochabus, drawWorld: centroWorld },
  'javier-prado': { cfg: javierPradoConfig as unknown as StageConfig, ai: PhaseBoss, drawBoss: drawCombiAsesina, drawWorld: javierPradoWorld },
  miraflores: { cfg: mirafloresConfig as unknown as StageConfig, ai: PhaseBoss, drawBoss: drawSerenazgo, drawWorld: mirafloresWorld },
  'san-isidro': { cfg: sanIsidroConfig as unknown as StageConfig, ai: PhaseBoss, drawBoss: drawQ8, drawWorld: sanIsidroWorld },
};

export const DEFAULT_STAGE = 'miraflores';

// Etapas en orden de juego y utilidades de progreso.
export const STAGE_ORDER = Object.keys(STAGES).sort((a, b) => STAGES[a].cfg.number - STAGES[b].cfg.number);
export const stageNumber = (id: string): number | undefined => STAGES[id]?.cfg.number;
// La etapa que toca jugar: la más avanzada desbloqueada que exista (si se desbloqueó una que aún no está hecha, la última).
export function stageForUnlocked(unlocked: number): string {
  let id = STAGE_ORDER[0];
  for (const s of STAGE_ORDER) if (STAGES[s].cfg.number <= unlocked) id = s;
  return id;
}
export function nextStage(id: string): string | null {
  const i = STAGE_ORDER.indexOf(id);
  return i >= 0 && i < STAGE_ORDER.length - 1 ? STAGE_ORDER[i + 1] : null;
}
// Objetos de victoria que ya tiene el jugador: los de cada etapa ganada (las menores a la desbloqueada).
export function wonItems(unlocked: number): ItemDef[] {
  return STAGE_ORDER.map((s) => STAGES[s].cfg).filter((c) => c.number < unlocked && c.rewards.item).map((c) => c.rewards.item!);
}
// Modo prueba (?prueba en la dirección): muestra el selector de etapas para probar sin desbloquear.
export const TEST_MODE = typeof location !== 'undefined' && new URLSearchParams(location.search).has('prueba');

// Scroll global del asfalto: sigue corriendo entre menú, etapa y resultados, como en el prototipo.
export const track = { scroll: 0 };
