import type { DiffKey, Difficulty, FireMode, PowerKey, StageConfig, VehicleLook, VehicleMove, ItemDef, PerkEffect } from './config';
import { H } from './constants';
import { Sfx } from './audio/sfx';
import { C, rnd, reduceMotion } from './util';

export interface Keys { left: boolean; right: boolean; up: boolean; down: boolean; cone: boolean; oil: boolean; horn: boolean }
export const newKeys = (): Keys => ({ left: false, right: false, up: false, down: false, cone: false, oil: false, horn: false });

export type WeaponKey = 'cone' | 'oil' | 'horn' | 'cancha';
export type TimedPower = 'turbo' | 'cancha' | 'soat';

export interface Player {
  x: number; y: number; w: number; h: number; vx: number; vy: number; hp: number; max: number;
  stun: number; hitCd: number; flash: number;
  cd: Record<WeaponKey, number>; pw: Record<TimedPower, number>;
  ammo: number; reloadT: number; coneHeld: boolean; lives: number;
  air: number; airMax: number; // salto de rampa: tiempo que le queda en el aire y duración total
}

export type BossFlash = null | 'brake' | 'rev' | 'hazard' | 'horn' | 'jet' | 'throw' | 'swing';
export interface Boss {
  x: number; y: number; baseY: number; w: number; h: number; hp: number; max: number;
  tx: number; rx: number; rvx: number; state: string; st: number; act: number; phase: number;
  slip: number; phoneOff: number; hornT: number; valetT: number; summonT: number; jetHit: boolean; flash: BossFlash; hitFlash: number; ang: number; bumpT: number;
  swing: number; // coletazo: lado (-1 o 1) por el progreso del barrido, para el dibujo
}

export interface Car {
  k: string; x: number; y: number; w: number; h: number; vy: number; hp: number; max: number; col: string;
  spin: number; seed: number; flash?: number;
  zz?: number; brakeT?: number; tx?: number; enter?: number; life?: number; phase?: number; invulnerable?: boolean; contactDmg?: number; selfDmg?: number; killBonus?: number;
  look?: VehicleLook; move?: VehicleMove;
}
export interface Shot { k: 'cone' | 'oil' | 'kernel' | 'picaron'; x: number; y: number; vx: number; vy: number; r: number; ay?: number; hit?: boolean; t?: number; ret?: boolean; dead?: boolean; hitBoss?: boolean }
export interface Obstacle { i: number; x: number; y: number; w: number; h: number; hit: boolean; bx?: number; ph?: number }
export interface Ally { k: 'combi'; x: number; y: number; w: number; h: number; vy: number; said: boolean; dead?: boolean; dmg?: number }
// proyectil del jefe: avanza en línea recta y se pierde al salir de la pista
export interface Foe { x: number; y: number; vx: number; vy: number; r: number; dmg: number; col: string; look?: 'moneda' | 'rollo' | 'contenedor'; dead?: boolean }
export interface Pickup { k: PowerKey; x: number; y: number; r: number; rot: number; dead?: boolean }
export interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; col: string; size: number }
export interface Ring { x: number; y: number; r: number; max: number; col: string; life: number }
export interface Float { x: number; y: number; text: string; col: string; life: number; size?: number }

// Contrato que cumple la IA de cada jefe (src/bosses/*).
export interface BossAI {
  update(G: Game, dt: number): void;
  interrupt(G: Game): void;
}

export interface Game {
  cfg: StageConfig; dk: DiffKey; d: Difficulty; keys: Keys; ai: BossAI; fireMode: FireMode;
  // combo de punto ciego y congelamiento de impacto (la escena lo consume; la simulación no se detiene)
  combo: { n: number; best: number }; hitstop: number;
  t: number; mode: 'play' | 'over'; shake: number; bonus: number; fines: number; speed: number;
  announce: { t: string; col: string; life: number } | null;
  hint: { text: string; life: number } | null; hintI: number;
  perks: { item: ItemDef; used: boolean }[];
  p: Player; b: Boss;
  traffic: Car[]; shots: Shot[]; foes: Foe[]; allies: Ally[]; pickups: Pickup[];
  bumps: { y: number; hitP: boolean; hitB: boolean }[]; cross: { y: number; name: string }[];
  parts: Particle[]; rings: Ring[]; floats: Float[];
  bubble: { text: string; t: number } | null; bubbleT: number;
  trafficT: number; pickT: number; bumpT: number; crossT: number; streetI: number;
  swarmT: number[]; // un temporizador por enjambre activo en esta dificultad (Infinity si no aplica)
  obstacles: Obstacle[]; obsT: number[];
  allyT: number; privilegeT: number; // Socio de la Combi y aviso del sticker (mejoras de lujo)
  stats: { right: number; total: number; dmgP3: boolean; powers: number };
  result: null | { win: boolean };
}

export const laneX = (cfg: StageConfig, i: number) => cfg.road.left + cfg.road.laneWidth / 2 + cfg.road.laneWidth * i;
export const laneOf = (cfg: StageConfig, x: number) =>
  Math.max(0, Math.min(cfg.road.lanes - 1, Math.floor((x - cfg.road.left) / cfg.road.laneWidth)));

