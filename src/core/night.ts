import Phaser from 'phaser';
import { H, MAX_VIEW_W, W } from './constants';
import { Gfx } from './gfx';
import type { Layers } from './render';
import type { Game } from './state';

/*
 * Noche (ADR 0065, G2): una capa de oscuridad sobre la pista y los costados, declarada por etapa en `night`. Se ve lo
 * que iluminan los faros del Tico, los faros y el halo de cada auto, los objetos de la pista y los postes de luz. Va
 * sobre el asfalto, los bonus y el tráfico, y debajo del jefe, sus avisos, sus proyectiles, la carretilla, las aves, la
 * garúa y el Tico, así las amenazas que hay que leer nunca quedan a oscuras. Solo dibujo, la pelea no cambia.
 *
 * Phaser.Graphics no puede restar figuras, así que la oscuridad es una textura dinámica a media resolución: se llena
 * de oscuro y se le borran luces suaves (halos y conos horneados una vez). La escala la suaviza sola.
 */

// una luz en coordenadas de pista: halo redondo (r) o cono de faro hacia arriba (len de largo, w de ancho al final)
export interface Glow { x: number; y: number; a: number; r?: number; beam?: { len: number; w: number } }

const RES = 0.5, MARGIN = 24;                                   // media resolución; margen para el sacudón de cámara
const X0 = W / 2 - MAX_VIEW_W / 2 - MARGIN, Y0 = -MARGIN;
const TW = Math.ceil((MAX_VIEW_W + 2 * MARGIN) * RES), TH = Math.ceil((H + 2 * MARGIN) * RES);
const TEX = 'night-dark', HALO = 'night-halo', BEAM = 'night-beam', HALO_PX = 128, BEAM_W = 128, BEAM_H = 256;
const COLOR = 0x05081a;

// Postes de luz a los costados: alternados, uno a cada lado, bajan con la pista.
export function nightPosts(G: Game, scroll: number): { x: number; y: number; side: -1 | 1 }[] {
  const every = G.cfg.night?.posts;
  if (!every) return [];
  const { left, right } = G.cfg.road, out: { x: number; y: number; side: -1 | 1 }[] = [];
  const off = ((scroll % every) + every) % every;
  for (let y = off - every; y < H + every; y += every) {
    out.push({ x: left - 12, y, side: -1 });
    out.push({ x: right + 12, y: y + every / 2, side: 1 });
  }
  return out.filter((q) => q.y > -60 && q.y < H + 60);
}

// Qué ilumina la noche en este cuadro. Lee la pelea y nunca la cambia.
export function nightGlows(G: Game, scroll: number): Glow[] {
  const out: Glow[] = [], p = G.p;
  out.push({ x: p.x, y: p.y, a: 0.95, r: 48 });
  out.push({ x: p.x, y: p.y - p.h / 2 + 4, a: 0.95, beam: { len: 300, w: 120 } });
  for (const c of [...G.traffic, ...G.allies]) {
    out.push({ x: c.x, y: c.y, a: 0.85, r: Math.max(c.w, c.h) * 0.9 });
    out.push({ x: c.x, y: c.y - c.h / 2 + 2, a: 0.7, beam: { len: 110, w: 54 } });
  }
  for (const o of G.obstacles) out.push({ x: o.x, y: o.y, a: 0.75, r: Math.max(o.w, o.h) * 0.6 + 16 });
  for (const u of G.pickups) if (!u.dead) out.push({ x: u.x, y: u.y, a: 0.8, r: u.r * 2.6 + 6 });
  for (const q of nightPosts(G, scroll)) out.push({ x: q.x - q.side * 14, y: q.y, a: 0.7, r: 78 });
  return out;
}

