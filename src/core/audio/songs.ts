/*
 * Música por distrito (ADR 0038): una canción por etapa, sintetizada y con melodías originales. Cada canción es datos:
 * tempo, pasos por pulso, bajo, melodía, acordes opcionales y patrones de percusión. Las notas son MIDI (0 es silencio)
 * y cada voz se repite con su propio largo. En los patrones, "x" es un golpe, "X" un golpe fuerte y "." silencio.
 */

export type Drum = 'kick' | 'snare' | 'hat' | 'guiro' | 'clave' | 'cowbell' | 'cajon' | 'shaker' | 'bombo' | 'quijada';
export interface Voice { wave: OscillatorType; vol: number; dur: number; notes: (number | number[])[]; double?: number }
export interface Song { bpm: number; sub: number; bass: Voice; lead: Voice; chords?: Voice; drums: Partial<Record<Drum, string>> }

const bar = (n: number, ...steps: (number | number[])[]) => Array.from({ length: n }, (_, i) => steps[i] ?? 0);
// arpegio de una tríada en dieciseisavos: sube y baja dos veces
const arp = (c: number[]) => [c[0], c[1], c[2], c[0] + 12, c[2], c[1], c[0], c[1], c[0], c[1], c[2], c[0] + 12, c[1] + 12, c[0] + 12, c[2], c[1]];

