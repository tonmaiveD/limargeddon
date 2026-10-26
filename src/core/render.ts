import { H, W, view } from './constants';
import type Phaser from 'phaser';
import { BODY, FONT, Gfx } from './gfx';
import { tramo, type Game } from './state';
import { jetZone, throwOrigin } from '../bosses/phase-boss';
import { drawHazards, drawSplat } from './hazards';
import { drawEndingUI, drawEndingWorld } from './ending';
import { drawLights } from './lights';
import { HITBOXES, drawHitboxes } from './hitboxes';
import { ART_SCALE, drawVehicle, lights, texture, ticoArt } from './art/vehicles';
import { bossCar } from './art/bosses';
import { drawFoe, drawObstacle, drawPickupB, drawShot } from './art/props';
import { cobrador } from '../bosses/combi-render';
import { phaseDef } from '../bosses/phase-machine';
import { C, clamp } from './util';

/* Dibujo de entidades, efectos, globo de diálogo y HUD. El paisaje y el jefe los aporta cada etapa. */

// Capas de dibujo, de abajo hacia arriba (ADR 0042 y 0044): paisaje horneado; asfalto; bonus; tráfico (imágenes) y sus luces; jefe, proyectiles
// y peligros (el jefe en imagen, ADR 0043); lo que va sobre el jefe; el Tico (imagen) y sus luces; efectos; interfaz.
export interface Layers { back: Gfx; world: Gfx; low: Gfx; cars: Gfx; carsFx: Gfx; ents: Gfx; bossFx: Gfx; me: Gfx; meFx: Gfx; fx: Gfx; ui: Gfx; uiTop: Gfx }

// Pantalla táctil (lo fija main.ts): cambia qué muestra el HUD.
export const ui = { touch: false };

// Detalles declarativos sobre la carrocería (ver VehicleLook en config.ts).
// Obstáculos declarados en el JSON (ver ObstacleDef), en la capa del asfalto, rígidos sobre la curva (ADR 0040).
// Nivel B (ADR 0044): cada uno es un sprite horneado; el peaje y los peatones tienen partes en vivo (art/props.ts).
function drawObstacles(g: Gfx, G: Game): void {
  for (const ob of G.obstacles) g.rigid(ob.x, ob.y, () => drawObstacle(g, G, ob));
}

// Aviso del lanzamiento (ataque 'throw'): líneas punteadas parpadeantes por donde van a pasar los proyectiles.
function drawThrow(g: Gfx, G: Game): void {
  const b = G.b, T = phaseDef(G.cfg.boss.phases, b.phase).throw;
  if (b.state !== 'teleThrow' || !T) return;
  const { x: x0, y: y0 } = throwOrigin(G);
  g.fillStyle = Math.floor(G.t * 10) % 2 ? (T.col ?? T.cols?.[0] ?? '#ffe14d') : '#ffffff';
  if (T.aim !== 'abajo') { // apuntado al Tico: una sola línea hasta él
    const dx = G.p.x - x0, dy = G.p.y - y0, d = Math.hypot(dx, dy) || 1;
    for (let s = 20; s < d - 30; s += 22) g.fillRect(x0 + (dx / d) * s - 2, y0 + (dy / d) * s - 2, 4, 4);
    return;
  }
  for (let i = 0; i < T.count; i++) { // cae hacia abajo: una línea por proyectil, sobre su trayectoria
    const a = Math.PI / 2 + (T.count > 1 ? (i / (T.count - 1) - 0.5) * T.spread : 0), cx = Math.cos(a), cy = Math.sin(a);
    for (let s = 16; y0 + cy * s < H; s += 22) g.fillRect(x0 + cx * s - 2, y0 + cy * s - 2, 4, 4);
  }
}

