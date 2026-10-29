import Phaser from 'phaser';
import { setupCamera } from '../core/camera';
import type { DiffKey } from '../core/config';
import { beginLayers, createLayers, endLayers, setWarp, type Layers } from '../core/render';
import { roadWarp } from '../core/road';
import { setDeckAmmo, setDeckCooldowns, setDeckMode } from '../core/input';
import { FIRE_MODES, type FireMode } from '../core/config';
import { DEFAULT_NAME, creditsSeen, forgetHints, getMedals, getPlayerName, getSettings, knownHints, setSettings, unlockedStage } from '../core/save';
import { medalChips } from './medal-chips';
import { openName, openRanking, openReset } from './player-dialogs';
import { Sfx } from '../core/audio/sfx';
import type { CreditsData } from './Credits';
import { DEFAULT_STAGE, STAGES, STAGE_ORDER, TEST_MODE, stageForUnlocked, stageNumber, track } from '../stages';

/* Menú: overlay DOM con dificultad y bonus sobre el asfalto que sigue corriendo. */
export class MenuScene extends Phaser.Scene {
  private L!: Layers;
  private stageId = DEFAULT_STAGE;

  constructor() { super('Menu'); }

  create(): void {
    setupCamera(this);
    this.L = createLayers(this);
    // Las etapas se juegan en orden: el menú ofrece la más avanzada desbloqueada y deja volver a las ya ganadas
    // (ADR 0039). Solo el modo prueba deja elegir cualquiera y recuerda la última elegida.
    const saved = getSettings().stageId;
    this.stageId = TEST_MODE ? (saved && STAGES[saved] ? saved : DEFAULT_STAGE) : this.latest();
    // revisión de los créditos (ADR 0049): en el modo prueba, ?creditos=segundos los muestra quietos en ese instante
    const at = new URLSearchParams(location.search).get('creditos');
    if (TEST_MODE && at !== null) {
      document.getElementById('menu')!.hidden = true;
      const data: CreditsData = { done: (cs) => cs.scene.start('Menu'), at: Number(at) || 0, talk: new URLSearchParams(location.search).has('claxon') };
      this.scene.start('Credits', data);
      return;
    }
    this.setupStageSelector();
    this.showStage();
    this.setupPlayer();
    this.setupMedley();
  }

