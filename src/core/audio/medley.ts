import type { Drum, Song, Voice } from './songs';

/*
 * Popurrí de los créditos (ADR 0048): un solo gancho original que cada distrito toca con su género, de Miraflores a la
 * Línea Amarilla, y un final que sube un tono. Lo que lo hace pegajoso viene de dos estudios:
 * - Jakubowski y otros (2017): las melodías que se quedan pegadas son rápidas, tienen un contorno común (sube y baja)
 *   y algún intervalo poco común, como un salto o notas repetidas.
 * - Witek y otros (2014): las ganas de moverse y el placer son mayores con síncopa media, ni poca ni mucha.
 * Así que el gancho dura dos compases, sube hasta el Do agudo con notas repetidas y cae de golpe una sexta, entra a
 * contratiempo y vuelve en cada sección (repetición con variación). Todo va sobre un mismo pulso para que los cambios
 * de distrito sean limpios.
 * Cada sección es una canción normal (songs.ts) con su largo en compases; el secuenciador las encadena (sfx.ts).
 */

export interface Section { name: string; song: Song; bars: number; transpose?: number }
export interface Medley { sections: Section[] }

export const MEDLEY_BPM = 124;

// Un evento es [nota MIDI, duración en pulsos]; la nota 0 es silencio.
type Ev = [number, number];
// Cómo cae la segunda mitad de un pulso: recta (a la mitad), con swing de tresillo (2 de 3) o con puntillo (3 de 4,
// el largo corto del huayno).
type Feel = 'recto' | 'swing' | 'puntillo';

// El gancho: dos compases en arco, con notas repetidas, contratiempo y un salto de sexta hacia abajo.
const HOOK: Ev[] = [
  [76, 0.5], [76, 1], [79, 0.5], [81, 1], [81, 0.5], [84, 0.5],
  [76, 1], [79, 0.5], [76, 0.5], [74, 0.5], [72, 0.5], [69, 1],
];
// La respuesta del tercer compás, que deja abierto el regreso al gancho.
const TAG: Ev[] = [[79, 1], [77, 0.5], [76, 0.5], [74, 1], [71, 1]];

const CHORDS: Record<string, { root: number; notes: number[] }> = {
  Am: { root: 45, notes: [57, 60, 64] }, F: { root: 41, notes: [57, 60, 65] }, G: { root: 43, notes: [55, 59, 62] },
  E: { root: 40, notes: [56, 59, 64] },
  Am7: { root: 45, notes: [55, 60, 64, 67] }, F7M: { root: 41, notes: [53, 57, 60, 64] }, G6: { root: 43, notes: [55, 59, 62, 64] },
};

function place(beat: number, sub: number, feel: Feel): number {
  const whole = Math.floor(beat + 1e-9), frac = beat - whole;
  if (frac < 1e-9) return whole * sub;
  if (Math.abs(frac - 0.5) < 1e-9) return whole * sub + (feel === 'swing' ? 2 : feel === 'puntillo' ? 3 : sub / 2);
  return whole * sub + Math.round(frac * sub);
}

// Pasa eventos a pasos del secuenciador.
export function render(evs: Ev[], steps: number, sub: number, feel: Feel = 'recto'): number[] {
  const out: number[] = Array(steps).fill(0);
  let beat = 0;
  for (const [n, d] of evs) {
    const i = place(beat, sub, feel);
    if (n && i < steps) out[i] = n;
    beat += d;
  }
  return out;
}

// Bajo por compás desde un patrón: r raíz, f quinta, o octava, punto silencio.
function bassLine(harmony: string[], pat: string): number[] {
  return harmony.flatMap((h) => {
    const r = CHORDS[h].root;
    return [...pat].map((c) => (c === 'r' ? r : c === 'f' ? r + 7 : c === 'o' ? r + 12 : 0));
  });
}
// Acompañamiento por compás: c es el acorde, punto silencio.
function comp(harmony: string[], pat: string): (number | number[])[] {
  return harmony.flatMap((h) => [...pat].map((c) => (c === 'c' ? CHORDS[h].notes : 0)));
}
// Arpegio del acorde en dieciseisavos, sube y baja.
function arp(harmony: string[]): number[] {
  return harmony.flatMap((h) => { const [a, b, c] = CHORDS[h].notes.map((n) => n + 12); return [a, b, c, a + 12, c, b, a, b, a, b, c, a + 12, b + 12, a + 12, c, b]; });
}

