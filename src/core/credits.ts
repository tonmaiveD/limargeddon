import data from '../stages/creditos.json';
import { CREDITS, sectionSeconds } from './audio/medley';

/*
 * Créditos de la Línea Amarilla del Terror (ADR 0049): línea de tiempo y textos, sin dibujo, para poder probarlos.
 * La escena (scenes/Credits.ts) sigue las secciones del popurrí (ADR 0048): la entrada es el despegue visto desde la
 * ventanilla, cada distrito es un tramo del desfile con su jefe, el final y el cierre vuelven al avión, y después va el
 * poscrédito del vuelo de regreso.
 */

export interface CastEntry { stage: string; name?: string; as: string; after: string; honk: string; sign?: string }
export interface StaffEntry { role: string; name: string }
// staff: un rol y su nombre por distrito, pintados en el asfalto; dedication: los agradecimientos, en el cierre
export interface CreditsText {
  title: string; thanks: string; staff: StaffEntry[]; dedication?: { role: string; text: string }; cast: CastEntry[];
  post: { later: string; speaker: string; end: string };
}
export const TEXT = data as CreditsText;

export type PartKind = 'despegue' | 'distrito' | 'cierre' | 'post';
export interface Part { kind: PartKind; start: number; end: number; stage?: string; index?: number }

export const POST_S = 12; // duración del poscrédito

// Partes en orden, con su inicio y fin en segundos desde que empiezan los créditos.
export function timeline(): Part[] {
  const out: Part[] = [];
  let t = 0, district = 0;
  for (const s of CREDITS.sections) {
    const d = sectionSeconds(s);
    const kind: PartKind = s.name === 'entrada' ? 'despegue' : s.name.startsWith('final') || s.name === 'cierre' ? 'cierre' : 'distrito';
    const last = out[out.length - 1];
    if (kind === 'cierre' && last?.kind === 'cierre') last.end = t + d; // el final y el cierre son una sola parte
    else out.push({ kind, start: t, end: t + d, ...(kind === 'distrito' ? { stage: s.name, index: district++ } : {}) });
    t += d;
  }
  out.push({ kind: 'post', start: t, end: t + POST_S });
  return out;
}

const PARTS = timeline();
export const POST_START = PARTS[PARTS.length - 1].start;
export const CREDITS_SECONDS = PARTS[PARTS.length - 1].end;
export const partAt = (t: number): Part => PARTS.find((p) => t < p.end) ?? PARTS[PARTS.length - 1];
export const castFor = (stage: string): CastEntry | undefined => TEXT.cast.find((c) => c.stage === stage);

// La primera vez no se saltan; después sí, con un toque. El modo prueba siempre deja saltar.
export const canSkip = (seen: boolean, test: boolean) => seen || test;
// Un toque durante los créditos salta al poscrédito; durante el poscrédito, termina.
export const skipTo = (t: number): number => (t < POST_START ? POST_START : CREDITS_SECONDS);

// Corta un texto en líneas que caben en el ancho dado, según la función que mide.
export function wrap(text: string, width: number, measure: (s: string) => number): string[] {
  const lines: string[] = [];
  let cur = '';
  for (const w of text.split(' ')) {
    const next = cur ? cur + ' ' + w : w;
    if (cur && measure(next) > width) { lines.push(cur); cur = w; } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}
