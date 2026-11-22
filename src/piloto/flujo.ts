import type { PilotEvent, PilotSurveyEvent, PilotVariant } from '../core/telemetry';
import type { FrameSummary } from '../core/frames';
import type { Game } from '../core/state';
import { summarize } from '../core/world';

/*
 * Reglas de la prueba de arte (ADR 0067), sin pantalla ni Phaser para poder probarlas. Cada persona juega la Costa Verde
 * dos veces, una con el arte actual y otra con el nuevo. El orden se alterna entre una prueba y la siguiente en el mismo
 * aparato, así la mitad empieza por cada uno. En la encuesta las versiones se llaman A (la primera) y B, para no
 * sugerir cuál es la nueva, y la respuesta se guarda ya traducida a "actual" o "nuevo".
 */

export const ORDER_KEY = 'limargeddon.piloto'; // aparte del guardado del juego: la demo no lo toca

export const firstFor = (count: number): PilotVariant => (count % 2 === 0 ? 'actual' : 'nuevo');
export const other = (v: PilotVariant): PilotVariant => (v === 'actual' ? 'nuevo' : 'actual');
export const variantFor = (round: number, first: PilotVariant): PilotVariant => (round % 2 === 1 ? first : other(first));
export const letterFor = (round: number): 'A' | 'B' => (round % 2 === 1 ? 'A' : 'B');

// Enlace directo a una sola versión, fuera de la prueba: ?arte=nuevo (o ?arte=actual). Se juega las veces que se quiera,
// sin encuesta, sin enviar datos y sin mover el orden alternado. Cualquier otro valor deja la prueba completa.
export function freeVariant(search: string): PilotVariant | null {
  const v = new URLSearchParams(search).get('arte');
  return v === 'nuevo' || v === 'actual' ? v : null;
}

// Cuántas pruebas empezó este aparato; sin almacenamiento cuenta como la primera.
export function nextCount(store: Pick<Storage, 'getItem' | 'setItem'> | null): number {
  let n = 0;
  try { n = Number(JSON.parse(store?.getItem(ORDER_KEY) ?? '{}').n) || 0; } catch { n = 0; }
  try { store?.setItem(ORDER_KEY, JSON.stringify({ n: n + 1 })); } catch { /* sin espacio o bloqueado */ }
  return n;
}

export type Pick3 = 'A' | 'B' | 'igual';
export const fromLetter = (x: Pick3, first: PilotVariant): PilotVariant | 'igual' => (x === 'igual' ? 'igual' : x === 'A' ? first : other(first));

export type RoundStats = Omit<PilotEvent, 'id' | 'v' | 'build' | 'day' | 'device' | 'tester' | 'kind' | 'stage'>;
// Lo que sale de una partida: resultado, tiempo, cuánto le quedó al jefe y al Tico, papeletas, de qué recibió daño y la fluidez.
export function roundStats(G: Game, o: { session: string; round: number; first: PilotVariant; end: 'fin' | 'abandono'; frames?: FrameSummary }): RoundStats {
  const s = summarize(G);
  let frames: RoundStats['frames'];
  if (o.frames) { const { device: _d, ...rest } = o.frames; frames = rest; }
  return {
    session: o.session, round: o.round, variant: variantFor(o.round, o.first), first: o.first, end: o.end,
    win: o.end === 'fin' && s.win, t: Math.floor(G.t * 10) / 10, bossPct: Math.max(0, Math.min(100, s.bossPct)), hpPct: Math.round(100 * Math.max(0, G.p.hp) / G.p.max),
    fines: s.fines || undefined, lastHit: G.lastHit || undefined, dmgBy: Object.keys(G.stats.dmgBy).length ? { ...G.stats.dmgBy } : undefined, frames,
  };
}

export type SurveyAnswers = { prefer: Pick3; readable: Pick3; lima: 'si' | 'no'; recognized: 'si' | 'no' | 'nose' };
export type SurveyStats = Omit<PilotSurveyEvent, 'id' | 'v' | 'build' | 'day' | 'device' | 'tester' | 'kind' | 'stage'>;
export const surveyStats = (session: string, first: PilotVariant, a: SurveyAnswers): SurveyStats => ({
  session, first, prefer: fromLetter(a.prefer, first), readable: fromLetter(a.readable, first), lima: a.lima, recognized: a.recognized,
});
