import Phaser from 'phaser';
import { showDeck } from '../core/layout';
import { setupCamera } from '../core/camera';
import { H, W, view } from '../core/constants';
import { BODY, FONT, type Gfx } from '../core/gfx';
import { beginLayers, createLayers, drawMarea, drawTico, endLayers, setWarp, type Layers } from '../core/render';
import { roadWarp } from '../core/road';
import { createGame, newKeys, type Game } from '../core/state';
import { keys, pauseHook } from '../core/input';
import { Sfx } from '../core/audio/sfx';
import { bakePlane } from '../core/art/bosses';
import { ART_SCALE } from '../core/art/vehicles';
import { C, clamp, hash } from '../core/util';
import { creditsSeen, getGarage, markCreditsOpened, markCreditsSeen } from '../core/save';
import { applyUpgrades } from '../garage/upgrades';
import { CREDITS_SECONDS, POST_START, RETURN_GUARD_MS, TEXT, advance, canSkip, castFor, isSkipInput, isTap, newClock, partAt, resumed, skipTo, wrap, type Clock, type Part, type Press } from '../core/credits';
import { frameMs } from '../core/frames';
import { STAGES, TEST_MODE } from '../stages';
import { creditsEnd, creditsProgress, creditsStart } from '../core/share';
import type { CreditsEnd, CreditsEvent } from '../core/telemetry';

/*
 * Créditos de la Línea Amarilla del Terror (ADR 0049). Siguen el popurrí (ADR 0048) con su propio reloj:
 * - Despegue: Lima de noche desde la ventanilla del carguero, que se abre, y el título.
 * - Desfile: un tramo por distrito, con su paisaje y su jefe. El Tico se maneja sin daño y el claxon hace hablar al
 *   jefe. Arriba, la ficha de reparto y lo que pasó después. Los roles y nombres van pintados en el asfalto.
 * - Cierre: de vuelta al avión, "Gracias por manejar" y los agradecimientos especiales.
 * - Poscrédito: el vuelo regresa a Lima, el Tico baja por la rampa a la Vía de Evitamiento y la marea lo espera.
 * Se pueden pausar desde la primera vez, con "Continuar" y "Ver después" (ADR 0059). Salir no es saltar.
 * La primera vez no se saltan. Después, un toque en la pantalla (o Enter) salta los créditos y otro el poscrédito; los
 * controles de manejo y el claxon no saltan. La narración sigue al reloj de la música y se pausa con ella al salir de la
 * app. No tocan cobro, puntaje, ranking ni medallas.
 */

// at: solo para revisar (modo prueba con ?creditos=segundos), deja la escena quieta en ese instante, sin música;
// talk: además muestra lo que contesta el jefe al claxon
// from: de dónde se abrieron, para los datos anónimos (ADR 0060)
export interface CreditsData { done: (scene: Phaser.Scene) => void; at?: number; talk?: boolean; from?: 'victoria' | 'menu' }

const SPEED = 210; // avance de la pista en el desfile
const PAINT_W = 240; // ancho máximo de un nombre pintado en el asfalto
const PLANE = STAGES['linea-amarilla'].cfg.route!.plane!;
const PLANE_KEY = `carguero-${PLANE.w}-${PLANE.h}`;
const $ = (id: string) => document.getElementById(id)!;

export class CreditsScene extends Phaser.Scene {
  private L!: Layers;
  private d!: CreditsData;
  private t = 0;
  private scroll = 0;
  private games = new Map<string, Game>();
  private tico!: Game; // el Tico del jugador, con sus mejoras a la vista
  private me = { x: W / 2, y: 500 };
  private hornPrev = false;
  private talk: { text: string; until: number } | null = null;
  private skippable = false;
  private seenMarked = false;
  private finished = false;
  private postMusic = false;

  constructor() { super('Credits'); }

  init(d: CreditsData): void { this.d = d; }

