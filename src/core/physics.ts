import { H } from './constants';
import { burst, floatText, laneOf, laneX, shake, type Car, type Game } from './state';
import { C, clamp, overlap, type Box } from './util';

/*
 * Física sólida (ADR 0031): vehículos, elementos y jefe no ocupan el mismo espacio ni pasan uno por debajo del otro.
 * Se activa con `traffic.solid` en la config de la etapa. La réplica del prototipo (prueba de paridad) no la usa,
 * porque en el prototipo los autos se atravesaban.
 */

export const solid = (G: Game) => !!G.cfg.traffic.solid;

// Fuselaje del carguero de la etapa secreta: sólido para todo. Las alas no, y los bonus pueden pasar por debajo.
export function fuselage(G: Game): Box | null {
  const P = G.cfg.route?.plane, pl = G.route.plane;
  if (!P || pl.phase === 'off') return null;
  return { x: pl.x, y: pl.y, w: P.w * 0.92, h: P.h };
}

// Cajas que el tráfico no puede pisar, además de los bloques y el jefe (que ya se resuelven en world.ts).
function blockers(G: Game): Box[] {
  const out: Box[] = [];
  const f = fuselage(G); if (f) out.push(f);
  for (const ch of G.chains) { for (const s of ch.segs) out.push(s); if (ch.lead) out.push(ch.lead); }
  if (G.cart.on) out.push({ x: G.cart.x, y: G.cart.y, w: 30, h: 22 });
  return out;
}

// Saca a un auto de encima de una caja: al costado si cabe, si no, detrás.
export function pushOut(G: Game, c: Car, b: Box): void {
  const { left, right } = G.cfg.road, half = (c.w + b.w) / 2;
  const toL = b.x - half, toR = b.x + half, fitsL = toL >= left + c.w / 2, fitsR = toR <= right - c.w / 2, preferR = c.x >= b.x;
  if (preferR ? fitsR : fitsL) c.x = preferR ? toR : toL;
  else if (preferR ? fitsL : fitsR) c.x = preferR ? toL : toR;
  else c.y = c.y < b.y ? b.y - (c.h + b.h) / 2 - 1 : b.y + (c.h + b.h) / 2 + 1;
}

const entering = (c: Car) => c.enter !== undefined && c.enter > 0;

/*
 * Después de mover el tráfico: nadie pisa peajes, carretilla, cuerpo de serpiente ni fuselaje, y ningún par de
 * vehículos se superpone. Entre dos que se tocan, el de más arriba espera detrás del de abajo (se recorre de abajo
 * hacia arriba para que una fila se acomode en una sola pasada).
 */
export function resolveTraffic(G: Game): void {
  if (!solid(G)) return;
  const B = blockers(G), defs = G.cfg.obstacles ?? [];
  for (const c of G.traffic) {
    if (entering(c)) continue;
    for (const ob of G.obstacles) if (defs[ob.i].kind === 'peaje' && overlap(c, ob)) c.y = ob.y - (c.h + ob.h) / 2 - 1; // espera su turno en el peaje
    for (const b of B) if (overlap(c, b)) pushOut(G, c, b);
  }
  // los carros de equipaje tampoco se meten bajo el fuselaje
  const f = fuselage(G);
  if (f) for (const ob of G.obstacles) if (defs[ob.i].kind === 'bloque' && overlap(ob, f)) {
    const side = ob.x >= f.x ? 1 : -1; ob.x = f.x + side * ((f.w + ob.w) / 2 + 1); if (ob.bx !== undefined) ob.bx = ob.x;
  }
  const list = G.traffic.filter((c) => !entering(c)).sort((a, b) => b.y - a.y);
  for (let i = 0; i < list.length; i++) for (let j = 0; j < i; j++) {
    const lower = list[j], upper = list[i];
    if (Math.abs(upper.x - lower.x) >= (upper.w + lower.w) / 2) continue;
    const gap = lower.y - upper.y - (upper.h + lower.h) / 2;
    if (gap < 14) {
      // alcanzó al de adelante: adelanta por un carril libre; si no hay, baja a su velocidad (no se apilan)
      if (upper.laneTo === undefined && !upper.move?.zigzag && upper.life === undefined && !overtake(G, upper)) upper.vy = Math.min(upper.vy, lower.vy);
    }
    if (gap < 0) upper.y = lower.y - (upper.h + lower.h) / 2 - 1;
  }
}

