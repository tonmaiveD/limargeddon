import type { Gfx } from '../core/gfx';
import type { Game } from '../core/state';
import { bossArt, bossCar, hornText, rearDoor } from '../core/art/bosses';

// Camión de Gamarra: cabina roja adelante y la tolva cargada de rollos de tela. Antes de soltar la carga se abre la
// puerta de atrás. Nivel B (ADR 0043): cabina y rollos horneados; la puerta va encima.
export function drawCamion(g: Gfx, G: Game, img: Gfx): void {
  const b = G.b, opening = b.flash === 'throw';
  const art = bossArt(G, { kind: 'truck', body: '#d93b3b', roof: '#c9ccd3', cargo: { kind: 'rollos', cols: ['#ff2e88', '#3a7bff', '#ffe14d', '#3dff9a'] }, label: 'MERCADERÍA', labelCol: '#f4f1e6', labelY: 0.27 });
  bossCar(img, g, G, b.x, b.y, art, 31, { ang: b.ang, brake: b.flash === 'brake', rev: b.flash === 'rev', hazard: b.flash === 'hazard', flash: b.hitFlash, dmg: 1 - b.hp / b.max },
    (fx, w, h) => rearDoor(fx, G.t, w, h, opening));
  hornText(g, G, '¡POOO!', '#ff2e88');
}
