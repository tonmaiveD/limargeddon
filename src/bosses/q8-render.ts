import type { Gfx } from '../core/gfx';
import type { Game } from '../core/state';
import { C } from '../core/util';
import { bossArt, bossCar, hornText } from '../core/art/bosses';

// SUV de lujo "Q8" con cuatro anillos, uno deformado (parodia), y la conductora al celular. Nivel B (ADR 0043): la
// pantalla del celular, que se apaga con el claxon, va encima de la carrocería horneada.
export function drawQ8(g: Gfx, G: Game, img: Gfx): void {
  const b = G.b;
  const art = bossArt(G, { kind: 'suv', body: '#eceaf2', roof: '#d9d6e2', rings: true, driver: { hair: '#4a2c1e', shades: true } });
  bossCar(img, g, G, b.x, b.y, art, 3, { ang: b.ang, brake: b.flash === 'brake', rev: b.flash === 'rev', hazard: b.flash === 'hazard', flash: b.hitFlash, dmg: 1 - b.hp / b.max },
    (fx, w, h, fr) => {
      if (b.phoneOff > 0 || b.phase !== 1) return;
      const dx = -w / 4 + 2, dy = -h / 2 + h * 0.28 + fr * 0.72 + 1;
      fx.fillStyle = '#6ff3ff'; fx.fillRect(dx + 4, dy - 1, 2, 4);
    });
  hornText(g, G, '♪!', C.pink, 12);
}
