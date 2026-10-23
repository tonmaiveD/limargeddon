import { drawCar } from '../core/damage-render';
import { FONT, type Gfx } from '../core/gfx';
import type { Game } from '../core/state';
import { C } from '../core/util';

// SUV de lujo "Q6" con cuatro anillos, uno deformado (parodia), y la conductora al celular.
export function drawQ6(g: Gfx, G: Game): void {
  const b = G.b;
  drawCar(g, G.t, b, {
    body: '#eceaf2', roof: '#d9d6e2', ang: b.ang, brake: b.flash === 'brake', rev: b.flash === 'rev', hazard: b.flash === 'hazard',
    flash: b.hitFlash, dmg: 1 - b.hp / b.max, seed: 3,
    extra: (g, w, h) => {
      g.strokeStyle = '#8c8a96'; g.lineWidth = 1;
      [-7.5, -2.5, 2.5].forEach((dx) => { g.beginPath(); g.arc(dx, -h / 2 + 8, 2.6, 0, 7); g.closePath(); g.stroke(); });
      g.beginPath(); g.ellipse(7.5, -h / 2 + 8, 3.6, 2, 0, 0, 7); g.closePath(); g.stroke();
      const dx = -w / 4 + 2, dy = -h / 2 + h * 0.27;
      g.fillStyle = '#4a2c1e'; g.beginPath(); g.arc(dx, dy + 1, 3.4, 0, 7); g.fill();
      g.fillStyle = '#000'; g.fillRect(dx - 4, dy - 2.5, 8, 2);
      if (b.phoneOff <= 0 && b.phase === 1) { g.fillStyle = '#6ff3ff'; g.fillRect(dx + 4, dy - 1, 2, 4); }
      g.fillStyle = 'rgba(61,255,154,.55)'; g.fillRect(w / 2 - 2, -h / 4, 2, h / 2); // punto ciego derecho
    },
  });
  if (b.flash === 'horn') { g.fillStyle = C.pink; g.font = FONT(16); g.textAlign = 'center'; g.fillText('♪!', b.x + b.w / 2 + 12, b.y - b.h / 2); }
}
