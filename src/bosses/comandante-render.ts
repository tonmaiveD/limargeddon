import type { Gfx } from '../core/gfx';
import type { Game } from '../core/state';
import { bossArt, bossCar, hornText, rearDoor } from '../core/art/bosses';

// Camioneta del Comandante: blanca y verde, circulina larga en el techo y la compuerta de atrás que se abre para tirar
// rompellantas. Nivel B (ADR 0043): circulina y compuerta van encima de la carrocería horneada.
export function drawComandante(g: Gfx, G: Game, img: Gfx): void {
  const b = G.b, opening = b.flash === 'throw';
  const art = bossArt(G, { kind: 'suv', body: '#f4f6fb', roof: '#2f6b3f', siren: true, band: '#2f6b3f', label: 'COMANDANTE', labelCol: '#f4f6fb', bandLabel: true, labelY: 0.6, driver: { hair: '#e8c4a0', cap: '#2f6b3f', badge: '#ffe14d' } });
  bossCar(img, g, G, b.x, b.y, art, 47, { ang: b.ang, brake: b.flash === 'brake', rev: b.flash === 'rev', hazard: b.flash === 'hazard', flash: b.hitFlash, dmg: 1 - b.hp / b.max, fastSiren: !!b.flash },
    (fx, w, h) => rearDoor(fx, G.t, w, h, opening, '#c9ccd3'));
  hornText(g, G, '¡UIUIUI!', '#7fd4ff', 24);
}
