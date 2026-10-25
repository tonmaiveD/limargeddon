import { H, W } from './constants';
import { FONT, type Gfx } from './gfx';
import { fine, floatText, say, type Game } from './state';
import { C, rnd } from './util';
import { Sfx } from './audio/sfx';

/*
 * Semáforos en ola (ADR 0038): cada tanto llega una ola de semáforos que bajan con la pista. Cada uno está en rojo y
 * se pone en verde al llegar a `greenY`, así que los de una ola se van poniendo en verde uno tras otro. Quien va en su
 * línea de crucero pasa en verde; quien se adelanta acelerando lo cruza en rojo y es papeleta. El jefe se los pasa.
 */

export const lightGreen = (G: Game, y: number) => y >= G.cfg.lights!.greenY;

export function updateLights(G: Game, dt: number): void {
  const L = G.cfg.lights;
  if (!L) return;
  if (G.b.state !== 'enter') G.lightT -= dt;
  if (G.lightT <= 0) {
    G.lightT = rnd(...L.every);
    for (let i = 0; i < L.wave; i++) G.lights.push({ y: -30 - i * L.gap, done: false, boss: false });
  }
  const p = G.p, b = G.b;
  for (const l of G.lights) {
    l.y += G.speed * dt;
    // el Tico cruza la línea: en rojo es papeleta (en el aire también, el semáforo lo vio)
    if (!l.done && l.y >= p.y) {
      l.done = true;
      if (!lightGreen(G, l.y)) { fine(G, p.x, p.y, L.fine, 'LUZ ROJA'); Sfx.play('whistle'); }
    }
    // la combi se pasa el rojo y lo celebra
    if (!l.boss && b.state !== 'enter' && !G.cfg.route && l.y >= b.y) {
      l.boss = true;
      if (!lightGreen(G, l.y) && L.bossQuip) { say(G, L.bossQuip); floatText(G, b.x, b.y - b.h / 2 - 14, 'SE PASÓ LA ROJA', C.pink, 9); }
    }
  }
  G.lights = G.lights.filter((l) => l.y < H + 40);
}

export function drawLights(g: Gfx, G: Game): void {
  if (!G.cfg.lights) return;
  const { left, right } = G.cfg.road;
  for (const l of G.lights) {
    const green = lightGreen(G, l.y), col = green ? '#3dff9a' : '#ff3355';
    g.fillStyle = 'rgba(255,255,255,.75)'; for (let x = left + 6; x < right - 6; x += 16) g.fillRect(x, l.y - 22, 9, 14); // cebra
    g.fillStyle = '#f4f6fb'; g.fillRect(left, l.y - 3, right - left, 5); // línea de pare
    g.fillStyle = green ? 'rgba(61,255,154,.12)' : 'rgba(255,51,85,.16)'; g.fillRect(left, l.y - 40, right - left, 40);
    for (const x of [left - 12, right + 4]) { // postes con su cabeza de tres luces
      g.fillStyle = '#2a2632'; g.fillRect(x + 2, l.y - 34, 4, 36); g.fillRect(x - 1, l.y - 62, 10, 30);
      g.fillStyle = green ? '#40212a' : '#ff3355'; g.beginPath(); g.arc(x + 4, l.y - 56, 3.4, 0, 7); g.fill();
      g.fillStyle = '#3d3520'; g.beginPath(); g.arc(x + 4, l.y - 47, 3.4, 0, 7); g.fill();
      g.fillStyle = green ? '#3dff9a' : '#1d3a2a'; g.beginPath(); g.arc(x + 4, l.y - 38, 3.4, 0, 7); g.fill();
    }
    if (!green && l.y > 0) { g.fillStyle = col; g.font = FONT(7); g.textAlign = 'center'; g.fillText('ROJO', W / 2, l.y - 26); }
  }
}
