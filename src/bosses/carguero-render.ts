import { FONT, type Gfx } from '../core/gfx';
import type { Game } from '../core/state';
import { rampBox } from './route-ai';
import { bakePlane } from '../core/art/bosses';
import { ART_SCALE } from '../core/art/vehicles';

// Carguero gigante tipo C-5 visto desde arriba: alas más anchas que la pista, cuatro motores, cola en T y la rampa
// trasera abierta e iluminada. Solo aparece en el último tramo de la etapa secreta. Nivel B (ADR 0043): el avión es una
// imagen horneada; la rampa, que parpadea mientras se puede subir, va encima.
export function drawCarguero(g: Gfx, G: Game, img: Gfx): void {
  const P = G.cfg.route?.plane, pl = G.route.plane;
  if (!P || pl.phase === 'off') return;
  const key = `carguero-${P.w}-${P.h}`;
  if (!img.textures.exists(key)) img.textures.addCanvas(key, bakePlane(P.w, P.h, P.label ?? 'GALAXIA CARGO', ART_SCALE));
  img.image(key, pl.x, pl.y, 1 / ART_SCALE);
  const r = rampBox(G);
  if (r) {
    const open = pl.phase === 'hold' || (pl.phase === 'out' && pl.t < 0.6);
    g.fillStyle = open ? (Math.floor(G.t * 8) % 2 ? '#ffe14d' : '#fff6c8') : '#6c717c';
    g.fillRect(r.x - r.w / 2, r.y - r.h / 2, r.w, r.h);
    if (open) { g.fillStyle = '#15111d'; g.font = FONT(6); g.textAlign = 'center'; g.fillText('SUBE', r.x, r.y + 3); }
  }
}