// Señal del punto ciego (ADR 0032): hasta que el jugador acierte 3 golpes por la derecha, una flecha verde lo marca.
// Va en la capa de efectos para seguir la pista curva.
function drawBlindSpot(g: Gfx, G: Game): void {
  const b = G.b;
  if (G.cfg.route || b.state === 'enter' || G.stats.rightHits >= 3 || G.mode !== 'play') return;
  const a = 0.55 + Math.sin(G.t * 6) * 0.35, x = b.x + b.w / 2 + 8, y = b.y;
  g.rigid(b.x, b.y, () => { // pegada al jefe también en la pista curva
    g.globalAlpha = a; g.fillStyle = C.green;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + 10, y - 7); g.lineTo(x + 10, y + 7); g.closePath(); g.fill();
    g.font = FONT(7); g.textAlign = 'left'; g.fillText('PUNTO CIEGO', x + 13, y + 3); g.globalAlpha = 1;
  });
}

// Marea de la etapa secreta: todos los personajes anteriores apretados detrás del Tico, empujando hacia arriba.
const MAREA = ['#f4f6fb', '#1d1b22', '#56603f', '#f2c230', '#c9ccd3', '#2a7de1', '#d93b3b', '#3a7bff', '#ffd400', '#1f4fbf', '#8a2f3f'];
function drawTide(g: Gfx, G: Game): void {
  const y0 = G.route.tideY;
  if (!tramo(G)?.tide || y0 >= H + 40) return;
  g.fillStyle = 'rgba(14,10,22,.85)'; g.fillRect(-view.extra, y0 + 10, W + 2 * view.extra, H - y0);
  for (let row = 0; row < 6; row++) for (let i = 0; i < 9; i++) {
    const x = G.cfg.road.left - 30 + i * 44 + ((row * 23) % 44) + Math.sin(G.t * 6 + i + row) * 3, y = y0 + 8 + row * 26 + Math.sin(G.t * 9 + i * 2) * 3;
    if (y > H + 20) continue;
    g.fillStyle = MAREA[(i * 3 + row * 5) % MAREA.length]; g.roundRect(x - 11, y - 14, 22, 30, 4); g.fill();
    g.fillStyle = '#10131c'; g.fillRect(x - 8, y - 9, 16, 5);
  }
  g.fillStyle = C.pink; g.font = FONT(9); g.textAlign = 'center'; g.fillText('¡TODOS TE PERSIGUEN!', W / 2, y0 + 2);
}

// Túnel: todo oscuro menos el cono de los faros del Tico.
function drawDark(g: Gfx, G: Game): void {
  if (!tramo(G)?.dark) return;
  const p = G.p, top = Math.max(44, p.y - 330), nearY = p.y - p.h / 2, near = 14, far = 92, L = -view.extra - 10, R = W + view.extra + 10;
  g.fillStyle = 'rgba(6,4,10,.9)';
  g.fillRect(L, 0, R - L, top);                                              // arriba del alcance de los faros
  g.fillRect(L, p.y + p.h / 2 + 6, R - L, H - p.y);                         // detrás del Tico
  g.beginPath(); g.moveTo(L, top); g.lineTo(p.x - far, top); g.lineTo(p.x - near, nearY); g.lineTo(p.x - near, p.y + p.h / 2 + 6); g.lineTo(L, p.y + p.h / 2 + 6); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(R, top); g.lineTo(p.x + far, top); g.lineTo(p.x + near, nearY); g.lineTo(p.x + near, p.y + p.h / 2 + 6); g.lineTo(R, p.y + p.h / 2 + 6); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,240,180,.06)'; g.beginPath(); g.moveTo(p.x - near, nearY); g.lineTo(p.x - far, top); g.lineTo(p.x + far, top); g.lineTo(p.x + near, nearY); g.closePath(); g.fill();
}

// Garúa: una capa gris que baja desde arriba hasta `depth` del alto, más espesa arriba, con hilos de llovizna.
function drawFog(g: Gfx, G: Game): void {
  const F = G.cfg.weather?.fog, k = G.fog.k;
  if (!F || k <= 0) return;
  const bottom = H * F.depth, bands = 12;
  for (let i = 0; i < bands; i++) {
    const y0 = 44 + ((bottom - 44) * i) / bands, a = k * 0.9 * (1 - (i / bands) ** 2);
    g.fillStyle = `rgba(186,190,204,${a.toFixed(3)})`; g.fillRect(-view.extra, y0, W + 2 * view.extra, (bottom - 44) / bands + 1);
  }
  g.fillStyle = `rgba(230,234,244,${(k * 0.35).toFixed(3)})`;
  for (let i = 0; i < 40; i++) { const x = ((i * 53 + G.t * 30) % (W + 40)) - 20, y = 44 + ((i * 97 + G.t * 260) % (bottom - 44)); g.fillRect(x, y, 1, 7); }
}

