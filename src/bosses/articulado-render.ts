import type { Gfx } from '../core/gfx';
import type { Game } from '../core/state';
import { phaseDef } from './phase-machine';
import { bossCar, hornText } from '../core/art/bosses';
import type { CarArt } from '../core/art/bake';

// Bus expreso articulado: dos cuerpos rojos unidos por el fuelle. La mitad de atrás tiembla antes del coletazo y luego
// barre de lado. Nivel B (ADR 0043): cada mitad es una imagen horneada; la de atrás trae el fuelle.
export function drawArticulado(g: Gfx, G: Game, img: Gfx): void {
  const b = G.b, half = b.h / 2, warn = b.state === 'teleSwing', S = phaseDef(G.cfg.boss.phases, b.phase).swing;
  const look = { brake: b.flash === 'brake', rev: b.flash === 'rev', hazard: b.flash === 'hazard' || warn, flash: b.hitFlash, dmg: 1 - b.hp / b.max };
  const base = { kind: 'bus', w: b.w, h: half, body: '#d93b3b', roof: '#b02a2a', band: '#f4f1e6', bandLabel: true, blind: true } as const;
  const front: CarArt = { ...base, joint: 'front', label: 'EXPRESO', labelCol: '#15111d', labelY: 0.62 };
  const rear: CarArt = { ...base, joint: 'rear', labelY: 0.5 };
  // aviso del coletazo: franja naranja en el costado hacia donde va a barrer
  if (warn && S) {
    const side = Math.sign(b.swing) || 1, x = side > 0 ? b.x + b.w / 2 : b.x - b.w / 2 - S.reach;
    g.fillStyle = Math.floor(G.t * 10) % 2 ? 'rgba(255,138,31,.35)' : 'rgba(255,255,255,.18)'; g.fillRect(x, b.y, S.reach, half + 34);
  }
  // mitad de atrás, girando sobre el fuelle
  const turn = -(b.state === 'swing' ? b.swing * 0.55 : 0) + (warn ? Math.sin(G.t * 40) * 0.05 : 0) + b.ang;
  for (const l of [img, g]) { l.save(); l.translate(b.x, b.y); l.rotate(turn); }
  bossCar(img, g, G, 0, half / 2, rear, 43, look);
  for (const l of [img, g]) l.restore();
  bossCar(img, g, G, b.x, b.y - half / 2, front, 41, { ...look, ang: b.ang });
  hornText(g, G, '¡PAAA!', '#ffe14d');
}
