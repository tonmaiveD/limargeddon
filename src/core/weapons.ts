import { Sfx } from './audio/sfx';
import { C, rnd } from './util';
import { burst, dmgBoss, fine, floatText, say, type Game } from './state';
import { scareFlock } from './hazards';

/* Armas del Tico: conos, aceite, claxon y la canchita del bonus. Cooldowns y daño salen del JSON. */

export function fire(G: Game): void {
  const p = G.p, b = G.b, k = G.keys, Wp = G.cfg.weapons;
  if (p.pw.cancha > 0 && p.cd.cancha <= 0) {
    const c = Wp.cancha; p.cd.cancha = c.cd;
    [-c.spread, c.spread].forEach((vx) => G.shots.push({ k: 'kernel', x: p.x + vx / 12, y: p.y - 26, vx: vx + rnd(-c.jitter, c.jitter), vy: c.vy, r: c.r }));
    Sfx.play('kernel');
  }
  fireCone(G);
  if (k.oil && p.cd.oil <= 0) { p.cd.oil = Wp.oil.cd; G.shots.push({ k: 'oil', x: p.x, y: p.y - 28, vx: 0, vy: Wp.oil.vy, r: Wp.oil.r }); Sfx.play('oil'); }
  if (k.horn && p.cd.horn <= 0) {
    const h = Wp.horn; p.cd.horn = h.cd;
    G.rings.push({ x: p.x, y: p.y, r: 10, max: h.ring, col: C.yellow, life: 0.5 }); Sfx.play('horn'); scareFlock(G);
    if (Math.hypot(p.x - b.x, p.y - b.y) <= h.reach && b.state !== 'enter') {
      b.phoneOff = h.phoneOff; dmgBoss(G, h.dmg, false); say(G, G.cfg.boss.quips.horn); G.ai.interrupt(G);
    }
    G.traffic.forEach((c) => { if (Math.hypot(c.x - p.x, c.y - p.y) < h.trafficRadius) c.x += Math.sign(c.x - p.x || 1) * h.trafficPush; });
  }
}

function launchCone(G: Game): void {
  const p = G.p, c = G.cfg.weapons.cone;
  G.shots.push({ k: 'cone', x: p.x, y: p.y - 28, vx: 0, vy: c.vy, r: c.r }); Sfx.play('cone');
}

// Conos según el modo de disparo elegido (ver FireMode en config.ts).
function fireCone(G: Game): void {
  const p = G.p, k = G.keys, c = G.cfg.weapons.cone;
  if (G.fireMode === 'toque') {
    // un cono por toque: solo cuenta el momento de presionar, y se gasta la reserva
    const pressed = k.cone && !p.coneHeld;
    if (pressed && p.ammo >= 1 && p.cd.cone <= 0) { p.ammo--; p.cd.cone = c.tapGap ?? 0.08; launchCone(G); }
  } else if (G.fireMode === 'acelerar') {
    if (k.up && p.cd.cone <= 0) { p.cd.cone = c.cd; launchCone(G); }
  } else if (k.cone && p.cd.cone <= 0) { p.cd.cone = c.cd; launchCone(G); }
  p.coneHeld = k.cone;
}

// La reserva de conos del modo por toque se recarga de a uno, aunque el Tico esté aturdido.
export function reloadCones(G: Game, dt: number): void {
  const p = G.p, c = G.cfg.weapons.cone, max = c.ammo ?? 0;
  if (G.fireMode !== 'toque' || p.ammo >= max) { p.reloadT = 0; return; }
  p.reloadT += dt;
  if (p.reloadT >= (c.reload ?? 0.5)) { p.reloadT = 0; p.ammo++; }
}

// Combo de punto ciego: conos seguidos por la derecha suben el multiplicador; un fallo o un golpe por la izquierda lo corta.
function coneHit(G: Game, fromRight: boolean, x: number, y: number): void {
  const combo = G.cfg.weapons.cone.combo, base = G.cfg.weapons.cone.dmg;
  if (!combo || G.fireMode === 'mantener') { dmgBoss(G, base, fromRight); return; }
  if (!fromRight) { breakCombo(G); dmgBoss(G, base, false); return; }
  const n = ++G.combo.n; G.combo.best = Math.max(G.combo.best, n);
  const mult = 1 + combo.step * Math.min(n - 1, combo.maxSteps);
  dmgBoss(G, base * mult, true, n >= 2 ? 14 : undefined);
  if (n >= 2) {
    // la racha cuenta impactos; el daño extra tiene techo (maxSteps), por eso se muestran por separado
    floatText(G, x, y - 46, `RACHA ${n} · DAÑO +${Math.round((mult - 1) * 100)}%`, C.green, n >= 5 ? 13 : 11);
    G.hitstop = Math.max(G.hitstop, combo.hitstop);
    Sfx.play('combo', Math.min(n, 8));
  }
}
function breakCombo(G: Game): void {
  if (G.combo.n >= 3) floatText(G, G.p.x, G.p.y - 46, 'RACHA CORTADA', C.muted);
  G.combo.n = 0;
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
      if (s.k === 'cone') { s.dead = true; s.hitBoss = true; coneHit(G, fr, s.x, s.y); burst(G, s.x, s.y, C.orange, 6, 120); }
      else if (s.k === 'kernel') { s.dead = true; dmgBoss(G, Wp.cancha.dmg, fr); burst(G, s.x, s.y, '#fff3c2', 3, 80); }
      else if (s.k === 'picaron') { s.hit = true; dmgBoss(G, Wp.picaron.dmg, fr); burst(G, s.x, s.y, '#e0954a', 8, 120); Sfx.play('hit'); }
      else { s.dead = true; b.slip = Wp.oil.slip; dmgBoss(G, Wp.oil.dmg, fr); burst(G, s.x, s.y, '#5a4a2a', 16, 140); say(G, G.cfg.boss.quips.oil); Sfx.play('skid'); }
    }
    // impacto válido en una parte del jefe (cuerpo de la serpiente): no corta la racha, pero tampoco la sube
    if (!s.dead && G.ai.hitShot?.(G, s)) { if (s.k !== 'picaron') s.dead = true; s.hitBoss = true; continue; }
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
  // un cono que no le pegó al jefe (se perdió arriba o chocó tráfico) corta el combo
  if (G.combo.n > 0) for (const s of G.shots) if (s.k === 'cone' && !s.hitBoss && (s.dead || s.y <= -60)) { breakCombo(G); break; }
  G.shots = G.shots.filter((s) => !s.dead && s.y > -60 && s.y < 640 + 40);
}
