import Phaser from 'phaser';
import { showDeck } from '../core/layout';
import { setupCamera } from '../core/camera';
import type { DiffKey, FireMode } from '../core/config';
import { Sfx } from '../core/audio/sfx';
import { keys, pauseHook, setDeckAmmo, setDeckCooldowns, setDeckMode } from '../core/input';
import { beginLayers, createLayers, endLayers, renderEntities, setWarp, type Layers } from '../core/render';
import { roadWarp } from '../core/road';
import { createGame, newKeys, type Game } from '../core/state';
import { clamp, rnd } from '../core/util';
import { summarize, update, updateWorld } from '../core/world';
import { DEFAULT_NAME, addMedals, getGarage, getMedals, getPlayerName, getRecord, getSettings, knownHints, learnHints, recordScore, settleFight, unlockedStage } from '../core/save';
import { SCORE_VERSION, scoreFight, scorePoints } from '../core/score';
import { earnedMedals } from '../core/medals';
import { startEnding, updateEnding } from '../core/ending';
import { learnedHints } from '../core/hints';
import { FrameMeter, frameMs } from '../core/frames';
import type { CreditsData } from './Credits';
import { track as trackData } from '../core/share';
import { abandonEvent, fightEvent } from '../core/telemetry';
import { applyUpgrades } from '../garage/upgrades';
import { DEFAULT_STAGE, STAGES, TEST_MODE, stageNumber, track, wonItems, type StageDef } from '../stages';

export interface StageData { stageId?: string; dk?: DiffKey }

const $ = (id: string) => document.getElementById(id)!;

/* Etapa genérica: simula con el motor común y dibuja con el paisaje y el jefe que aporta la etapa. */
export class StageScene extends Phaser.Scene {
  private L!: Layers;
  private def!: StageDef;
  private G!: Game;
  private data0: Required<StageData> = { stageId: DEFAULT_STAGE, dk: 'normal' };
  private paused = false;
  private meter = new FrameMeter(); // fluidez para el registro (ADR 0045)
  private results: (() => void) | null = null; // abre los resultados una sola vez
  private skip = false; // un toque o una tecla salta la animación de cierre
  private onSkip = () => { if (this.G?.ending && this.G.ending.t > 0.3) this.skip = true; };
  private onHidden = () => { if (document.hidden) this.setPaused(true); };
  private onBlur = () => this.setPaused(true);

  constructor() { super('Stage'); }

  init(data: StageData): void {
    this.data0 = { stageId: data.stageId ?? DEFAULT_STAGE, dk: data.dk ?? 'normal' };
  }

