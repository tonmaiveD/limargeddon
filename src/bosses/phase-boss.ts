import type { BossAttack, BossPhase, BossSummon } from '../core/config';
import { W, H } from '../core/constants';
import { Sfx } from '../core/audio/sfx';
import { C, clamp, overlap, rnd, step } from '../core/util';
import {
  announce, burst, dmgBoss, floatText, hurt, laneOf, laneX, say, shake, usePerk,
  type BossAI, type Game,
} from '../core/state';
import { phaseDef, phaseFor, runState, type StateTable } from './phase-machine';
import { makeCar } from '../core/world';

/*
 * Jefe genérico por fases (ADR 0015), portado de updateBoss/chooseAction del prototipo y parametrizado por JSON:
 * ataques combinables por fase (frenazo, reversa, embestida), valets, invocaciones, escoltas y claxon.
 * La Loca del Q8 y la camioneta del serenazgo son el mismo jefe con distinto JSON y distinto dibujo.
 */

// Estados que un golpe fuerte (claxon, combi, metro) corta para mandarla de vuelta a su carril.
const INTERRUPTIBLE = ['teleRev', 'rev', 'teleRam', 'ram', 'teleBrake', 'brake', 'park', 'teleJet', 'jet', 'teleThrow', 'teleSwing', 'swing'];

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
  startAttack(G, P, pickAttack(P));
}

// Con un solo ataque no se sortea nada (mismo orden de sorteos que el prototipo).
function pickAttack(P: BossPhase): BossAttack {
  if (!P.attacks?.length) return P.attack;
  const total = P.attacks.reduce((a, x) => a + x.weight, 0);
  let r = Math.random() * total;
  for (const a of P.attacks) { if (r < a.weight) return a.k; r -= a.weight; }
  return P.attacks[P.attacks.length - 1].k;
}

function startAttack(G: Game, P: BossPhase, attack: BossAttack): void {
  const b = G.b;
  if (attack === 'brake') { b.state = 'teleBrake'; b.st = P.tele; }
  else if (attack === 'reverse') { b.state = 'teleRev'; b.st = G.d.tele ? P.tele : (P.teleOff ?? P.tele); b.tx = laneX(G.cfg, laneOf(G.cfg, G.p.x)); }
  else if (attack === 'jet' && P.jet) { b.state = 'teleJet'; b.st = P.jet.tele; b.tx = laneX(G.cfg, laneOf(G.cfg, G.p.x)); b.jetHit = false; }
  else if (attack === 'swing' && P.swing) { b.state = 'teleSwing'; b.st = G.d.tele ? P.swing.tele : P.swing.tele * 0.7; b.swing = Math.sign(G.p.x - b.x) || 1; }
  else if (attack === 'throw' && P.throw) { b.state = 'teleThrow'; b.st = G.d.tele ? P.throw.tele : P.throw.tele * 0.7; }
  else { b.state = 'teleRam'; b.st = P.tele; b.rx = G.p.x; Sfx.play('bossHorn'); }
}

// Punto de salida de los proyectiles: la puerta derecha (cobrador) o la parte de atrás (carga del camión).
export function throwOrigin(G: Game): { x: number; y: number } {
  const b = G.b, T = ph(G).throw;
  return T?.from === 'atras' ? { x: b.x, y: b.y + b.h / 2 + 4 } : { x: b.x + b.w / 2, y: b.y + b.h / 4 };
}

// Zona del coletazo: la mitad trasera del jefe corrida hacia el lado del barrido (null si no está barriendo).
export function swingZone(G: Game): { x: number; y: number; w: number; h: number } | null {
  const b = G.b, S = ph(G).swing;
  if (b.state !== 'swing' || !S) return null;
  const k = Math.sin(Math.PI * (1 - b.st / S.dur)), side = Math.sign(b.swing) || 1;
  // la punta de la cola barre un poco más abajo que la mitad trasera
  const h = b.h / 2 + 34;
  return { x: b.x + side * (b.w / 2 + S.reach / 2) * k, y: b.y + h / 2, w: b.w * 0.6 + S.reach * k, h };
}

