import { H } from './constants';
import { Sfx } from './audio/sfx';
import { C, overlap, pick, rnd, step, clamp } from './util';
import { announce, burst, fine, floatText, hurt, dmgBoss, laneX, say, shake, usePerk, type Car, type Game } from './state';
import type { TrafficType } from './config';
import { updatePlayer } from './vehicle';
import { updateShots } from './weapons';
import { activate, spawnPickup } from './powerups';
import { W } from './constants';

/* Mundo: apariciones, rompemuelles, cruces, tráfico, aliados, bonus, partículas y fin de partida. */

export function spawnCar(G: Game): void {
  const T = G.cfg.traffic.types, lane = Math.floor(Math.random() * G.cfg.road.lanes);
  let r = Math.random(), t = T[T.length - 1];
  for (const ty of T) { if (r < ty.weight) { t = ty; break; } r -= ty.weight; }
  G.traffic.push(makeCar(t, laneX(G.cfg, lane), -60));
}

// Crea un vehículo de un tipo del JSON. Mismo orden de sorteos que el prototipo: velocidad, color (si hay varios), zigzag, semilla.
export function makeCar(t: TrafficType, x: number, y: number): Car {
  const vy = rnd(t.vy[0], t.vy[1]);
  const col = t.cols.length > 1 ? pick(t.cols) : t.cols[0];
  const zz = t.move?.zigzag ? Math.random() * 6 : undefined;
  return {
    k: t.k, x, y, w: t.w, h: t.h, vy, hp: t.hp, max: t.hp, col,
    spin: 0, seed: Math.random() * 100, invulnerable: t.invulnerable, contactDmg: t.contactDmg, selfDmg: t.selfDmg, killBonus: t.killBonus, zz,
    look: t.look, move: t.move,
  };
}

// Un enjambre entra por arriba en formación. Comparten la fase del zigzag para moverse como grupo.
export function spawnSwarm(G: Game, i: number): void {
  const S = G.cfg.swarms![i], t = G.cfg.traffic.types.find((ty) => ty.k === S.type);
  if (!t) return;
  const lanes = G.cfg.road.lanes, n = Math.round(rnd(S.count[0], S.count[1])), lane = Math.floor(Math.random() * lanes), zz = Math.random() * 6;
  for (let j = 0; j < n; j++) {
    let x = laneX(G.cfg, lane), y = -60 - j * S.gap;
    if (S.formation === 'v') { const side = j % 2 ? 1 : -1, row = Math.ceil(j / 2); x += side * row * S.gap * 0.6; y = -60 - row * S.gap; }
    else if (S.formation === 'diagonal') x = laneX(G.cfg, (lane + j) % lanes);
    const c = makeCar(t, x, y);
    if (c.zz !== undefined) c.zz = zz + j * 0.3;
    G.traffic.push(c);
  }
  if (S.label) announce(G, S.label, C.orange);
}

// El jefe se abre paso: el tráfico se aparta hacia el lado con espacio en vez de pasarle por debajo.
// Si no cabe a ningún lado, queda atascado detrás (o empujado delante si el jefe lo embiste en reversa o carga).
function yieldToBoss(G: Game, c: Car): void {
  if (G.b.state === 'enter' || !overlap(c, G.b)) return;
  pushAside(G, c, G.b);
}

// Saca a un auto de encima de una caja: al lado con espacio, o delante/detrás si no cabe.
function pushAside(G: Game, c: Car, b: { x: number; y: number; w: number; h: number }): void {
  const { left, right } = G.cfg.road;
  const half = (c.w + b.w) / 2, toLeft = b.x - half, toRight = b.x + half;
  const fitsL = toLeft >= left + c.w / 2, fitsR = toRight <= right - c.w / 2;
  const preferRight = c.x >= b.x;
  if (preferRight ? fitsR : fitsL) c.x = preferRight ? toRight : toLeft;
  else if (preferRight ? fitsL : fitsR) c.x = preferRight ? toLeft : toRight;
  else c.y = c.y < b.y ? b.y - (c.h + b.h) / 2 : b.y + (c.h + b.h) / 2;
  if (c.spin <= 0 && !c.invulnerable) c.spin = 0.25; // pequeño coletazo al ser empujado
}

function spawnObstacle(G: Game, i: number): void {
  const o = G.cfg.obstacles![i], { lanes, laneWidth, left } = G.cfg.road;
  const n = Math.min(o.lanes, lanes), first = Math.floor(Math.random() * (lanes - n + 1));
  const w = Math.min(o.w ?? Infinity, n * laneWidth - 10), x = left + first * laneWidth + (n * laneWidth) / 2;
  G.obstacles.push({ i, x, y: -o.h, w, h: o.h, hit: false, bx: x, ph: o.drift ? Math.random() * 6 : undefined });
}

