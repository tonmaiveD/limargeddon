import { beforeEach, describe, expect, it } from 'vitest';
import { CREDITS_SECONDS, POST_START, TEXT, canSkip, castFor, isSkipInput, narrativeStep, partAt, skipTo, timeline, wrap } from '../src/core/credits';
import { CREDITS, medleyClock, medleySeconds, sectionSeconds } from '../src/core/audio/medley';
import { creditsSeen, markCreditsSeen, resetProgress } from '../src/core/save';
import { STAGES, STAGE_ORDER } from '../src/stages';

/* Créditos de la Línea Amarilla del Terror (ADR 0049). */

describe('Créditos', () => {
  beforeEach(() => {
    const mem = new Map<string, string>();
    (globalThis as unknown as { localStorage: Storage }).localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => mem.set(k, v) } as unknown as Storage;
  });

  it('duran entre 60 y 90 segundos, con el poscrédito', () => {
    expect(CREDITS_SECONDS).toBeGreaterThan(60); expect(CREDITS_SECONDS).toBeLessThan(90);
    expect(CREDITS_SECONDS - POST_START).toBe(12);
  });

  it('van del despegue al desfile por los diez distritos, el cierre y el poscrédito', () => {
    const parts = timeline();
    expect(parts.map((p) => p.kind)).toEqual(['despegue', ...STAGE_ORDER.map(() => 'distrito'), 'cierre', 'post']);
    expect(parts.filter((p) => p.kind === 'distrito').map((p) => p.stage)).toEqual(STAGE_ORDER);
    for (let i = 1; i < parts.length; i++) expect(parts[i].start).toBeCloseTo(parts[i - 1].end, 9);
    expect(partAt(0).kind).toBe('despegue'); expect(partAt(CREDITS_SECONDS - 0.01).kind).toBe('post');
  });

  it('cada distrito tiene su ficha, lo que pasó después y lo que contesta al claxon', () => {
    for (const id of STAGE_ORDER) {
      const c = castFor(id)!;
      expect(c, id).toBeDefined();
      expect(c.as).toMatch(/^como (él|ella) mism[oa]$/);
      expect(c.after.length).toBeGreaterThan(10); expect(c.honk.length).toBeGreaterThan(3);
    }
  });

  it('los textos cumplen las reglas de puntuación del juego', () => {
    const all = [TEXT.title, TEXT.thanks, ...Object.values(TEXT.post), ...TEXT.cast.flatMap((c) => [c.name ?? '', c.as, c.after, c.honk, c.sign ?? '']),
      ...TEXT.staff.flatMap((s) => [s.role, s.name]), TEXT.dedication?.role ?? '', TEXT.dedication?.text ?? ''];
    for (const s of all) expect(s, s).not.toMatch(/[:;—–]/);
  });

  it('lo que pasó después cabe en la ficha en tres líneas o menos', () => {
    const measure = (s: string) => s.length * 6.2; // ancho aproximado de la letra de 11 px
    for (const c of TEXT.cast) expect(wrap(c.after, 304, measure).length, c.stage).toBeLessThanOrEqual(3);
  });

  it('la primera vez no se saltan; después un toque salta los créditos y otro el poscrédito', () => {
    expect(canSkip(false, false)).toBe(false);
    expect(canSkip(true, false)).toBe(true);
    expect(canSkip(false, true)).toBe(true); // modo prueba
    expect(skipTo(10)).toBe(POST_START);
    expect(skipTo(POST_START + 1)).toBe(CREDITS_SECONDS);
  });

  // octava auditoría, U01: saltar al volver a verlos se mantiene, pero manejar no salta
  it('saltan con un toque en la pantalla o Enter, nunca con los controles de manejo ni el claxon', () => {
    expect(isSkipInput({ kind: 'pointer', onControls: false })).toBe(true);
    expect(isSkipInput({ kind: 'pointer', onControls: true })).toBe(false); // volante, acelerador, claxon del deck
    expect(isSkipInput({ kind: 'key', key: 'Enter' })).toBe(true);
    for (const key of [' ', 'c', 'ArrowLeft', 'ArrowUp', 'Escape']) expect(isSkipInput({ kind: 'key', key }), key).toBe(false);
  });

  // octava auditoría, U02: la narración no se alarga cuando el teléfono dibuja pocos cuadros
  it.each([10, 15, 20, 30, 60])('a %i cuadros por segundo, sin audio, terminan a tiempo (dentro de un cuadro)', (fps) => {
    let t = 0, wall = 0;
    while (t < CREDITS_SECONDS) { t = narrativeStep(t, 1000 / fps, null); wall += 1 / fps; }
    expect(Math.abs(wall - CREDITS_SECONDS)).toBeLessThanOrEqual(1 / fps + 1e-9);
  });

  it.each([10, 15, 60])('a %i cuadros por segundo, con música, cada parte cae en su sección (tolerancia 150 ms)', (fps) => {
    const parts = timeline();
    let t = 0;
    for (let wall = 0; wall < POST_START; wall += 1 / fps) {
      t = narrativeStep(t, 1000 / fps, wall); // el reloj del audio corre con el tiempo real
      expect(Math.abs(t - wall)).toBeLessThanOrEqual(0.15);
    }
    expect(parts.filter((p) => p.kind !== 'post').at(-1)!.end).toBeCloseTo(medleySeconds(CREDITS), 9);
  });

  it('un salto largo (el juego estuvo detenido) no se come los créditos', () => {
    expect(narrativeStep(10, 5000, null)).toBeCloseTo(10.25, 9);
  });

  it('el reloj de la música sale de la sección y el paso agendados', () => {
    const s0 = sectionSeconds(CREDITS.sections[0]), song = CREDITS.sections[1].song, step = 60 / song.bpm / song.sub;
    // sección 1, paso 4 agendado para dentro de 0,1 s: suenan s0 + 4 pasos - 0,1
    expect(medleyClock(CREDITS, 1, 4, 10.1, 10)).toBeCloseTo(s0 + 4 * step - 0.1, 9);
    expect(medleyClock(CREDITS, 0, 0, 5.05, 5)).toBeCloseTo(-0.05, 9);
  });

  it('quedan vistos al guardar, y empezar de nuevo no lo borra', () => {
    expect(creditsSeen()).toBe(false);
    markCreditsSeen();
    expect(creditsSeen()).toBe(true);
    resetProgress();
    expect(creditsSeen()).toBe(true);
  });

  it('hay un rol por distrito como máximo, y los agradecimientos van aparte', () => {
    expect(TEXT.staff.length).toBeLessThanOrEqual(STAGE_ORDER.length);
    for (const s of TEXT.staff) { expect(s.role.length).toBeGreaterThan(0); expect(s.name.length).toBeGreaterThan(0); }
    expect(TEXT.dedication?.text).toContain('Lima');
    expect(wrap(TEXT.dedication!.text, 290, (s) => s.length * 6.8).length).toBeLessThanOrEqual(3);
  });

  it('solo la Línea Amarilla termina en créditos', () => {
    expect(STAGE_ORDER.filter((id) => STAGES[id].cfg.ending?.credits)).toEqual(['linea-amarilla']);
  });
});
