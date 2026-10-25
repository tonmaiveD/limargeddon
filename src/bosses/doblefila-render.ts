import { drawCar } from '../core/damage-render';
import { FONT, type Gfx } from '../core/gfx';
import type { Game, Seg } from '../core/state';

// La Doble Fila de Agua Dulce: autos estacionados con las balizas prendidas que se mueven en fila detrás de una camioneta.
function drawSeg(g: Gfx, G: Game, s: Seg, k: number): void {
  drawCar(g, G.t, s, {
    body: s.col, ang: s.ang, hazard: Math.floor(G.t * 3 + k) % 2 === 0, flash: s.flash, dmg: 1 - Math.max(0, s.hp) / s.max, seed: 50 + k,
    extra: (g, w, h) => { g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(-w / 2 + 3, -h / 2 + h * 0.4, w - 6, 3); },
  });
}

// Enrosque: mientras se forma, un círculo punteado anticipa el anillo; la salida late en verde con una flecha hacia afuera.
function drawCoil(g: Gfx, G: Game): void {
  const c = G.coil;
  if (c.st !== 'tele' && c.st !== 'hold') return;
  const pulse = 0.55 + 0.45 * Math.sin(G.t * 14);
  if (c.st === 'tele') {
    g.fillStyle = 'rgba(255,46,136,.7)';
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; if (Math.abs(Math.atan2(Math.sin(a - c.gap), Math.cos(a - c.gap))) > c.half) g.fillRect(c.cx + Math.cos(a) * c.r - 2, c.cy + Math.sin(a) * c.r - 2, 4, 4); }
  }
  const ax = Math.cos(c.gap), ay = Math.sin(c.gap), x = c.cx + ax * (c.r + 6), y = c.cy + ay * (c.r + 6);
  g.save(); g.translate(x, y); g.rotate(c.gap);
  g.fillStyle = `rgba(61,255,154,${pulse})`;
  g.beginPath(); g.moveTo(16, 0); g.lineTo(0, -11); g.lineTo(0, -5); g.lineTo(-12, -5); g.lineTo(-12, 5); g.lineTo(0, 5); g.lineTo(0, 11); g.closePath(); g.fill();
  g.restore();
  g.fillStyle = '#3dff9a'; g.font = FONT(8); g.textAlign = 'center';
  g.fillText('SALIDA', c.cx + ax * (c.r + 34), c.cy + ay * (c.r + 34) + 3);
}

export function drawDobleFila(g: Gfx, G: Game): void {
  drawCoil(g, G);
  let k = 0;
  for (const ch of G.chains) {
    for (let i = ch.segs.length - 1; i >= 0; i--) drawSeg(g, G, ch.segs[i], k++);
    if (ch.lead) drawSeg(g, G, ch.lead, k++);
  }
  const b = G.b;
  drawCar(g, G.t, b, {
    body: '#c9ccd3', roof: '#6c717c', ang: b.ang, brake: b.flash === 'brake', rev: b.flash === 'rev', hazard: b.flash === 'hazard' || Math.floor(G.t * 3) % 2 === 0,
    flash: b.hitFlash, dmg: 1 - b.hp / b.max, seed: 49,
    extra: (g, w, h) => {
      g.fillStyle = '#15111d'; g.fillRect(-w / 2 + 4, -h / 2 + h * 0.56, w - 8, 9);
      g.fillStyle = '#ffe14d'; g.font = FONT(5); g.textAlign = 'center'; g.fillText('DOBLE FILA', 0, -h / 2 + h * 0.56 + 7);
      g.fillStyle = 'rgba(61,255,154,.55)'; g.fillRect(w / 2 - 2, -h / 4, 2, h / 2); // punto ciego derecho
    },
  });
  if (b.flash === 'horn') { g.fillStyle = '#ffe14d'; g.font = FONT(14); g.textAlign = 'center'; g.fillText('¡PIII PIII!', b.x + b.w / 2 + 26, b.y - b.h / 2); }
}
