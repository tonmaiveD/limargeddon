import { Sfx } from '../core/audio/sfx';
import { H } from '../core/constants';
import { cartNear } from '../core/hazards';
import { burst, dmgBoss, floatText, hurt, laneX, playerMaxY, say, shake, type BossAI, type Chain, type Game, type Seg, type Shot } from '../core/state';
import { C, clamp, overlap, rnd, step } from '../core/util';
import { phaseDef } from './phase-machine';
import { PhaseBoss } from './phase-boss';

/*
 * Jefe serpiente (ADR 0026): la cabeza es un PhaseBoss normal (fases, ataques, punto ciego) y detrás cuelga un cuerpo
 * de autos en doble fila. Cada segmento repite la posición horizontal de su guía con un retraso, así el cuerpo ondula
 * por donde pasó la cabeza. Los segmentos se rompen a disparos; al romper uno, la cola se suelta y deambula por su cuenta.
 * La carretilla de helados tiene prioridad: mientras cruza cerca, la serpiente se detiene a cederle el paso.
 * En la fase final el cuerpo se enrosca alrededor del Tico dejando un solo hueco (ADR 0034).
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


/*
 * Enrosque (ADR 0034): el cuerpo principal deja la fila y forma un anillo alrededor del Tico, con un auto por casillero
 * y un casillero vacío como salida (si la serpiente perdió autos, el hueco es más grande). Mientras dura, el anillo es
 * sólido. Si el Tico sigue adentro al final, el anillo aprieta; si escapa, la cabeza queda quieta para castigarla.
 */
const TAU = Math.PI * 2;
const angDiff = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
const coilDef = (G: Game) => phaseDef(G.cfg.boss.phases, G.b.phase).coil;
export const coilOn = (G: Game) => G.coil.st === 'tele' || G.coil.st === 'hold';

// ¿Por dónde puede salir el Tico? Descarta huecos que dan fuera de la pista o más abajo de lo que puede bajar.
function exitOk(G: Game, a: number, cx: number, cy: number, r: number): boolean {
  const p = G.p, pc = G.cfg.player, { left, right } = G.cfg.road, d = r + G.cfg.boss.body!.w / 2 + p.h / 2 + 4;
  const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d, maxY = pc.throttle === 'acelerador' ? Math.max(pc.y, cy) : playerMaxY(G);
  return x > left + p.w / 2 && x < right - p.w / 2 && y > pc.minY && y < maxY + 6;
}

function startCoil(G: Game): void {
  const B = G.cfg.boss.body!, K = coilDef(G)!, c = G.coil, main = G.chains.find((ch) => ch.main)!, n = B.count + 1;
  const slot = TAU / n, r = (n * (B.h + 4)) / TAU, cx = G.p.x, cy = G.p.y;
  // los autos ocupan los casilleros que siguen al hueco; los que faltan agrandan la salida hacia atrás
  const empty = n - main.segs.length, mid = (k: number) => -Math.PI / 2 + k * slot - ((empty - 1) * slot) / 2;
  const ok = Array.from({ length: n }, (_, k) => k).filter((k) => exitOk(G, mid(k), cx, cy, r));
  const g = ok.length ? ok[Math.floor(Math.random() * ok.length)] : 0, gap0 = -Math.PI / 2 + g * slot;
  c.slots = main.segs.map((_, i) => gap0 + (i + 1) * slot);
  c.gap = mid(g);
  const open = empty * slot + (slot - B.h / r), pAng = G.p.w / r;
  c.half = Math.max(0.15, (open - pAng * 0.7) / 2);
  c.st = 'tele'; c.t = G.d.tele ? K.tele : K.tele * 0.75; c.cx = cx; c.cy = cy; c.r = r;
  const L = G.cfg.boss.lines.coil; if (L?.length) say(G, L[Math.floor(Math.random() * L.length)]); Sfx.play('bossHorn'); shake(G, 0.2);
  floatText(G, cx, cy - r - 30, '¡SE ENROSCA!', C.pink, 12);
}

// Mezcla la posición en la fila (ya calculada por place) con el casillero del anillo; k va de 0 (fila) a 1 (anillo).
function blendRing(G: Game, k: number): void {
  const c = G.coil, main = G.chains.find((ch) => ch.main);
  if (!main) return;
  main.segs.forEach((s, i) => {
    const a = c.slots[i]; if (a === undefined) return;
    s.x += (c.cx + Math.cos(a) * c.r - s.x) * k; s.y += (c.cy + Math.sin(a) * c.r - s.y) * k;
    s.ang = angDiff(a, 0) * k;
  });
}

// El anillo es sólido salvo en el hueco: el Tico que lo toca queda del lado en que estaba.
function ringBlock(G: Game): void {
  const c = G.coil, p = G.p, band = G.cfg.boss.body!.w / 2;
  const dx = p.x - c.cx, dy = p.y - c.cy, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
  if (Math.abs(angDiff(a, c.gap)) < c.half) return;
  const pr = Math.abs(Math.cos(a)) * p.w / 2 + Math.abs(Math.sin(a)) * p.h / 2;
  if (Math.abs(d - c.r) >= band + pr) return;
  const nd = d < c.r ? Math.max(0, c.r - band - pr) : c.r + band + pr;
  const { left, right } = G.cfg.road;
  p.x = clamp(c.cx + Math.cos(a) * nd, left + p.w / 2 + 2, right - p.w / 2 - 2);
  p.y = clamp(c.cy + Math.sin(a) * nd, G.cfg.player.minY, playerMaxY(G)); p.vx *= 0.3; p.vy *= 0.3;
}