// Chorro del jefe (ataque 'jet'): aviso con línea punteada sobre el carril y luego la columna de agua.
function drawJet(g: Gfx, G: Game): void {
  const b = G.b;
  if (b.state === 'teleJet') {
    g.fillStyle = 'rgba(127,212,255,.5)';
    for (let y = b.y + b.h / 2 + 6; y < H; y += 18) g.fillRect(b.x - 1.5, y, 3, 9);
    g.fillStyle = Math.floor(G.t * 12) % 2 ? '#7fd4ff' : '#ffffff'; g.beginPath(); g.arc(b.x, b.y + b.h / 2, 5, 0, 7); g.fill();
    return;
  }
  const z = jetZone(G);
  if (!z) return;
  const top = z.y - z.h / 2;
  g.fillStyle = 'rgba(127,212,255,.35)'; g.fillRect(z.x - z.w / 2, top, z.w, z.h);
  g.fillStyle = 'rgba(220,245,255,.6)'; g.fillRect(z.x - z.w / 6, top, z.w / 3, z.h);
  g.fillStyle = '#ffffff';
  for (let i = 0; i < 14; i++) { const yy = top + ((G.t * 520 + i * 47) % Math.max(1, z.h)), xx = z.x + Math.sin(i * 2.3 + G.t * 9) * z.w * 0.4; g.fillRect(xx, yy, 2, 4); }
}

// Socio de la Combi: la combi aliada, horneada como el tráfico, con el cobrador colgado (ADR 0043).
function drawCombi(L: Layers, G: Game, a: { x: number; y: number; w: number; h: number }): void {
  const art = { kind: 'combi', w: a.w, h: a.h, body: '#f4f1e6', roof: '#d93b3b', band: '#2a7de1', label: 'JAVIER PRADO', labelCol: '#d93b3b' } as const;
  bossCar(L.cars, L.carsFx, G, a.x, a.y, art, 29, {}, (fx, w) => cobrador(fx, G.t, w, -4, false));
}

// El Tico con su pintura y sus mejoras visibles (imagen horneada, ADR 0042); también lo usa el cierre del carguero.
function drawTico(img: Gfx, fx: Gfx, G: Game, body: { x: number; y: number; w: number; h: number }, brake = false, flash = 0, dmg = 0): void {
  const a = ticoArt(G.cfg.player.look), k = body.w / a.w;
  img.image(texture(img, a, dmg, 7), body.x, body.y, k / ART_SCALE, 0, flash > 0 ? 0xffffff : undefined);
  if (k === 1 && brake) { fx.save(); fx.translate(body.x, body.y); lights(fx, G.t, a, dmg, true, false, false); fx.restore(); }
}

function drawPlayer(L: Layers, G: Game): void {
  const p = G.p, g = L.meFx;
  // en el aire: sombra en el piso y el Tico más grande, como si se acercara a la cámara
  const lift = p.air > 0 && p.airMax > 0 ? Math.sin(Math.PI * (1 - p.air / p.airMax)) : 0;
  if (lift > 0) { L.ents.fillStyle = 'rgba(0,0,0,.35)'; L.ents.beginPath(); L.ents.ellipse(p.x + 6 * lift, p.y + 8 * lift, p.w / 2 + 2, p.h / 2, 0, 0, 7); L.ents.fill(); }
  const body = lift > 0 ? { x: p.x, y: p.y - 10 * lift, w: p.w * (1 + 0.3 * lift), h: p.h * (1 + 0.3 * lift) } : p;
  L.me.globalAlpha = p.hitCd > 0 && Math.floor(G.t * 20) % 2 ? 0.6 : 1;
  drawTico(L.me, g, G, body, G.cfg.player.throttle === 'libre' ? G.keys.down : !G.keys.up && p.vy > 40, p.flash, 1 - p.hp / p.max);
  L.me.globalAlpha = 1;
  if (p.pw.soat > 0) { g.strokeStyle = C.green; g.globalAlpha = 0.5 + Math.sin(G.t * 10) * 0.2; g.lineWidth = 2; g.beginPath(); g.ellipse(p.x, p.y, 24, 34, 0, 0, 7); g.closePath(); g.stroke(); g.globalAlpha = 1; }
  if (p.stun > 0) { g.fillStyle = C.yellow; g.font = FONT(9); g.textAlign = 'center'; g.fillText('★ ★ ★', p.x, p.y - p.h / 2 - 8); }
}


