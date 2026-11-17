import { beforeEach, describe, expect, it } from 'vitest';
import { CREDITS_SECONDS, POST_START, TEXT, canSkip, castFor, isSkipInput, isTap, RETURN_GUARD_MS, advance, newClock, partAt, resumed, skipTo, timeline, wrap, type Clock } from '../src/core/credits';
import { CREDITS, medleyClock, medleyPosition, medleySeconds, sectionSeconds, sectionSteps } from '../src/core/audio/medley';
import { creditsOpened, creditsSeen, markCreditsOpened, markCreditsSeen, resetProgress } from '../src/core/save';
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

  // ADR 0053: los gestos del sistema no saltan los créditos
  it('salta solo con un toque completo en el mismo lugar, no con gestos ni toques al volver', () => {
    const down = { x: 100, y: 300, at: 1000 };
    expect(isTap(down, { x: 103, y: 302, at: 1150 }, 0)).toBe(true); // toque normal
    expect(isTap(null, { x: 100, y: 300, at: 1150 }, 0)).toBe(false); // solo llegó el final (el sistema tomó el inicio)
    expect(isTap(down, { x: 100, y: 600, at: 1200 }, 0)).toBe(false); // deslizamiento
    expect(isTap(down, { x: 100, y: 300, at: 1800 }, 0)).toBe(false); // dedo apoyado mucho tiempo
    expect(isTap(down, { x: 100, y: 300, at: 1100 }, 1000 + RETURN_GUARD_MS / 2)).toBe(false); // justo al volver
    expect(isTap({ ...down, at: 2000 }, { x: 100, y: 300, at: 2100 }, 1000 + RETURN_GUARD_MS)).toBe(true); // pasado el margen
  });

  // octava auditoría, U02: la narración no se alarga cuando el teléfono dibuja pocos cuadros
  it.each([10, 15, 20, 30, 60])('a %i cuadros por segundo, sin audio, terminan a tiempo (dentro de un cuadro)', (fps) => {
    let wall = 0;
    let c = newClock();
    while (c.t < CREDITS_SECONDS) { c = advance(c, 1000 / fps, null); wall += 1 / fps; }
    expect(Math.abs(wall - CREDITS_SECONDS)).toBeLessThanOrEqual(1 / fps + 1e-9);
  });

  it.each([10, 15, 60])('a %i cuadros por segundo, con música, cada parte cae en su sección (tolerancia 150 ms)', (fps) => {
    const parts = timeline();
    let t = 0, clock = newClock();
    for (let wall = 0; wall < POST_START; wall += 1 / fps) {
      clock = advance(clock, 1000 / fps, wall); t = clock.t; // el reloj del audio corre con el tiempo real
      expect(Math.abs(t - wall)).toBeLessThanOrEqual(0.15);
    }
    expect(parts.filter((p) => p.kind !== 'post').at(-1)!.end).toBeCloseTo(medleySeconds(CREDITS), 9);
  });

  // ADR 0052: en iPad la imagen quedaba esperando a un audio que no avanzaba
  it('si el reloj del audio se traba, la imagen sigue con el tiempo real y nunca se congela', () => {
    let c = newClock();
    for (let i = 0; i < 60; i++) c = advance(c, 1000 / 60, i / 60); // un segundo con la música andando
    const t1 = c.t;
    for (let i = 0; i < 120; i++) c = advance(c, 1000 / 60, 1); // el audio se queda en 1 s durante 2 s
    expect(c.t).toBeCloseTo(t1 + 2, 6);
  });

  /*
   * Auditoría del 16 de noviembre, C01: tras un corte del audio con la página visible, la imagen esperaba a que la
   * música la alcanzara, tanto como duró el corte. Simula la escena a 60 cuadros por segundo: el audio corre con el
   * tiempo real, se corta y vuelve desde donde quedó, y cuando el reloj pide reubicar la música (resync) salta a la
   * imagen, como hace Sfx.seek.
   */
  function run(cuts: [number, number][], kind: 'nulo' | 'quieto') {
    const fps = 60, frame = 1 / fps, ends = new Map<number, number>();
    let c: Clock = newClock(), audio = 0, wall = 0, still = 0, maxStill = 0;
    while (c.t < CREDITS_SECONDS && wall < 300) {
      // el corte empieza cuando la imagen llega al instante pedido y dura d segundos de tiempo real
      for (const [at, d] of cuts) if (!ends.has(at) && c.t >= at) ends.set(at, wall + d);
      const cut = [...ends.values()].some((end) => wall < end);
      if (!cut) audio += frame;
      const prev = c.t;
      c = advance(c, 1000 / fps, cut && kind === 'nulo' ? null : audio);
      if (c.resync) audio = c.t;
      wall += frame;
      if (c.t <= prev) { still += frame; maxStill = Math.max(maxStill, still); } else still = 0;
      expect(c.t).toBeGreaterThanOrEqual(prev);
    }
    return { maxStill, total: wall };
  }

  it.each(['nulo', 'quieto'] as const)('con cortes de audio de 5, 20 y 60 s (reloj %s), la imagen no espera a la música', (kind) => {
    const { maxStill, total } = run([[10, 5], [35, 20], [65, 60]], kind);
    expect(maxStill).toBeLessThanOrEqual(0.25);
    expect(total).toBeLessThanOrEqual(84.5);
  });

  // novena auditoría, V04: al volver de una pausa la imagen saltaba entre 0,2 y 0,3 s
  it.each([10, 35, 65])('al volver de una pausa de 30 s en el segundo %i, la imagen sigue desde el mismo instante', (at) => {
    let c = newClock();
    while (c.t < at) c = advance(c, 1000 / 60, c.t);
    const paused = c.t;
    c = resumed(c); // la escena retoma: el primer cuadro mide toda la pausa
    c = advance(c, 30000, paused); // y la música se reubicó en el mismo instante
    expect(Math.abs(c.t - paused)).toBeLessThanOrEqual(0.15);
    const next = advance(c, 1000 / 60, paused + 1 / 60);
    expect(next.t - paused).toBeLessThanOrEqual(0.15);
  });

  it('la música se reubica en el paso que sigue, sin volver a tocar uno que ya sonó', () => {
    for (const s of [0, 3.3, 10, 35.71, 65, POST_START - 0.2]) {
      const p = medleyPosition(CREDITS, s)!;
      expect(p.step).toBeLessThan(sectionSteps(CREDITS.sections[p.sec]));
      expect(p.wait).toBeGreaterThanOrEqual(0);
      // el paso agendado cae justo en s más la espera: nada anterior a s
      expect(medleyClock(CREDITS, p.sec, p.step, 100 + p.wait, 100)).toBeCloseTo(s, 9);
    }
    // después del último paso del cierre ya no queda nada por sonar
    expect(medleyPosition(CREDITS, POST_START - 0.01)).toBeNull();
    expect(medleyPosition(CREDITS, POST_START + 1)).toBeNull();
  });

  it('un salto largo (el juego estuvo detenido) no se come los créditos', () => {
    expect(advance(newClock(10), 5000, null).t).toBeCloseTo(10.25, 9);
  });

  it('si la música va adelantada (el teléfono dibujó pocos cuadros), la imagen la alcanza', () => {
    const c = advance(advance(newClock(), 16, 0), 1000, 1); // un cuadro de un segundo, con el audio en 1 s
    expect(c.t).toBeCloseTo(1, 6);
    expect(c.resync).toBe(false);
  });

  it('el reloj de la música sale de la sección y el paso agendados', () => {
    const s0 = sectionSeconds(CREDITS.sections[0]), song = CREDITS.sections[1].song, step = 60 / song.bpm / song.sub;
    // sección 1, paso 4 agendado para dentro de 0,1 s: suenan s0 + 4 pasos - 0,1
    expect(medleyClock(CREDITS, 1, 4, 10.1, 10)).toBeCloseTo(s0 + 4 * step - 0.1, 9);
    expect(medleyClock(CREDITS, 0, 0, 5.05, 5)).toBeCloseTo(-0.05, 9);
  });

  // auditoría del 16 de noviembre, C02a: quien los dejó a medias puede volver a verlos, pero no saltarlos
  it('empezados una vez, el menú los ofrece aunque no se hayan visto completos', () => {
    expect(creditsOpened()).toBe(false);
    markCreditsOpened();
    expect(creditsOpened()).toBe(true);
    expect(creditsSeen()).toBe(false);
    expect(canSkip(creditsSeen(), false)).toBe(false);
    resetProgress();
    expect(creditsOpened()).toBe(true);
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
