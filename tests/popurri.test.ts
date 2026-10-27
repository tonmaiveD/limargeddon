import { describe, expect, it } from 'vitest';
import { CREDITS, MEDLEY_BPM, medleySeconds, render, sectionSteps } from '../src/core/audio/medley';
import { STAGE_ORDER } from '../src/stages';

/* Popurrí de los créditos (ADR 0048): un gancho que cada distrito toca con su género. */

const notes = (a: (number | number[])[]) => a.filter((n) => n !== 0) as number[];
const HOOK_PITCHES = [76, 76, 79, 81, 81, 84, 76, 79, 76, 74, 72, 69];

describe('Popurrí de los créditos', () => {
  it('dura entre 60 y 90 segundos', () => {
    const s = medleySeconds(CREDITS);
    expect(s).toBeGreaterThan(60); expect(s).toBeLessThan(90);
  });

  it('recorre los diez distritos en el orden del juego, entre la entrada y el final', () => {
    const names = CREDITS.sections.map((s) => s.name);
    expect(names.slice(1, 11)).toEqual(STAGE_ORDER);
    expect(names[0]).toBe('entrada');
    expect(names.slice(11)).toEqual(['final', 'final-arriba', 'cierre']);
  });

  it('todas las secciones van al mismo pulso y sus voces llenan la sección justa', () => {
    for (const s of CREDITS.sections) {
      expect(s.song.bpm).toBe(MEDLEY_BPM);
      const n = sectionSteps(s);
      expect(s.song.lead.notes.length).toBe(n);
      expect(s.song.bass.notes.length).toBe(n);
      if (s.song.chords) expect(s.song.chords.notes.length).toBe(n);
      for (const p of Object.values(s.song.drums)) expect(n % p!.length).toBe(0);
    }
  });

  it('cada distrito y el final tocan el gancho completo, reconocible con cualquier ritmo', () => {
    for (const s of CREDITS.sections.slice(1, 13)) expect(notes(s.song.lead.notes).slice(0, 12)).toEqual(HOOK_PITCHES);
  });

  it('las secciones de los distritos duran lo mismo, también el vals en tres por cuatro', () => {
    const secs = CREDITS.sections.slice(1, 11).map((s) => s.bars * (s.song.beats ?? 4));
    expect(new Set(secs)).toEqual(new Set([12]));
  });

  it('el final sube un tono y el cierre queda arriba', () => {
    const t = Object.fromEntries(CREDITS.sections.map((s) => [s.name, s.transpose ?? 0]));
    expect(t.final).toBe(0); expect(t['final-arriba']).toBe(2); expect(t.cierre).toBe(2);
  });

  // lo que buscan los estudios citados en medley.ts
  it('el gancho tiene contorno en arco, notas repetidas y un salto poco común', () => {
    const peak = HOOK_PITCHES.indexOf(Math.max(...HOOK_PITCHES));
    expect(peak).toBeGreaterThan(0); expect(peak).toBeLessThan(HOOK_PITCHES.length - 1);
    expect(HOOK_PITCHES.at(-1)!).toBeLessThan(HOOK_PITCHES[0]); // termina más abajo de donde empezó
    expect(HOOK_PITCHES.some((n, i) => i > 0 && n === HOOK_PITCHES[i - 1])).toBe(true);
    expect(Math.max(...HOOK_PITCHES.slice(1).map((n, i) => Math.abs(n - HOOK_PITCHES[i])))).toBeGreaterThanOrEqual(8);
  });

  it('el gancho entra a contratiempo (síncopa) y cada género ubica el contratiempo a su manera', () => {
    const ev: [number, number][] = [[60, 0.5], [62, 0.5]];
    expect(render(ev, 8, 2)).toEqual([60, 62, 0, 0, 0, 0, 0, 0]);
    expect(render(ev, 12, 3, 'swing')).toEqual([60, 0, 62, ...Array(9).fill(0)]);
    expect(render(ev, 16, 4, 'puntillo')).toEqual([60, 0, 0, 62, ...Array(12).fill(0)]);
    const sanIsidro = CREDITS.sections[2].song.lead.notes;
    expect(sanIsidro[1]).toBe(76); expect(sanIsidro[2]).toBe(0); // la segunda nota cae en el contratiempo y se sostiene
  });
});
