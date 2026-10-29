import { beforeEach, describe, expect, it } from 'vitest';
import { CREDITS_SECONDS, POST_START, TEXT, canSkip, castFor, partAt, skipTo, timeline, wrap } from '../src/core/credits';
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
