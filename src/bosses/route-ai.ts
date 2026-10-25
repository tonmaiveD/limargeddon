import { Sfx } from '../core/audio/sfx';
import { H, W } from '../core/constants';
import { announce, burst, floatText, hurt, laneX, say, shake, type BossAI, type Game } from '../core/state';
import { C, clamp, overlap } from '../core/util';
import { fuselage } from '../core/physics';

/*
 * Etapa de ruta (ADR 0030): no hay jefe que pelear. El "jefe" es el recorrido: la barra muestra lo que falta, cada
 * tramo cambia la pista (peajes, túnel oscuro, puente angosto, pista del aeropuerto) y se gana subiendo a la rampa del
 * avión carguero. Morir o perder el avión gasta un intento y retoma el tramo actual, sin perder los anteriores.
 */

const total = (G: Game) => G.cfg.route!.tramos.reduce((a, t) => a + t.len, 0);
const tramoStart = (G: Game, i: number) => G.cfg.route!.tramos.slice(0, i).reduce((a, t) => a + t.len, 0);

function enter(G: Game, i: number, silent = false): void {
  const R = G.cfg.route!, T = R.tramos[i], base = G.route.base!;
  G.route.i = i; G.route.start = tramoStart(G, i); G.b.phase = i + 1;
  G.cfg.road = { ...base.road, ...(T.road ?? {}) };
  G.cfg.player.minY = T.minY ?? base.minY;
  G.cfg.traffic.every = T.trafficEvery ?? base.every;
  G.p.x = clamp(G.p.x, G.cfg.road.left + G.p.w / 2 + 2, G.cfg.road.right - G.p.w / 2 - 2);
  for (const c of G.traffic) c.x = clamp(c.x, G.cfg.road.left + c.w / 2, G.cfg.road.right - c.w / 2);
  // la marea arranca fuera de pantalla al entrar a su primer tramo y sigue donde estaba en los siguientes
  G.route.tideY = !T.tide ? 9999 : G.route.tideY > 5000 ? H + 60 : G.route.tideY;
  G.route.plane = { phase: T.plane ? 'in' : 'off', x: W / 2, y: -(R.plane?.h ?? 200), t: 0 };
  if (!silent) { announce(G, T.name, T.col); Sfx.play('phase'); if (T.banner) say(G, T.banner); }
}

function init(G: Game): void {
  // la ruta cambia la pista: se trabaja sobre una copia de la config, guardando la geometría original
  G.cfg = structuredClone(G.cfg);
  G.route.base = { road: { ...G.cfg.road }, minY: G.cfg.player.minY, every: [...G.cfg.traffic.every] as [number, number] };
  G.b.max = G.b.hp = total(G); G.b.state = 'route'; G.b.y = -600; G.b.x = W / 2;
  G.route.ready = true; G.route.dist = 0;
  enter(G, 0);
}

// Vuelve al inicio del tramo actual, con la vida llena y la pista limpia.
function retry(G: Game, why: string): void {
  G.route.attempts--; G.route.dist = G.route.start;
  G.traffic = []; G.obstacles = []; G.foes = []; G.shots = []; G.pickups = [];
  const p = G.p; p.hp = p.max; p.stun = 0; p.vx = p.vy = 0; p.air = 0; p.hitCd = 1.2; p.pw.soat = 1.5;
  p.x = laneX(G.cfg, Math.floor(G.cfg.road.lanes / 2)); p.y = G.cfg.player.y;
  G.route.tideY = 9999; enter(G, G.route.i, true);
  announce(G, `${why} · QUEDAN ${G.route.attempts}`, C.pink); shake(G, 0.4); Sfx.play('lose');
}

