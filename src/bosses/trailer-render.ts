import type { Gfx } from '../core/gfx';
import type { Game } from '../core/state';
import { bossArt, bossCar, hornText, rearDoor } from '../core/art/bosses';

// Tráiler del puerto: cabina azul adelante y la plataforma con contenedores mal amarrados. Antes de soltar uno, la puerta
// de atrás parpadea. Nivel B (ADR 0043): cabina y contenedores horneados; la puerta va encima.
export function drawTrailer(g: Gfx, G: Game, img: Gfx): void {
  const b = G.b, opening = b.flash === 'throw';
  const art = bossArt(G, { kind: 'truck', body: '#2a7de1', roof: '#4a4452', cargo: { kind: 'contenedores', cols: ['#d93b3b', '#1f9e5a'] }, label: 'CARGA PESADA', labelCol: '#f4f1e6', labelY: 0.62 });
  bossCar(img, g, G, b.x, b.y, art, 37, { ang: b.ang, brake: b.flash === 'brake', rev: b.flash === 'rev', hazard: b.flash === 'hazard', flash: b.hitFlash, dmg: 1 - b.hp / b.max },
    (fx, w, h) => rearDoor(fx, G.t, w, h, opening));
  hornText(g, G, '¡BUUU!', '#ff2e88');
}
