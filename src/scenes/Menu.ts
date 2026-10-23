import Phaser from 'phaser';
import { setupCamera } from '../core/camera';
import type { DiffKey } from '../core/config';
import { beginLayers, createLayers, endLayers, type Layers } from '../core/render';
import { setDeckCooldowns } from '../core/input';
import { Sfx } from '../core/audio/sfx';
import { DEFAULT_STAGE, STAGES, track } from '../stages';

/* Menú: overlay DOM con dificultad y bonus sobre el asfalto que sigue corriendo. */
export class MenuScene extends Phaser.Scene {
  private L!: Layers;
  private stageId = DEFAULT_STAGE;

  constructor() { super('Menu'); }

  create(): void {
    setupCamera(this);
    this.L = createLayers(this);
    const { cfg } = STAGES[this.stageId];
    const $ = (id: string) => document.getElementById(id)!;
    $('menuEyebrow').textContent = cfg.eyebrow;
    $('menuBoss').textContent = cfg.boss.title;
    $('menuTip').textContent = cfg.tip;
    $('menuPowers').innerHTML = Object.values(cfg.powers)
      .map((P) => `<span><i style="background:${P.col}">${P.L}</i>${P.label}</span>`).join('');
    const diffs = $('menuDiffs'); diffs.innerHTML = '';
    (Object.keys(cfg.difficulties) as DiffKey[]).forEach((dk) => {
      const b = document.createElement('button');
      b.className = 'pick' + (dk === 'normal' ? '' : ' alt'); b.dataset.diff = dk; b.id = 'd-' + dk; b.textContent = cfg.difficulties[dk].label;
      b.addEventListener('click', () => {
        Sfx.init(); $('menu').hidden = true;
        this.scene.start('Stage', { stageId: this.stageId, dk });
      });
      diffs.appendChild(b);
    });
    $('menu').hidden = false;
    Sfx.engine(0);
    setDeckCooldowns({ cone: 0, oil: 0, horn: 0 });
  }

  update(_t: number, delta: number): void {
    const dt = Math.min(0.05, delta / 1000), def = STAGES[this.stageId];
    track.scroll += def.cfg.road.idleScroll * dt;
    beginLayers(this.L); def.drawWorld(this.L.world, def.cfg, track.scroll, null); endLayers(this.L);
  }
}
