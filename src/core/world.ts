import { H } from './constants';
import { Sfx } from './audio/sfx';
import { C, overlap, pick, rnd, step, clamp } from './util';
import { burst, fine, floatText, hurt, dmgBoss, laneX, say, shake, type Game } from './state';
import { updatePlayer } from './vehicle';
import { updateShots } from './weapons';
import { activate, spawnPickup } from './powerups';
import { W } from './constants';

/* Mundo: apariciones, rompemuelles, cruces, tráfico, aliados, bonus, partículas y fin de partida. */

export function spawnCar(G: Game): void {
  const T = G.cfg.traffic.types, lane = Math.floor(Math.random() * G.cfg.road.lanes);
  let r = Math.random(), t = T[T.length - 1];
  for (const ty of T) { if (r < ty.weight) { t = ty; break; } r -= ty.weight; }
  // mismo orden de sorteos que el prototipo: velocidad, color (si hay varios), zigzag, semilla
  const vy = rnd(t.vy[0], t.vy[1]);
  const col = t.cols.length > 1 ? pick(t.cols) : t.cols[0];
  const zz = t.k === 'scooter' ? Math.random() * 6 : undefined;
  G.traffic.push({
    k: t.k, x: laneX(G.cfg, lane), y: -60, w: t.w, h: t.h, vy, hp: t.hp, max: t.hp, col,
    spin: 0, seed: Math.random() * 100, invulnerable: t.invulnerable, contactDmg: t.contactDmg, selfDmg: t.selfDmg, zz,
  });
}

