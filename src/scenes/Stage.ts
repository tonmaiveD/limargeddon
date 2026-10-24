import Phaser from 'phaser';
import { setupCamera } from '../core/camera';
import type { DiffKey, FireMode } from '../core/config';
import { Sfx } from '../core/audio/sfx';
import { keys, pauseHook, setDeckAmmo, setDeckCooldowns, setDeckMode } from '../core/input';
import { beginLayers, createLayers, endLayers, renderEntities, type Layers } from '../core/render';
import { createGame, newKeys, type Game } from '../core/state';
import { clamp, rnd } from '../core/util';
import { summarize, update, updateWorld } from '../core/world';
import { getGarage, getSettings, settleFight } from '../core/save';
import { applyUpgrades } from '../garage/upgrades';
import { DEFAULT_STAGE, STAGES, stageNumber, track, type StageDef } from '../stages';

export interface StageData { stageId?: string; dk?: DiffKey }

const $ = (id: string) => document.getElementById(id)!;

/* Etapa genérica: simula con el motor común y dibuja con el paisaje y el jefe que aporta la etapa. */
export class StageScene extends Phaser.Scene {
  private L!: Layers;
  private def!: StageDef;
  private G!: Game;
  private data0: Required<StageData> = { stageId: DEFAULT_STAGE, dk: 'normal' };
  private paused = false;
  private onHidden = () => { if (document.hidden) this.setPaused(true); };
  private onBlur = () => this.setPaused(true);

  constructor() { super('Stage'); }

  init(data: StageData): void {
    this.data0 = { stageId: data.stageId ?? DEFAULT_STAGE, dk: data.dk ?? 'normal' };
  }

  create(): void {
    setupCamera(this);
    this.L = createLayers(this);
    this.def = STAGES[this.data0.stageId];
    const mode: FireMode | undefined = this.def.cfg.weapons.cone.mode ? getSettings().fireMode : undefined;
    // las mejoras del taller se aplican sobre una copia de la config de la etapa (ADR 0018)
    this.G = createGame(applyUpgrades(this.def.cfg, getGarage().levels), this.data0.dk, keys, this.def.ai, mode);
    setDeckMode(this.G.fireMode);
    this.paused = false;
    Sfx.init(); Sfx.music(true);

    // pausa: botón, teclas P/Escape y automática al salir de la app o perder el foco (llamada, notificación)
    const btn = $('pauseBtn') as HTMLButtonElement;
    btn.hidden = false; btn.onclick = () => this.setPaused(true);
    ($('resume') as HTMLButtonElement).onclick = () => this.setPaused(false);
    ($('quit') as HTMLButtonElement).onclick = () => this.quitToMenu();
    pauseHook.toggle = () => this.setPaused(!this.paused);
    document.addEventListener('visibilitychange', this.onHidden);
    addEventListener('blur', this.onBlur);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      document.removeEventListener('visibilitychange', this.onHidden);
      removeEventListener('blur', this.onBlur);
      pauseHook.toggle = null; btn.hidden = true; $('pause').hidden = true;
    });
  }

  private setPaused(v: boolean): void {
    if (this.G.mode !== 'play' || v === this.paused) return;
    this.paused = v;
    $('pause').hidden = !v;
    if (v) {
      // al pausar se sueltan todos los controles, para no volver con un botón "pegado"
      Object.assign(keys, newKeys());
      Sfx.music(false); Sfx.engine(0);
      ($('resume') as HTMLButtonElement).focus();
    } else Sfx.music(true);
  }

  private quitToMenu(): void {
    this.paused = false; $('pause').hidden = true;
    Sfx.music(false); Sfx.engine(0);
    this.scene.start('Menu');
  }

  update(_t: number, delta: number): void {
    const G = this.G, dt = Math.min(0.05, delta / 1000);
    if (this.paused) return;
    if (G.hitstop > 0) {
      // congelamiento de impacto: la simulación espera unos ms y el cuadro se sigue dibujando
      G.hitstop = Math.max(0, G.hitstop - delta / 1000);
    } else {
      track.scroll += (G.mode === 'play' ? G.speed : this.def.cfg.road.idleScroll) * dt;
      if (G.mode === 'play') {
        if (update(G, dt)) {
          const summary = summarize(G);
          const { earned, replay, wallet } = settleFight(
            { stage: this.data0.stageId, dk: this.data0.dk, win: summary.win, t: summary.seconds, fireMode: G.fireMode, bestCombo: G.combo.best },
            G.cfg.number, summary.pay, stageNumber);
          ($('pauseBtn') as HTMLButtonElement).hidden = true;
          this.time.delayedCall(900, () => this.scene.launch('Results', { summary, stageId: this.data0.stageId, dk: this.data0.dk, earned, replay, wallet }));
        }
      } else { G.t += dt; updateWorld(G, dt); }
    }
    Sfx.tick();
    // sacudón: desplaza la cámara, no el contexto
    const s = G.shake > 0 ? G.shake * 4 : 0;
    setupCamera(this, s ? rnd(-4, 4) * s : 0, s ? rnd(-4, 4) * s : 0);
    beginLayers(this.L);
    this.def.drawWorld(this.L.world, this.def.cfg, track.scroll, G);
    renderEntities(this.L, G, this.def.drawBoss);
    endLayers(this.L);
    const Wp = G.cfg.weapons, cd = G.p.cd, maxAmmo = Wp.cone.ammo ?? 0;
    const coneShade = G.fireMode === 'toque' ? (G.p.ammo > 0 ? 0 : clamp(1 - G.p.reloadT / (Wp.cone.reload ?? 0.5), 0, 1)) : clamp(cd.cone / Wp.cone.cd, 0, 1);
    setDeckCooldowns({ cone: coneShade, oil: clamp(cd.oil / Wp.oil.cd, 0, 1), horn: clamp(cd.horn / Wp.horn.cd, 0, 1) });
    setDeckAmmo(G.fireMode === 'toque' ? G.p.ammo : 0, G.fireMode === 'toque' ? maxAmmo : 0);
  }

  // expuesto para pruebas en el navegador
  get game0(): Game { return this.G; }
}
