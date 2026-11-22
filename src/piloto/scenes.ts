import Phaser from 'phaser';
import { showDeck } from '../core/layout';
import { setupCamera } from '../core/camera';
import { Sfx } from '../core/audio/sfx';
import { buzz, keys, pauseHook, setDeckAmmo, setDeckCooldowns } from '../core/input';
import { beginLayers, createLayers, endLayers, renderEntities, setWarp, type Layers } from '../core/render';
import { createNight, drawNight, type Night } from '../core/night';
import { roadWarp } from '../core/road';
import { setSkin } from '../core/art/skin';
import { createGame, newKeys, type Game } from '../core/state';
import { clamp, rnd } from '../core/util';
import { update, updateWorld } from '../core/world';
import { startEnding, updateEnding } from '../core/ending';
import { learnedHints } from '../core/hints';
import { FrameMeter, frameMs, type FrameSummary } from '../core/frames';
import { STAGES, track, type StageDef } from '../stages';
import type { PilotVariant } from '../core/telemetry';
import ARTE from './arte.json';
import { CART_LEFT, pilotSkin } from './skin';
import { drawWorld as pilotWorld } from './world';
import { drawBoss as pilotBoss } from './boss';

/*
 * Escenas de la demo del piloto de arte (ADR 0067). PilotoBoot carga las imágenes entregadas y arma tres derivadas: la
 * carretilla espejada y las dos orillas de las transiciones, que cambian de piedra a arena a mitad del tramo, como en
 * la prueba del paquete. PilotoStage juega la Costa Verde en Normal, con el Tico de serie, con el arte actual o con el
 * nuevo. Copia el ciclo de la etapa del juego (Stage.ts) sin guardado, sin taller, sin medallas ni ranking: la demo no
 * toca el progreso del jugador. Al terminar avisa con el evento 'ronda' y el flujo de la página sigue.
 */

const $ = (id: string) => document.getElementById(id)!;
const SCALE = 3;

export class PilotoBoot extends Phaser.Scene {
  constructor() { super('PilotoBoot'); }
  preload(): void {
    for (const a of ARTE.assets) this.load.image(a.id, `arte/${a.id}.png`);
  }
  create(): void {
    const tex = this.textures, img = (id: string) => tex.get(id).getSourceImage() as HTMLImageElement;
    const canvas = (key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) => {
      if (tex.exists(key)) return;
      const t = tex.createCanvas(key, w, h)!; draw(t.getContext()); t.refresh();
    };
    const cart = img('carretilla');
    canvas(CART_LEFT, cart.width, cart.height, (c) => { c.translate(cart.width, 0); c.scale(-1, 1); c.drawImage(cart, 0, 0); });
    const stone = img('orilla_piedra'), sand = img('orilla_arena'), half = Math.round((55 * SCALE)); // la mitad del tramo de 110
    canvas('orilla_mar_arena', stone.width, stone.height, (c) => { c.drawImage(stone, 0, 0, stone.width, half, 0, 0, stone.width, half); c.drawImage(sand, 0, half, sand.width, sand.height - half, 0, half, sand.width, sand.height - half); });
    canvas('orilla_arena_mar', sand.width, sand.height, (c) => { c.drawImage(sand, 0, 0, sand.width, half, 0, 0, sand.width, half); c.drawImage(stone, 0, half, stone.width, stone.height - half, 0, half, stone.width, stone.height - half); });
    this.game.events.emit('arte-listo');
  }
}

export interface RoundData { variant: PilotVariant; hintKnown: string[] }
export interface RoundResult { G: Game; end: 'fin' | 'abandono'; frames: FrameSummary; hints: string[] }

// La Costa Verde con el arte de la variante: la actual es la etapa del juego tal cual; la nueva cambia solo el dibujo.
export function stageFor(variant: PilotVariant): StageDef {
  const def = STAGES['costa-verde'];
  return variant === 'nuevo' ? { ...def, drawWorld: pilotWorld, drawBoss: pilotBoss } : def;
}

export class PilotoStage extends Phaser.Scene {
  private L!: Layers;
  private night: Night | null = null;
  private def!: StageDef;
  private G!: Game;
  private data0!: RoundData;
  private paused = false;
  private meter = new FrameMeter();
  private done = false;
  private onHidden = () => { if (document.hidden) this.setPaused(true); };
  private onBlur = () => this.setPaused(true);

  constructor() { super('PilotoStage'); }

  init(data: RoundData): void { this.data0 = data; }

