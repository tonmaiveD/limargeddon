import { FONT, type Gfx } from '../core/gfx';
import type { Game } from '../core/state';
import { rampBox } from './route-ai';

// Carguero gigante tipo C-5 visto desde arriba: alas más anchas que la pista, cuatro motores, cola en T y la rampa
// trasera abierta e iluminada. Solo aparece en el último tramo de la etapa secreta.
export function drawCarguero(g: Gfx, G: Game): void {
  const P = G.cfg.route?.plane, pl = G.route.plane;
  if (!P || pl.phase === 'off') return;
  const x = pl.x, y = pl.y, w = P.w, h = P.h, top = y - h / 2;
  g.fillStyle = 'rgba(0,0,0,.35)'; g.roundRect(x - w / 2 + 10, top + 14, w, h, w / 2); g.fill(); // sombra
  // alas en flecha y motores
  g.fillStyle = '#8a8f99';
  g.beginPath(); g.moveTo(x - w / 2, top + h * 0.34); g.lineTo(x - w * 2.1, top + h * 0.52); g.lineTo(x - w * 2.1, top + h * 0.6); g.lineTo(x - w / 2, top + h * 0.5); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(x + w / 2, top + h * 0.34); g.lineTo(x + w * 2.1, top + h * 0.52); g.lineTo(x + w * 2.1, top + h * 0.6); g.lineTo(x + w / 2, top + h * 0.5); g.closePath(); g.fill();
  g.fillStyle = '#4a4452';
  for (const k of [-1.55, -0.95, 0.95, 1.55]) g.fillRect(x + k * w - 6, top + h * 0.44 + Math.abs(k) * 8, 12, 24);
  // fuselaje
  g.fillStyle = '#b9bec8'; g.roundRect(x - w / 2, top, w, h, w / 2); g.fill();
  g.fillStyle = '#10131c'; g.fillRect(x - w / 4, top + 10, w / 2, 8); // cabina
  g.fillStyle = '#6c717c'; for (let i = 0; i < 9; i++) g.fillRect(x - w / 2 + 6, top + 30 + i * (h / 12), 3, 5); // ventanillas
  // cola en T
  g.fillStyle = '#8a8f99'; g.fillRect(x - w * 0.9, top + h - 34, w * 1.8, 10);
  g.fillStyle = '#15111d'; g.font = FONT(7); g.textAlign = 'center'; g.fillText('GALAXIA CARGO', x, top + h * 0.3);
  // rampa abierta: parpadea mientras se puede subir
  const r = rampBox(G);
  if (r) {
    const open = pl.phase === 'hold' || (pl.phase === 'out' && pl.t < 0.6);
    g.fillStyle = open ? (Math.floor(G.t * 8) % 2 ? '#ffe14d' : '#fff6c8') : '#6c717c';
    g.fillRect(r.x - r.w / 2, r.y - r.h / 2, r.w, r.h);
    if (open) { g.fillStyle = '#15111d'; g.font = FONT(6); g.fillText('SUBE', r.x, r.y + 3); }
  }
}