export function updateWorld(G: Game, dt: number): void {
  const b = G.b, p = G.p, cfg = G.cfg, k = G.keys, play = G.mode === 'play';
  const base = cfg.road.speed;
  G.speed = p.pw.turbo > 0 ? cfg.road.turboSpeed : base; const extra = G.speed - base;
  const lastPhase = b.phase === cfg.boss.phases.length;
  if (play) {
    G.trafficT -= dt; if (G.trafficT <= 0 && b.state !== 'enter') { spawnCar(G); G.trafficT = rnd(...cfg.traffic.every) * (lastPhase ? cfg.traffic.lastPhaseMult : 1); }
    G.pickT -= dt; if (G.pickT <= 0 && b.state !== 'enter') { spawnPickup(G); G.pickT = rnd(...cfg.pickups.every); }
    G.bumpT -= dt; if (G.bumpT <= 0) { G.bumps.push({ y: -10, hitP: false, hitB: false }); G.bumpT = rnd(...cfg.bumps.every); }
    G.crossT -= dt; if (G.crossT <= 0) { G.cross.push({ y: -40, name: cfg.streets[G.streetI++ % cfg.streets.length] }); G.crossT = rnd(...cfg.crossings.every); }
  }
  // rompemuelles y cruces
  for (const m of G.bumps) {
    m.y += G.speed * dt;
    if (!m.hitB && b.state !== 'enter' && Math.abs(m.y - b.y) < b.h / 2) { m.hitB = true; b.bumpT = 0.35; }
    if (!m.hitP && Math.abs(m.y - p.y) < p.h / 2 && play) {
      m.hitP = true; Sfx.play('bump');
      if (k.up && p.pw.turbo <= 0) { hurt(G, cfg.bumps.dmg); floatText(G, p.x, p.y - 46, '¡ROMPEMUELLES!', C.yellow); shake(G, 0.3); }
      else if (p.pw.turbo > 0) { floatText(G, p.x, p.y - 46, '¡VUELA!', C.orange); burst(G, p.x, p.y, C.orange, 8); }
      else shake(G, 0.08);
    }
  }
  G.bumps = G.bumps.filter((m) => m.y < H + 20);
  for (const c of G.cross) c.y += G.speed * dt; G.cross = G.cross.filter((c) => c.y < H + 60);
  // tráfico
  for (const c of G.traffic) {
    if (c.k === 'valet') { if (c.enter! > 0) { c.enter! -= dt; c.x += (c.tx! - c.x) * Math.min(1, dt * 5); } else c.y += (70 + extra) * dt; }
    else if (c.k === 'amiga') {
      c.life! -= dt; c.phase! += dt;
      if (c.life! > 0) { c.y += ((240 + Math.sin(c.phase!) * 40) - c.y) * Math.min(1, dt * 1.5); c.x += step(p.x - c.x, 45 * dt); }
      else c.y -= 240 * dt;
    } else { c.y += (c.vy + extra) * dt; if (c.k === 'scooter') { c.zz! += dt * 3; c.x += Math.sin(c.zz!) * 50 * dt; } }
    if (c.spin > 0) { c.spin -= dt; c.x += Math.sin(G.t * 20) * 70 * dt; }
    const inValet = c.k === 'valet' && c.enter! > 0;
    c.x = clamp(c.x, inValet ? -40 : cfg.road.left + c.w / 2, inValet ? W + 40 : cfg.road.right - c.w / 2);
    if (play && overlap(p, c)) {
      const dx = p.x - c.x, dy = p.y - c.y, ox = (p.w + c.w) / 2 - Math.abs(dx), oy = (p.h + c.h) / 2 - Math.abs(dy), push = cfg.player.trafficPush;
      if (ox < oy) { p.x += Math.sign(dx || 1) * ox; p.vx = Math.sign(dx || 1) * push; } else { p.y += Math.sign(dy || 1) * oy; p.vy = Math.sign(dy || 1) * push; }
      if (p.hitCd <= 0) {
        p.hitCd = cfg.player.trafficHitCd;
        if (c.invulnerable) { fine(G, p.x, p.y, cfg.fines.amount, cfg.fines.contact); c.flash = 0.3; }
        else if (p.pw.turbo > 0) { c.hp = 0; Sfx.play('hit'); }
        else { hurt(G, c.contactDmg ?? 8); c.hp -= c.selfDmg ?? 10; }
        burst(G, (p.x + c.x) / 2, (p.y + c.y) / 2, C.orange, 8);
      }
    }
    if (c.flash) c.flash -= dt;
  }
  updateShots(G, dt);
  // aliados: combi kamikaze
  for (const a of G.allies) {
    a.y += a.vy * dt; if (b.state !== 'enter') a.x += step(b.x - a.x, 260 * dt);
    if (!a.said && a.y < H - 60) { a.said = true; floatText(G, a.x, a.y - 50, '¡AL FONDO HAY SITIO!', C.pink); }
    for (const c of G.traffic) if (!c.invulnerable && overlap(a, c)) c.hp = 0;
    if (!a.dead && b.state !== 'enter' && overlap(a, b)) {
      a.dead = true; dmgBoss(G, cfg.powers.combi.dmg ?? 80, false); b.slip = Math.max(b.slip, 1); G.ai.interrupt(G); shake(G, 0.7); Sfx.play('boom');
      burst(G, b.x, b.y + 30, C.pink, 30, 240); burst(G, b.x, b.y + 30, C.yellow, 20, 200); say(G, cfg.boss.quips.combi);
    }
  }
  G.allies = G.allies.filter((a) => !a.dead && a.y > -100);
  // bonus
  for (const u of G.pickups) {
    u.y += (cfg.pickups.fall + extra) * dt; u.rot += dt * 3;
    if (play && Math.hypot(u.x - p.x, u.y - p.y) < p.h / 2 + u.r) { u.dead = true; activate(G, u.k); }
  }
  G.pickups = G.pickups.filter((u) => !u.dead && u.y < H + 30);
  G.traffic = G.traffic.filter((c) => {
    if (c.hp <= 0) {
      burst(G, c.x, c.y, C.orange, 22, 200); burst(G, c.x, c.y, '#777', 10, 90); G.bonus += cfg.traffic.killBonus;
      floatText(G, c.x, c.y, '+S/' + cfg.traffic.killBonus, C.green); shake(G, 0.15); Sfx.play('boom'); return false;
    }
    return c.y < H + 80 && c.y > -140;
  });
  for (const q of G.parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.96; q.vy *= 0.96; q.life -= dt; }
  G.parts = G.parts.filter((q) => q.life > 0);
  for (const r of G.rings) { r.r += (r.max / r.life) * dt * 0.9; r.life -= dt; } G.rings = G.rings.filter((r) => r.life > 0);
  for (const f of G.floats) { f.y -= 40 * dt; f.life -= dt; } G.floats = G.floats.filter((f) => f.life > 0);
  if (G.announce) { G.announce.life -= dt; if (G.announce.life <= 0) G.announce = null; }
  if (G.bubble) { G.bubble.t -= dt; if (G.bubble.t <= 0) G.bubble = null; }
  if (play) { G.bubbleT -= dt; if (G.bubbleT <= 0 && b.state !== 'enter') say(G, pick(cfg.boss.lines[b.phase])); }
  // humo sobre el 50% de daño, fuego sobre el 80%
  const emit = (e: { x: number; y: number; w: number; h: number }, d: number) => {
    if (d < 0.5) return;
    if (Math.random() < (d - 0.4) * dt * 28) G.parts.push({ x: e.x + rnd(-e.w / 4, e.w / 4), y: e.y - e.h / 2 + 6, vx: rnd(-15, 15), vy: rnd(60, 120), life: 0.8, max: 0.8, col: pick(['#5c5866', '#77727f', '#3e3a45']), size: rnd(3, 6) });
    if (d > 0.8 && Math.random() < dt * 14) G.parts.push({ x: e.x + rnd(-5, 5), y: e.y - e.h / 2 + 8, vx: rnd(-10, 10), vy: rnd(40, 90), life: 0.35, max: 0.35, col: pick([C.orange, C.yellow, '#ff4a2a']), size: rnd(2, 4) });
  };
  emit(p, 1 - p.hp / p.max); if (b.state !== 'enter') emit(b, 1 - b.hp / b.max);
  for (const c of G.traffic) if (c.max && !c.invulnerable) emit(c, 1 - c.hp / c.max);
  G.shake = Math.max(0, G.shake - dt);
}

