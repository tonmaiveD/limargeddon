import { Sfx } from '../core/audio/sfx';
import { H } from '../core/constants';
import { cartNear } from '../core/hazards';
import { burst, dmgBoss, floatText, hurt, laneX, say, shake, type BossAI, type Chain, type Game, type Seg, type Shot } from '../core/state';
import { C, clamp, overlap, rnd, step } from '../core/util';
import { PhaseBoss } from './phase-boss';

/*
 * Jefe serpiente (ADR 0026): la cabeza es un PhaseBoss normal (fases, ataques, punto ciego) y detrás cuelga un cuerpo
 * de autos en doble fila. Cada segmento repite la posición horizontal de su guía con un retraso, así el cuerpo ondula
 * por donde pasó la cabeza. Los segmentos se rompen a disparos; al romper uno, la cola se suelta y deambula por su cuenta.
 * La carretilla de helados tiene prioridad: mientras cruza cerca, la serpiente se detiene a cederle el paso.
 */

const HIST = 240; // cuadros de historia de la guía (a 60 cps, unos 4 s)

function makeChain(G: Game, segs: Seg[], lead: Seg | null): Chain {
  const x = lead ? lead.x : G.b.x;
  return { main: !lead, segs, lead, hist: Array(HIST).fill(x), tx: x, t: rnd(0.6, 1.4) };
}

function init(G: Game): void {
  const B = G.cfg.boss.body;
  G.snakeReady = true;
  if (!B) return;
  const segs: Seg[] = Array.from({ length: B.count }, (_, i) => ({
    x: G.b.x, y: G.b.y + G.b.h / 2 + B.spacing * (i + 0.5), w: B.w, h: B.h, hp: B.hp, max: B.hp, col: B.cols[i % B.cols.length], flash: 0,
  }));
  G.chains = [makeChain(G, segs, null)];
}

// Coloca los segmentos de una cadena: cada uno repite la x de la guía con retraso y cuelga a distancia fija.
function place(G: Game, ch: Chain): void {
  const B = G.cfg.boss.body!, lag = Math.max(1, Math.round((B.spacing / G.cfg.road.speed) * 60));
  const leadX = ch.lead ? ch.lead.x : G.b.x, leadY = ch.lead ? ch.lead.y : G.b.y + G.b.h / 2 - B.h / 2;
  ch.hist.unshift(leadX); ch.hist.length = HIST;
  ch.segs.forEach((s, i) => {
    s.x = ch.hist[Math.min(HIST - 1, lag * (i + 1))] + (B.lean ?? 0) * (i + 1); s.y = leadY + B.spacing * (i + 1);
  });
}

// Una cola suelta deambula entre carriles y baja despacio hasta salir de la pantalla.
function wander(G: Game, ch: Chain, dt: number): void {
  const L = ch.lead!;
  ch.t -= dt;
  if (ch.t <= 0) { ch.t = rnd(0.8, 1.5); ch.tx = laneX(G.cfg, Math.floor(Math.random() * G.cfg.road.lanes)); }
  L.x += step(ch.tx - L.x, 130 * dt); L.y += 34 * dt;
}

function split(G: Game, ch: Chain, i: number): void {
  const dead = ch.segs[i], tail = ch.segs.slice(i + 1);
  burst(G, dead.x, dead.y, C.orange, 22, 200); burst(G, dead.x, dead.y, '#777', 10, 90); shake(G, 0.3); Sfx.play('boom');
  ch.segs = ch.segs.slice(0, i);
  if (tail.length) {
    const [lead, ...rest] = tail;
    G.chains.push(makeChain(G, rest, lead));
    floatText(G, dead.x, dead.y - 20, '¡SE PARTIÓ EN DOS!', C.yellow, 11);
  }
}

function segHit(G: Game, ch: Chain, i: number, dmg: number): void {
  const s = ch.segs[i], B = G.cfg.boss.body!;
  s.hp -= dmg; s.flash = 0.12;
  dmgBoss(G, dmg * B.bodyDmgShare, false);
  if (s.hp <= 0) split(G, ch, i);
}

