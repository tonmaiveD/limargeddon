import { Sfx } from './audio/sfx';
import { C, clamp, pick, rnd } from './util';
import { playerMaxY, shake, type Game } from './state';
import { fire, reloadCones } from './weapons';

/* Manejo del Tico: aceleración suavizada, límites de pista, estela del turbo y motor. */

export function updatePlayer(G: Game, dt: number): void {
  const p = G.p, k = G.keys, pc = G.cfg.player, road = G.cfg.road;
  p.stun -= dt; p.hitCd -= dt; p.flash -= dt;
  for (const w in p.cd) p.cd[w as keyof typeof p.cd] -= dt;
  for (const w in p.pw) { const key = w as keyof typeof p.pw; p.pw[key] = Math.max(0, p.pw[key] - dt); }
  let ax = 0, ay = 0;
  const sp = p.pw.turbo > 0 ? pc.turboMult : 1, r = Math.min(1, dt * pc.response);
  if (p.stun <= 0) { if (k.left) ax--; if (k.right) ax++; }
  let vyTarget: number;
  if (pc.throttle === 'acelerador') {
    // nunca hay freno: acelerar sube en pantalla; al soltar el Tico vuelve solo a su línea de crucero
    const gas = p.stun <= 0 && k.up;
    vyTarget = gas ? -pc.accelY * sp : clamp((pc.y - p.y) * 4, -pc.cruiseReturn, pc.cruiseReturn);
  } else {
    if (p.stun <= 0) { if (k.up) ay--; if (k.down) ay++; }
    vyTarget = ay * pc.accelY * sp;
  }
  if (p.air > 0) { // en el aire casi no se gira; al aterrizar, sacudida
    ax *= 0.3; p.air -= dt;
    if (p.air <= 0) { p.air = 0; shake(G, 0.25); Sfx.play('bump'); }
  }
  p.vx += (ax * pc.accelX * sp - p.vx) * r; p.vy += (vyTarget - p.vy) * r;
  p.x = clamp(p.x + p.vx * dt, road.left + p.w / 2 + 2, road.right - p.w / 2 - 2);
  p.y = clamp(p.y + p.vy * dt, pc.minY, playerMaxY(G));
  if (p.pw.turbo > 0 && Math.random() < 0.8) {
    G.parts.push({ x: p.x + rnd(-6, 6), y: p.y + p.h / 2, vx: rnd(-20, 20), vy: rnd(120, 220), life: 0.3, max: 0.3, col: pick([C.orange, C.yellow, C.pink]), size: rnd(3, 5) });
  }
  if (pc.regen && p.hp > 0) p.hp = Math.min(p.max, p.hp + pc.regen * dt); // reparación al paso (taller)
  reloadCones(G, dt);
  if (p.stun <= 0) fire(G); else p.coneHeld = k.cone;
  Sfx.engine(0.5 + (k.up ? 0.3 : 0) + (p.pw.turbo > 0 ? 0.5 : 0));
}
