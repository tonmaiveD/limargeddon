import { drawCar } from '../core/damage-render';
import { FONT, type Gfx } from '../core/gfx';
import type { Game } from '../core/state';

// Camioneta del Comandante: blanca y verde, circulina larga en el techo y la compuerta de atrás que se abre para tirar rompellantas.
export function drawComandante(g: Gfx, G: Game): void {
  const b = G.b, opening = b.flash === 'throw';
  drawCar(g, G.t, b, {
    body: '#f4f6fb', roof: '#2f6b3f', ang: b.ang, brake: b.flash === 'brake', rev: b.flash === 'rev', hazard: b.flash === 'hazard',
    flash: b.hitFlash, dmg: 1 - b.hp / b.max, seed: 47,
    extra: (g, w, h) => {
      const blink = Math.floor(G.t * (b.flash ? 14 : 6)) % 2;
      g.fillStyle = '#10131c'; g.fillRect(-w / 2 + 5, -h / 2 + h * 0.36, w - 10, 6);
      g.fillStyle = blink ? '#ff3355' : '#3a7bff'; g.fillRect(-w / 2 + 6, -h / 2 + h * 0.36 + 1, (w - 12) / 2, 4);
      g.fillStyle = blink ? '#3a7bff' : '#ff3355'; g.fillRect(0, -h / 2 + h * 0.36 + 1, (w - 12) / 2, 4);
      g.fillStyle = '#2f6b3f'; g.fillRect(-w / 2, -h / 2 + h * 0.6, w, 5);
      g.fillStyle = '#f4f6fb'; g.font = FONT(5); g.textAlign = 'center'; g.fillText('COMANDANTE', 0, -h / 2 + h * 0.6 + 4.5);
      g.fillStyle = '#ffe14d'; g.beginPath(); g.arc(-w / 4 + 2, -h / 2 + h * 0.26, 3, 0, 7); g.fill(); // la gorra con insignia
      g.fillStyle = opening ? (Math.floor(G.t * 12) % 2 ? '#ffe14d' : '#ffffff') : '#c9ccd3';
      g.fillRect(-w / 2 + 3, h / 2 - (opening ? 3 : 5), w - 6, opening ? 3 : 4);
      g.fillStyle = 'rgba(61,255,154,.55)'; g.fillRect(w / 2 - 2, -h / 4, 2, h / 2); // punto ciego derecho
    },
  });
  if (b.flash === 'horn') { g.fillStyle = '#7fd4ff'; g.font = FONT(14); g.textAlign = 'center'; g.fillText('¡UIUIUI!', b.x + b.w / 2 + 24, b.y - b.h / 2); }
}