  create(): void {
    showDeck(this.game, true);
    setupCamera(this);
    this.L = createLayers(this);
    this.def = STAGES[this.data0.stageId];
    const mode: FireMode | undefined = this.def.cfg.weapons.cone.mode ? getSettings().fireMode : undefined;
    // las mejoras del taller se aplican sobre una copia de la config de la etapa (ADR 0018)
    const cfg = applyUpgrades(this.def.cfg, getGarage().levels);
    cfg.player.items = wonItems(unlockedStage(stageNumber));
    this.G = createGame(cfg, this.data0.dk, keys, this.def.ai, mode);
    this.G.hintKnown = knownHints(this.data0.stageId, this.G.fireMode); // las ya leídas en este modo no salen (ADR 0039)
    this.G.hintsOn = getSettings().hints !== false; // el jugador puede apagarlas en el menú
    this.results = null; this.skip = false;
    setDeckMode(this.G.fireMode);
    this.paused = false; this.meter = new FrameMeter();
    Sfx.init(); Sfx.music(true, cfg.music);

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
      removeEventListener('pointerdown', this.onSkip); removeEventListener('keydown', this.onSkip);
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
    } else { Sfx.music(true, this.G.cfg.music); this.meter.resume(); }
  }

  // Guarda las ayudas que se alcanzaron a leer. El modo prueba no gasta el tutorial (auditoría R01).
  private saveHints(): void {
    if (!TEST_MODE) learnHints(this.data0.stageId, this.G.fireMode, learnedHints(this.G));
  }

  private quitToMenu(): void {
    this.saveHints();
    // abandonar a mitad de pelea también es un dato: dónde se rinde la gente (ADR 0051)
    const G = this.G;
    if (G.mode === 'play') trackData(TEST_MODE, (c) => abandonEvent({ stage: this.data0.stageId, dk: this.data0.dk, fireMode: G.fireMode, t: Math.round(G.t * 10) / 10,
      phase: G.b.phase, bossPct: Math.round(100 * Math.max(0, G.b.hp) / G.b.max), hpPct: Math.round(100 * Math.max(0, G.p.hp) / G.p.max) }, c));
    this.paused = false; $('pause').hidden = true;
    Sfx.music(false); Sfx.engine(0);
    this.scene.start('Menu');
  }

  update(_t: number, delta: number): void {
    const G = this.G, dt = Math.min(0.05, delta / 1000);
    if (this.paused) return;
    if (G.mode === 'play') this.meter.add(frameMs(this.game.loop)); // intervalo crudo, no el suavizado (ADR 0046)
    if (G.hitstop > 0) {
      // congelamiento de impacto: la simulación espera unos ms y el cuadro se sigue dibujando
      G.hitstop = Math.max(0, G.hitstop - delta / 1000);
    } else {
      track.scroll += (G.mode === 'play' ? G.speed : this.def.cfg.road.idleScroll) * dt;
      if (G.mode === 'play') {
        if (update(G, dt)) {
          const summary = summarize(G), points = scoreFight(G), stageId = this.data0.stageId, upgrades = getGarage().levels;
          const record = { stage: stageId, dk: this.data0.dk, win: summary.win, t: summary.seconds, fireMode: G.fireMode, bestCombo: G.combo.best,
            build: __BUILD__, test: TEST_MODE || undefined, upgrades, bossPct: summary.bossPct, gross: summary.gross, fines: summary.fines, tolls: summary.tolls || undefined,
            points: points || undefined, scoreV: points ? SCORE_VERSION : undefined, lastHit: G.lastHit || undefined, dmgBy: Object.keys(G.stats.dmgBy).length ? G.stats.dmgBy : undefined,
            frames: this.meter.summary() };
          const { earned, replay, wallet } = settleFight(record, G.cfg.number, summary.pay, stageNumber);
          trackData(TEST_MODE, (c) => fightEvent({ ...record, earned, replay }, c)); // datos anónimos (ADR 0051)
          this.saveHints();
          // puntaje (ADR 0029) con su contexto (ADR 0037): solo las victorias, y el modo prueba no entra al ranking ni da medallas
          const name = getPlayerName() ?? DEFAULT_NAME, parts = scorePoints(G);
          const ctx = { points, v: SCORE_VERSION, mode: G.fireMode, dk: this.data0.dk, upgrades, build: __BUILD__, at: new Date().toISOString(), parts };
          const prev = getRecord(name, stageId);
          const score = points ? { points, test: TEST_MODE, parts, prev, ...(TEST_MODE ? { best: points, record: false } : recordScore(name, stageId, points, ctx)) } : null;
          const fresh = TEST_MODE ? [] : addMedals(name, stageId, earnedMedals(G));
          const medals = { have: TEST_MODE ? earnedMedals(G) : getMedals(name, stageId), fresh };
          ($('pauseBtn') as HTMLButtonElement).hidden = true;
          let shown = false;
          this.results = () => {
            if (shown) return; shown = true;
            removeEventListener('pointerdown', this.onSkip); removeEventListener('keydown', this.onSkip);
            this.scene.launch('Results', { summary, stageId, dk: this.data0.dk, earned, replay, wallet, score, medals });
          };
          // tras el cierre de la Línea Amarilla van los créditos (ADR 0049), y de ahí los resultados
          if (summary.win && G.cfg.ending?.credits) {
            const show = this.results;
            let rolled = false;
            this.results = () => {
              if (rolled) return; rolled = true;
              removeEventListener('pointerdown', this.onSkip); removeEventListener('keydown', this.onSkip);
              this.scene.pause();
              const data: CreditsData = { done: (cs) => { cs.scene.stop(); this.scene.resume(); show(); } };
              this.scene.launch('Credits', data); this.scene.bringToTop('Credits');
            };
          }
          // cierre de la etapa (ADR 0038): la carretilla cruza la meta o el Tico sube al carguero; si no hay, resultados
          if (summary.win && G.cfg.ending) { startEnding(G); addEventListener('pointerdown', this.onSkip); addEventListener('keydown', this.onSkip); }
          else this.time.delayedCall(900, () => this.results?.());
        }
      } else if (G.ending) {
        G.t += dt;
        if (updateEnding(G, dt) || this.skip) this.results?.();
      } else { G.t += dt; updateWorld(G, dt); }
    }
    Sfx.tick();
    // sacudón: desplaza la cámara, no el contexto
    const s = G.shake > 0 ? G.shake * 4 : 0;
    setupCamera(this, s ? rnd(-4, 4) * s : 0, s ? rnd(-4, 4) * s : 0);
    beginLayers(this.L); setWarp(this.L, roadWarp(this.def.cfg, track.scroll));
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