function drawHUD(g: Gfx, G: Game): void {
  const b = G.b, p = G.p, cfg = G.cfg, phases = cfg.boss.phases, cur = phases.find((x) => x.id === b.phase) ?? phases[0];
  g.fillStyle = 'rgba(14,10,22,.78)'; g.fillRect(-view.extra, 0, W + 2 * view.extra, 44);
  g.textAlign = 'left'; g.fillStyle = C.pink; g.font = FONT(11); g.fillText(cfg.boss.name, 12, 16);
  g.textAlign = 'right'; g.fillStyle = C.muted; g.font = BODY(600, 9); g.fillText(cur.name, W - 12, 16);
  const bw = W - 24, r = b.hp / b.max;
  g.fillStyle = '#2b2238'; g.fillRect(12, 24, bw, 10);
  g.fillStyle = cur.bar; g.fillRect(12, 24, bw * r, 10);
  g.fillStyle = C.bg; for (const ph of phases) if (ph.from < 1) g.fillRect(12 + bw * ph.from, 24, 2, 10);
  // nivel de búsqueda: cinco estrellas bajo la barra del jefe
  if (cfg.wanted) {
    g.textAlign = 'center'; g.font = FONT(11); // centradas, para no quedar bajo el botón de pausa
    for (let i = 0; i < cfg.wanted.max; i++) { g.fillStyle = i < G.stars ? C.yellow : 'rgba(255,255,255,.22)'; g.fillText('★', W / 2 + (i - (cfg.wanted.max - 1) / 2) * 14, 54); }
  }
  // poderes activos
  let py = 52;
  for (const k of ['turbo', 'cancha', 'soat'] as const) if (p.pw[k] > 0) {
    const P = cfg.powers[k]; g.fillStyle = 'rgba(14,10,22,.75)'; g.fillRect(8, py, 128, 14);
    g.fillStyle = P.col; g.fillRect(8, py + 11, (128 * p.pw[k]) / P.dur, 3);
    g.font = BODY(800, 9); g.textAlign = 'left'; g.fillText(P.name, 12, py + 9); py += 17;
  }
  // multas
  if (G.fines > 0) { g.textAlign = 'right'; g.fillStyle = C.sky; g.font = BODY(800, 9); g.fillText('PAPELETAS -S/' + G.fines, W - 70, 62); }
  // jugador
  g.fillStyle = 'rgba(14,10,22,.78)'; g.fillRect(-view.extra, H - 26, W + 2 * view.extra, 26);
  g.textAlign = 'left'; g.fillStyle = C.yellow; g.font = FONT(10); g.fillText('TICO', 10, H - 9);
  // en celular el deck ya muestra armas y recargas: la barra de vida se alarga y no se muestran atajos de teclado
  // la barra cede espacio a las fichas de objetos para no chocar con el texto de la racha
  const barW = (ui.touch ? 210 : 110) - G.perks.length * 15;
  g.fillStyle = '#2b2238'; g.fillRect(50, H - 17, barW, 8);
  g.fillStyle = p.hp > 35 ? C.green : C.pink; g.fillRect(50, H - 17, (barW * p.hp) / p.max, 8);
  if (G.combo.n >= 2) { g.textAlign = 'right'; g.fillStyle = C.green; g.font = FONT(10); g.fillText(`RACHA ${G.combo.n}`, W - 10, H - 9); }
  // objetos de victoria: una ficha por objeto, que se apaga cuando ya protegió en esta pelea
  G.perks.forEach((k, i) => {
    const x = 50 + barW + 12 + i * 15;
    g.globalAlpha = k.used ? 0.25 : 1; g.fillStyle = k.item.col; g.beginPath(); g.arc(x, H - 13, 6, 0, 7); g.fill();
    g.fillStyle = C.bg; g.font = BODY(800, 8); g.textAlign = 'center'; g.fillText(k.item.icon, x, H - 10); g.globalAlpha = 1;
  });
  if (!ui.touch) {
    const Wp = cfg.weapons, tap = G.fireMode === 'toque', maxAmmo = Wp.cone.ammo ?? 0;
    ([['cone', Wp.cone.cd, C.orange, 'Z', 'CONOS'], ['oil', Wp.oil.cd, C.green, 'X', 'ACEITE'], ['horn', Wp.horn.cd, C.yellow, 'C', 'CLAXON']] as const).forEach(([k, max, col, key, lab], i) => {
      const x = 170 + i * 52;
      // por toque, la barra de los conos muestra la reserva en vez del cooldown
      const f = k === 'cone' && tap ? 1 - p.ammo / maxAmmo : clamp(p.cd[k] / max, 0, 1);
      const label = k === 'cone' && G.fireMode === 'acelerar' ? '↑ CONOS' : key + ' ' + lab;
      g.fillStyle = '#2b2238'; g.fillRect(x, H - 19, 46, 12);
      g.fillStyle = col; g.globalAlpha = f > 0 ? 0.35 : 1; g.fillRect(x, H - 19, 46 * (1 - f), 12); g.globalAlpha = 1;
      g.fillStyle = f > 0 ? C.muted : C.bg; g.font = BODY(800, 8); g.textAlign = 'center'; g.fillText(label, x + 23, H - 10);
    });
  }
  if (b.state === 'enter') { g.textAlign = 'center'; g.fillStyle = C.yellow; g.font = FONT(22); g.fillText('¡AHÍ VIENE!', W / 2, H / 2 - 40); }
  if (G.announce) {
    const a = G.announce; g.globalAlpha = clamp(a.life * 2, 0, 1); g.textAlign = 'center'; g.font = FONT(18);
    g.fillStyle = '#0e0a16'; g.fillText(a.t, W / 2 + 2, H / 2 + 2); g.fillStyle = a.col; g.fillText(a.t, W / 2, H / 2); g.globalAlpha = 1;
  }
}

