import { H, W, view } from './constants';
import { drawCar } from './damage-render';
import type Phaser from 'phaser';
import { BODY, FONT, Gfx } from './gfx';
import type { Car, Game, Pickup } from './state';
import type { VehicleLook } from './config';
import { C, clamp } from './util';

/* Dibujo de entidades, efectos, globo de diálogo y HUD. El paisaje y el jefe los aporta cada etapa. */

export interface Layers { world: Gfx; ents: Gfx; fx: Gfx; ui: Gfx }

// Pantalla táctil (lo fija main.ts): cambia qué muestra el HUD.
export const ui = { touch: false };

// Detalles declarativos sobre la carrocería (ver VehicleLook en config.ts).
function drawLook(g: Gfx, G: Game, L: VehicleLook, w: number, h: number): void {
  if (L.panel) { g.fillStyle = L.panel; g.fillRect(-w / 2 + 4, -h / 2 + h * 0.36, w - 8, h * 0.3); }
  if (L.siren) {
    const blink = Math.floor(G.t * 8) % 2;
    g.fillStyle = blink ? '#ff3355' : '#3a7bff'; g.fillRect(-9, -h / 2 + h * 0.4, 8, 4);
    g.fillStyle = blink ? '#3a7bff' : '#ff3355'; g.fillRect(1, -h / 2 + h * 0.4, 8, 4);
  }
  if (L.band) { g.fillStyle = L.band; g.fillRect(-w / 2, -h / 2 + h * 0.55, w, 5); }
  if (L.shades) { g.fillStyle = '#000'; g.fillRect(-w / 4 - 2, -h / 2 + h * 0.25, 7, 2); }
  if (L.label) {
    g.fillStyle = L.labelCol ?? '#fff'; g.font = FONT(L.labelSize ?? 5); g.textAlign = 'center';
    g.fillText(L.label, 0, -h / 2 + h * (L.labelY ?? 0.6));
  }
}

function drawMoto(g: Gfx, c: Car): void {
  g.save(); g.translate(c.x, c.y); g.rotate(c.zz !== undefined ? Math.sin(c.zz) * 0.25 : 0);
  g.fillStyle = '#222'; g.fillRect(-2, -12, 4, 24); g.fillStyle = c.col; g.fillRect(-4, -4, 8, 12);
  if (c.look?.box) { g.fillStyle = c.look.box; g.fillRect(-6, 3, 12, 10); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(-6, 11, 12, 2); }
  g.fillStyle = '#e8c4a0'; g.beginPath(); g.arc(0, -2, 4, 0, 7); g.fill(); g.fillStyle = '#111'; g.fillRect(-6, -12, 12, 2);
  g.restore();
}

function drawBici(g: Gfx, c: Car): void {
  g.save(); g.translate(c.x, c.y); g.rotate(c.zz !== undefined ? Math.sin(c.zz) * 0.15 : 0);
  g.fillStyle = '#1b1b22'; g.fillRect(-1, -11, 2, 22);                       // ruedas y cuadro
  g.fillStyle = c.col; g.fillRect(-3, -3, 6, 8);                             // ciclista
  g.fillStyle = c.look?.box ?? '#ffe14d'; g.beginPath(); g.arc(0, -3, 3.4, 0, 7); g.fill(); // casco
  g.fillStyle = '#111'; g.fillRect(-5, -9, 10, 1.5);                         // timón
  g.restore();
}

function drawTraffic(g: Gfx, G: Game, c: Car): void {
  if (c.look?.kind === 'moto') { drawMoto(g, c); return; }
  if (c.look?.kind === 'bici') { drawBici(g, c); return; }
  const L = c.look;
  drawCar(g, G.t, c, {
    body: c.col, roof: L?.roof, ang: c.spin > 0 ? Math.sin(G.t * 14) * 0.5 : 0, extra: L ? (g, w, h) => drawLook(g, G, L, w, h) : undefined,
    flash: c.flash, dmg: c.max && !c.invulnerable ? 1 - c.hp / c.max : 0, seed: c.seed,
  });
}

