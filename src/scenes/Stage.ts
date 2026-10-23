import Phaser from 'phaser';
import { setupCamera } from '../core/camera';
import type { DiffKey } from '../core/config';
import { Sfx } from '../core/audio/sfx';
import { keys, setDeckCooldowns } from '../core/input';
import { beginLayers, createLayers, endLayers, renderEntities, type Layers } from '../core/render';
import { createGame, type Game } from '../core/state';
import { clamp, rnd } from '../core/util';
import { summarize, update, updateWorld } from '../core/world';
import { DEFAULT_STAGE, STAGES, track, type StageDef } from '../stages';

export interface StageData { stageId?: string; dk?: DiffKey }

/* Etapa genérica: simula con el motor común y dibuja con el paisaje y el jefe que aporta la etapa. */
export class StageScene extends Phaser.Scene {
  private L!: Layers;
  private def!: StageDef;
  private G!: Game;
  private data0: Required<StageData> = { stageId: DEFAULT_STAGE, dk: 'normal' };

  constructor() { super('Stage'); }

  init(data: StageData): void {
    this.data0 = { stageId: data.stageId ?? DEFAULT_STAGE, dk: data.dk ?? 'normal' };
  }

  create(): void {
    setupCamera(this);
    this.L = createLayers(this);
    this.def = STAGES[this.data0.stageId];
    this.G = createGame(this.def.cfg, this.data0.dk, keys, this.def.ai);
    Sfx.init(); Sfx.music(true);
  }

  update(_t: number, delta: number): void {
    const G = this.G, dt = Math.min(0.05, delta / 1000);
    track.scroll += (G.mode === 'play' ? G.speed : this.def.cfg.road.idleScroll) * dt;
    if (G.mode === 'play') {
      if (update(G, dt)) {
        const summary = summarize(G);
        this.time.delayedCall(900, () => this.scene.launch('Results', { summary, stageId: this.data0.stageId, dk: this.data0.dk }));
      }
    } else { G.t += dt; updateWorld(G, dt); }
    Sfx.tick();
    // sacudón: desplaza la cámara, no el contexto
    const s = G.shake > 0 ? G.shake * 4 : 0;
    setupCamera(this, s ? rnd(-4, 4) * s : 0, s ? rnd(-4, 4) * s : 0);
    beginLayers(this.L);
    this.def.drawWorld(this.L.world, this.def.cfg, track.scroll, G);
    renderEntities(this.L, G, this.def.drawBoss);
    endLayers(this.L);
    const Wp = G.cfg.weapons, cd = G.p.cd;
    setDeckCooldowns({ cone: clamp(cd.cone / Wp.cone.cd, 0, 1), oil: clamp(cd.oil / Wp.oil.cd, 0, 1), horn: clamp(cd.horn / Wp.horn.cd, 0, 1) });
  }

  // expuesto para pruebas en el navegador
  get game0(): Game { return this.G; }
}