function drawBubble(g: Gfx, G: Game): void {
  const bb = G.bubble, b = G.b; if (!bb) return;
  g.font = BODY(800, 11);
  const tw = g.measureText(bb.text).width + 16, x = clamp(b.x - tw / 2, 6, W - tw - 6), y = Math.max(48, b.y - b.h / 2 - 34);
  g.fillStyle = '#fff'; g.roundRect(x, y, tw, 22, 5); g.fill();
  g.beginPath(); g.moveTo(clamp(b.x - 6, x + 6, x + tw - 14), y + 22); g.lineTo(clamp(b.x + 2, x + 12, x + tw - 6), y + 22); g.lineTo(b.x - 4, y + 30); g.fill();
  g.fillStyle = C.pink; g.textAlign = 'left'; g.fillText(bb.text, x + 8, y + 15);
}

export function renderEntities(L: Layers, G: Game, drawBoss: (g: Gfx, G: Game, img: Gfx) => void): void {
  const g = L.ents, f = L.fx, lo = L.low;
  drawLights(L.world, G); drawObstacles(L.world, G);
  G.pickups.forEach((u) => lo.rigid(u.x, u.y, () => drawPickupB(lo, G, u)));
  // tráfico en nivel B (ADR 0042): imagen horneada y, encima, sus luces; rígidos sobre la pista curva
  G.traffic.forEach((c) => L.cars.rigid(c.x, c.y, () => L.carsFx.rigid(c.x, c.y, () => drawVehicle(L.cars, L.carsFx, G.t, c))));
  for (const s of G.shots) g.rigid(s.x, s.y, () => drawShot(g, G, s));

  drawFog(g, G); // la garúa tapa tráfico y obstáculos, pero no los avisos del jefe ni sus proyectiles
  drawHazards(g, G); // la carretilla y las aves siempre se ven, aunque haya neblina
  drawJet(g, G); drawThrow(g, G);
  for (const f of G.foes) g.rigid(f.x, f.y, () => drawFoe(g, G, f));

  drawBoss(L.bossFx, G, g); G.allies.forEach((a) => L.cars.rigid(a.x, a.y, () => L.carsFx.rigid(a.x, a.y, () => drawCombi(L, G, a)))); drawTide(g, G); drawEndingWorld(g, G);
  L.me.rigid(G.p.x, G.p.y, () => L.meFx.rigid(G.p.x, G.p.y, () => drawPlayer(L, G)));
  for (const r of G.rings) f.rigid(r.x, r.y, () => { f.strokeStyle = r.col; f.globalAlpha = clamp(r.life * 2, 0, 1); f.lineWidth = 3; f.beginPath(); f.arc(r.x, r.y, r.r, 0, 7); f.closePath(); f.stroke(); f.globalAlpha = 1; });
  for (const q of G.parts) { f.globalAlpha = clamp(q.life / q.max, 0, 1); f.fillStyle = q.col; f.fillRect(q.x, q.y, q.size, q.size); } f.globalAlpha = 1;
  f.textAlign = 'center';
  for (const t of G.floats) { f.font = FONT(t.size ?? 10); f.globalAlpha = clamp(t.life * 1.5, 0, 1); f.fillStyle = t.col; f.fillText(t.text, t.x, t.y); } f.globalAlpha = 1;
  drawBlindSpot(L.fx, G); drawDark(L.fx, G);
  if (HITBOXES) drawHitboxes(L.fx, G); // vista de diagnóstico, sobre la oscuridad y bajo el HUD
  drawSplat(L.ui, G); drawBubble(L.ui, G); drawHint(L.ui, G);
  // dentro del carguero no hay pista: el HUD se oculta (sus textos quedarían sobre el interior del avión)
  if (G.ending && G.cfg.ending?.kind === 'carguero') drawEndingUI(L.ui, G, (g, box) => drawTico(g, g, G, box));
  else { drawHUD(L.ui, G); drawEndingUI(L.ui, G, (g, box) => drawTico(g, g, G, box)); }
}

