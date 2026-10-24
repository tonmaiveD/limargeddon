import { drawCar } from '../core/damage-render';
import { FONT, type Gfx } from '../core/gfx';
import type { Game } from '../core/state';

// Camión de Gamarra: cabina roja adelante y la tolva cargada de rollos de tela. Antes de soltar la carga se abre la puerta de atrás.
export function drawCamion(g: Gfx, G: Game): void {
  const b = G.b, opening = b.flash === 'throw';
  drawCar(g, G.t, b, {
    body: '#c9ccd3', roof: '#8a8f99', ang: b.ang, brake: b.flash === 'brake', rev: b.flash === 'rev', hazard: b.flash === 'hazard',
    flash: b.hitFlash, dmg: 1 - b.hp / b.max, seed: 31,
    extra: (g, w, h) => {
      g.fillStyle = '#d93b3b'; g.fillRect(-w / 2 + 2, -h / 2 + 2, w - 4, h * 0.22); // cabina
      g.fillStyle = '#10131c'; g.fillRect(-w / 2 + 5, -h / 2 + h * 0.05, w - 10, 5);
      // rollos de tela apilados en la tolva
      const cols = ['#ff2e88', '#3a7bff', '#ffe14d', '#3dff9a'];
      for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
        g.fillStyle = cols[(r + c) % 4]; g.fillRect(-w / 2 + 5 + c * ((w - 10) / 3), -h / 2 + h * 0.3 + r * 13, (w - 10) / 3 - 2, 10);
      }
      g.fillStyle = '#15111d'; g.font = FONT(5); g.textAlign = 'center'; g.fillText('MERCADERÍA', 0, -h / 2 + h * 0.27);
      // puerta de atrás: se abre y parpadea antes de soltar los rollos
      g.fillStyle = opening ? (Math.floor(G.t * 12) % 2 ? '#ffe14d' : '#ffffff') : '#6c717c';
      g.fillRect(-w / 2 + 3, h / 2 - (opening ? 3 : 6), w - 6, opening ? 3 : 5);
      g.fillStyle = 'rgba(61,255,154,.55)'; g.fillRect(w / 2 - 2, -h / 4, 2, h / 2); // punto ciego derecho
    },
  });
  if (b.flash === 'horn') { g.fillStyle = '#ff2e88'; g.font = FONT(14); g.textAlign = 'center'; g.fillText('¡POOO!', b.x + b.w / 2 + 20, b.y - b.h / 2); }
}