  // Con ?popurri en la dirección se puede escuchar la música de los créditos antes de que exista la escena (ADR 0048).
  private medleyBtn: HTMLElement | null = null;
  private setupMedley(): void {
    if (typeof location === 'undefined' || !new URLSearchParams(location.search).has('popurri')) return;
    const b = this.medleyBtn = document.getElementById('toMedley')!;
    b.hidden = false; b.textContent = 'Escuchar popurrí';
    b.onclick = () => { Sfx.init(); if (Sfx.section()) Sfx.music(false); else Sfx.music(true, 'creditos'); };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { Sfx.music(false); b.hidden = true; this.medleyBtn = null; });
  }

  // Jugador (ADR 0029): nombre, ranking y empezar de nuevo. La primera vez se pide el nombre antes de jugar.
  private setupPlayer(): void {
    const name = document.getElementById('toName')!;
    const label = () => { name.textContent = `Jugador · ${getPlayerName() ?? DEFAULT_NAME}`; };
    label();
    name.onclick = () => openName(false, () => { label(); this.showStage(); }); // las medallas son del jugador (auditoría R04)
    document.getElementById('toRanking')!.onclick = () => openRanking();
    // créditos (ADR 0049): el botón aparece cuando ya se vieron completos una vez, y siempre en el modo prueba
    const credits = document.getElementById('toCredits')!;
    credits.hidden = !(creditsSeen() || TEST_MODE);
    credits.onclick = () => {
      Sfx.init(); document.getElementById('menu')!.hidden = true;
      const data: CreditsData = { done: (cs) => cs.scene.start('Menu') };
      this.scene.start('Credits', data);
    };
    // interruptor de ayudas (ADR 0039): apagadas no sale ninguna; al prenderlas vuelven solo las no leídas
    const hints = document.getElementById('toHintsOnOff')!;
    const paintHints = () => { const on = getSettings().hints !== false; hints.textContent = on ? 'Ayudas activadas' : 'Ayudas desactivadas'; hints.setAttribute('aria-pressed', String(on)); };
    hints.onclick = () => { setSettings({ hints: getSettings().hints === false }); paintHints(); this.showStage(); };
    paintHints();
    document.getElementById('toReset')!.onclick = () => openReset(() => this.scene.restart());
    if (!getPlayerName()) openName(true, label);
  }

  private latest(): string { return stageForUnlocked(unlockedStage(stageNumber)); }

  // Selector de etapa: las ya desbloqueadas, para volver por medallas o récords (ADR 0039). En modo prueba, todas.
  private setupStageSelector(): void {
    const box = document.getElementById('stageSel')!, unlocked = unlockedStage(stageNumber);
    const ids = STAGE_ORDER.filter((id) => TEST_MODE || STAGES[id].cfg.number <= unlocked);
    box.innerHTML = '';
    box.hidden = ids.length < 2;
    ids.forEach((id) => {
      const b = document.createElement('button');
      b.type = 'button'; b.setAttribute('role', 'radio'); b.dataset.stage = id;
      // solo el número, para que entren las diez etapas; el nombre completo se ve abajo y en el lector de pantalla
      b.className = 'seg num'; b.textContent = String(STAGES[id].cfg.number);
      b.setAttribute('aria-label', `${STAGES[id].cfg.number} · ${STAGES[id].cfg.district}`); b.title = STAGES[id].cfg.district;
      b.onclick = () => { this.stageId = id; if (TEST_MODE) setSettings({ stageId: id }); this.showStage(); };
      box.appendChild(b);
    });
    document.getElementById('toLatest')!.onclick = () => { this.stageId = this.latest(); this.showStage(); };
  }

  private showStage(): void {
    document.querySelectorAll<HTMLButtonElement>('#stageSel [data-stage]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.stage === this.stageId)));
    const { cfg } = STAGES[this.stageId];
    const $ = (id: string) => document.getElementById(id)!;
    $('menuEyebrow').textContent = cfg.eyebrow;
    // pista de la etapa secreta: aparece a mitad del recorrido y desaparece cuando ya se puede jugar
    const secret = STAGE_ORDER.map((id) => STAGES[id].cfg).find((c) => c.secret), unlocked = unlockedStage(stageNumber);
    $('secretHint').hidden = !secret || unlocked < 5 || unlocked >= secret.number;
    $('menuBoss').textContent = cfg.boss.title;
    $('menuTip').textContent = cfg.tip;
    $('menuMedals').innerHTML = medalChips(cfg, getMedals(getPlayerName() ?? DEFAULT_NAME, this.stageId));
    // volver a una etapa ya ganada: se avisa que paga la mitad y se ofrece seguir el recorrido
    $('replayNote').hidden = TEST_MODE || this.stageId === this.latest();
    // "Ver ayudas otra vez" aparece si esta etapa ya enseñó algo, en cualquiera de los dos modos (auditoría R01)
    const hintsBtn = $('toHints') as HTMLButtonElement, learned = FIRE_MODES.some((m) => knownHints(this.stageId, m).length > 0);
    hintsBtn.hidden = !learned || getSettings().hints === false; hintsBtn.textContent = 'Ver ayudas otra vez';
    hintsBtn.onclick = () => { forgetHints(this.stageId); hintsBtn.textContent = 'Las ayudas vuelven a salir'; };
    $('menuPowers').innerHTML = Object.values(cfg.powers)
      .map((P) => `<span><i style="background:${P.col}">${P.L}</i>${P.label}</span>`).join('');
    const diffs = $('menuDiffs'); diffs.innerHTML = '';
    (Object.keys(cfg.difficulties) as DiffKey[]).forEach((dk) => {
      const b = document.createElement('button');
      b.className = 'pick' + (dk === 'normal' ? '' : ' alt'); b.dataset.diff = dk; b.id = 'd-' + dk; b.textContent = cfg.difficulties[dk].label;
      b.addEventListener('click', () => {
        Sfx.init(); $('menu').hidden = true; setSettings({ dk });
        this.scene.start('Stage', { stageId: this.stageId, dk });
      });
      diffs.appendChild(b);
    });
    this.setupFireSelector(cfg.weapons.cone.mode !== undefined, !!cfg.route);
    ($('toGarage') as HTMLButtonElement).onclick = () => {
      $('menu').hidden = true; this.scene.start('Garage', { stageId: this.stageId, dk: getSettings().dk ?? 'normal' });
    };
    $('menu').hidden = false;
    Sfx.engine(0);
    setDeckCooldowns({ cone: 0, oil: 0, horn: 0 });
    setDeckAmmo(0, 0);
  }

  // Selector del modo de disparo (los dos son opciones permanentes, ADR 0013); la elección se guarda en el dispositivo.
  private setupFireSelector(enabled: boolean, route = false): void {
    const box = document.getElementById('fireSel')!, tip = document.getElementById('fireTip')!;
    box.hidden = !enabled; tip.hidden = !enabled;
    if (!enabled) return;
    // en la ruta no hay jefe: el texto habla de abrirse paso y llegar al carguero, no de racha ni punto ciego
    const TIPS: Record<FireMode, string> = route ? {
      toque: 'Cada toque lanza un cono para abrirte paso. Acelera a fondo, que la marea no espera, y sube a la rampa del carguero.',
      acelerar: 'Mientras aceleras, el Tico lanza conos solo y te abre paso. No sueltes, que la marea no espera.',
      mantener: '',
    } : {
      toque: 'Cada toque lanza un cono. Tienes 3 y se recargan de a uno, y si pegas seguido por la derecha armas una racha que suma daño, hasta +30%.',
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
    beginLayers(this.L); setWarp(this.L, roadWarp(def.cfg, track.scroll)); def.drawWorld(this.L.world, def.cfg, track.scroll, null); endLayers(this.L);
    if (this.medleyBtn) { Sfx.tick(); const s = Sfx.section(); this.medleyBtn.textContent = s ? `Popurrí · ${s} · detener` : 'Escuchar popurrí'; }
  }
}