interface Spec {
  name: string; sub: number; beats?: number; feel?: Feel; harmony: string[]; lead: Ev[];
  leadV: Omit<Voice, 'notes'>; bassV: Omit<Voice, 'notes'>; bass: string; chordsV?: Omit<Voice, 'notes'>; chords?: string | 'arp';
  drums: Partial<Record<Drum, string>>; transpose?: number;
}
function section(s: Spec): Section {
  const beats = s.beats ?? 4, steps = s.harmony.length * beats * s.sub;
  const lead = render(s.lead, steps, s.sub, s.feel);
  const chords = s.chordsV && s.chords ? { ...s.chordsV, notes: s.chords === 'arp' ? arp(s.harmony) : comp(s.harmony, s.chords) } : undefined;
  return {
    name: s.name, bars: s.harmony.length, transpose: s.transpose,
    song: { bpm: MEDLEY_BPM, sub: s.sub, beats, lead: { ...s.leadV, notes: lead }, bass: { ...s.bassV, notes: bassLine(s.harmony, s.bass) }, chords, drums: s.drums },
  };
}

const DISTRICT = ['Am', 'F', 'G'];
const SQUARE = { wave: 'square' as const, vol: 0.12, dur: 0.18, double: 0.05 };
const TRI_BASS = { wave: 'triangle' as const, vol: 0.45, dur: 0.22 };

