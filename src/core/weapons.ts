import { Sfx } from './audio/sfx';
import { C, rnd } from './util';
import { burst, dmgBoss, fine, say, type Game } from './state';

/* Armas del Tico: conos, aceite, claxon y la canchita del bonus. Cooldowns y daño salen del JSON. */

export function fire(G: Game): void {
  const p = G.p, b = G.b, k = G.keys, Wp = G.cfg.weapons;
  if (p.pw.cancha > 0 && p.cd.cancha <= 0) {
    const c = Wp.cancha; p.cd.cancha = c.cd;
    [-c.spread, c.spread].forEach((vx) => G.shots.push({ k: 'kernel', x: p.x + vx / 12, y: p.y - 26, vx: vx + rnd(-c.jitter, c.jitter), vy: c.vy, r: c.r }));
    Sfx.play('kernel');
  }
  if (k.cone && p.cd.cone <= 0) { p.cd.cone = Wp.cone.cd; G.shots.push({ k: 'cone', x: p.x, y: p.y - 28, vx: 0, vy: Wp.cone.vy, r: Wp.cone.r }); Sfx.play('cone'); }
  if (k.oil && p.cd.oil <= 0) { p.cd.oil = Wp.oil.cd; G.shots.push({ k: 'oil', x: p.x, y: p.y - 28, vx: 0, vy: Wp.oil.vy, r: Wp.oil.r }); Sfx.play('oil'); }
  if (k.horn && p.cd.horn <= 0) {
    const h = Wp.horn; p.cd.horn = h.cd;
    G.rings.push({ x: p.x, y: p.y, r: 10, max: h.ring, col: C.yellow, life: 0.5 }); Sfx.play('horn');
    if (Math.hypot(p.x - b.x, p.y - b.y) <= h.reach && b.state !== 'enter') {
      b.phoneOff = h.phoneOff; dmgBoss(G, h.dmg, false); say(G, G.cfg.boss.quips.horn); G.ai.interrupt(G);
    }
    G.traffic.forEach((c) => { if (Math.hypot(c.x - p.x, c.y - p.y) < h.trafficRadius) c.x += Math.sign(c.x - p.x || 1) * h.trafficPush; });
  }
}

export function updateShots(G: Game, dt: number): void {
  const p = G.p, b = G.b, Wp = G.cfg.weapons, F = G.cfg.fines;
  for (const s of G.shots) {
    s.x += (s.vx || 0) * dt; s.y += s.vy * dt;
    if (s.k === 'picaron') {
      s.t! += dt; s.vy += s.ay! * dt; s.vx *= 0.985;
      if (!s.ret && s.vy > 0) { s.ret = true; s.hit = false; } // de regreso puede volver a golpear
      if ((s.ret && s.y > p.y + 30) || s.t! > Wp.picaron.life) s.dead = true;
    }
    if (!s.dead && !s.hit && b.state !== 'enter' && Math.abs(s.x - b.x) < b.w / 2 + s.r && Math.abs(s.y - b.y) < b.h / 2) {
      const fr = s.x > b.x;
      if (s.k === 'cone') { s.dead = true; dmgBoss(G, Wp.cone.dmg, fr); burst(G, s.x, s.y, C.orange, 6, 120); }
      else if (s.k === 'kernel') { s.dead = true; dmgBoss(G, Wp.cancha.dmg, fr); burst(G, s.x, s.y, '#fff3c2', 3, 80); }
      else if (s.k === 'picaron') { s.hit = true; dmgBoss(G, Wp.picaron.dmg, fr); burst(G, s.x, s.y, '#e0954a', 8, 120); Sfx.play('hit'); }
      else { s.dead = true; b.slip = Wp.oil.slip; dmgBoss(G, Wp.oil.dmg, fr); burst(G, s.x, s.y, '#5a4a2a', 16, 140); say(G, G.cfg.boss.quips.oil); Sfx.play('skid'); }
    }
    if (!s.dead) for (const c of G.traffic) {
      if (Math.abs(s.x - c.x) < c.w / 2 + s.r && Math.abs(s.y - c.y) < c.h / 2) {
        if (s.k !== 'picaron') s.dead = true;
        if (c.invulnerable) { if (!c.flash || c.flash <= 0) { fine(G, c.x, c.y, F.amount, F.shot); c.flash = 0.6; } }
        else if (s.k === 'oil') c.spin = Wp.oil.trafficSpin;
        else c.hp -= s.k === 'kernel' ? Wp.cancha.trafficDmg : Wp.cone.trafficDmg;
        burst(G, s.x, s.y, C.orange, 4, 90); break;
      }
    }
  }
  G.shots = G.shots.filter((s) => !s.dead && s.y > -60 && s.y < 640 + 40);
}
