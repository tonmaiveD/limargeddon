import type { PowerKey } from './config';
import { H } from './constants';
import { Sfx } from './audio/sfx';
import { C, pick } from './util';
import { announce, burst, dmgBoss, laneX, say, shake, type Game } from './state';

/* Bonus en pista: aparición, activación y efectos instantáneos. */

export function spawnPickup(G: Game): void {
  const cfg = G.cfg.pickups, keys = Object.keys(G.cfg.powers) as PowerKey[];
  // la combi y el metro son algo más raros
  let k = pick(keys); if (cfg.rare.includes(k) && Math.random() < cfg.rareReroll) k = pick(cfg.rerollTo);
  G.pickups.push({ k, x: laneX(G.cfg, Math.floor(Math.random() * G.cfg.road.lanes)), y: -20, r: 12, rot: 0 });
}

export function activate(G: Game, k: PowerKey): void {
  const p = G.p, b = G.b, P = G.cfg.powers[k]; G.stats.powers++;
  Sfx.play('pickup'); announce(G, P.name, P.col); burst(G, p.x, p.y, P.col, 18, 180);
  if (P.dur && (k === 'turbo' || k === 'cancha' || k === 'soat')) { p.pw[k] = P.dur; if (k === 'turbo') Sfx.play('turbo'); }
  if (k === 'combi') {
    G.allies.push({ k: 'combi', x: p.x, y: H + 50, w: 34, h: 70, vy: P.vy ?? -560, said: false });
    Sfx.play('combi');
  }
  if (k === 'picaron') {
    const c = G.cfg.weapons.picaron;
    c.vx.forEach((vx) => G.shots.push({ k: 'picaron', x: p.x, y: p.y - 24, vx, vy: c.vy, ay: c.ay, r: c.r, hit: false, t: 0, ret: false }));
    Sfx.play('picaron');
  }
  if (k === 'metro') {
    Sfx.play('metro'); shake(G, 0.6);
    G.rings.push({ x: p.x, y: p.y, r: 20, max: 520, col: C.sky, life: 0.9 });
    G.rings.push({ x: p.x, y: p.y, r: 10, max: 380, col: C.ink, life: 0.7 });
    if (b.state !== 'enter') {
      b.phoneOff = P.phoneOff ?? 2.5; b.slip = Math.max(b.slip, P.slip ?? 1.5); G.ai.interrupt(G); dmgBoss(G, P.dmg ?? 30, false); say(G, G.cfg.boss.quips.metro);
    }
    G.traffic.forEach((c) => { if (!c.invulnerable) c.spin = P.trafficSpin ?? 2.2; });
  }
}
