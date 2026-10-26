import { FONT, type Gfx } from '../core/gfx';
import type { Game, Seg } from '../core/state';
import { bossCar } from '../core/art/bosses';

// La Doble Fila de Agua Dulce: autos estacionados con las balizas prendidas que se mueven en fila detrás de una camioneta.
// Nivel B (ADR 0043): cada auto y la camioneta son imágenes horneadas; las balizas parpadean encima.
function drawSeg(g: Gfx, img: Gfx, G: Game, s: Seg, k: number): void {
  bossCar(img, g, G, s.x, s.y, { kind: 'sedan', w: s.w, h: s.h, body: s.col }, 50 + k,
    { ang: s.ang, hazard: Math.floor(G.t * 3 + k) % 2 === 0, flash: s.flash, dmg: 1 - Math.max(0, s.hp) / s.max });
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

export function drawDobleFila(g: Gfx, G: Game, img: Gfx): void {
  g.rigid(G.coil.cx, G.coil.cy, () => drawCoil(g, G));
  let k = 0;
  // cada auto de la fila es rígido sobre la pista curva: se corre y gira entero, no se deforma (ADR 0040)
  const seg = (s: Seg) => { const n = k++; img.rigid(s.x, s.y, () => g.rigid(s.x, s.y, () => drawSeg(g, img, G, s, n))); };
  for (const ch of G.chains) {
    for (let i = ch.segs.length - 1; i >= 0; i--) seg(ch.segs[i]);
    if (ch.lead) seg(ch.lead);
  }
  const b = G.b;
  img.rigid(b.x, b.y, () => g.rigid(b.x, b.y, () => drawHead(g, img, G)));
}

function drawHead(g: Gfx, img: Gfx, G: Game): void {
  const b = G.b;
  bossCar(img, g, G, b.x, b.y, { kind: 'suv', w: b.w, h: b.h, body: '#c9ccd3', roof: '#6c717c', panel: '#15111d', label: 'DOBLE FILA', labelCol: '#ffe14d', blind: true },
    49, { ang: b.ang, brake: b.flash === 'brake', rev: b.flash === 'rev', hazard: b.flash === 'hazard' || Math.floor(G.t * 3) % 2 === 0, flash: b.hitFlash, dmg: 1 - b.hp / b.max });
  if (b.flash === 'horn') { g.fillStyle = '#ffe14d'; g.font = FONT(14); g.textAlign = 'center'; g.fillText('¡PIII PIII!', b.x + b.w / 2 + 26, b.y - b.h / 2); }
}