// Obstáculos declarados en el JSON (ver ObstacleDef). Van en la capa del asfalto, debajo de los vehículos.
function drawObstacles(g: Gfx, G: Game): void {
  const defs = G.cfg.obstacles ?? [];
  for (const ob of G.obstacles) {
    const o = defs[ob.i], x0 = ob.x - ob.w / 2, y0 = ob.y - ob.h / 2;
    if (o.style === 'crater') {
      g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(ob.x, ob.y + 2, ob.w / 2, ob.h / 2, 0, 0, 7); g.fill();
      g.fillStyle = o.col; g.beginPath(); g.ellipse(ob.x, ob.y, ob.w / 2 - 3, ob.h / 2 - 3, 0, 0, 7); g.fill();
      g.strokeStyle = o.col2 ?? '#4a4452'; g.lineWidth = 1.2; g.beginPath();
      for (let i = 0; i < 4; i++) { const a = i * 1.7 + ob.x; g.moveTo(ob.x + Math.cos(a) * ob.w * 0.3, ob.y + Math.sin(a) * ob.h * 0.3); g.lineTo(ob.x + Math.cos(a) * ob.w * 0.55, ob.y + Math.sin(a) * ob.h * 0.55); }
      g.stroke();
    } else if (o.style === 'conos') {
      const n = Math.max(2, Math.floor(ob.w / 18)), stepX = ob.w / n;
      g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(x0 + stepX / 2, ob.y - 1, ob.w - stepX, 2); // cinta
      for (let i = 0; i < n; i++) {
        const cx = x0 + stepX * (i + 0.5);
        g.fillStyle = o.col; g.beginPath(); g.moveTo(cx, ob.y - 8); g.lineTo(cx + 6, ob.y + 6); g.lineTo(cx - 6, ob.y + 6); g.closePath(); g.fill();
        g.fillStyle = o.col2 ?? '#fff'; g.fillRect(cx - 3, ob.y - 1, 6, 2);
      }
    } else if (o.style === 'peatones') {
      // turistas cruzando para la foto del atardecer: muñequitos con cámara
      const n = Math.max(2, Math.floor(ob.w / 14)), stepX = ob.w / n;
      for (let i = 0; i < n; i++) {
        const px = x0 + stepX * (i + 0.5) + Math.sin(G.t * 6 + i) * 1.5, cols = [o.col, o.col2 ?? '#7fd4ff', '#ffe14d'];
        g.fillStyle = cols[i % 3]; g.fillRect(px - 3, ob.y - 3, 6, 8);
        g.fillStyle = '#e8c4a0'; g.beginPath(); g.arc(px, ob.y - 6, 3, 0, 7); g.fill();
        if (i % 2 === 0) { g.fillStyle = '#111'; g.fillRect(px + 2, ob.y - 4, 4, 3); } // cámara
      }
    } else if (o.style === 'scooter') {
      // scooter eléctrico tirado en la pista
      g.save(); g.translate(ob.x, ob.y); g.rotate(0.6);
      g.fillStyle = o.col; g.fillRect(-12, -2, 24, 4); g.fillRect(9, -8, 3, 10);
      g.fillStyle = '#111'; g.beginPath(); g.arc(-11, 3, 3, 0, 7); g.fill(); g.beginPath(); g.arc(11, 3, 3, 0, 7); g.fill();
      g.restore();
    } else if (o.style === 'barrera') {
      g.fillStyle = o.col; g.fillRect(x0, y0, ob.w, ob.h);
      g.fillStyle = o.col2 ?? '#111';
      for (let x = x0; x < x0 + ob.w; x += 12) g.fillRect(x, y0, 6, ob.h);
    } else {
      g.fillStyle = 'rgba(0,0,0,.35)'; g.roundRect(x0 + 3, y0 + 4, ob.w, ob.h, 4); g.fill();
      g.fillStyle = o.col; g.roundRect(x0, y0, ob.w, ob.h, 4); g.fill();
      g.fillStyle = o.col2 ?? 'rgba(0,0,0,.25)'; g.fillRect(x0 + 4, y0 + 4, ob.w - 8, 6);
    }
    if (o.label) {
      g.fillStyle = o.labelCol ?? '#fff'; g.font = FONT(o.style === 'conos' ? 6 : 7); g.textAlign = 'center';
      g.fillText(o.label, ob.x, o.style === 'conos' ? ob.y - 11 : ob.y + 4);
    }
  }
}

function drawCombi(g: Gfx, G: Game, a: { x: number; y: number; w: number; h: number }): void {
  drawCar(g, G.t, a, {
    body: '#f4f1e6', roof: '#d93b3b', extra: (g, w, h) => {
      g.fillStyle = '#2a7de1'; g.fillRect(-w / 2, -h / 2 + h * 0.55, w, 5);
      g.fillStyle = '#d93b3b'; g.font = FONT(5); g.textAlign = 'center'; g.fillText('JAVIER PRADO', 0, -h / 2 + h * 0.5);
      g.fillStyle = '#e8c4a0'; g.beginPath(); g.arc(w / 2 + 3, 0, 4, 0, 7); g.fill(); // cobrador colgado
    },
  });
}

function drawPlayer(g: Gfx, G: Game): void {
  const p = G.p;
  if (p.hitCd > 0 && Math.floor(G.t * 20) % 2) g.globalAlpha = 0.6;
  drawCar(g, G.t, p, {
    body: '#f2c230', roof: '#e0ae1a', flash: p.flash, brake: G.cfg.player.throttle === 'libre' ? G.keys.down : !G.keys.up && p.vy > 40, dmg: 1 - p.hp / p.max, seed: 7, extra: (g, _w, h) => {
      g.fillStyle = '#111'; g.fillRect(-8, -h / 2 + h * 0.42, 16, 6);
      g.fillStyle = C.yellow; g.font = FONT(5); g.textAlign = 'center'; g.fillText('TAXI', 0, -h / 2 + h * 0.42 + 5);
    },
  });
  g.globalAlpha = 1;
  if (p.pw.soat > 0) { g.strokeStyle = C.green; g.globalAlpha = 0.5 + Math.sin(G.t * 10) * 0.2; g.lineWidth = 2; g.beginPath(); g.ellipse(p.x, p.y, 24, 34, 0, 0, 7); g.closePath(); g.stroke(); g.globalAlpha = 1; }
  if (p.stun > 0) { g.fillStyle = C.yellow; g.font = FONT(9); g.textAlign = 'center'; g.fillText('★ ★ ★', p.x, p.y - p.h / 2 - 8); }
}

