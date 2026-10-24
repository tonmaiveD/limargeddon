import { drawCar } from '../core/damage-render';
import { FONT, type Gfx } from '../core/gfx';
import type { Game } from '../core/state';
import { phaseDef } from './phase-machine';

// Bus expreso articulado: dos cuerpos rojos unidos por el fuelle. La mitad de atrás tiembla antes del coletazo y luego barre de lado.
export function drawArticulado(g: Gfx, G: Game): void {
  const b = G.b, half = b.h / 2, warn = b.state === 'teleSwing', S = phaseDef(G.cfg.boss.phases, b.phase).swing;
  const look = (seed: number) => ({
    body: '#d93b3b', roof: '#b02a2a', brake: b.flash === 'brake', rev: b.flash === 'rev', hazard: b.flash === 'hazard' || warn,
    flash: b.hitFlash, dmg: 1 - b.hp / b.max, seed,
  });
  // aviso del coletazo: franja naranja en el costado hacia donde va a barrer
  if (warn && S) {
    const side = Math.sign(b.swing) || 1, x = side > 0 ? b.x + b.w / 2 : b.x - b.w / 2 - S.reach;
    g.fillStyle = Math.floor(G.t * 10) % 2 ? 'rgba(255,138,31,.35)' : 'rgba(255,255,255,.18)'; g.fillRect(x, b.y, S.reach, half + 34);
  }
  // mitad de atrás, girando sobre el fuelle
  g.save(); g.translate(b.x, b.y);
  const shake = warn ? Math.sin(G.t * 40) * 0.05 : 0;
  g.rotate(-(b.state === 'swing' ? b.swing * 0.55 : 0) + shake + b.ang);
  drawCar(g, G.t, { x: 0, y: half / 2, w: b.w, h: half }, {
    ...look(43), extra: (g, w, h) => {
      g.fillStyle = '#f4f1e6'; g.fillRect(-w / 2, -h / 2 + h * 0.5, w, 4);
      g.fillStyle = 'rgba(61,255,154,.55)'; g.fillRect(w / 2 - 2, -h / 2, 2, h * 0.7); // punto ciego derecho
    },
  });
  g.restore();
  // fuelle y mitad de adelante
  g.fillStyle = '#15111d'; g.fillRect(b.x - b.w / 2 + 6, b.y - 4, b.w - 12, 8);
  g.fillStyle = '#4a4452'; for (let i = 0; i < 4; i++) g.fillRect(b.x - b.w / 2 + 8 + i * ((b.w - 16) / 4), b.y - 3, 2, 6);
  drawCar(g, G.t, { x: b.x, y: b.y - half / 2, w: b.w, h: half }, {
    ...look(41), ang: b.ang, extra: (g, w, h) => {
      g.fillStyle = '#f4f1e6'; g.fillRect(-w / 2, -h / 2 + h * 0.62, w, 4);
      g.fillStyle = '#15111d'; g.font = FONT(5); g.textAlign = 'center'; g.fillText('EXPRESO', 0, -h / 2 + h * 0.62 + 3.5);
      g.fillStyle = 'rgba(61,255,154,.55)'; g.fillRect(w / 2 - 2, -h / 2 + h * 0.3, 2, h * 0.7);
    },
  });
  if (b.flash === 'horn') { g.fillStyle = '#ffe14d'; g.font = FONT(14); g.textAlign = 'center'; g.fillText('¡PAAA!', b.x + b.w / 2 + 20, b.y - b.h / 2); }
}
