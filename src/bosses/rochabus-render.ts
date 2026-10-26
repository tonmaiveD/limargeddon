import type { Gfx } from '../core/gfx';
import type { Game } from '../core/state';
import { bossArt, bossCar } from '../core/art/bosses';

// Rochabús: camión blindado verde oliva con el cañón de agua en el techo. La boquilla brilla antes del chorro.
// Nivel B (ADR 0043): torreta y rejillas horneadas; el brillo de la boquilla va encima.
export function drawRochabus(g: Gfx, G: Game, img: Gfx): void {
  const b = G.b, aiming = b.flash === 'jet';
  const art = bossArt(G, { kind: 'suv', body: '#56603f', roof: '#3f472e', grilles: 4, turret: true, label: 'ROCHABÚS', labelCol: '#e8e2d0', labelY: 0.3 });
  bossCar(img, g, G, b.x, b.y, art, 19, { ang: b.ang, brake: b.flash === 'brake', rev: b.flash === 'rev', hazard: b.flash === 'hazard', flash: b.hitFlash, dmg: 1 - b.hp / b.max },
    (fx, _w, h) => {
      if (!aiming) return;
      const on = Math.floor(G.t * 12) % 2;
      fx.fillStyle = on ? 'rgba(127,212,255,.4)' : 'rgba(255,255,255,.3)'; fx.beginPath(); fx.arc(0, h / 2 - 3, 8, 0, 7); fx.fill();
      fx.fillStyle = on ? '#7fd4ff' : '#ffffff'; fx.beginPath(); fx.arc(0, h / 2 - 3, 4, 0, 7); fx.fill();
    });
}