// Marea: avanza desde abajo si no aceleras y retrocede si aceleras. Mientras te toca, quita vida.
function updateTide(G: Game, dt: number): void {
  const Td = G.cfg.route!.tide, r = G.route, p = G.p;
  if (!Td || r.tideY > 5000) return;
  r.tideY = clamp(r.tideY + (G.keys.up && p.stun <= 0 ? Td.recede : -Td.advance) * dt, Td.minY, H + 60);
  r.tideCd -= dt;
  if (r.tideY < p.y + p.h / 2 && p.air <= 0) {
    p.y = Math.min(p.y, r.tideY - p.h / 2 + 4);
    if (r.tideCd <= 0) { r.tideCd = Td.hitCd; r.tideHits++; hurt(G, Td.dmg, 'LA MAREA'); }
  }
  for (const c of G.traffic) if (c.y > r.tideY + 20) c.y = H + 200; // la marea se traga a quien queda atrás
}

// Avión: baja hasta arriveY, rueda meciéndose y despega. La rampa abierta está en su cola.
export function rampBox(G: Game): { x: number; y: number; w: number; h: number } | null {
  const P = G.cfg.route?.plane, pl = G.route.plane;
  if (!P || pl.phase === 'off') return null;
  return { x: pl.x, y: pl.y + P.h / 2 - P.rampH / 2, w: P.rampW, h: P.rampH };
}

function updatePlane(G: Game, dt: number): void {
  const P = G.cfg.route!.plane!, pl = G.route.plane;
  pl.t += dt;
  if (pl.phase === 'in') { pl.y += (P.arriveY - pl.y) * Math.min(1, dt * 1.6); if (Math.abs(pl.y - P.arriveY) < 3) { pl.phase = 'hold'; pl.t = 0; say(G, '¡Rampa abierta, sube ya!'); } }
  else if (pl.phase === 'hold') {
    pl.x = W / 2 + Math.sin(pl.t * 0.9) * P.sway;
    if (pl.t > P.hold) { pl.phase = 'out'; pl.t = 0; Sfx.play('skid'); say(G, '¡Despegamos!'); }
  } else if (pl.phase === 'out') {
    pl.y -= (P.speed + pl.t * 400) * dt;
    if (pl.y < -P.h) { retry(G, 'SE FUE EL AVIÓN'); return; }
  }
  const ramp = rampBox(G);
  if (ramp && pl.phase !== 'in' && overlap(G.p, ramp)) {
    G.b.hp = 0; G.b.x = G.p.x; G.b.y = G.p.y; // ganó: el Tico entra al carguero
    floatText(G, G.p.x, G.p.y - 50, '¡ADENTRO!', C.yellow, 14); burst(G, G.p.x, G.p.y, C.yellow, 40, 260);
    return;
  }
  // el resto del fuselaje es sólido: se entra solo por la rampa
  const f = fuselage(G), p = G.p;
  if (f && p.air <= 0 && overlap(p, f)) {
    const dx = p.x - f.x, ox = (p.w + f.w) / 2 - Math.abs(dx), oy = (p.h + f.h) / 2 - Math.abs(p.y - f.y);
    if (ox < oy) p.x += Math.sign(dx || 1) * ox; else p.y = f.y + (p.h + f.h) / 2;
  }
}

export const RouteAI: BossAI = {
  interrupt() { /* nada que interrumpir */ },

  update(G, dt) {
    if (!G.route.ready) init(G);
    if (G.b.hp <= 0) return;
    const R = G.cfg.route!, T = R.tramos[G.route.i];
    if (!T.plane) {
      G.route.dist += (G.speed / G.route.base!.road.speed) * dt;
      if (G.route.dist >= tramoStart(G, G.route.i + 1) && G.route.i < R.tramos.length - 1) enter(G, G.route.i + 1);
    }
    // la barra del "jefe" muestra lo que falta; en el último tramo queda un resto hasta subir al avión
    G.b.hp = Math.max(1, G.b.max - G.route.dist);
    if (T.tide) updateTide(G, dt);
    if (T.plane) updatePlane(G, dt);
  },

  onDeath(G) {
    if (G.route.attempts <= 1) return false;
    retry(G, 'OTRA VEZ');
    return true;
  },
};