// Obstáculos: avanzan con el asfalto. Los bloques empujan al Tico y al tráfico; los huecos castigan al pasar.
function updateObstacles(G: Game, dt: number): void {
  const p = G.p, play = G.mode === 'play', defs = G.cfg.obstacles ?? [];
  for (const ob of G.obstacles) {
    ob.y += G.speed * dt;
    const o = defs[ob.i];
    if (o.drift && ob.ph !== undefined) {
      ob.ph += dt * o.drift.freq;
      ob.x = clamp(ob.bx! + Math.sin(ob.ph) * o.drift.amp, G.cfg.road.left + ob.w / 2, G.cfg.road.right - ob.w / 2);
    }
    if (o.kind === 'rampa') {
      // rampa: acelerando (o con turbo) el Tico sale volando; sin acelerar, solo un saltito
      if (play && !ob.hit && p.air <= 0 && overlap(p, ob)) {
        ob.hit = true;
        if (G.keys.up || p.pw.turbo > 0) { p.air = p.airMax = o.jump ?? 0.9; floatText(G, p.x, p.y - 46, o.hitText ?? '¡A VOLAR!', C.orange); Sfx.play('pickup'); }
        else shake(G, 0.08);
      }
      continue;
    }
    if (p.air > 0) continue; // en el aire pasa por encima de bloques y huecos
    if (o.kind === 'bloque') {
      if (play && overlap(p, ob)) {
        const dx = p.x - ob.x, dy = p.y - ob.y, ox = (p.w + ob.w) / 2 - Math.abs(dx), oy = (p.h + ob.h) / 2 - Math.abs(dy);
        if (ox < oy) { p.x += Math.sign(dx || 1) * ox; p.vx = Math.sign(dx || 1) * 160; } else { p.y += Math.sign(dy || 1) * oy; p.vy = Math.sign(dy || 1) * 160; }
        if (!ob.hit && p.hitCd <= 0) {
          ob.hit = true; p.hitCd = G.cfg.player.trafficHitCd;
          if (p.pw.turbo > 0) { floatText(G, ob.x, ob.y - 10, '¡FUERA!', C.orange); burst(G, ob.x, ob.y, o.col, 12); ob.y = 9999; }
          else { if (o.dmg && !usePerk(G, 'obstacleHit')) hurt(G, o.dmg); if (o.fine) fine(G, p.x, p.y, o.fine, 'PAPELETA'); burst(G, p.x, p.y - p.h / 2, o.col, 8); }
        }
      }
    } else if (play && !ob.hit && overlap(p, ob) && (!o.accelOnly || G.keys.up)) {
      ob.hit = true;
      if (p.pw.turbo > 0) { floatText(G, p.x, p.y - 46, '¡VUELA!', C.orange); burst(G, p.x, p.y, C.orange, 8); }
      else {
        if (!usePerk(G, 'obstacleHit')) hurt(G, o.dmg);
        floatText(G, p.x, p.y - 46, o.hitText ?? '¡HUECO!', C.yellow); shake(G, 0.35); Sfx.play('bump');
      }
    }
  }
  G.obstacles = G.obstacles.filter((ob) => ob.y < 640 + 60);
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
    G.swarmT.forEach((t, i) => {
      if (!isFinite(t) || b.state === 'enter') return;
      G.swarmT[i] = t - dt;
      if (G.swarmT[i] <= 0) { spawnSwarm(G, i); G.swarmT[i] = rnd(...G.cfg.swarms![i].every); }
    });
    G.obsT.forEach((t, i) => {
      if (!isFinite(t) || b.state === 'enter') return;
      G.obsT[i] = t - dt;
      if (G.obsT[i] <= 0) { spawnObstacle(G, i); G.obsT[i] = rnd(...G.cfg.obstacles![i].every); }
    });
    // Socio de la Combi: una combi aliada llega sola cada cierto tiempo a embestir al jefe
    if (isFinite(G.allyT) && b.state !== 'enter') {
      G.allyT -= dt;
      if (G.allyT <= 0) {
        G.allyT = cfg.player.allyEvery!;
        G.allies.push({ k: 'combi', x: p.x, y: H + 50, w: 34, h: 70, vy: cfg.powers.combi.vy ?? -560, said: false, dmg: cfg.player.allyDmg });
        Sfx.play('combi');
      }
    }
    G.crossT -= dt; if (G.crossT <= 0) { G.cross.push({ y: -40, name: cfg.streets[G.streetI++ % cfg.streets.length] }); G.crossT = rnd(...cfg.crossings.every); }
  }
  // rompemuelles y cruces
  for (const m of G.bumps) {
    m.y += G.speed * dt;
    if (!m.hitB && b.state !== 'enter' && Math.abs(m.y - b.y) < b.h / 2) { m.hitB = true; b.bumpT = 0.35; }
    if (!m.hitP && Math.abs(m.y - p.y) < p.h / 2 && play && p.air <= 0) {
      m.hitP = true; Sfx.play('bump');
      if (k.up && p.pw.turbo <= 0) { hurt(G, cfg.bumps.dmg); floatText(G, p.x, p.y - 46, '¡ROMPEMUELLES!', C.yellow); shake(G, 0.3); }
      else if (p.pw.turbo > 0) { floatText(G, p.x, p.y - 46, '¡VUELA!', C.orange); burst(G, p.x, p.y, C.orange, 8); }
      else shake(G, 0.08);
    }
  }
  G.bumps = G.bumps.filter((m) => m.y < H + 20);
  for (const c of G.cross) c.y += G.speed * dt; G.cross = G.cross.filter((c) => c.y < H + 60);
  updateObstacles(G, dt);
  // tráfico
  for (const c of G.traffic) {
    // entra desde un costado (valet, invocaciones) o sigue al Tico (escoltas): se decide por sus datos, no por su nombre
    if (c.enter !== undefined) { if (c.enter > 0) { c.enter! -= dt; c.x += (c.tx! - c.x) * Math.min(1, dt * 5); } else c.y += (70 + extra) * dt; }
    else if (c.life !== undefined) {
      c.life! -= dt; c.phase! += dt;
      if (c.life! > 0) { c.y += ((240 + Math.sin(c.phase!) * 40) - c.y) * Math.min(1, dt * 1.5); c.x += step(p.x - c.x, 45 * dt); }
      else c.y -= 240 * dt;
    } else {
      c.y += (c.vy + extra) * dt;
      const zig = c.move?.zigzag; if (zig) { c.zz! += dt * zig.freq; c.x += Math.sin(c.zz!) * zig.amp * dt; }
      // frenazo en seco: se detiene en la pista (baja en pantalla a la velocidad de la vía) con luces de freno
      const br = c.move?.brake;
      if (br) {
        if ((c.brakeT ?? 0) > 0) { c.brakeT! -= dt; c.y += (cfg.road.speed - c.vy) * dt; }
        else if (c.y > 40 && c.y < p.y - 140 && Math.random() < br.chance * dt) c.brakeT = br.dur;
      }
    }
    if (c.spin > 0) { c.spin -= dt; c.x += Math.sin(G.t * 20) * 70 * dt; }
    // con el sticker, serenazgo y policía se corren de carril cuando el Tico viene detrás
    if (cfg.player.privilege && c.invulnerable && c.y < p.y && p.y - c.y < 160 && Math.abs(c.x - p.x) < (c.w + p.w) / 2 + 8) c.x += Math.sign(c.x - p.x || 1) * 130 * dt;
    const inValet = c.enter !== undefined && c.enter > 0;
    // los bloques (obras, conos, barreras) también desvían al tráfico; si un auto queda apretado entre un bloque
    // y el jefe, se resuelve en pocas pasadas y el jefe va al final (lo más visible es que no le pase por debajo)
    if (!inValet) for (let pass = 0; pass < 3; pass++) {
      for (const ob of G.obstacles) if (cfg.obstacles![ob.i].kind === 'bloque' && overlap(c, ob)) pushAside(G, c, ob);
      if (cfg.traffic.yieldToBoss) yieldToBoss(G, c);
    }
    // si sigue atrapado entre un bloque y el jefe, se queda esperando detrás del bloque
    if (!inValet) for (const ob of G.obstacles) if (cfg.obstacles![ob.i].kind === 'bloque' && overlap(c, ob)) c.y = ob.y - (c.h + ob.h) / 2;
    c.x = clamp(c.x, inValet ? -40 : cfg.road.left + c.w / 2, inValet ? W + 40 : cfg.road.right - c.w / 2);
    if (play && p.air <= 0 && overlap(p, c)) {
      const dx = p.x - c.x, dy = p.y - c.y, ox = (p.w + c.w) / 2 - Math.abs(dx), oy = (p.h + c.h) / 2 - Math.abs(dy), push = cfg.player.trafficPush;
      if (ox < oy) { p.x += Math.sign(dx || 1) * ox; p.vx = Math.sign(dx || 1) * push; } else { p.y += Math.sign(dy || 1) * oy; p.vy = Math.sign(dy || 1) * push; }
      if (p.hitCd <= 0) {
        p.hitCd = cfg.player.trafficHitCd;
        if (c.invulnerable) { fine(G, p.x, p.y, cfg.fines.amount, cfg.fines.contact, true); c.flash = 0.3; }
        else if (p.pw.turbo > 0) { c.hp = 0; Sfx.play('hit'); }
        else { hurt(G, c.contactDmg ?? 8); c.hp -= c.selfDmg ?? 10; }
        burst(G, (p.x + c.x) / 2, (p.y + c.y) / 2, C.orange, 8);
      }
    }
    if (c.flash) c.flash -= dt;
  }
  updateShots(G, dt);
  // proyectiles del jefe: el SOAT los bloquea; el Casco de obra perdona el primero
  for (const f of G.foes) {
    f.x += f.vx * dt; f.y += f.vy * dt;
    if (play && Math.hypot(f.x - p.x, f.y - p.y) < f.r + p.w / 2) {
      f.dead = true; burst(G, f.x, f.y, f.col, 6, 120);
      if (p.pw.soat > 0 || !usePerk(G, 'shotHit')) hurt(G, f.dmg); // con SOAT, hurt lo bloquea sin gastar el casco
    }
  }
  G.foes = G.foes.filter((f) => !f.dead && f.y < H + 20 && f.y > -40 && f.x > -40 && f.x < W + 40);
  // aliados: combi kamikaze
  for (const a of G.allies) {
    a.y += a.vy * dt; if (b.state !== 'enter') a.x += step(b.x - a.x, 260 * dt);
    if (!a.said && a.y < H - 60) { a.said = true; floatText(G, a.x, a.y - 50, '¡AL FONDO HAY SITIO!', C.pink); }
    for (const c of G.traffic) if (!c.invulnerable && overlap(a, c)) c.hp = 0;
    if (!a.dead && b.state !== 'enter' && overlap(a, b)) {
      a.dead = true; dmgBoss(G, a.dmg ?? cfg.powers.combi.dmg ?? 80, false); b.slip = Math.max(b.slip, 1); G.ai.interrupt(G); shake(G, 0.7); Sfx.play('boom');
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
      const pay = c.killBonus ?? cfg.traffic.killBonus;
      burst(G, c.x, c.y, C.orange, 22, 200); burst(G, c.x, c.y, '#777', 10, 90); G.bonus += pay;
      if (pay) floatText(G, c.x, c.y, '+S/' + pay, C.green);
      shake(G, 0.15); Sfx.play('boom'); return false;
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
  G.shake = Math.max(0, G.shake - dt); G.privilegeT -= dt;
}

// Un paso de simulación. Devuelve true el cuadro en que termina la pelea.
export function update(G: Game, dt: number): boolean {
  G.t += dt;
  const hints = G.cfg.hints;
  if (hints && G.hintI < hints.length && G.t >= hints[G.hintI].at) G.hint = { text: hints[G.hintI++].text, life: 3.2 };
  if (G.hint && (G.hint.life -= dt) <= 0) G.hint = null;
  updatePlayer(G, dt); G.ai.update(G, dt); updateWorld(G, dt);
  // SOAT de verdad (taller): una vida extra por etapa
  if (G.p.hp <= 0 && G.p.lives > 0) {
    G.p.lives--; G.p.hp = 40; G.p.pw.soat = 2.5; G.p.hitCd = 1;
    floatText(G, G.p.x, G.p.y - 50, '¡EL SOAT TE SALVÓ!', C.green, 12); burst(G, G.p.x, G.p.y, C.green, 24, 200); Sfx.play('block');
  }
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
  blind: boolean; clean: boolean; honest: boolean; bestCombo: number; fireMode: Game['fireMode'];
  // vida que le quedaba al jefe (0 al ganar) y cobro bruto antes de multas, para el registro
  bossPct: number; gross: number;
}

export function summarize(G: Game): Summary {
  const win = !!G.result?.win, s = G.stats, R = G.cfg.rewards;
  const pct = s.total ? Math.round((s.right / s.total) * 100) : 0;
  const clean = win && !s.dmgP3, blind = win && pct >= R.blindPct, honest = G.fines === 0;
  const gross = win ? R.win + (clean ? R.clean : 0) + G.bonus : G.bonus, pay = Math.max(0, gross - G.fines);
  const mm = Math.floor(G.t / 60), ss = String(Math.floor(G.t % 60)).padStart(2, '0');
  return { win, time: `${mm}:${ss}`, seconds: G.t, rightPct: pct, powers: s.powers, fines: G.fines, pay, blind, clean, honest, bestCombo: G.combo.best, fireMode: G.fireMode,
    bossPct: Math.ceil((G.b.hp / G.b.max) * 100), gross };
}
