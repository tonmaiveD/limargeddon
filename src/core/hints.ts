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
// los avisos de peligro entran al instante; las demás esperan a que la ayuda visible se haya podido leer
const URGENT = [...TELE, 'coil', 'cart', 'birds', 'slide'];
const urgent = (h: HintDef) => !!h.on && URGENT.includes(h.on);

// Tiempo en pantalla para dar una ayuda por leída (ADR 0039, auditoría R01 y R02).
export const READ_TIME = 2.4;
// Un aviso de peligro no reemplaza a otro que lleva menos que esto en pantalla.
const URGENT_MIN = 1.2;

// Ayudas de la pelea que ya se leyeron (para guardarlas por etapa y modo).
export function learnedHints(G: Game): string[] {
  return (G.cfg.hints ?? []).filter((_, i) => (G.hintShown[i] ?? 0) >= READ_TIME).map((h) => h.text);
}

/*
 * Un paso de las ayudas. Una ayuda cuenta como leída recién con READ_TIME en pantalla. Si otra la interrumpe antes,
 * una explicación vuelve a la cola y un aviso de peligro espera a que el peligro se repita (nunca sale fuera de
 * contexto). Las que el jugador ya leyó en otra pelea, en este modo de disparo, no salen.
 */
export function updateHints(G: Game, dt: number): void {
  const list = G.cfg.hints ?? [];
  if (G.hint) {
    G.hint.life -= dt;
    if (G.hintIdx >= 0) G.hintShown[G.hintIdx] = (G.hintShown[G.hintIdx] ?? 0) + dt;
    if (G.hint.life <= 0) { G.hint = null; G.hintIdx = -1; }
  }
  if (!G.hintsOn || !list.length) return;
  const read = (i: number) => (G.hintShown[i] ?? 0) >= READ_TIME;
  list.forEach((h, i) => {
    if (!forMode(h, G.fireMode) || G.hintKnown.includes(h.text) || read(i)) return;
    const now = h.on ? happened(G, h.on) : G.t >= (h.at ?? 0), rising = now && !G.hintPrev[i];
    G.hintPrev[i] = now;
    if (G.hintAt[i] === undefined && (h.on ? rising : now)) G.hintAt[i] = G.t + (h.on ? h.after ?? 0 : 0);
    // un aviso de peligro que no llegó a salir y cuyo peligro ya pasó se descarta, sin gastarse
    if (urgent(h) && !now && G.hintAt[i] !== undefined && G.hintAt[i]! >= 0) G.hintAt[i] = undefined;
  });
  const cur = G.hintIdx, curShown = cur >= 0 ? G.hintShown[cur] ?? 0 : Infinity;
  const curUrgent = cur >= 0 && urgent(list[cur]);
  const canShow = (i: number) => !G.hint
    || (urgent(list[i]) ? !curUrgent || curShown >= URGENT_MIN : curShown >= READ_TIME);
  let next = -1;
  G.hintAt.forEach((t, i) => {
    if (t === undefined || t < 0 || G.t < t || !canShow(i)) return;
    if (next < 0 || urgent(list[i]) > urgent(list[next]) || (urgent(list[i]) === urgent(list[next]) && t < G.hintAt[next]!)) next = i;
  });
  if (next < 0) return;
  // la que estaba en pantalla sin terminar de leerse: una explicación vuelve a la cola, un aviso espera otra ocasión
  if (cur >= 0 && !read(cur)) G.hintAt[cur] = urgent(list[cur]) ? undefined : G.t;
  G.hint = { text: list[next].text, life: 3.2 }; G.hintIdx = next; G.hintAt[next] = -1;
}