// Ayuda del tutorial: una píldora sobre el Tico que se desvanece al final.
function drawHint(g: Gfx, G: Game): void {
  const h = G.hint; if (!h) return;
  g.font = BODY(800, 12);
  const tw = g.measureText(h.text).width + 20, x = clamp(G.p.x - tw / 2, 6, W - tw - 6), y = G.p.y - G.p.h / 2 - 48;
  g.globalAlpha = clamp(h.life * 2, 0, 1);
  g.fillStyle = 'rgba(14,10,22,.85)'; g.roundRect(x, y, tw, 24, 12); g.fill();
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(h.text, x + tw / 2, y + 16); g.globalAlpha = 1;
}

export function createLayers(scene: Phaser.Scene): Layers {
  const back = new Gfx(scene, -1), world = new Gfx(scene, 0);
  world.under = back; // los costados horneados van debajo de la pista (ADR 0044)
  const ui = new Gfx(scene, 30), uiTop = new Gfx(scene, 30.5);
  ui.over = uiTop; // sobre las imágenes del HUD y bajo sus textos (ADR 0045)
  return {
    back, world, low: new Gfx(scene, 8), cars: new Gfx(scene, 10), carsFx: new Gfx(scene, 11), ents: new Gfx(scene, 12),
    bossFx: new Gfx(scene, 12.5), me: new Gfx(scene, 13), meFx: new Gfx(scene, 14), fx: new Gfx(scene, 20), ui, uiTop,
  };
}
const ALL = (L: Layers) => [L.back, L.world, L.low, L.cars, L.carsFx, L.ents, L.bossFx, L.me, L.meFx, L.fx, L.ui, L.uiTop];
export const beginLayers = (L: Layers) => { for (const g of ALL(L)) g.begin(); };
// la curva se aplica a todo menos al HUD
export const setWarp = (L: Layers, w: ((y: number) => number) | null) => { for (const g of ALL(L)) if (g !== L.ui && g !== L.uiTop) g.warp = w; };
export const endLayers = (L: Layers) => { for (const g of ALL(L)) g.end(); };