export const SONGS: Record<string, Song> = {
  // San Isidro: la cumbia chicha del prototipo, tal cual (Am y G, bajo raíz y quinta, güiro y punteo pentatónico)
  cumbia: {
    bpm: 104, sub: 2,
    bass: { wave: 'triangle', vol: 0.5, dur: 0.22, notes: [45, 0, 52, 0, 45, 0, 52, 57, 43, 0, 50, 0, 43, 0, 50, 55] },
    lead: { wave: 'square', vol: 0.13, dur: 0.18, double: 0.06, notes: [69, 0, 72, 74, 76, 0, 74, 72, 69, 0, 67, 69, 72, 0, 69, 0, 76, 0, 74, 72, 74, 0, 72, 69, 67, 0, 69, 72, 69, 0, 0, 0] },
    drums: { guiro: 'xXxXxXxX', kick: 'x...x...' },
  },
  // Miraflores: lounge playero, bossa suave en Re mayor
  lounge: {
    bpm: 96, sub: 2,
    chords: { wave: 'triangle', vol: 0.05, dur: 0.5, notes: [
      ...bar(8, [62, 66, 69, 73], 0, 0, [62, 66, 69, 73]), ...bar(8, [59, 62, 66, 69], 0, 0, [59, 62, 66, 69]),
      ...bar(8, [64, 67, 71, 74], 0, 0, [64, 67, 71, 74]), ...bar(8, [57, 61, 64, 67], 0, 0, [57, 61, 64, 67])] },
    bass: { wave: 'triangle', vol: 0.4, dur: 0.3, notes: [38, 0, 0, 45, 38, 0, 0, 45, 35, 0, 0, 42, 35, 0, 0, 42, 40, 0, 0, 47, 40, 0, 0, 47, 33, 0, 0, 40, 33, 0, 0, 40] },
    lead: { wave: 'triangle', vol: 0.12, dur: 0.3, notes: [78, 0, 76, 0, 74, 0, 0, 0, 74, 0, 76, 78, 0, 0, 74, 0, 76, 0, 79, 0, 78, 0, 76, 0, 73, 0, 74, 76, 0, 0, 0, 0] },
    drums: { clave: 'x..x..x...x..x..', shaker: 'xxxxxxxx', kick: 'x.......' },
  },
  // Centro: vals criollo en 3/4, Mi menor, con cajón
  vals: {
    bpm: 160, sub: 2,
    bass: { wave: 'triangle', vol: 0.45, dur: 0.25, notes: [40, 0, 0, 0, 0, 0, 40, 0, 0, 0, 0, 0, 35, 0, 0, 0, 0, 0, 35, 0, 0, 0, 0, 0, 45, 0, 0, 0, 0, 0, 40, 0, 0, 0, 0, 0, 35, 0, 0, 0, 0, 0, 40, 0, 0, 0, 0, 0] },
    chords: { wave: 'square', vol: 0.045, dur: 0.12, notes: [
      ...bar(6, 0, 0, [64, 67, 71], 0, [64, 67, 71]), ...bar(6, 0, 0, [64, 67, 71], 0, [64, 67, 71]),
      ...bar(6, 0, 0, [63, 66, 69], 0, [63, 66, 69]), ...bar(6, 0, 0, [63, 66, 69], 0, [63, 66, 69]),
      ...bar(6, 0, 0, [60, 64, 69], 0, [60, 64, 69]), ...bar(6, 0, 0, [64, 67, 71], 0, [64, 67, 71]),
      ...bar(6, 0, 0, [63, 66, 69], 0, [63, 66, 69]), ...bar(6, 0, 0, [64, 67, 71], 0, [64, 67, 71])] },
    lead: { wave: 'square', vol: 0.1, dur: 0.25, double: 0.04, notes: [
      71, 0, 72, 71, 69, 0, 67, 0, 0, 0, 71, 0, 69, 0, 71, 69, 66, 0, 63, 0, 0, 0, 66, 0,
      72, 0, 74, 72, 71, 0, 67, 0, 71, 0, 76, 0, 75, 0, 74, 72, 71, 0, 76, 0, 0, 0, 0, 0] },
    drums: { cajon: 'X...x.' },
  },
  // Javier Prado: tecnocumbia en Re menor, con sintetizador y campana
  tecnocumbia: {
    bpm: 112, sub: 2,
    bass: { wave: 'triangle', vol: 0.5, dur: 0.2, notes: [38, 0, 45, 0, 38, 0, 45, 38, 36, 0, 43, 0, 36, 0, 43, 36, 34, 0, 41, 0, 34, 0, 41, 34, 33, 0, 40, 0, 33, 0, 40, 33] },
    lead: { wave: 'sawtooth', vol: 0.08, dur: 0.16, double: 0.04, notes: [74, 0, 77, 0, 76, 74, 72, 0, 72, 0, 76, 0, 74, 72, 70, 0, 70, 0, 74, 0, 72, 70, 69, 0, 69, 0, 73, 0, 76, 0, 0, 0] },
    drums: { kick: 'x...x...', guiro: 'xXxXxXxX', cowbell: '..x...x.' },
  },
  // Gamarra: huayno cumbia, ritmo largo corto corto en La menor pentatónica
  huayno: {
    bpm: 116, sub: 4,
    bass: { wave: 'triangle', vol: 0.45, dur: 0.18, notes: [45, 0, 0, 52, 45, 0, 0, 0, 45, 0, 0, 52, 45, 0, 0, 0, 43, 0, 0, 50, 43, 0, 0, 0, 43, 0, 0, 50, 43, 0, 0, 0] },
    lead: { wave: 'square', vol: 0.11, dur: 0.14, double: 0.05, notes: [76, 0, 0, 79, 76, 0, 0, 74, 72, 0, 0, 74, 76, 0, 0, 0, 74, 0, 0, 72, 69, 0, 0, 72, 67, 0, 0, 69, 69, 0, 0, 0] },
    drums: { kick: 'x.......x.......', snare: '....x..x....x..x', guiro: 'x.x.x.x.x.x.x.x.' },
  },
  // Callao: salsa chalaca en Do menor, clave 2-3, tumbao y montuno
  salsa: {
    bpm: 180, sub: 2,
    bass: { wave: 'triangle', vol: 0.5, dur: 0.22, notes: [0, 0, 0, 43, 0, 0, 36, 0, 0, 0, 0, 48, 0, 0, 41, 0, 0, 0, 0, 38, 0, 0, 43, 0, 0, 0, 0, 43, 0, 0, 48, 0] },
    chords: { wave: 'square', vol: 0.045, dur: 0.1, notes: [
      ...bar(8, [60, 63, 67], 0, [60, 63, 67], [60, 63, 67], 0, [60, 63, 67], 0, [60, 63, 67]),
      ...bar(8, [60, 65, 68], 0, [60, 65, 68], [60, 65, 68], 0, [60, 65, 68], 0, [60, 65, 68]),
      ...bar(8, [59, 62, 65, 67], 0, [59, 62, 65, 67], [59, 62, 65, 67], 0, [59, 62, 65, 67], 0, [59, 62, 65, 67]),
      ...bar(8, [60, 63, 67], 0, [60, 63, 67], [60, 63, 67], 0, [60, 63, 67], 0, [60, 63, 67])] },
    lead: { wave: 'sawtooth', vol: 0.07, dur: 0.2, notes: [72, 0, 72, 75, 0, 72, 0, 0, 77, 0, 75, 72, 0, 0, 0, 0, 74, 0, 74, 77, 0, 74, 0, 71, 72, 0, 0, 0, 0, 0, 0, 0] },
    drums: { clave: '..x.x...x..x..x.', cowbell: 'x.x.x.x.', kick: 'x.......' },
  },
  // Vía Expresa: electrónica rápida en Mi menor, bombo en negras y arpegio en dieciseisavos
  electro: {
    bpm: 136, sub: 4,
    bass: { wave: 'sawtooth', vol: 0.16, dur: 0.1, notes: [
      ...bar(16, 0, 0, 40, 0, 0, 0, 40, 0, 0, 0, 40, 0, 0, 0, 40), ...bar(16, 0, 0, 36, 0, 0, 0, 36, 0, 0, 0, 36, 0, 0, 0, 36),
      ...bar(16, 0, 0, 38, 0, 0, 0, 38, 0, 0, 0, 38, 0, 0, 0, 38), ...bar(16, 0, 0, 35, 0, 0, 0, 35, 0, 0, 0, 35, 0, 0, 0, 35)] },
    lead: { wave: 'square', vol: 0.06, dur: 0.08, notes: [...arp([64, 67, 71]), ...arp([60, 64, 67]), ...arp([62, 66, 69]), ...arp([59, 63, 66])] },
    drums: { kick: 'x...x...x...x...', hat: '..x...x...x...x.', snare: '....x.......x...' },
  },
  // Panamericana: andina en La menor, quena, charango y bombo
  andina: {
    bpm: 100, sub: 2,
    chords: { wave: 'square', vol: 0.04, dur: 0.08, notes: [
      ...bar(8, [57, 60, 64, 69], [57, 60, 64, 69], 0, [57, 60, 64, 69], [57, 60, 64, 69], 0, [57, 60, 64, 69]),
      ...bar(8, [60, 64, 67, 72], [60, 64, 67, 72], 0, [60, 64, 67, 72], [60, 64, 67, 72], 0, [60, 64, 67, 72]),
      ...bar(8, [55, 59, 62, 67], [55, 59, 62, 67], 0, [55, 59, 62, 67], [55, 59, 62, 67], 0, [55, 59, 62, 67]),
      ...bar(8, [57, 60, 64, 69], [57, 60, 64, 69], 0, [57, 60, 64, 69], [57, 60, 64, 69], 0, [57, 60, 64, 69])] },
    bass: { wave: 'triangle', vol: 0.35, dur: 0.3, notes: [45, 0, 0, 0, 52, 0, 0, 0, 48, 0, 0, 0, 55, 0, 0, 0, 43, 0, 0, 0, 50, 0, 0, 0, 45, 0, 0, 0, 52, 0, 0, 0] },
    lead: { wave: 'sine', vol: 0.16, dur: 0.4, notes: [76, 0, 0, 0, 79, 0, 76, 0, 74, 0, 72, 0, 74, 0, 0, 0, 71, 0, 74, 0, 72, 0, 71, 0, 69, 0, 0, 0, 0, 0, 0, 0] },
    drums: { bombo: 'x..x....', shaker: 'x.x.x.x.' },
  },
  // Costa Verde: festejo de noche en 12/8, Re menor, cajón y quijada
  festejo: {
    bpm: 92, sub: 3,
    bass: { wave: 'triangle', vol: 0.4, dur: 0.25, notes: [38, 0, 0, 45, 0, 0, 38, 0, 0, 45, 0, 41, 33, 0, 0, 40, 0, 0, 33, 0, 0, 40, 0, 37] },
    lead: { wave: 'triangle', vol: 0.11, dur: 0.22, notes: [74, 0, 77, 0, 76, 0, 74, 0, 0, 72, 0, 74, 73, 0, 0, 76, 0, 0, 74, 0, 0, 0, 0, 0] },
    drums: { cajon: 'X..x.xX..x.x', quijada: '......X.....' },
  },
  // Línea Amarilla: sintetizador tenso, bajo que late en dieciseisavos y una melodía que no resuelve
  tension: {
    bpm: 128, sub: 4,
    bass: { wave: 'sawtooth', vol: 0.12, dur: 0.08, notes: [...bar(16, ...Array(16).fill(40)), ...bar(16, ...Array(16).fill(41)), ...bar(16, ...Array(16).fill(40)), ...bar(16, ...Array(16).fill(43))] },
    lead: { wave: 'square', vol: 0.07, dur: 0.3, notes: bar(64, 76, 0, 0, 0, 0, 0, 77, 0, 0, 0, 0, 0, 0, 0, 71, 0, ...Array(16).fill(0), 76, 0, 0, 0, 0, 0, 82, 0, 0, 0, 0, 0, 0, 0, 0, 0, 70) },
    drums: { kick: 'x...x...x...x...', hat: 'xxxxxxxxxxxxxxxx', clave: '........x.......' },
  },
};

export const DEFAULT_SONG = 'cumbia';