  create(): void {
    showDeck(this.game, true);
    setupCamera(this);
    this.L = createLayers(this);
    this.t = 0; this.scroll = 0; this.talk = null; this.finished = false; this.seenMarked = false; this.postMusic = false;
    this.me = { x: W / 2, y: 500 };
    this.skippable = canSkip(creditsSeen(), TEST_MODE);
    // datos anónimos (C06, ADR 0060): en la vista quieta no se anota nada
    this.skips = 0; this.stallMax = 0; this.movedAt = performance.now(); this.savedAt = 0;
    this.record = this.d.at === undefined ? creditsStart(TEST_MODE, { from: this.d.from ?? 'menu', first: !creditsSeen(), reached: 0, maxStall: 0, skips: 0 }) : null;
    if (this.d.at === undefined && !TEST_MODE) markCreditsOpened(); // al entrar, no al final (C02a, ADR 0058)
    const la = STAGES['linea-amarilla'];
    this.tico = createGame(applyUpgrades(la.cfg, getGarage().levels), 'normal', newKeys(), la.ai);
    Object.assign(keys, newKeys());
    Sfx.init(); Sfx.engine(0); if (this.d.at === undefined) Sfx.music(true, 'creditos');
    this.paused = false; this.userPaused = false; this.clock = newClock();
    this.press = null; this.guardUntil = 0;
    // pausa con el botón de la pelea, P o Escape, desde la primera vez (C02b, ADR 0059). En el panel, "Ver después"
    // reemplaza a "Salir al menú" y sigue a los resultados o al menú. El botón baja a la esquina inferior derecha para
    // no tapar la ficha de reparto
    const btn = $('pauseBtn') as HTMLButtonElement, quit = $('quit') as HTMLButtonElement;
    if (this.d.at === undefined) { btn.hidden = false; btn.onclick = () => this.pauseByUser(true); }
    ($('resume') as HTMLButtonElement).onclick = () => this.pauseByUser(false);
    quit.textContent = 'Ver después'; quit.onclick = () => this.later();
    pauseHook.toggle = () => this.pauseByUser(!this.paused);
    document.body.classList.add('en-creditos');
    addEventListener('pointerdown', this.onDown); addEventListener('pointerup', this.onUp); addEventListener('pointercancel', this.onCancel);
    addEventListener('keydown', this.onKey);
    // al salir de la app, imagen y música se detienen juntas y siguen juntas al volver (U02). Solo cuenta salir de verdad
    // (la página oculta): perder el foco no pausa, porque en iPad muchas veces no avisa al recuperarlo (ADR 0052)
    document.addEventListener('visibilitychange', this.onVisibility);
    addEventListener('focus', this.onReturn); addEventListener('pageshow', this.onReturn);
    addEventListener('pagehide', this.saveProgress);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      removeEventListener('pointerdown', this.onDown); removeEventListener('pointerup', this.onUp); removeEventListener('pointercancel', this.onCancel);
      removeEventListener('keydown', this.onKey);
      document.removeEventListener('visibilitychange', this.onVisibility);
      removeEventListener('pagehide', this.saveProgress);
      removeEventListener('focus', this.onReturn); removeEventListener('pageshow', this.onReturn);
      pauseHook.toggle = null; btn.hidden = true; $('pause').hidden = true; quit.textContent = 'Salir al menú';
      document.body.classList.remove('en-creditos');
      Sfx.hold(false); Sfx.music(false);
    });
  }

  // datos anónimos de los créditos (C06, ADR 0060)
  private record: CreditsEvent | null = null;
  private skips = 0;
  private stallMax = 0; // mayor rato, en ms, con la imagen quieta fuera de la pausa
  private movedAt = 0;
  private savedAt = 0;
  private fields() { return { reached: Math.floor(this.t * 10) / 10, maxStall: Math.round(this.stallMax / 10) / 100, skips: this.skips }; }
  private saveProgress = () => { this.record = creditsProgress(this.record, this.fields()); };
  // la imagen avanzó o no: se mide en tiempo real, salvo en pausa
  private measureStall(prevT: number): void {
    const now = performance.now();
    if (this.t > prevT) this.movedAt = now; else this.stallMax = Math.max(this.stallMax, now - this.movedAt);
    if (now - this.savedAt > 3000) { this.savedAt = now; this.saveProgress(); } // el borrador, por si cierran a mitad
  }

  private paused = false;
  private clock: Clock = newClock();
  private lastSeek = 0;
  private userPaused = false; // la pausó el jugador: volver a la app no la levanta sola
  private pauseByUser(v: boolean): void {
    if (this.d.at !== undefined || this.finished) return;
    this.userPaused = v; this.setPaused(v);
  }
  private setPaused(v: boolean): void {
    if (v === this.paused || this.finished) return;
    this.paused = v; Sfx.hold(v); $('pause').hidden = !v;
    this.press = null; // el toque que abrió o cerró la pausa no salta
    if (v) { Object.assign(keys, newKeys()); ($('resume') as HTMLButtonElement).focus(); this.saveProgress(); return; } // sin controles pegados al volver
    this.movedAt = performance.now(); // la pausa no cuenta como imagen quieta
    // al seguir, imagen y música retoman desde el mismo instante en que se pausó (V04, ADR 0057)
    this.clock = resumed(this.clock);
    if (this.t < POST_START) Sfx.seek(this.t);
  }
  private onVisibility = () => {
    if (document.hidden) { this.setPaused(true); return; }
    this.onReturn(); if (!this.userPaused) this.setPaused(false);
  };
  // "Ver después": termina aquí y sigue a los resultados o al menú. No marca los créditos como vistos
  private later(): void { this.finish('despues'); }
  // al volver la pantalla al juego, los toques del momento son del sistema (cerrar el centro de control), no para saltar
  private press: Press | null = null;
  private guardUntil = 0;
  private onReturn = () => { this.guardUntil = performance.now() + RETURN_GUARD_MS; this.press = null; };

  // El primer medio segundo no cuenta para saltar: es el toque que cerró la escena anterior.
  private canSkipNow(): boolean { return this.skippable && this.t >= 0.5; }

  // en pausa los toques son del panel y no saltan nada; si no, se anota dónde bajó el dedo
  private onDown = (e: PointerEvent) => {
    if (this.paused) { this.press = null; return; }
    const onControls = !!(e.target as Element | null)?.closest?.('#deck, button, a, input, dialog, form');
    this.press = isSkipInput({ kind: 'pointer', onControls }) ? { x: e.clientX, y: e.clientY, at: performance.now() } : null;
  };
  // un toque completo en la pantalla salta, si se puede; los controles de manejo y el claxon no (U01, ADR 0053)
  private onUp = (e: PointerEvent) => {
    const down = this.press; this.press = null;
    if (this.paused || !this.canSkipNow()) return;
    if (isTap(down, { x: e.clientX, y: e.clientY, at: performance.now() }, this.guardUntil)) this.skip();
  };
  private onCancel = () => { this.press = null; }; // el sistema se llevó el gesto
  // Enter salta; en pausa las teclas son del panel (P y Escape la levantan, Enter pulsa el botón elegido)
  private onKey = (e: KeyboardEvent) => {
    if (this.paused) return;
    if (this.canSkipNow() && isSkipInput({ kind: 'key', key: e.key })) this.skip();
  };
  private skip(): void {
    this.t = skipTo(this.t); this.clock = newClock(this.t); this.skips++;
    if (this.t >= CREDITS_SECONDS) this.finish('saltado'); else Sfx.music(false);
  }

  private finish(end: CreditsEnd): void {
    if (this.finished) return;
    this.finished = true;
    creditsEnd(TEST_MODE, this.record, end, this.fields()); this.record = null;
    if (this.paused) { this.paused = false; Sfx.hold(false); $('pause').hidden = true; } // "Ver después" desde la pausa
    Sfx.music(false);
    try { this.d.done(this); } catch (e) { console.error('Créditos: no se pudo seguir a la escena siguiente', e); this.scene.start('Menu'); }
  }

  private gameFor(stage: string): Game {
    let G = this.games.get(stage);
    if (!G) { const def = STAGES[stage]; G = createGame(def.cfg, 'normal', newKeys(), def.ai); G.b.state = 'cruise'; this.games.set(stage, G); }
    return G;
  }

  /*
   * Red de seguridad (auditoría del 16 de noviembre, C03): si un error escapa de update, Phaser deja de pedir cuadros y
   * el juego queda quieto para siempre. Ante cualquier error, los créditos terminan y siguen a los resultados o al
   * menú, y el error queda en la consola.
   */
  update(_t: number, delta: number): void {
    if (this.finished) return;
    try { this.frame(delta); } catch (e) { console.error('Créditos: error en un cuadro, se cierran', e); this.finish('error'); }
  }

  private frame(delta: number): void {
    // en pausa no avanza nada y el panel de pausa queda encima
    // el manejo y el avance de la pista usan un paso con tope; la narración, el reloj de la música (U02)
    const frozen = this.d.at !== undefined, paused = this.paused, dt = frozen || paused ? 0 : Math.min(0.05, delta / 1000);
    if (frozen) { this.t = Math.min(this.d.at!, CREDITS_SECONDS - 0.01); this.scroll = this.t * SPEED; }
    else if (!paused) {
      const prevT = this.t;
      Sfx.tick(); this.clock = advance(this.clock, frameMs(this.game.loop), Sfx.medleyTime()); this.t = this.clock.t;
      this.measureStall(prevT);
      // la música quedó atrás tras un corte del audio: se reubica en la imagen, que no la espera (C01, ADR 0057)
      const now = performance.now();
      if (this.clock.resync && now - this.lastSeek > 1000) { this.lastSeek = now; Sfx.seek(this.t); }
    }
    this.scroll += SPEED * dt; this.tico.t = this.t;
    if (this.t >= POST_START && !this.seenMarked && !frozen) { this.seenMarked = true; if (!TEST_MODE) markCreditsSeen(); this.skippable = true; }
    if (this.t >= CREDITS_SECONDS) { this.finish('completo'); return; }
    setupCamera(this);
    const L = this.L, part = partAt(this.t);
    beginLayers(this.L); setWarp(L, null);
    if (part.kind === 'despegue') this.drawTakeoff(part);
    else if (part.kind === 'distrito') this.drawDistrict(part, dt);
    else if (part.kind === 'cierre') this.drawClosing(part);
    else this.drawPost(part);
    if (!paused && this.skippable && this.t > 0.5) { L.ui.globalAlpha = 0.6; L.ui.fillStyle = '#fff'; L.ui.font = BODY(700, 10); L.ui.textAlign = 'center'; L.ui.fillText('Toca para saltar', W / 2, H - 14); L.ui.globalAlpha = 1; }
    endLayers(this.L);
  }

  /* ---------- Lima desde el aire ---------- */

  private drawCity(g: Gfx, drift: number): void {
    const ex = view.extra, cell = 22;
    g.fillStyle = '#070b18'; g.fillRect(-ex - 10, -10, W + 2 * ex + 20, H + 20);
    // el mar a la izquierda, con la costa que se mueve
    const coast = (y: number) => -ex + 30 + 26 * Math.sin((y + drift) / 140);
    g.fillStyle = '#0a1a33'; g.beginPath(); g.moveTo(-ex - 10, -10);
    for (let y = -10; y <= H + 10; y += 20) g.lineTo(coast(y), y);
    g.lineTo(-ex - 10, H + 10); g.closePath(); g.fill();
    const off = drift % cell, row0 = Math.floor(drift / cell);
    for (let r = -1; r < H / cell + 1; r++) for (let c = 0; c < (W + 2 * ex) / cell; c++) {
      const x = -ex + c * cell, y = r * cell + off, k = hash((r - row0) * 131 + c * 17);
      if (k > 0.5 || x < coast(y) + 6) continue;
      g.fillStyle = k < 0.08 ? '#ffffff' : k < 0.3 ? '#ffd27a' : '#ff9e4a';
      g.fillRect(x + k * 14, y + hash(c * 7 + r) * 14, 2, 2);
    }
    // una avenida de luces en diagonal
    g.fillStyle = '#ffe9b0';
    for (let i = 0; i < 40; i++) { const y = ((i * 17 + drift * 1.0) % (H + 40)) - 20; g.fillRect(W * 0.62 + (y - H / 2) * 0.35, y, 2, 2); }
  }

  private drawPlane(g: Gfx, x: number, y: number, k: number, ang = 0): void {
    if (!g.textures.exists(PLANE_KEY)) g.textures.addCanvas(PLANE_KEY, bakePlane(PLANE.w, PLANE.h, PLANE.label ?? 'GALAXIA CARGO', ART_SCALE));
    g.image(PLANE_KEY, x, y, k / ART_SCALE, ang);
  }

  private title(g: Gfx, text: string, y: number, size: number, col: string, alpha: number): void {
    g.globalAlpha = alpha; g.textAlign = 'center'; g.font = FONT(size);
    g.fillStyle = '#ff2e88'; g.fillText(text, W / 2 + 2, y + 2);
    g.fillStyle = col; g.fillText(text, W / 2, y); g.globalAlpha = 1;
  }

  // la ventanilla se abre: un aro oscuro que crece hasta salir de la pantalla
  private windowRing(g: Gfx, r: number): void {
    if (r > 700) return;
    const R = 900;
    g.strokeStyle = '#120e1a'; g.lineWidth = 2 * R; g.beginPath(); g.arc(W / 2, H / 2, r + R, 0, Math.PI * 2); g.closePath(); g.stroke();
    g.strokeStyle = '#8a8f99'; g.lineWidth = 8; g.beginPath(); g.arc(W / 2, H / 2, r, 0, Math.PI * 2); g.closePath(); g.stroke();
    g.lineWidth = 1;
  }

  private drawTakeoff(p: Part): void {
    const L = this.L, lt = this.t - p.start, k = lt / (p.end - p.start);
    this.drawCity(L.world, this.t * 40);
    this.drawPlane(L.ents, W / 2, H * 0.62 - k * 40, 0.42);
    this.windowRing(L.fx, 120 + Math.pow(k, 2) * 600);
    this.title(L.ui, TEXT.title, 150, 26, '#ffe14d', clamp((k - 0.35) * 3, 0, 1));
  }

  private drawClosing(p: Part): void {
    const L = this.L, lt = this.t - p.start, dur = p.end - p.start, g = L.ui;
    this.drawCity(L.world, this.t * 40);
    this.drawPlane(L.ents, W / 2, H * 0.66 - lt * 10, 0.42);
    this.title(g, TEXT.title, 120, 26, '#ffe14d', clamp(lt * 2, 0, 1));
    this.title(g, TEXT.thanks.toUpperCase(), 156, 12, '#ffffff', clamp(lt * 2 - 1, 0, 1));
    // los agradecimientos especiales, debajo
    const ded = TEXT.dedication;
    if (ded) {
      g.globalAlpha = clamp(lt * 1.5 - 2, 0, 1); g.textAlign = 'center';
      g.fillStyle = '#3dff9a'; g.font = BODY(800, 9); g.fillText(ded.role.toUpperCase(), W / 2, 206);
      g.fillStyle = '#ffffff'; g.font = BODY(700, 12);
      wrap(ded.text, W - 70, (s) => g.measureText(s).width).forEach((l, i) => g.fillText(l, W / 2, 226 + i * 17));
      g.globalAlpha = 1;
    }
    // al final se cierra la ventanilla
    if (lt > dur - 1.6) this.windowRing(L.fx, 700 - (lt - (dur - 1.6)) / 1.6 * 700);
  }

  /* ---------- desfile ---------- */

  private drawDistrict(p: Part, dt: number): void {
    const L = this.L, id = p.stage!, def = STAGES[id], cfg = def.cfg, cast = castFor(id)!, lt = this.t - p.start, dur = p.end - p.start;
    setWarp(L, roadWarp(cfg, this.scroll));
    def.drawWorld(L.world, cfg, this.scroll, null);
    this.drawPainted(L.low, p, lt);

    // el jefe entra desde arriba, se queda frente al Tico y se adelanta al final
    const G = this.gameFor(id), b = G.b;
    G.t = this.t;
    const by = lt < 1.1 ? -140 + (lt / 1.1) * 360 : lt > dur - 0.9 ? 220 - ((lt - (dur - 0.9)) / 0.9) * 420 : 220 + Math.sin(lt * 2) * 8;
    if (cast.sign) this.drawSign(L.ents, cast.sign, by);
    else { b.x = W / 2 + Math.sin(lt * 1.4) * 34; b.y = by; def.drawBoss(L.bossFx, G, L.ents); }

    this.driveTico(dt, cfg.road.left, cfg.road.right);
    const t = this.tico; t.p.x = this.me.x; t.p.y = this.me.y;
    L.me.rigid(this.me.x, this.me.y, () => L.meFx.rigid(this.me.x, this.me.y, () => drawTico(L.me, L.meFx, t, { x: this.me.x, y: this.me.y, w: 28, h: 48 }, keys.down)));

    // claxon: el jefe contesta
    if (keys.horn && !this.hornPrev) { Sfx.play('horn'); if (lt > 0.8 && lt < dur - 0.8) { this.talk = { text: cast.honk, until: this.t + 1.6 }; Sfx.play('say'); } }
    this.hornPrev = keys.horn;
    if (this.d.talk && lt > 0.8 && lt < dur - 0.8) this.talk = { text: cast.honk, until: this.t + 1 };
    if (this.talk && this.t < this.talk.until && lt < dur - 0.6) this.bubble(L.ui, this.talk.text, cast.sign ? W / 2 : b.x, Math.max(40, by + 50));
    else if (this.talk && this.t >= this.talk.until) this.talk = null;

    // en el primer distrito, cómo se juega el desfile
    if (p.index === 0 && lt > 0.6 && lt < dur - 0.6 && !this.talk) this.pill(L.ui, 'Maneja y toca el claxon', this.me.y + 40);
    const vis = clamp(lt / 0.35, 0, 1) * clamp((dur - lt) / 0.3, 0, 1);
    this.card(L.ui, cfg.eyebrow, cast.name ?? cfg.boss.name, cast.as, cast.after, vis);
    // corte entre distritos
    const fade = 1 - clamp(lt / 0.25, 0, 1) + (1 - clamp((dur - lt) / 0.2, 0, 1));
    if (fade > 0) { L.fx.globalAlpha = clamp(fade, 0, 1); L.fx.fillStyle = '#000'; L.fx.fillRect(-view.extra - 10, -10, W + 2 * view.extra + 20, H + 20); L.fx.globalAlpha = 1; }
  }

  private driveTico(dt: number, left: number, right: number): void {
    const m = this.me, sp = 170;
    if (keys.left) m.x -= sp * dt;
    if (keys.right) m.x += sp * dt;
    if (keys.up) m.y -= sp * 0.6 * dt;
    if (keys.down) m.y += sp * 0.6 * dt;
    m.x = clamp(m.x, left + 16, right - 16); m.y = clamp(m.y, 400, 570);
  }

  // nombres pintados en el asfalto: un nombre por distrito cuando estén; mientras tanto, el distrito
  private drawPainted(g: Gfx, p: Part, lt: number): void {
    const staff = TEXT.staff[p.index!], y = -60 + (lt - 0.6) * SPEED;
    if (y < -60 || y > H + 60) return;
    const role = staff?.role, name = staff?.name ?? STAGES[p.stage!].cfg.eyebrow.split(' · ')[1] ?? '';
    g.globalAlpha = 0.55; g.fillStyle = '#ffffff'; g.textAlign = 'center';
    if (role) { g.font = BODY(800, 10); g.fillText(role.toUpperCase(), W / 2, y - 22); }
    // el nombre se achica hasta caber entre las líneas de la pista
    let size = 18;
    g.font = FONT(size);
    while (size > 9 && g.measureText(name.toUpperCase()).width > PAINT_W) g.font = FONT(--size);
    g.fillText(name.toUpperCase(), W / 2, y);
    g.globalAlpha = 1;
  }

  // el letrero del puente definitivo, sobre la pista
  private drawSign(g: Gfx, text: string, y: number): void {
    g.fillStyle = '#4a4452'; g.fillRect(56, y - 10, 6, 46); g.fillRect(W - 62, y - 10, 6, 46);
    g.fillStyle = '#1d6b3a'; g.roundRect(46, y - 34, W - 92, 30, 4); g.fill();
    g.strokeStyle = '#f4f6fb'; g.lineWidth = 2; g.roundRect(49, y - 31, W - 98, 24, 3); g.stroke(); g.lineWidth = 1;
    g.fillStyle = '#f4f6fb'; g.font = FONT(10); g.textAlign = 'center'; g.fillText(text, W / 2, y - 15);
  }

  private bubble(g: Gfx, text: string, x: number, y: number): void {
    g.font = BODY(800, 11);
    const w = g.measureText(text).width + 18, bx = clamp(x - w / 2, 6, W - w - 6);
    g.fillStyle = 'rgba(255,255,255,.95)'; g.roundRect(bx, y, w, 22, 11); g.fill();
    g.fillStyle = '#15111d'; g.textAlign = 'center'; g.fillText(text, bx + w / 2, y + 15);
  }

  private pill(g: Gfx, text: string, y: number): void {
    g.font = BODY(800, 10);
    const w = g.measureText(text).width + 20;
    g.fillStyle = 'rgba(14,10,22,.8)'; g.roundRect(W / 2 - w / 2, y, w, 20, 10); g.fill();
    g.fillStyle = '#ffe14d'; g.textAlign = 'center'; g.fillText(text, W / 2, y + 14);
  }

  // ficha de reparto: el distrito, el jefe "como él mismo" y lo que pasó después
  private card(g: Gfx, eyebrow: string, name: string, as: string, after: string, vis: number): void {
    if (vis <= 0) return;
    g.globalAlpha = vis;
    g.font = BODY(700, 11);
    const lines = wrap(after, W - 56, (s) => g.measureText(s).width), h = 58 + lines.length * 14, y = 10 - (1 - vis) * 20;
    g.fillStyle = 'rgba(14,10,22,.88)'; g.roundRect(14, y, W - 28, h, 10); g.fill();
    g.textAlign = 'center';
    g.fillStyle = '#3dff9a'; g.font = BODY(800, 8); g.fillText(eyebrow.toUpperCase(), W / 2, y + 15);
    g.fillStyle = '#ffe14d'; g.font = FONT(13); g.fillText(name, W / 2, y + 33);
    g.fillStyle = '#c9ccd3'; g.font = BODY(600, 10); g.fillText(as, W / 2, y + 47);
    g.fillStyle = '#ffffff'; g.font = BODY(700, 11);
    lines.forEach((l, i) => g.fillText(l, W / 2, y + 64 + i * 14));
    g.globalAlpha = 1;
  }

  /* ---------- poscrédito ---------- */

  private drawPost(p: Part): void {
    const L = this.L, lt = this.t - p.start, ex = view.extra;
    const black = () => { L.world.fillStyle = '#000'; L.world.fillRect(-ex - 10, -10, W + 2 * ex + 20, H + 20); };
    if (lt < 1.5) {
      black();
      L.ui.globalAlpha = clamp(lt * 2, 0, 1) * clamp((1.5 - lt) * 3, 0, 1);
      L.ui.fillStyle = '#c9ccd3'; L.ui.font = BODY(700, 14); L.ui.textAlign = 'center'; L.ui.fillText(TEXT.post.later, W / 2, H / 2); L.ui.globalAlpha = 1;
      return;
    }
    if (lt < 5) {
      // el avión da media vuelta sobre Lima
      const k = clamp((lt - 1.8) / 2.2, 0, 1), turn = (1 - Math.cos(k * Math.PI)) / 2;
      this.drawCity(L.world, this.t * 40);
      this.drawPlane(L.ents, W / 2 + Math.sin(turn * Math.PI) * 40, H * 0.55, 0.42, turn * Math.PI);
      this.speaker(L.ui, TEXT.post.speaker, clamp((lt - 1.6) * 3, 0, 1));
      return;
    }
    // de vuelta en la Vía de Evitamiento: el Tico baja por la rampa y la marea ya lo espera
    if (!this.postMusic && !this.paused) { this.postMusic = true; Sfx.music(true, 'tension'); }
    const la = STAGES['linea-amarilla'], G = this.tico, k = clamp((lt - 5) / 2.4, 0, 1);
    setWarp(L, roadWarp(la.cfg, this.scroll));
    la.drawWorld(L.world, la.cfg, this.scroll, null);
    G.route.plane = { phase: 'hold', x: W / 2, y: 30 - k * 20, t: 0 };
    la.drawBoss(L.bossFx, G, L.ents);
    const ty = 120 + (1 - Math.pow(1 - k, 2)) * 330;
    L.me.rigid(W / 2, ty, () => drawTico(L.me, L.meFx, G, { x: W / 2, y: ty, w: 28, h: 48 }));
    drawMarea(L.fx, H - (lt - 5) * 24, this.t, la.cfg.road.left);
    if (lt > 9.8) {
      const a = clamp((lt - 9.8) * 2, 0, 1);
      L.fx.globalAlpha = a * 0.7; L.fx.fillStyle = '#000'; L.fx.fillRect(-ex - 10, -10, W + 2 * ex + 20, H + 20); L.fx.globalAlpha = 1;
      this.title(L.ui, TEXT.post.end, H / 2, 24, '#ffe14d', a);
    }
  }

  // anuncio por los parlantes del avión, abajo
  private speaker(g: Gfx, text: string, a: number): void {
    if (a <= 0) return;
    g.globalAlpha = a; g.font = BODY(700, 12);
    const lines = wrap(text, W - 60, (s) => g.measureText(s).width), h = 20 + lines.length * 16;
    g.fillStyle = 'rgba(14,10,22,.9)'; g.roundRect(18, H - 60 - h, W - 36, h, 10); g.fill();
    g.fillStyle = C.yellow; g.textAlign = 'center'; g.font = BODY(800, 9); g.fillText('CABINA', W / 2, H - 60 - h + 14);
    g.fillStyle = '#fff'; g.font = BODY(700, 12);
    lines.forEach((l, i) => g.fillText(l, W / 2, H - 60 - h + 30 + i * 16));
    g.globalAlpha = 1;
  }
}