export function createGame(cfg: StageConfig, dk: DiffKey, keys: Keys, ai: BossAI, fireMode?: FireMode): Game {
  const d = cfg.difficulties[dk], pc = cfg.player, bc = cfg.boss;
  for (const k in keys) keys[k as keyof Keys] = false;
  const cone = cfg.weapons.cone;
  return {
    cfg, dk, d, keys, ai, fireMode: fireMode ?? cone.mode ?? 'mantener', combo: { n: 0, best: 0 }, hitstop: 0, t: 0, mode: 'play', shake: 0, bonus: 0, fines: 0, speed: cfg.road.speed, announce: null, hint: null, hintI: 0,
    perks: (cfg.player.items ?? []).map((item) => ({ item, used: false })),
    p: { x: laneX(cfg, pc.lane), y: pc.y, w: pc.w, h: pc.h, vx: 0, vy: 0, hp: pc.hp, max: pc.hp, stun: 0, hitCd: 0, flash: 0,
      cd: { cone: 0, oil: 0, horn: 0, cancha: 0 }, pw: { turbo: 0, cancha: 0, soat: 0 }, ammo: cone.ammo ?? 0, reloadT: 0, coneHeld: false, lives: pc.lives ?? 0, air: 0, airMax: 0 },
    b: { x: laneX(cfg, bc.lane), y: bc.startY, baseY: bc.baseY, w: bc.w, h: bc.h, hp: d.hp, max: d.hp, tx: laneX(cfg, bc.lane), rx: 0, rvx: 0,
      state: 'enter', st: 0, act: bc.firstAction, phase: 1, slip: 0, phoneOff: 0, hornT: 4, valetT: 3, summonT: Infinity, jetHit: false, flash: null, hitFlash: 0, ang: 0, bumpT: 0, swing: 0 },
    traffic: [], shots: [], foes: [], allies: [], pickups: [], bumps: [], cross: [], parts: [], rings: [], floats: [],
    bubble: null, bubbleT: 2, trafficT: cfg.traffic.first, pickT: cfg.pickups.first, bumpT: cfg.bumps.first, crossT: cfg.crossings.first, streetI: 0,
    swarmT: (cfg.swarms ?? []).map((s) => (s.diffs.includes(dk) ? s.first : Infinity)),
    allyT: cfg.player.allyEvery ? 12 : Infinity, privilegeT: 0,
    obstacles: [], obsT: (cfg.obstacles ?? []).map((o) => (!o.diffs || o.diffs.includes(dk) ? o.first : Infinity)),
    stats: { right: 0, total: 0, dmgP3: false, powers: 0 },
    result: null,
  };
}

/* =================== EFECTOS COMUNES =================== */
export function say(G: Game, t: string): void { G.bubble = { text: t, t: 2.4 }; G.bubbleT = 7; Sfx.play('say'); }
export function burst(G: Game, x: number, y: number, col: string, n = 10, sp = 160): void {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = rnd(40, sp);
    G.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(0.3, 0.7), max: 0.7, col, size: rnd(2, 4) });
  }
}
export function floatText(G: Game, x: number, y: number, text: string, col: string, size?: number): void { G.floats.push({ x, y, text, col, life: 0.9, size }); }
export function shake(G: Game, v: number): void { if (!reduceMotion) G.shake = Math.max(G.shake, v); }
export function announce(G: Game, t: string, col: string): void { G.announce = { t, col, life: 1.3 }; }

export function dmgBoss(G: Game, amount: number, fromRight: boolean, size?: number): number {
  const b = G.b, bc = G.cfg.boss;
  let m = fromRight ? bc.weakSideMult : 1; if (b.slip > 0) m *= bc.slipMult;
  const v = Math.round(amount * m); b.hp = Math.max(0, b.hp - v); b.hitFlash = 0.12;
  G.stats.total += v; if (fromRight) G.stats.right += v;
  floatText(G, b.x + rnd(-14, 14), b.y - 30, '-' + v, fromRight ? C.green : C.ink, size);
  return v;
}
export function hurt(G: Game, d: number): void {
  const p = G.p;
  if (p.pw.soat > 0) { floatText(G, p.x, p.y - 30, 'SOAT', C.green); Sfx.play('block'); return; }
  if (G.d.dmgMult) d = Math.max(1, Math.round(d * G.d.dmgMult));
  if (G.cfg.player.armor) d = Math.max(1, Math.round(d * (1 - G.cfg.player.armor)));
  p.hp = Math.max(0, p.hp - d); p.flash = 0.2; if (G.b.phase === G.cfg.boss.phases.length) G.stats.dmgP3 = true;
  floatText(G, p.x, p.y - 30, '-' + d, C.pink); shake(G, 0.25); Sfx.play('hit');
}
// Gasta la carga de un objeto de victoria con ese efecto, si queda alguna. Devuelve true si protegió.
export function usePerk(G: Game, effect: PerkEffect): boolean {
  const k = G.perks.find((x) => !x.used && x.item.effect === effect);
  if (!k) return false;
  k.used = true; floatText(G, G.p.x, G.p.y - 52, k.item.name.toUpperCase(), k.item.col, 11); Sfx.play('block');
  return true;
}

// contact: la papeleta viene de un roce con un intocable (la perdona el Silbato antes que el Bolso).
export function fine(G: Game, x: number, y: number, amt: number, why: string, contact = false): void {
  // Sticker "Mi papá es socio del Golf": nadie le pone papeletas
  if (G.cfg.player.privilege) {
    if (G.privilegeT <= 0) { floatText(G, x, y - 34, '¿Usted sabe quién soy yo?', C.yellow); G.privilegeT = 2; }
    return;
  }
  if ((contact && usePerk(G, 'contactFine')) || usePerk(G, 'anyFine')) return;
  G.fines += amt; floatText(G, x, y - 34, why + ' -S/' + amt, C.sky); Sfx.play('whistle');
}

export const playerMaxY = (G: Game) => H - G.cfg.player.bottomMargin;