// Zona del chorro: columna del ancho del JSON desde el frente del jefe hasta abajo.
export function jetZone(G: Game): { x: number; y: number; w: number; h: number } | null {
  const b = G.b, J = ph(G).jet;
  if (b.state !== 'jet' || !J) return null;
  const top = b.y + b.h / 2, defs = G.cfg.obstacles ?? [];
  // el chorro nunca llega a las personas: se corta en el primer grupo de peatones que tenga delante
  let bottom = H;
  for (const ob of G.obstacles) {
    const edge = ob.y - ob.h / 2;
    if (defs[ob.i]?.style === 'peatones' && edge > top && edge < bottom && Math.abs(ob.x - b.x) < (ob.w + J.w) / 2) bottom = edge;
  }
  return { x: b.x, y: (top + bottom) / 2, w: J.w, h: bottom - top };
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
  // chorro: se alinea con el carril del Tico (boquilla brillando) y luego dispara hacia abajo
  teleJet(G, dt) { const b = G.b; b.flash = 'jet'; b.x += step(b.tx - b.x, 140 * dt); b.st -= dt; if (b.st <= 0) { b.state = 'jet'; b.st = ph(G).jet!.dur; Sfx.play('skid'); } },
  jet(G, dt) {
    const b = G.b, p = G.p, J = ph(G).jet!, z = jetZone(G)!; b.flash = 'jet'; b.st -= dt;
    if (overlap(p, z)) {
      const side = Math.sign(p.x - b.x || 1);
      p.x += side * J.push * dt; p.vx = side * J.push * 0.5;
      if (!b.jetHit && p.pw.soat <= 0) { b.jetHit = true; if (!usePerk(G, 'jetHit')) hurt(G, J.dmg, 'CHORRO'); }
    }
    for (const c of G.traffic) if (!c.invulnerable && overlap(c, z)) c.x += Math.sign(c.x - b.x || 1) * J.push * 0.6 * dt;
    if (b.st <= 0) b.state = 'return';
  },
  // coletazo: la mitad trasera tiembla (aviso) y luego barre hacia el lado donde estaba el Tico
  teleSwing(G, dt) { const b = G.b; b.flash = 'swing'; b.st -= dt; if (b.st <= 0) { b.state = 'swing'; b.st = ph(G).swing!.dur; b.jetHit = false; Sfx.play('skid'); } },
  swing(G, dt) {
    const b = G.b, p = G.p, S = ph(G).swing!; b.flash = 'swing'; b.st -= dt;
    b.swing = (Math.sign(b.swing) || 1) * Math.sin(Math.PI * Math.max(0, 1 - b.st / S.dur));
    const z = swingZone(G);
    if (z && p.air <= 0 && !b.jetHit && overlap(p, z)) {
      b.jetHit = true; const side = Math.sign(p.x - b.x) || 1; p.vx = side * S.push;
      if (p.pw.soat <= 0 && !usePerk(G, 'swingHit')) hurt(G, S.dmg, 'COLETAZO');
    }
    if (b.st <= 0) { b.swing = 0; b.state = 'return'; }
  },
  // lanzamiento: el brazo asoma (aviso) y suelta el abanico de proyectiles apuntado al Tico
  teleThrow(G, dt) {
    const b = G.b, T = ph(G).throw!; b.flash = 'throw'; b.st -= dt;
    if (b.st > 0) return;
    const { x: x0, y: y0 } = throwOrigin(G), aim = T.aim === 'abajo' ? Math.PI / 2 : Math.atan2(G.p.y - y0, G.p.x - x0);
    for (let i = 0; i < T.count; i++) {
      const a = aim + (T.count > 1 ? (i / (T.count - 1) - 0.5) * T.spread : 0), col = T.cols ? T.cols[i % T.cols.length] : T.col ?? C.yellow;
      G.foes.push({ x: x0, y: y0, vx: Math.cos(a) * T.speed, vy: Math.sin(a) * T.speed, r: T.r, dmg: T.dmg, col, look: T.look, stun: T.stun });
    }
    if (T.text) floatText(G, x0, y0 - 20, T.text, T.col ?? C.yellow);
    Sfx.play('kernel');
    if (T.park) { b.state = 'park'; b.st = T.park; } else b.state = 'return';
  },
  return(G, dt) {
    const b = G.b; b.flash = null; b.y += (b.baseY - b.y) * Math.min(1, dt * 2.2); b.x += step(b.tx - b.x, 120 * dt);
    if (Math.abs(b.y - b.baseY) < 6) { b.state = 'cruise'; b.act = ph(G).returnAct * G.d.freq; }
  },
};

function spawnValet(G: Game): void {
  const side = Math.random() < 0.5 ? 0 : 1, lane = side ? G.cfg.road.lanes - 1 : 0;
  G.traffic.push({ k: 'valet', x: side ? W + 30 : -30, tx: laneX(G.cfg, lane), y: rnd(290, 360), w: 28, h: 50, vy: 0, hp: 36, max: 36,
    seed: Math.random() * 100, spin: 0, col: '#b9b4c4', enter: 0.7, contactDmg: 8, selfDmg: 10,
    look: { label: 'VALET', labelCol: C.pink, labelSize: 6, labelY: 0.58 } });
  say(G, G.cfg.boss.quips.valet);
}

function spawnEscorts(G: Game, P: BossPhase): void {
  const b = G.b, e = P.escorts!, { left, right } = G.cfg.road;
  [-1, 1].forEach((s, i) => {
    G.traffic.push({ k: 'amiga', x: clamp(b.x + s * 70, left + 20, right - 20), y: -70, w: e.w ?? 32, h: e.h ?? 56, vy: 0, hp: e.hp, max: e.hp,
      seed: Math.random() * 100, spin: 0, col: e.cols[i], life: e.life, phase: Math.random() * 6, contactDmg: e.contactDmg ?? 10, selfDmg: 10, look: e.look ?? { shades: true } });
  });
}

