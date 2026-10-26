import type { Gfx } from '../core/gfx';
import type { Game } from '../core/state';
import { bossArt, bossCar, hornText } from '../core/art/bosses';

// Camioneta del serenazgo: blanca y azul, circulina en el techo y el sereno con gorra. Su punto ciego también está a la
// derecha. Nivel B (ADR 0043): carrocería horneada; la circulina, que acelera cuando va a atacar, va encima.
export function drawSerenazgo(g: Gfx, G: Game, img: Gfx): void {
  const b = G.b;
  const art = bossArt(G, { kind: 'suv', body: '#f4f6fb', roof: '#1f4fbf', siren: true, band: '#1f4fbf', label: 'SERENAZGO', labelCol: '#fff', bandLabel: true, labelY: 0.62, driver: { hair: '#e8c4a0', cap: '#1f2f6b' } });
  bossCar(img, g, G, b.x, b.y, art, 11, { ang: b.ang, brake: b.flash === 'brake', rev: b.flash === 'rev', hazard: b.flash === 'hazard', flash: b.hitFlash, dmg: 1 - b.hp / b.max, fastSiren: !!b.flash });
  hornText(g, G, '¡PRRR!', '#7fd4ff', 18);
}
