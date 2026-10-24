import { drawCar } from '../core/damage-render';
import { FONT, type Gfx } from '../core/gfx';
import type { Game } from '../core/state';

// Camioneta del serenazgo: blanca y azul, circulina en el techo y el sereno con gorra. Su punto ciego también está a la derecha.
export function drawSerenazgo(g: Gfx, G: Game): void {
  const b = G.b;
  drawCar(g, G.t, b, {
    body: '#f4f6fb', roof: '#1f4fbf', ang: b.ang, brake: b.flash === 'brake', rev: b.flash === 'rev', hazard: b.flash === 'hazard',
    flash: b.hitFlash, dmg: 1 - b.hp / b.max, seed: 11,
    extra: (g, w, h) => {
      const blink = Math.floor(G.t * (b.flash ? 14 : 6)) % 2; // la circulina acelera cuando va a atacar
      g.fillStyle = '#10131c'; g.fillRect(-w / 2 + 6, -h / 2 + h * 0.36, w - 12, 6);
      g.fillStyle = blink ? '#ff3355' : '#3a7bff'; g.fillRect(-w / 2 + 7, -h / 2 + h * 0.36 + 1, (w - 14) / 2, 4);
      g.fillStyle = blink ? '#3a7bff' : '#ff3355'; g.fillRect(0, -h / 2 + h * 0.36 + 1, (w - 14) / 2, 4);
      g.fillStyle = '#1f4fbf'; g.fillRect(-w / 2, -h / 2 + h * 0.62, w, 5); // franja lateral
      g.fillStyle = '#fff'; g.font = FONT(5); g.textAlign = 'center'; g.fillText('SERENAZGO', 0, -h / 2 + h * 0.62 + 4.5);
      const dx = -w / 4 + 2, dy = -h / 2 + h * 0.27;
      g.fillStyle = '#e8c4a0'; g.beginPath(); g.arc(dx, dy + 1, 3.2, 0, 7); g.fill();
      g.fillStyle = '#1f2f6b'; g.fillRect(dx - 4, dy - 3, 8, 2.5); // gorra
      g.fillStyle = 'rgba(61,255,154,.55)'; g.fillRect(w / 2 - 2, -h / 4, 2, h / 2); // punto ciego derecho
    },
  });
  if (b.flash === 'horn') { g.fillStyle = '#7fd4ff'; g.font = FONT(14); g.textAlign = 'center'; g.fillText('¡PRRR!', b.x + b.w / 2 + 18, b.y - b.h / 2); }
}
