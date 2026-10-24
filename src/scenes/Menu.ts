import Phaser from 'phaser';
import { setupCamera } from '../core/camera';
import type { DiffKey } from '../core/config';
import { beginLayers, createLayers, endLayers, type Layers } from '../core/render';
import { setDeckAmmo, setDeckCooldowns, setDeckMode } from '../core/input';
import { FIRE_MODES, type FireMode } from '../core/config';
import { getSettings, setSettings, unlockedStage } from '../core/save';
import { Sfx } from '../core/audio/sfx';
import { DEFAULT_STAGE, STAGES, STAGE_ORDER, TEST_MODE, stageForUnlocked, stageNumber, track } from '../stages';

/* Menú: overlay DOM con dificultad y bonus sobre el asfalto que sigue corriendo. */
export class MenuScene extends Phaser.Scene {
  private L!: Layers;
  private stageId = DEFAULT_STAGE;

  constructor() { super('Menu'); }

  create(): void {
    setupCamera(this);
    this.L = createLayers(this);
    // Las etapas se juegan en orden: el menú ofrece la más avanzada desbloqueada. Solo el modo prueba deja elegir.
    const saved = getSettings().stageId;
    this.stageId = TEST_MODE ? (saved && STAGES[saved] ? saved : DEFAULT_STAGE) : stageForUnlocked(unlockedStage(stageNumber));
    this.setupStageSelector();
    this.showStage();
  }

  // Selector de etapa, solo en modo prueba (?prueba en la dirección). Recuerda la última elegida.
  private setupStageSelector(): void {
    const box = document.getElementById('stageSel')!;
    box.hidden = !TEST_MODE;
    box.innerHTML = '';
    if (!TEST_MODE) return;
    STAGE_ORDER.forEach((id) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'seg'; b.setAttribute('role', 'radio'); b.dataset.stage = id;
      b.textContent = `${STAGES[id].cfg.number} · ${STAGES[id].cfg.district}`;
      b.onclick = () => { this.stageId = id; setSettings({ stageId: id }); this.showStage(); };
      box.appendChild(b);
    });
  }

  private showStage(): void {
    document.querySelectorAll<HTMLButtonElement>('#stageSel [data-stage]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.stage === this.stageId)));
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
    this.setupFireSelector(cfg.weapons.cone.mode !== undefined);
    $('menu').hidden = false;
    Sfx.engine(0);
    setDeckCooldowns({ cone: 0, oil: 0, horn: 0 });
    setDeckAmmo(0, 0);
  }

  // Selector del modo de disparo (los dos son opciones permanentes, ADR 0013); la elección se guarda en el dispositivo.
  private setupFireSelector(enabled: boolean): void {
    const box = document.getElementById('fireSel')!, tip = document.getElementById('fireTip')!;
    box.hidden = !enabled; tip.hidden = !enabled;
    if (!enabled) return;
    const TIPS: Record<FireMode, string> = {
      toque: 'Cada toque lanza un cono; tienes 3 y se recargan de a uno. Seguidos por la derecha suben el combo.',
      acelerar: 'Mientras aceleras, el Tico lanza conos solo. Atacar te obliga a acercarte.',
      mantener: '',
    };
    const current = (): FireMode => { const m = getSettings().fireMode; return m && FIRE_MODES.includes(m) ? m : 'toque'; };
    const paint = () => {
      const m = current();
      box.querySelectorAll<HTMLButtonElement>('[data-fire]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.fire === m)));
      tip.textContent = TIPS[m]; setDeckMode(m);
    };
    box.querySelectorAll<HTMLButtonElement>('[data-fire]').forEach((b) => {
      b.onclick = () => { setSettings({ fireMode: b.dataset.fire as FireMode }); paint(); };
    });
    paint();
  }

  update(_t: number, delta: number): void {
    const dt = Math.min(0.05, delta / 1000), def = STAGES[this.stageId];
    track.scroll += def.cfg.road.idleScroll * dt;
    setupCamera(this); // la vista puede cambiar de ancho al rotar o redimensionar
    beginLayers(this.L); def.drawWorld(this.L.world, def.cfg, track.scroll, null); endLayers(this.L);
  }
}
