import type { BossPhase } from '../core/config';
import { W, H } from '../core/constants';
import { Sfx } from '../core/audio/sfx';
import { C, clamp, overlap, pick, rnd, step } from '../core/util';
import {
  announce, burst, dmgBoss, floatText, hurt, laneOf, laneX, say, shake,
  type BossAI, type Game,
} from '../core/state';
import { phaseDef, phaseFor, runState, type StateTable } from './phase-machine';

/* La Loca del Q6: IA por fases portada de updateBoss/chooseAction del prototipo. Todos los números salen del JSON. */

// Estados que un golpe fuerte (claxon, combi, metro) corta para mandarla de vuelta a su carril.
const INTERRUPTIBLE = ['teleRev', 'rev', 'teleRam', 'ram', 'teleBrake', 'brake', 'park'];

const ph = (G: Game): BossPhase => phaseDef(G.cfg.boss.phases, G.b.phase);
const spdK = (G: Game) => G.d.spd / 260;

function laneSwap(G: Game): void {
  const b = G.b, lanes = G.cfg.road.lanes, cur = laneOf(G.cfg, b.x);
  let n: number;
  if (Math.random() < G.cfg.boss.laneSwapAimChance) { n = laneOf(G.cfg, G.p.x); if (n === cur) n = (cur + (Math.random() < 0.5 ? 1 : 3)) % lanes; }
  else { do { n = Math.floor(Math.random() * lanes); } while (n === cur); }
  b.tx = laneX(G.cfg, n);
}

function chooseAction(G: Game): void {
  const b = G.b, f = G.d.freq, P = ph(G);
  if (b.phoneOff > 0) { b.act = G.cfg.boss.phoneOffAct; return; }
  if (Math.random() < P.swapChance) { laneSwap(G); b.act = P.swapAct * f; return; }
  if (P.attack === 'brake') { b.state = 'teleBrake'; b.st = P.tele; }
  else if (P.attack === 'reverse') { b.state = 'teleRev'; b.st = G.d.tele ? P.tele : (P.teleOff ?? P.tele); b.tx = laneX(G.cfg, laneOf(G.cfg, G.p.x)); }
  else { b.state = 'teleRam'; b.st = P.tele; b.rx = G.p.x; Sfx.play('bossHorn'); }
}

const STATES: StateTable<Game> = {
  enter(G, dt) { const b = G.b; b.y += (b.baseY - b.y) * Math.min(1, dt * 2); if (Math.abs(b.y - b.baseY) < 4) { b.state = 'cruise'; say(G, G.cfg.boss.lines[1][0]); } },
  cruise(G, dt) {
    const b = G.b; b.flash = null; b.y += (b.baseY - b.y) * Math.min(1, dt * 2);
    if (b.slip <= 0) b.x += step(b.tx - b.x, G.cfg.boss.cruiseSpeed * spdK(G) * dt);
    b.act -= dt; if (b.act <= 0 && b.slip <= 0) chooseAction(G);
  },
  // fase 1: frenazo seco con luz de freno como aviso
  teleBrake(G, dt) { const b = G.b; b.flash = 'brake'; b.st -= dt; if (b.st <= 0) { b.state = 'brake'; b.st = ph(G).dur; Sfx.play('skid'); } },
  brake(G, dt) { const b = G.b; b.flash = 'brake'; b.y += ph(G).speed * spdK(G) * dt; b.st -= dt; if (b.st <= 0) b.state = 'return'; },
  // fase 2: reversa con luces blancas, luego queda estacionada en doble fila
  teleRev(G, dt) { const b = G.b; b.flash = 'rev'; b.x += step(b.tx - b.x, 160 * dt); b.st -= dt; if (b.st <= 0) { b.state = 'rev'; b.st = ph(G).dur; } },
  rev(G, dt) {
    const b = G.b, P = ph(G); b.flash = 'rev'; b.x += step(b.tx - b.x, 80 * dt); b.y += P.speed * spdK(G) * dt; b.st -= dt;
    if (b.st <= 0 || b.y > (P.maxY ?? H - 150)) { b.state = 'park'; b.st = P.park ?? 1.6; }
  },
  park(G, dt) { const b = G.b; b.flash = 'hazard'; b.st -= dt; if (b.st <= 0) b.state = 'return'; },
  // fase 3: embestida apuntada con ícono de claxon
  teleRam(G, dt) {
    const b = G.b; b.flash = 'horn'; b.x += step(b.rx - b.x, 110 * dt); b.st -= dt;
    if (b.st <= 0) { const d = ph(G).dur; b.state = 'ram'; b.st = d; b.rvx = (G.p.x - b.x) / d; }
  },
  ram(G, dt) {
    const b = G.b, P = ph(G); b.flash = 'horn'; b.y += P.speed * spdK(G) * dt; b.x += b.rvx * dt; b.st -= dt;
    if (b.st <= 0 || b.y > (P.maxY ?? H - 130)) b.state = 'return';
  },
  return(G, dt) {
    const b = G.b; b.flash = null; b.y += (b.baseY - b.y) * Math.min(1, dt * 2.2); b.x += step(b.tx - b.x, 120 * dt);
    if (Math.abs(b.y - b.baseY) < 6) { b.state = 'cruise'; b.act = ph(G).returnAct * G.d.freq; }
  },
};

