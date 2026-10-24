import { drawCar } from '../core/damage-render';
import { FONT, type Gfx } from '../core/gfx';
import type { Game } from '../core/state';

// Combi Asesina: amarilla con franja roja y techo verde, la ruta pintada y el cobrador colgado de la puerta derecha.
// Antes de lanzar monedas el cobrador saca el brazo y el sencillo brilla.
export function drawCombiAsesina(g: Gfx, G: Game): void {
  const b = G.b, throwing = b.flash === 'throw';
  drawCar(g, G.t, b, {
    body: '#f2c230', roof: '#1f9e5a', ang: b.ang, brake: b.flash === 'brake', rev: b.flash === 'rev', hazard: b.flash === 'hazard',
    flash: b.hitFlash, dmg: 1 - b.hp / b.max, seed: 23,
    extra: (g, w, h) => {
      g.fillStyle = '#d93b3b'; g.fillRect(-w / 2, -h / 2 + h * 0.5, w, 6); // franja
      g.fillStyle = '#f4f1e6'; g.font = FONT(4.5); g.textAlign = 'center'; g.fillText('TODO JAVIER PRADO', 0, -h / 2 + h * 0.5 + 5);
      g.fillStyle = '#15111d'; g.fillRect(-w / 2 + 5, -h / 2 + h * 0.08, w - 10, 3); // parrilla del techo
      // cobrador en la puerta derecha (su punto ciego), con el brazo afuera cuando va a lanzar
      const cy = -h / 2 + h * 0.38;
      g.fillStyle = '#e8c4a0'; g.beginPath(); g.arc(w / 2 + 2, cy, 3.4, 0, 7); g.fill();
      g.fillStyle = '#2a7de1'; g.fillRect(w / 2 - 1, cy + 3, 5, 9);
      if (throwing) {
        g.fillStyle = '#e8c4a0'; g.fillRect(w / 2 + 3, cy + 4, 9, 2.5);
        g.fillStyle = Math.floor(G.t * 12) % 2 ? '#ffd23f' : '#ffffff'; g.beginPath(); g.arc(w / 2 + 13, cy + 5, 3, 0, 7); g.fill();
      }
      g.fillStyle = 'rgba(61,255,154,.55)'; g.fillRect(w / 2 - 2, -h / 4, 2, h / 2); // punto ciego derecho
    },
  });
  if (b.flash === 'horn') { g.fillStyle = '#ffe14d'; g.font = FONT(14); g.textAlign = 'center'; g.fillText('¡PIIIP!', b.x + b.w / 2 + 20, b.y - b.h / 2); }
}