const outside = (G: Game) => Math.hypot(G.p.x - G.coil.cx, G.p.y - G.coil.cy) > G.coil.r + G.cfg.boss.body!.w / 2;

function escaped(G: Game): void {
  const K = coilDef(G)!, c = G.coil, b = G.b;
  c.st = 'release'; c.t = K.release; c.exposed = K.exposed;
  floatText(G, G.p.x, G.p.y - 50, '¡ESCAPASTE!', C.green, 13);
  floatText(G, b.x, b.y - b.h / 2 - 16, 'CABEZA EXPUESTA', C.green, 11);
  Sfx.play('pickup');
}

function updateCoil(G: Game, dt: number): void {
  const c = G.coil, K = coilDef(G), b = G.b, main = G.chains.find((ch) => ch.main);
  // la cabeza expuesta no ataca ni se mueve
  if (c.exposed > 0) {
    c.exposed -= dt; b.act = Math.max(b.act, 0.3); b.tx = b.x; if (b.state === 'cruise') b.flash = 'hazard';
    if (c.exposed <= 0) G.p.hitCd = Math.max(G.p.hitCd, 1); // al despertar, un respiro para apartarse de la fila
  }
  if (c.st === 'off') {
    if (!K) { c.cd = Infinity; return; }
    if (c.cd === Infinity) c.cd = K.first;
    if (b.state === 'cruise' && c.exposed <= 0) c.cd -= dt;
    if (c.cd <= 0 && b.state === 'cruise' && G.p.air <= 0 && (main?.segs.length ?? 0) >= K.minSegs) { c.cd = K.every * G.d.freq; startCoil(G); }
    return;
  }
  b.act = Math.max(b.act, 0.3); b.hornT = Math.max(b.hornT, 0.5); // la cabeza espera mientras el cuerpo encierra
  if (!main || !K) { c.st = 'off'; return; }
  if (main.segs.length > c.slots.length) c.slots.length = main.segs.length;
  c.t -= dt;
  if (c.st === 'tele') {
    blendRing(G, 1 - Math.max(0, c.t) / (G.d.tele ? K.tele : K.tele * 0.75));
    if (c.t <= 0) { c.st = 'hold'; c.t = K.hold; if (outside(G)) escaped(G); }
  } else if (c.st === 'hold') {
    blendRing(G, 1); ringBlock(G);
    if (outside(G)) escaped(G);
    else if (c.t <= 0) { // aprieta
      const p = G.p;
      if (p.pw.soat <= 0) { hurt(G, K.dmg, 'ENROSQUE'); p.stun = Math.max(p.stun, K.stun); }
      shake(G, 0.5); burst(G, p.x, p.y, C.pink, 24, 220); Sfx.play('boom');
      floatText(G, p.x, p.y - 50, '¡TE APRETÓ!', C.pink, 13);
      c.st = 'release'; c.t = K.release;
    }
  } else if (c.st === 'release') {
    blendRing(G, Math.max(0, c.t) / K.release);
    if (c.t <= 0) { c.st = 'off'; for (const s of main.segs) s.ang = 0; }
  }
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
    if (G.coil.exposed > 0) { G.b.tx = G.b.x; G.b.act = Math.max(G.b.act, 0.3); } // la cabeza expuesta no se mueve
    PhaseBoss.update(G, dt);
    if (!B || !G.snakeReady) return;
    for (const ch of G.chains) { if (!ch.main && ch.lead) wander(G, ch, dt); place(G, ch); }
    updateCoil(G, dt);
    // cola suelta: si su guía muere, el siguiente toma su lugar
    for (const ch of G.chains) if (!ch.main && ch.lead && ch.lead.hp <= 0) ch.lead = ch.segs.shift() ?? null;
    G.chains = G.chains.filter((ch) => ch.main || (ch.lead !== null && ch.lead.y < H + 60));
    // choque del Tico con el cuerpo: empuja como el tráfico y quita vida
    const p = G.p, pc = G.cfg.player;
    const ring = G.coil.st !== 'off';
    for (const { s } of allSegs(G)) {
      s.flash -= dt;
      if (ring) continue; // durante el enrosque el choque lo resuelve ringBlock
      if (p.air > 0 || !overlap(p, s)) continue;
      const dx = p.x - s.x, dy = p.y - s.y, ox = (p.w + s.w) / 2 - Math.abs(dx), oy = (p.h + s.h) / 2 - Math.abs(dy);
      if (ox < oy) { p.x += Math.sign(dx || 1) * ox; p.vx = Math.sign(dx || 1) * pc.trafficPush; } else { p.y += Math.sign(dy || 1) * oy; p.vy = Math.sign(dy || 1) * pc.trafficPush; }
      // con la cabeza expuesta, la fila entera está aturdida: empuja pero no quita vida
      if (p.hitCd <= 0 && G.coil.exposed <= 0) { p.hitCd = pc.trafficHitCd; hurt(G, B.contactDmg, 'DOBLE FILA'); burst(G, (p.x + s.x) / 2, (p.y + s.y) / 2, C.orange, 8); }
    }
    if (!ring) for (const ch of G.chains) for (const s of ch.segs) s.x = clamp(s.x, G.cfg.road.left + s.w / 2, G.cfg.road.right - s.w / 2);
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