// Invocación genérica: vehículos de un tipo del JSON, desde un costado (estacionándose como el valet) o desde arriba.
function summon(G: Game, S: BossSummon): void {
  const t = G.cfg.traffic.types.find((x) => x.k === S.type);
  if (!t) return;
  for (let i = 0; i < (S.count ?? 1); i++) {
    if (S.from === 'lado') {
      const side = Math.random() < 0.5 ? 0 : 1, lane = side ? G.cfg.road.lanes - 1 : 0;
      const c = makeCar(t, side ? W + 30 : -30, rnd(290, 360));
      c.tx = laneX(G.cfg, lane); c.enter = 0.7; c.vy = 0;
      G.traffic.push(c);
    } else G.traffic.push(makeCar(t, laneX(G.cfg, Math.floor(Math.random() * G.cfg.road.lanes)), -60 - i * 60));
  }
  if (S.say) say(G, S.say);
}

export const PhaseBoss: BossAI = {
  interrupt(G) { const b = G.b; if (INTERRUPTIBLE.includes(b.state)) b.state = 'return'; },

  update(G, dt) {
    const b = G.b, p = G.p, bc = G.cfg.boss, pc = G.cfg.player;
    b.hitFlash -= dt; b.phoneOff -= dt; b.bumpT -= dt;
    const next = phaseFor(bc.phases, b.hp / b.max);
    if (next !== b.phase && b.state !== 'enter') {
      b.phase = next; const P = ph(G);
      shake(G, 0.45); say(G, bc.lines[next][0]); Sfx.play('phase'); announce(G, P.name, P.col);
      if (P.valetEvery) { spawnValet(G); b.valetT = P.valetEvery * G.d.freq; }
      if (P.escorts) spawnEscorts(G, P);
      if (P.hornEvery) b.hornT = P.hornFirst ?? 2; // el primer claxon de la fase respeta su config, con o sin escoltas
      b.summonT = P.summon ? 0 : Infinity;
    }
    if (b.slip > 0) { b.slip -= dt; b.x += Math.sin(G.t * 22) * 90 * dt; b.ang = Math.sin(G.t * 11) * 0.35; }
    else if (b.bumpT > 0) b.ang = Math.sin(G.t * 40) * 0.08; else b.ang *= 0.85;

    runState(STATES, b.state, G, dt);

    b.x = clamp(b.x, G.cfg.road.left + b.w / 2 + 2, G.cfg.road.right - b.w / 2 - 2);
    const P = ph(G);
    if (P.valetEvery && b.state !== 'enter') { b.valetT -= dt; if (b.valetT <= 0) { spawnValet(G); b.valetT = P.valetEvery * G.d.freq; } }
    if (P.summon && b.state !== 'enter') { b.summonT -= dt; if (b.summonT <= 0) { summon(G, P.summon); b.summonT = P.summon.every * G.d.freq; } }
    if (P.hornEvery) {
      b.hornT -= dt;
      if (b.hornT <= 0) {
        const R = P.hornRadius ?? 150;
        b.hornT = P.hornEvery * G.d.freq; G.rings.push({ x: b.x, y: b.y, r: 10, max: R, col: P.hornCol ?? C.pink, life: 0.6 }); Sfx.play(P.hornSound ?? 'bossHorn');
        if (Math.hypot(p.x - b.x, p.y - b.y) < R + p.h / 2 && p.pw.soat <= 0) { p.stun = P.stun ?? 1; floatText(G, p.x, p.y - 40, P.hornText ?? '¡ATURDIDO!', C.yellow); }
        shake(G, 0.2);
      }
    }
    // choque cuerpo a cuerpo: el lado derecho es su punto ciego
    if (p.air <= 0 && overlap(p, b)) {
      const dx = p.x - b.x, dy = p.y - b.y, ox = (p.w + b.w) / 2 - Math.abs(dx), oy = (p.h + b.h) / 2 - Math.abs(dy);
      if (ox < oy) { p.x += Math.sign(dx || 1) * ox; p.vx = Math.sign(dx || 1) * pc.bossPush; }
      else { p.y += Math.sign(dy || 1) * oy; p.vy = Math.sign(dy || 1) * pc.bossPush; }
      if (p.hitCd <= 0) {
        p.hitCd = pc.bossHitCd; const fromRight = dx > 0;
        dmgBoss(G, G.cfg.weapons.ram.dmg * (p.pw.turbo > 0 ? pc.turboMult : 1), fromRight);
        const charge = b.state === 'ram' || b.state === 'rev';
        if (!charge || !usePerk(G, 'ramHit')) hurt(G, charge ? bc.chargeContactDmg : bc.contactDmg, charge ? 'EMBESTIDA' : 'JEFE');
        burst(G, (p.x + b.x) / 2, (p.y + b.y) / 2, C.yellow, 14);
      }
    }
  },
};