// Pincel redondo y pincel de cono, con bordes suaves, horneados una vez.
function bakeBrushes(scene: Phaser.Scene): void {
  const tex = scene.textures;
  const smooth = (e0: number, e1: number, x: number) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
  const bake = (key: string, w: number, h: number, alpha: (u: number, v: number) => number) => {
    if (tex.exists(key)) return;
    const c = tex.createCanvas(key, w, h)!, ctx = c.getContext(), img = ctx.createImageData(w, h);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const k = (j * w + i) * 4; img.data[k] = img.data[k + 1] = img.data[k + 2] = 255;
      img.data[k + 3] = Math.round(255 * alpha((i + 0.5) / w, (j + 0.5) / h));
    }
    ctx.putImageData(img, 0, 0); c.refresh();
  };
  bake(HALO, HALO_PX, HALO_PX, (u, v) => smooth(1, 0, Math.hypot(u - 0.5, v - 0.5) * 2));
  // el cono: angosto abajo (la trompa del auto), ancho y apagándose arriba
  bake(BEAM, BEAM_W, BEAM_H, (u, v) => {
    const up = 1 - v, half = 0.1 + 0.4 * up, d = Math.abs(u - 0.5) / half;
    return smooth(1, 0.55, d) * smooth(1, 0.25, up) * smooth(0, 0.04, up);
  });
}

export interface Night { tex: Phaser.Textures.DynamicTexture; img: Phaser.GameObjects.Image; stamp: Phaser.GameObjects.Image; heads: Gfx }

export function createNight(scene: Phaser.Scene): Night {
  bakeBrushes(scene);
  const tex = (scene.textures.exists(TEX) ? scene.textures.get(TEX) : scene.textures.addDynamicTexture(TEX, TW, TH)) as Phaser.Textures.DynamicTexture;
  const img = scene.add.image(X0, Y0, TEX).setOrigin(0, 0).setScale(1 / RES).setDepth(11.6);
  const stamp = scene.make.image({ key: HALO, add: false });
  return { tex, img, stamp, heads: new Gfx(scene, 11.7) };
}

export function drawNight(n: Night, L: Layers, G: Game, scroll: number): void {
  const N = G.cfg.night!, at = (x: number, y: number) => L.low.project(x, y), s = n.stamp;
  n.tex.clear(); n.tex.fill(COLOR, N.dark);
  for (const l of nightGlows(G, scroll)) {
    const b = at(l.x, l.y);
    if (l.beam) {
      const tip = at(l.x, l.y - l.beam.len);
      s.setTexture(BEAM).setOrigin(0.5, 1).setScale((l.beam.w * RES) / BEAM_W, (l.beam.len * RES) / BEAM_H)
        .setRotation(Math.atan2(tip.y - b.y, tip.x - b.x) + Math.PI / 2);
    } else s.setTexture(HALO).setOrigin(0.5, 0.5).setScale((l.r! * 2 * RES) / HALO_PX).setRotation(0);
    s.setAlpha(l.a).setPosition((b.x - X0) * RES, (b.y - Y0) * RES);
    n.tex.erase(s);
  }
  // cabezas de los postes y la luz tibia de los faros del Tico, sobre la oscuridad
  const g = n.heads;
  g.begin(); g.warp = L.low.warp;
  for (const q of nightPosts(G, scroll)) g.rigid(q.x, q.y, () => {
    const hx = q.x - q.side * 14;
    g.fillStyle = '#1a1622'; g.fillRect(Math.min(q.x, hx) - 1, q.y - 1.5, 16, 3);
    g.fillStyle = 'rgba(255,214,140,.07)'; g.beginPath(); g.arc(hx, q.y, 56, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,236,180,.35)'; g.beginPath(); g.arc(hx, q.y, 6, 0, 7); g.fill();
    g.fillStyle = '#fff4cf'; g.beginPath(); g.arc(hx, q.y, 2.6, 0, 7); g.fill();
  });
  const p = G.p, ny = p.y - p.h / 2 + 4;
  g.rigid(p.x, p.y, () => {
    g.fillStyle = 'rgba(255,240,180,.06)'; g.beginPath();
    g.moveTo(p.x - 10, ny); g.lineTo(p.x - 60, ny - 280); g.lineTo(p.x + 60, ny - 280); g.lineTo(p.x + 10, ny); g.closePath(); g.fill();
  });
  g.end();
}