function drawPickup(g: Gfx, G: Game, u: Pickup): void {
  const P = G.cfg.powers[u.k];
  g.save(); g.translate(u.x, u.y);
  g.fillStyle = P.col; g.globalAlpha = 0.25 + Math.sin(G.t * 6) * 0.1; g.beginPath(); g.arc(0, 0, 18, 0, 7); g.fill(); g.globalAlpha = 1;
  g.rotate(Math.PI / 4 + Math.sin(u.rot) * 0.2); g.fillStyle = P.col; g.fillRect(-10, -10, 20, 20);
  g.rotate(-Math.PI / 4 - Math.sin(u.rot) * 0.2); g.fillStyle = '#0e0a16'; g.font = FONT(12); g.textAlign = 'center'; g.fillText(P.L, 0, 5);
  g.restore();
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
  const barW = ui.touch ? 210 : 110;
  g.fillStyle = '#2b2238'; g.fillRect(50, H - 17, barW, 8);
  g.fillStyle = p.hp > 35 ? C.green : C.pink; g.fillRect(50, H - 17, (barW * p.hp) / p.max, 8);
  if (G.combo.n >= 2) { g.textAlign = 'right'; g.fillStyle = C.green; g.font = FONT(10); g.fillText(`x${G.combo.n}`, W - 10, H - 9); }
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

export function renderEntities(L: Layers, G: Game, drawBoss: (g: Gfx, G: Game) => void): void {
  const g = L.ents, f = L.fx;
  drawObstacles(L.world, G);
  G.pickups.forEach((u) => drawPickup(g, G, u));
  G.traffic.forEach((c) => drawTraffic(g, G, c));
  for (const s of G.shots) {
    if (s.k === 'cone') { g.fillStyle = C.orange; g.beginPath(); g.moveTo(s.x, s.y - 7); g.lineTo(s.x + 5, s.y + 5); g.lineTo(s.x - 5, s.y + 5); g.fill(); g.fillStyle = '#fff'; g.fillRect(s.x - 3, s.y, 6, 2); }
    else if (s.k === 'kernel') { g.fillStyle = '#fff3c2'; g.beginPath(); g.arc(s.x, s.y, 2.6, 0, 7); g.fill(); g.fillStyle = '#e6b64a'; g.fillRect(s.x - 1, s.y, 2, 2); }
    else if (s.k === 'picaron') {
      g.save(); g.translate(s.x, s.y); g.rotate(G.t * 14);
      g.strokeStyle = '#c87a35'; g.lineWidth = 5; g.beginPath(); g.arc(0, 0, 7, 0, 7); g.closePath(); g.stroke();
      g.strokeStyle = 'rgba(120,60,20,.8)'; g.lineWidth = 1.5; g.beginPath(); g.arc(0, 0, 7, 0, 3); g.stroke(); g.restore();
    } else { g.fillStyle = '#3b2f17'; g.beginPath(); g.ellipse(s.x, s.y, 8, 6, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(61,255,154,.5)'; g.beginPath(); g.arc(s.x - 2, s.y - 2, 2, 0, 7); g.fill(); }
  }
  drawBoss(g, G); G.allies.forEach((a) => drawCombi(g, G, a)); drawPlayer(g, G);
  for (const r of G.rings) { f.strokeStyle = r.col; f.globalAlpha = clamp(r.life * 2, 0, 1); f.lineWidth = 3; f.beginPath(); f.arc(r.x, r.y, r.r, 0, 7); f.closePath(); f.stroke(); f.globalAlpha = 1; }
  for (const q of G.parts) { f.globalAlpha = clamp(q.life / q.max, 0, 1); f.fillStyle = q.col; f.fillRect(q.x, q.y, q.size, q.size); } f.globalAlpha = 1;
  f.textAlign = 'center';
  for (const t of G.floats) { f.font = FONT(t.size ?? 10); f.globalAlpha = clamp(t.life * 1.5, 0, 1); f.fillStyle = t.col; f.fillText(t.text, t.x, t.y); } f.globalAlpha = 1;
  drawBubble(L.ui, G); drawHUD(L.ui, G);
}

export function createLayers(scene: Phaser.Scene): Layers {
  return { world: new Gfx(scene, 0), ents: new Gfx(scene, 10), fx: new Gfx(scene, 20), ui: new Gfx(scene, 30) };
}
export const beginLayers = (L: Layers) => { L.world.begin(); L.ents.begin(); L.fx.begin(); L.ui.begin(); };
export const endLayers = (L: Layers) => { L.world.end(); L.ents.end(); L.fx.end(); L.ui.end(); };