// Busca un carril vecino libre a la altura del auto (con margen adelante y atrás) y lo manda hacia allá.
function overtake(G: Game, c: Car): boolean {
  const lane = laneOf(G.cfg, c.x), defs = G.cfg.obstacles ?? [], B = blockers(G);
  for (const k of [lane - 1, lane + 1]) {
    if (k < 0 || k >= G.cfg.road.lanes) continue;
    const box = { x: laneX(G.cfg, k), y: c.y, w: c.w, h: c.h * 2.4 };
    // ocupado también si otro auto ya se está yendo a ese carril (si no, todos eligen el mismo y rebotan)
    if (G.traffic.some((o) => o !== c && (overlap(box, o) || (o.laneTo !== undefined && overlap(box, { x: o.laneTo, y: o.y, w: o.w, h: o.h }))))) continue;
    if (G.obstacles.some((ob) => (defs[ob.i].kind === 'bloque' || defs[ob.i].kind === 'peaje') && overlap(box, ob))) continue;
    // nadie se cruza encima del Tico: mira con margen antes de cambiar de carril
    if (overlap({ x: box.x, y: box.y, w: box.w, h: box.h + 60 }, G.p)) continue;
    if (B.some((b) => overlap(box, b)) || (G.b.state !== 'enter' && !G.cfg.route && overlap(box, G.b))) continue;
    c.laneTo = box.x; return true;
  }
  return false;
}

// ¿Hay lugar para algo nuevo en esa caja? (vehículos, bloques, peajes y fuselaje; los huecos y las rampas son piso)
export function freeSpot(G: Game, box: Box, margin = 6): boolean {
  if (!solid(G)) return true;
  const grown = { x: box.x, y: box.y, w: box.w + margin * 2, h: box.h + margin * 2 }, defs = G.cfg.obstacles ?? [];
  if (G.traffic.some((c) => overlap(grown, c))) return false;
  if (G.obstacles.some((ob) => (defs[ob.i].kind === 'bloque' || defs[ob.i].kind === 'peaje') && overlap(grown, ob))) return false;
  const f = fuselage(G); if (f && overlap(grown, f)) return false;
  return true;
}

/*
 * El jefe y los bloques: si un bloque viene por su carril, el jefe se corre a un carril libre. Si igual lo alcanza,
 * lo arrolla (la reja o la caja salen volando), salvo a los peatones, que nunca se atraviesan: ahí el jefe se aparta.
 * El cuerpo de la serpiente hace lo mismo. En los peajes, al jefe se le levanta la barrera y pasa por el medio del carril.
 */
export function bossVsObstacles(G: Game): void {
  if (!solid(G) || G.cfg.route || G.b.state === 'enter') return;
  const b = G.b, defs = G.cfg.obstacles ?? [], { left, right, lanes } = G.cfg.road;
  for (const ob of G.obstacles) {
    const o = defs[ob.i];
    if (o.kind === 'peaje') {
      if (Math.abs(ob.y - b.y) < (b.h + ob.h) / 2 + 30) { ob.bossLane = laneOf(G.cfg, b.x); b.x = laneX(G.cfg, ob.bossLane); b.tx = b.x; }
      continue;
    }
    if (o.kind !== 'bloque') continue;
    const ahead = ob.y < b.y && b.y - ob.y < 200 && Math.abs(ob.x - b.x) < (ob.w + b.w) / 2;
    if (ahead) { // buscar el carril libre más cercano
      let best = -1, dist = Infinity;
      for (let l = 0; l < lanes; l++) {
        const x = laneX(G.cfg, l);
        if (Math.abs(x - ob.x) < (ob.w + b.w) / 2) continue;
        if (Math.abs(x - b.x) < dist) { dist = Math.abs(x - b.x); best = l; }
      }
      if (best >= 0) b.tx = laneX(G.cfg, best);
    }
    const parts: Box[] = [b, ...G.chains.flatMap((ch) => [...ch.segs, ...(ch.lead ? [ch.lead] : [])])];
    for (const part of parts) {
      if (!overlap(part, ob)) continue;
      if (o.style === 'peatones') { // a la gente no se la atraviesa nunca: el jefe se aparta
        if (part === b) { const side = b.x >= ob.x ? 1 : -1; b.x = clamp(ob.x + side * ((ob.w + b.w) / 2 + 1), left + b.w / 2, right - b.w / 2); b.tx = b.x; }
      } else { // el bloque sale volando
        burst(G, ob.x, ob.y, o.col, 16, 200); floatText(G, ob.x, ob.y - 10, '¡CRASH!', C.orange); shake(G, 0.2);
        ob.y = H + 999;
      }
    }
  }
}