function spawnValet(G: Game): void {
  const side = Math.random() < 0.5 ? 0 : 1, lane = side ? G.cfg.road.lanes - 1 : 0;
  G.traffic.push({ k: 'valet', x: side ? W + 30 : -30, tx: laneX(G.cfg, lane), y: rnd(290, 360), w: 28, h: 50, vy: 0, hp: 36, max: 36,
    seed: Math.random() * 100, spin: 0, col: '#b9b4c4', enter: 0.7, contactDmg: 8, selfDmg: 10 });
  say(G, G.cfg.boss.quips.valet);
}

function spawnEscorts(G: Game, P: BossPhase): void {
  const b = G.b, e = P.escorts!, { left, right } = G.cfg.road;
  [-1, 1].forEach((s, i) => {
    G.traffic.push({ k: 'amiga', x: clamp(b.x + s * 70, left + 20, right - 20), y: -70, w: 32, h: 56, vy: 0, hp: e.hp, max: e.hp,
      seed: Math.random() * 100, spin: 0, col: e.cols[i], life: e.life, phase: Math.random() * 6, contactDmg: 10, selfDmg: 10 });
  });
}

export const Q6: BossAI = {
  interrupt(G) { const b = G.b; if (INTERRUPTIBLE.includes(b.state)) b.state = 'return'; },

  update(G, dt) {
    const b = G.b, p = G.p, bc = G.cfg.boss, pc = G.cfg.player;
    b.hitFlash -= dt; b.phoneOff -= dt; b.bumpT -= dt;
    const next = phaseFor(bc.phases, b.hp / b.max);
    if (next !== b.phase && b.state !== 'enter') {
      b.phase = next; const P = ph(G);
      shake(G, 0.45); say(G, bc.lines[next][0]); Sfx.play('phase'); announce(G, P.name, P.col);
      if (P.valetEvery) { spawnValet(G); b.valetT = P.valetEvery * G.d.freq; }
      if (P.escorts) { spawnEscorts(G, P); b.hornT = P.hornFirst ?? 2; }
    }
    if (b.slip > 0) { b.slip -= dt; b.x += Math.sin(G.t * 22) * 90 * dt; b.ang = Math.sin(G.t * 11) * 0.35; }
    else if (b.bumpT > 0) b.ang = Math.sin(G.t * 40) * 0.08; else b.ang *= 0.85;

    runState(STATES, b.state, G, dt);

    b.x = clamp(b.x, G.cfg.road.left + b.w / 2 + 2, G.cfg.road.right - b.w / 2 - 2);
    const P = ph(G);
    if (P.valetEvery && b.state !== 'enter') { b.valetT -= dt; if (b.valetT <= 0) { spawnValet(G); b.valetT = P.valetEvery * G.d.freq; } }
    if (P.hornEvery) {
      b.hornT -= dt;
      if (b.hornT <= 0) {
        const R = P.hornRadius ?? 150;
        b.hornT = P.hornEvery * G.d.freq; G.rings.push({ x: b.x, y: b.y, r: 10, max: R, col: C.pink, life: 0.6 }); Sfx.play('bossHorn');
        if (Math.hypot(p.x - b.x, p.y - b.y) < R + p.h / 2 && p.pw.soat <= 0) { p.stun = P.stun ?? 1; floatText(G, p.x, p.y - 40, '¡ATURDIDO!', C.yellow); }
        shake(G, 0.2);
      }
    }
    // choque cuerpo a cuerpo: el lado derecho es su punto ciego
    if (overlap(p, b)) {
      const dx = p.x - b.x, dy = p.y - b.y, ox = (p.w + b.w) / 2 - Math.abs(dx), oy = (p.h + b.h) / 2 - Math.abs(dy);
      if (ox < oy) { p.x += Math.sign(dx || 1) * ox; p.vx = Math.sign(dx || 1) * pc.bossPush; }
      else { p.y += Math.sign(dy || 1) * oy; p.vy = Math.sign(dy || 1) * pc.bossPush; }
      if (p.hitCd <= 0) {
        p.hitCd = pc.bossHitCd; const fromRight = dx > 0;
        dmgBoss(G, G.cfg.weapons.ram.dmg * (p.pw.turbo > 0 ? pc.turboMult : 1), fromRight);
        hurt(G, b.state === 'ram' || b.state === 'rev' ? bc.chargeContactDmg : bc.contactDmg);
        burst(G, (p.x + b.x) / 2, (p.y + b.y) / 2, C.yellow, 14);
      }
    }
  },
};

export const randomLine = (G: Game) => pick(G.cfg.boss.lines[G.b.phase]);