// Un paso de simulación. Devuelve true el cuadro en que termina la pelea.
export function update(G: Game, dt: number): boolean {
  G.t += dt;
  updatePlayer(G, dt); G.ai.update(G, dt); updateWorld(G, dt);
  if (G.b.hp <= 0 || G.p.hp <= 0) {
    const win = G.b.hp <= 0;
    G.mode = 'over'; G.result = { win };
    Sfx.music(false); Sfx.engine(0); Sfx.play('boom'); setTimeout(() => Sfx.play(win ? 'win' : 'lose'), 500);
    burst(G, win ? G.b.x : G.p.x, win ? G.b.y : G.p.y, win ? C.yellow : C.pink, 40, 260);
    return true;
  }
  return false;
}

export interface Summary {
  win: boolean; time: string; seconds: number; rightPct: number; powers: number; fines: number; pay: number;
  blind: boolean; clean: boolean; honest: boolean;
}

export function summarize(G: Game): Summary {
  const win = !!G.result?.win, s = G.stats, R = G.cfg.rewards;
  const pct = s.total ? Math.round((s.right / s.total) * 100) : 0;
  const clean = win && !s.dmgP3, blind = win && pct >= R.blindPct, honest = G.fines === 0;
  const gross = win ? R.win + (clean ? R.clean : 0) + G.bonus : G.bonus, pay = Math.max(0, gross - G.fines);
  const mm = Math.floor(G.t / 60), ss = String(Math.floor(G.t % 60)).padStart(2, '0');
  return { win, time: `${mm}:${ss}`, seconds: G.t, rightPct: pct, powers: s.powers, fines: G.fines, pay, blind, clean, honest };
}
