import type { StageConfig } from '../core/config';
import type { Gfx } from '../core/gfx';
import type { BossAI, Game } from '../core/state';
import { Q8 } from '../bosses/q8';
import { drawQ8 } from '../bosses/q8-render';
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
  'san-isidro': { cfg: sanIsidroConfig as unknown as StageConfig, ai: Q8, drawBoss: drawQ8, drawWorld: sanIsidroWorld },
};

export const DEFAULT_STAGE = 'san-isidro';

// Scroll global del asfalto: sigue corriendo entre menú, etapa y resultados, como en el prototipo.
export const track = { scroll: 0 };
