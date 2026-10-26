import type { Gfx } from '../core/gfx';
import type { Game } from '../core/state';
import { bossArt, bossCar, hornText } from '../core/art/bosses';

// Combi Asesina: amarilla con franja roja y techo verde, la ruta pintada y el cobrador colgado de la puerta derecha.
// Antes de lanzar monedas el cobrador saca el brazo y el sencillo brilla. Nivel B (ADR 0043): el cobrador va encima.
export function drawCombiAsesina(g: Gfx, G: Game, img: Gfx): void {
  const b = G.b, throwing = b.flash === 'throw';
  const art = bossArt(G, { kind: 'combi', body: '#f2c230', roof: '#1f9e5a', band: '#d93b3b', label: 'TODO JAVIER PRADO', labelCol: '#f4f1e6', labelSize: 4.5, bandLabel: true, labelY: 0.5, rack: true });
  bossCar(img, g, G, b.x, b.y, art, 23, { ang: b.ang, brake: b.flash === 'brake', rev: b.flash === 'rev', hazard: b.flash === 'hazard', flash: b.hitFlash, dmg: 1 - b.hp / b.max },
    (fx, w, h) => cobrador(fx, G.t, w, -h / 2 + h * 0.38, throwing));
  hornText(g, G, '¡PIIIP!', '#ffe14d');
}

// El cobrador colgado de la puerta derecha; con el brazo afuera y el sencillo brillando cuando va a lanzar.
export function cobrador(fx: Gfx, t: number, w: number, cy: number, throwing: boolean): void {
  fx.fillStyle = 'rgba(0,0,0,.3)'; fx.beginPath(); fx.ellipse(w / 2 + 3.5, cy + 6, 4, 6, 0, 0, 7); fx.fill();
  fx.fillStyle = '#2a7de1'; fx.roundRect(w / 2 - 1, cy + 2.5, 5, 9, 2); fx.fill();
  fx.fillStyle = '#e8c4a0'; fx.beginPath(); fx.arc(w / 2 + 2, cy, 3.4, 0, 7); fx.fill();
  fx.fillStyle = '#2a2238'; fx.beginPath(); fx.arc(w / 2 + 2, cy - 1, 3.4, Math.PI, 2 * Math.PI); fx.fill(); // pelo
  if (throwing) {
    fx.fillStyle = '#e8c4a0'; fx.fillRect(w / 2 + 3, cy + 4, 9, 2.5);
    fx.fillStyle = Math.floor(t * 12) % 2 ? '#ffd23f' : '#ffffff'; fx.beginPath(); fx.arc(w / 2 + 13, cy + 5, 3, 0, 7); fx.fill();
  }
}
