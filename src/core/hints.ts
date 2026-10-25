import type { FireMode, HintDef } from './config';
import { tramo, type Game } from './state';

/*
 * Tutorial en contexto (ADR 0037): cada etapa declara en su JSON ayudas breves que aparecen sobre el Tico cuando pasa
 * lo que explican, solo la primera vez que se juega esa etapa. Una ayuda se dispara por tiempo (`at`) o por un evento
 * (`on`), puede esperar unos segundos después del evento (`after`) y puede ser solo para un modo de disparo (`mode`).
 */

const TELE = ['teleBrake', 'teleRev', 'teleRam', 'teleJet', 'teleThrow', 'teleSwing'];

// Eventos que puede esperar una ayuda. Los que llevan dos puntos reciben un parámetro: fase, estilo de obstáculo o tramo.
export const HINT_EVENTS = ['boss', 'pickup', 'cart', 'birds', 'slide', 'coil', 'stars', 'fog', 'tide', 'plane', 'light', ...TELE] as const;
export const HINT_PREFIXES = ['phase:', 'obs:', 'tramo:'] as const;

export function validHintEvent(on: string): boolean {
  return (HINT_EVENTS as readonly string[]).includes(on) || HINT_PREFIXES.some((p) => on.startsWith(p) && on.length > p.length);
}

function happened(G: Game, on: string): boolean {
  const b = G.b, p = G.p;
  if (TELE.includes(on)) return b.state === on;
  if (on.startsWith('phase:')) return b.state !== 'enter' && b.phase === Number(on.slice(6));
  if (on.startsWith('obs:')) {
    const style = on.slice(4), defs = G.cfg.obstacles ?? [];
    return G.obstacles.some((ob) => defs[ob.i]?.style === style && ob.y > 40 && ob.y < p.y - 40);
  }
  if (on.startsWith('tramo:')) return tramo(G)?.id === on.slice(6);
  switch (on) {
    case 'boss': return b.state !== 'enter' && !G.cfg.route;
    case 'pickup': return G.pickups.some((u) => u.y > 40);
    case 'cart': return G.cart.on;
    case 'birds': return G.flock.on;
    case 'slide': return G.slide.phase > 0;
    case 'coil': return G.coil.st === 'tele';
    case 'stars': return G.stars > 0;
    case 'fog': return G.fog.k > 0.3;
    case 'tide': return G.route.tideY < 5000;
    case 'plane': return G.route.plane.phase !== 'off';
    case 'light': return G.lights.some((l) => l.y > 40);
  }
  return false;
}

const forMode = (h: HintDef, mode: FireMode) => !h.mode || h.mode === mode;
// los avisos de peligro entran al instante; las demás esperan a que la ayuda visible lleve al menos 2,4 s
const URGENT = [...TELE, 'coil', 'cart', 'birds', 'slide'];
const urgent = (h: HintDef) => !!h.on && URGENT.includes(h.on);

// Un paso de las ayudas: agenda las que ya ocurrieron y muestra la que toca, por orden de llegada.
export function updateHints(G: Game, dt: number): void {
  if (G.hint && (G.hint.life -= dt) <= 0) G.hint = null;
  const list = G.cfg.hints;
  if (!G.hintsOn || !list) return;
  list.forEach((h, i) => {
    if (G.hintAt[i] !== undefined || !forMode(h, G.fireMode)) return;
    if (h.on ? happened(G, h.on) : G.t >= (h.at ?? 0)) G.hintAt[i] = G.t + (h.on ? h.after ?? 0 : 0);
  });
  const busy = !!G.hint && G.hint.life > 0.8;
  let next = -1;
  G.hintAt.forEach((t, i) => {
    if (t === undefined || t < 0 || G.t < t || (busy && !urgent(list[i]))) return;
    if (next < 0 || urgent(list[i]) > urgent(list[next]) || (urgent(list[i]) === urgent(list[next]) && t < G.hintAt[next]!)) next = i;
  });
  if (next >= 0) { G.hint = { text: list[next].text, life: 3.2 }; G.hintAt[next] = -1; }
}