  create(): void {
    showDeck(this.game, true);
    setupCamera(this);
    this.L = createLayers(this);
    this.def = stageFor(this.data0.variant);
    setSkin(this.data0.variant === 'nuevo' ? pilotSkin : null);
    const cfg = structuredClone(this.def.cfg); // Normal, sin mejoras ni objetos de victoria: todos juegan igual
    this.G = createGame(cfg, 'normal', keys, this.def.ai, cfg.weapons.cone.mode ? 'toque' : undefined);
    this.night = cfg.night ? createNight(this) : null;
    this.G.hintKnown = [...this.data0.hintKnown];
    this.G.hintsOn = true;
    this.paused = false; this.done = false; this.meter = new FrameMeter();
    track.scroll = 0;
    Sfx.init(); Sfx.music(true, cfg.music);
    const btn = $('pauseBtn') as HTMLButtonElement;
    btn.hidden = false; btn.onclick = () => this.setPaused(true);
    ($('resume') as HTMLButtonElement).onclick = () => this.setPaused(false);
    ($('quit') as HTMLButtonElement).onclick = () => this.finish('abandono');
    pauseHook.toggle = () => this.setPaused(!this.paused);
    document.addEventListener('visibilitychange', this.onHidden);
    addEventListener('blur', this.onBlur);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      document.removeEventListener('visibilitychange', this.onHidden);
      removeEventListener('blur', this.onBlur);
      pauseHook.toggle = null; btn.hidden = true; $('pause').hidden = true;
      setSkin(null); // fuera de la ronda nueva no queda arte alterno instalado
    });
  }

  private setPaused(v: boolean): void {
    if (this.G.mode !== 'play' || v === this.paused || this.done) return;
    this.paused = v;
    $('pause').hidden = !v;
    if (v) { Object.assign(keys, newKeys()); Sfx.music(false); Sfx.engine(0); ($('resume') as HTMLButtonElement).focus(); }
    else { Sfx.music(true, this.G.cfg.music); this.meter.resume(); }
  }

  private finish(end: 'fin' | 'abandono'): void {
    if (this.done) return;
    this.done = true; this.paused = false; $('pause').hidden = true;
    Sfx.music(false); Sfx.engine(0);
    const r: RoundResult = { G: this.G, end, frames: this.meter.summary(), hints: learnedHints(this.G) };
    // el aviso sale después de este cuadro: el flujo detiene la escena, y detenerla en medio de su update rompía la
    // cámara y congelaba el reloj del juego para la ronda siguiente
    setTimeout(() => this.game.events.emit('ronda', r), 0);
  }

  update(_t: number, delta: number): void {
    const G = this.G, dt = Math.min(0.05, delta / 1000);
    if (this.paused || this.done) return;
    if (G.mode === 'play') this.meter.add(frameMs(this.game.loop));
    if (G.hitstop > 0) G.hitstop = Math.max(0, G.hitstop - delta / 1000);
    else {
      track.scroll += (G.mode === 'play' ? G.speed : this.def.cfg.road.idleScroll) * dt;
      if (G.mode === 'play') {
        const was = G.b.state, over = update(G, dt);
        if (G.b.state !== was && (G.b.state === 'teleRam' || G.b.state === 'teleRev')) { Sfx.play('alarm'); buzz(120); }
        if (over) {
          ($('pauseBtn') as HTMLButtonElement).hidden = true;
          // al ganar, el cierre de la etapa (Don Frío cruza primero); después, o al perder, sigue el flujo de la prueba
          if (G.result?.win && G.cfg.ending) startEnding(G);
          else this.time.delayedCall(900, () => this.finish('fin'));
        }
      } else if (G.ending) {
        G.t += dt;
        if (updateEnding(G, dt)) this.finish('fin');
      } else { G.t += dt; updateWorld(G, dt); }
    }
    Sfx.tick();
    const s = G.shake > 0 ? G.shake * 4 : 0;
    setupCamera(this, s ? rnd(-4, 4) * s : 0, s ? rnd(-4, 4) * s : 0);
    beginLayers(this.L); setWarp(this.L, roadWarp(this.def.cfg, track.scroll));
    this.def.drawWorld(this.L.world, this.def.cfg, track.scroll, G);
    renderEntities(this.L, G, this.def.drawBoss);
    if (this.night) drawNight(this.night, this.L, G, track.scroll);
    endLayers(this.L);
    const Wp = G.cfg.weapons, cd = G.p.cd, maxAmmo = Wp.cone.ammo ?? 0;
    const coneShade = G.fireMode === 'toque' ? (G.p.ammo > 0 ? 0 : clamp(1 - G.p.reloadT / (Wp.cone.reload ?? 0.5), 0, 1)) : clamp(cd.cone / Wp.cone.cd, 0, 1);
    setDeckCooldowns({ cone: coneShade, oil: clamp(cd.oil / Wp.oil.cd, 0, 1), horn: clamp(cd.horn / Wp.horn.cd, 0, 1) });
    setDeckAmmo(G.fireMode === 'toque' ? G.p.ammo : 0, G.fireMode === 'toque' ? maxAmmo : 0);
  }

  get game0(): Game { return this.G; }
}
