import { drawCar } from '../core/damage-render';
import { FONT, type Gfx } from '../core/gfx';
import type { Game } from '../core/state';

// Rochabús: camión blindado verde oliva con el cañón de agua en el techo. La boquilla brilla antes del chorro.
export function drawRochabus(g: Gfx, G: Game): void {
  const b = G.b, aiming = b.flash === 'jet';
  drawCar(g, G.t, b, {
    body: '#56603f', roof: '#3f472e', ang: b.ang, brake: b.flash === 'brake', rev: b.flash === 'rev', hazard: b.flash === 'hazard',
    flash: b.hitFlash, dmg: 1 - b.hp / b.max, seed: 19,
    extra: (g, w, h) => {
      g.fillStyle = '#2a2f1f'; for (let i = 0; i < 4; i++) g.fillRect(-w / 2 + 4, -h / 2 + h * 0.45 + i * 8, w - 8, 2); // rejillas
      g.fillStyle = '#7a8457'; g.beginPath(); g.arc(0, -h / 2 + h * 0.62, 9, 0, 7); g.fill(); // torreta
      g.fillStyle = '#2a2f1f'; g.fillRect(-3, -h / 2 + h * 0.62, 6, h * 0.38 - 2); // cañón hacia el frente
      g.fillStyle = aiming ? (Math.floor(G.t * 12) % 2 ? '#7fd4ff' : '#ffffff') : '#4a5236';
      g.beginPath(); g.arc(0, h / 2 - 3, 4, 0, 7); g.fill(); // boquilla
      g.fillStyle = '#e8e2d0'; g.font = FONT(5); g.textAlign = 'center'; g.fillText('ROCHABÚS', 0, -h / 2 + h * 0.3);
      g.fillStyle = 'rgba(61,255,154,.55)'; g.fillRect(w / 2 - 2, -h / 4, 2, h / 2); // punto ciego derecho
    },
  });
}