export const CREDITS: Medley = {
  sections: [
    // entrada: el pulso arma la base y la melodía asoma su primer motivo, para que el gancho se espere
    section({
      name: 'entrada', sub: 4, harmony: ['Am', 'G'], lead: [[76, 0.5], [76, 1], [79, 0.5], [81, 2], [0, 4]],
      leadV: SQUARE, bassV: { wave: 'sawtooth', vol: 0.12, dur: 0.1 }, bass: 'r.......r.......',
      drums: { hat: '..x...x...x...x...x...x...x...x.', kick: '................x...x...x...x...' },
    }),
    section({
      name: 'miraflores', sub: 2, harmony: ['Am7', 'F7M', 'G6'], lead: [...HOOK, ...TAG],
      leadV: { wave: 'triangle', vol: 0.13, dur: 0.3 }, bassV: { wave: 'triangle', vol: 0.4, dur: 0.3 }, bass: 'r..fr..f',
      chordsV: { wave: 'triangle', vol: 0.05, dur: 0.4 }, chords: 'c..c..c.',
      drums: { clave: 'x..x..x...x..x..x..x..x.', shaker: 'xxxxxxxx', kick: 'x...x...' },
    }),
    section({
      name: 'san-isidro', sub: 2, harmony: DISTRICT, lead: [...HOOK, ...TAG],
      leadV: { wave: 'square', vol: 0.13, dur: 0.18, double: 0.06 }, bassV: { wave: 'triangle', vol: 0.5, dur: 0.22 }, bass: 'r.f.r.fo',
      drums: { guiro: 'xXxXxXxX', kick: 'x...x...' },
    }),
    // vals: el mismo gancho en tres por cuatro, cuatro compases para durar lo mismo que los demás
    section({
      name: 'centro', sub: 2, beats: 3, harmony: ['Am', 'F', 'Am', 'G'],
      lead: [[76, 1], [76, 0.5], [79, 0.5], [81, 1], [81, 0.5], [84, 1.5], [76, 1], [79, 0.5], [76, 0.5], [74, 0.5], [72, 0.5], [69, 1], [79, 1], [74, 1], [71, 1]],
      leadV: { wave: 'square', vol: 0.1, dur: 0.25, double: 0.04 }, bassV: TRI_BASS, bass: 'r...f.',
      chordsV: { wave: 'square', vol: 0.045, dur: 0.12 }, chords: '..c.c.', drums: { cajon: 'X...x.' },
    }),
    section({
      name: 'javier-prado', sub: 2, harmony: DISTRICT, lead: [...HOOK, ...TAG],
      leadV: { wave: 'sawtooth', vol: 0.08, dur: 0.16, double: 0.04 }, bassV: { wave: 'triangle', vol: 0.5, dur: 0.2 }, bass: 'r.f.r.fr',
      drums: { kick: 'x...x...', guiro: 'xXxXxXxX', cowbell: '..x...x.' },
    }),
    section({
      name: 'gamarra', sub: 4, feel: 'puntillo', harmony: DISTRICT, lead: [...HOOK, ...TAG],
      leadV: { wave: 'square', vol: 0.11, dur: 0.14, double: 0.05 }, bassV: TRI_BASS, bass: 'r..fr...r..fr...',
      drums: { kick: 'x.......x.......', snare: '....x..x....x..x', guiro: 'x.x.x.x.x.x.x.x.' },
    }),
    // salsa: el tumbao se anticipa a cada acorde, con montuno y clave dos tres
    section({
      name: 'callao', sub: 2, harmony: DISTRICT, lead: [...HOOK, ...TAG],
      leadV: { wave: 'sawtooth', vol: 0.08, dur: 0.2 }, bassV: { wave: 'triangle', vol: 0.5, dur: 0.22 }, bass: '...f..r.',
      chordsV: { wave: 'square', vol: 0.045, dur: 0.1 }, chords: 'c.cc.c.c',
      drums: { clave: '..x.x...x..x..x...x.x...', cowbell: 'x.x.x.x.', kick: 'x.......' },
    }),
    section({
      name: 'via-expresa', sub: 4, harmony: DISTRICT, lead: [...HOOK, ...TAG],
      leadV: { wave: 'square', vol: 0.09, dur: 0.1 }, bassV: { wave: 'sawtooth', vol: 0.15, dur: 0.1 }, bass: '..r...r...r...r.',
      chordsV: { wave: 'square', vol: 0.035, dur: 0.07 }, chords: 'arp',
      drums: { kick: 'x...x...x...x...', hat: '..x...x...x...x.', snare: '....x.......x...' },
    }),
    section({
      name: 'panamericana', sub: 2, harmony: DISTRICT, lead: [...HOOK, ...TAG],
      leadV: { wave: 'sine', vol: 0.17, dur: 0.38 }, bassV: { wave: 'triangle', vol: 0.35, dur: 0.3 }, bass: 'r...f...',
      chordsV: { wave: 'square', vol: 0.04, dur: 0.08 }, chords: 'cc.cc.c.',
      drums: { bombo: 'x..x....', shaker: 'x.x.x.x.' },
    }),
    // festejo: los contratiempos caen en el tercer tresillo (seis por ocho sobre el mismo pulso)
    section({
      name: 'costa-verde', sub: 3, feel: 'swing', harmony: DISTRICT, lead: [...HOOK, ...TAG],
      leadV: { wave: 'triangle', vol: 0.12, dur: 0.22 }, bassV: { wave: 'triangle', vol: 0.4, dur: 0.25 }, bass: 'r..f..r..f.o',
      drums: { cajon: 'X..x.xX..x.x', quijada: '......X.....' },
    }),
    // Línea Amarilla: el gancho sobre el pulso tenso, y un acorde de Mi que pide volver a La en el final
    section({
      name: 'linea-amarilla', sub: 4, harmony: ['Am', 'F', 'E'], lead: [...HOOK, [80, 1], [76, 0.5], [74, 0.5], [71, 1], [68, 1]],
      leadV: { wave: 'sawtooth', vol: 0.07, dur: 0.14, double: 0.03 }, bassV: { wave: 'sawtooth', vol: 0.12, dur: 0.08 }, bass: 'rrrrrrrrrrrrrrrr',
      drums: { kick: 'x...x...x...x...', hat: 'xxxxxxxxxxxxxxxx', clave: '........x.......' },
    }),
    // final: todos juntos, chicha con bombo electrónico; la segunda vuelta sube un tono
    ...[0, 2].map((transpose) => section({
      name: transpose ? 'final-arriba' : 'final', sub: 4, harmony: ['Am', 'F'], lead: HOOK, transpose,
      leadV: { wave: 'square', vol: 0.13, dur: 0.18, double: 0.06 }, bassV: TRI_BASS, bass: 'r...f...r.o.f...',
      chordsV: { wave: 'triangle', vol: 0.05, dur: 0.2 }, chords: 'c.......c...c...',
      drums: { kick: 'x...x...x...x...', snare: '....x.......x...', hat: '..x...x...x...x.', guiro: 'xXxXxXxXxXxXxXxX' },
    })),
    section({
      name: 'cierre', sub: 4, harmony: ['Am'], lead: [[81, 4]], transpose: 2,
      leadV: { wave: 'square', vol: 0.12, dur: 1.6, double: 0.06 }, bassV: { wave: 'triangle', vol: 0.5, dur: 1.4 }, bass: 'r...............',
      chordsV: { wave: 'triangle', vol: 0.07, dur: 1.6 }, chords: 'c...............',
      drums: { kick: 'X...............', snare: 'X...............' },
    }),
  ],
};

export const MEDLEYS: Record<string, Medley> = { creditos: CREDITS };

// Pasos de una sección y duración del popurrí en segundos.
export const sectionSteps = (s: Section) => s.bars * (s.song.beats ?? 4) * s.song.sub;
export const sectionSeconds = (s: Section) => (s.bars * (s.song.beats ?? 4) * 60) / s.song.bpm;
export const medleySeconds = (m: Medley) => m.sections.reduce((t, s) => t + sectionSeconds(s), 0);