function allSegs(G: Game): { ch: Chain; i: number; s: Seg }[] {
  const out: { ch: Chain; i: number; s: Seg }[] = [];
  for (const ch of G.chains) {
    if (ch.lead) out.push({ ch, i: -1, s: ch.lead });
    ch.segs.forEach((s, i) => out.push({ ch, i, s }));
  }
  return out;
}

export const SnakeBoss: BossAI = {
  interrupt(G) { PhaseBoss.interrupt(G); },

  update(G, dt) {
    if (!G.snakeReady && G.b.state !== 'enter') init(G);
    const B = G.cfg.boss.body;
    // la carretilla pasa primero: si cruza a la altura de la cabeza o del cuerpo, todo se detiene con balizas
    const parts = allSegs(G);
    const yielding = G.b.state !== 'enter' && (cartNear(G, G.b.y, G.b.h / 2 + 40) || parts.some(({ s }) => cartNear(G, s.y, s.h / 2 + 30)));
    if (yielding) {
      if (G.b.flash !== 'hazard') say(G, G.cfg.boss.quips.valet || '¡Pase usted, maestro!');
      G.b.flash = 'hazard';
      return;
    }
    PhaseBoss.update(G, dt);
    if (!B || !G.snakeReady) return;
    for (const ch of G.chains) { if (!ch.main && ch.lead) wander(G, ch, dt); place(G, ch); }
    // cola suelta: si su guía muere, el siguiente toma su lugar
    for (const ch of G.chains) if (!ch.main && ch.lead && ch.lead.hp <= 0) ch.lead = ch.segs.shift() ?? null;
    G.chains = G.chains.filter((ch) => ch.main || (ch.lead !== null && ch.lead.y < H + 60));
    // choque del Tico con el cuerpo: empuja como el tráfico y quita vida
    const p = G.p, pc = G.cfg.player;
    for (const { s } of allSegs(G)) {
      s.flash -= dt;
      if (p.air > 0 || !overlap(p, s)) continue;
      const dx = p.x - s.x, dy = p.y - s.y, ox = (p.w + s.w) / 2 - Math.abs(dx), oy = (p.h + s.h) / 2 - Math.abs(dy);
      if (ox < oy) { p.x += Math.sign(dx || 1) * ox; p.vx = Math.sign(dx || 1) * pc.trafficPush; } else { p.y += Math.sign(dy || 1) * oy; p.vy = Math.sign(dy || 1) * pc.trafficPush; }
      if (p.hitCd <= 0) { p.hitCd = pc.trafficHitCd; hurt(G, B.contactDmg); burst(G, (p.x + s.x) / 2, (p.y + s.y) / 2, C.orange, 8); }
    }
    for (const ch of G.chains) for (const s of ch.segs) s.x = clamp(s.x, G.cfg.road.left + s.w / 2, G.cfg.road.right - s.w / 2);
  },

  hitShot(G, s: Shot) {
    if (!G.cfg.boss.body || s.hit) return false;
    const Wp = G.cfg.weapons;
    for (const ch of G.chains) {
      const list: [Seg, number][] = ch.segs.map((x, i) => [x, i]);
      if (ch.lead) list.unshift([ch.lead, -1]);
      for (const [seg, i] of list) {
        if (Math.abs(s.x - seg.x) >= seg.w / 2 + s.r || Math.abs(s.y - seg.y) >= seg.h / 2) continue;
        const dmg = s.k === 'cone' ? Wp.cone.trafficDmg : s.k === 'kernel' ? Wp.cancha.trafficDmg : s.k === 'picaron' ? Wp.picaron.dmg : Wp.oil.dmg;
        if (s.k === 'picaron') s.hit = true;
        burst(G, s.x, s.y, C.orange, 4, 90);
        if (i === -1) { seg.hp -= dmg; seg.flash = 0.12; dmgBoss(G, dmg * G.cfg.boss.body.bodyDmgShare, false); if (seg.hp <= 0) burst(G, seg.x, seg.y, C.orange, 18, 180); }
        else segHit(G, ch, i, dmg);
        return true;
      }
    }
    return false;
  },
};
