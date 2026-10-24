import { drawCar } from '../core/damage-render';
import { FONT, type Gfx } from '../core/gfx';
import type { Game } from '../core/state';

// Tráiler del puerto: cabina azul adelante y la plataforma con contenedores mal amarrados. Antes de soltar uno, la puerta de atrás parpadea.
export function drawTrailer(g: Gfx, G: Game): void {
  const b = G.b, opening = b.flash === 'throw';
  drawCar(g, G.t, b, {
    body: '#4a4452', roof: '#3a3442', ang: b.ang, brake: b.flash === 'brake', rev: b.flash === 'rev', hazard: b.flash === 'hazard',
    flash: b.hitFlash, dmg: 1 - b.hp / b.max, seed: 37,
    extra: (g, w, h) => {
      g.fillStyle = '#2a7de1'; g.fillRect(-w / 2 + 3, -h / 2 + 2, w - 6, h * 0.18); // cabina
      g.fillStyle = '#10131c'; g.fillRect(-w / 2 + 6, -h / 2 + h * 0.04, w - 12, 5);
      g.fillStyle = '#15111d'; g.fillRect(-w / 2 + 4, -h / 2 + h * 0.2, w - 8, 3); // enganche
      // dos contenedores apilados en la plataforma, con las cadenas sueltas
      const cols = ['#d93b3b', '#1f9e5a'];
      for (let i = 0; i < 2; i++) {
        const cy = -h / 2 + h * 0.25 + i * h * 0.36;
        g.fillStyle = cols[i]; g.fillRect(-w / 2 + 4, cy, w - 8, h * 0.34);
        g.fillStyle = 'rgba(0,0,0,.22)'; for (let x = -w / 2 + 7; x < w / 2 - 5; x += 5) g.fillRect(x, cy + 2, 1.5, h * 0.34 - 4);
      }
      g.strokeStyle = '#c9ccd3'; g.lineWidth = 1; g.beginPath(); g.moveTo(-w / 2 + 4, -h / 2 + h * 0.4); g.lineTo(w / 2 - 10, -h / 2 + h * 0.48); g.stroke();
      g.fillStyle = '#f4f1e6'; g.font = FONT(5); g.textAlign = 'center'; g.fillText('CARGA PESADA', 0, -h / 2 + h * 0.62);
      g.fillStyle = opening ? (Math.floor(G.t * 12) % 2 ? '#ffe14d' : '#ffffff') : '#6c717c';
      g.fillRect(-w / 2 + 3, h / 2 - (opening ? 3 : 6), w - 6, opening ? 3 : 5);
      g.fillStyle = 'rgba(61,255,154,.55)'; g.fillRect(w / 2 - 2, -h / 4, 2, h / 2); // punto ciego derecho
    },
  });
  if (b.flash === 'horn') { g.fillStyle = '#ff2e88'; g.font = FONT(14); g.textAlign = 'center'; g.fillText('¡BUUU!', b.x + b.w / 2 + 20, b.y - b.h / 2); }
}
