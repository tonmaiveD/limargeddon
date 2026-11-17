import { beforeEach, describe, expect, it } from 'vitest';
import { creditsEvent, queued, type CreditsEvent } from '../src/core/telemetry';
import { CREDITS_DRAFT_KEY, creditsEnd, creditsProgress, creditsStart, recoverCredits, setSharing } from '../src/core/share';
import { parseBatch, toRow } from '../server/src/validate';
import { report } from '../scripts/datos';

/* Datos anónimos de los créditos (C06 de la auditoría del 16 de noviembre, ADR 0060). */

const CTX = { build: 'abc123' };
const FIELDS = { from: 'victoria' as const, first: true, reached: 0, maxStall: 0, skips: 0 };
let mem: Map<string, string>;

describe('Datos de los créditos', () => {
  beforeEach(() => {
    globalThis.fetch = (async () => ({ ok: false })) as unknown as typeof fetch; // nada sale: todo queda en la cola
    mem = new Map();
    (globalThis as unknown as { localStorage: Storage }).localStorage = {
      getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => mem.set(k, v), removeItem: (k: string) => mem.delete(k),
    } as unknown as Storage;
  });

  it('el receptor guarda el registro tal como lo arma el juego, sin etapa ni nombre', () => {
    const e = creditsEvent({ ...FIELDS, reached: 84.1, maxStall: 0.03, end: 'completo' }, CTX);
    const rows = parseBatch(JSON.stringify({ v: 1, events: [e] }))!;
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ kind: 'creditos', stage: null, build: 'abc123' });
    expect(JSON.parse(rows[0].payload)).toEqual({ id: e.id, v: 1, kind: 'creditos', build: 'abc123', day: e.day, device: e.device,
      from: 'victoria', first: true, reached: 84.1, maxStall: 0.03, skips: 0, end: 'completo' });
  });

  it('el receptor descarta los registros de créditos que no calzan', () => {
    const e = creditsEvent({ ...FIELDS, end: 'despues' }, CTX);
    for (const bad of [{ end: 'otro' }, { from: 'tienda' }, { first: 'si' }, { reached: -1 }, { reached: 9999 }, { maxStall: 'mucho' }, { skips: 50 }])
      expect(toRow({ ...e, ...bad })).toBeNull();
    const { end: _e, ...noEnd } = e;
    expect(toRow(noEnd)).toBeNull();
    expect(JSON.parse(toRow({ ...e, playerName: 'NOAM' })!.payload)).not.toHaveProperty('playerName');
  });

  it('al terminar sale el registro con su final y se borra el borrador', () => {
    let e = creditsStart(false, FIELDS);
    expect(JSON.parse(mem.get(CREDITS_DRAFT_KEY)!)).toMatchObject({ kind: 'creditos', end: 'salida' });
    e = creditsProgress(e, { reached: 30.2, maxStall: 0.4 });
    expect(JSON.parse(mem.get(CREDITS_DRAFT_KEY)!)).toMatchObject({ reached: 30.2, maxStall: 0.4 });
    creditsEnd(false, e, 'despues', { reached: 31 });
    expect(mem.has(CREDITS_DRAFT_KEY)).toBe(false);
    expect(queued()).toEqual([expect.objectContaining({ kind: 'creditos', end: 'despues', reached: 31, maxStall: 0.4, from: 'victoria' })]);
  });

  it('unos créditos cerrados a mitad salen como "salida" al abrir el juego otra vez', () => {
    const e = creditsProgress(creditsStart(false, FIELDS), { reached: 12.5, maxStall: 6.2 }) as CreditsEvent;
    recoverCredits(false);
    expect(mem.has(CREDITS_DRAFT_KEY)).toBe(false);
    expect(queued()).toEqual([expect.objectContaining({ id: e.id, end: 'salida', reached: 12.5, maxStall: 6.2 })]);
    recoverCredits(false); // no se cuenta dos veces
    expect(queued()).toHaveLength(1);
  });

  it('el modo prueba y el envío apagado no anotan nada', () => {
    expect(creditsStart(true, FIELDS)).toBeNull();
    expect(mem.has(CREDITS_DRAFT_KEY)).toBe(false);
    creditsEnd(true, null, 'completo');
    const e = creditsStart(false, FIELDS);
    setSharing(false); // apagarlo borra también el borrador
    expect(mem.has(CREDITS_DRAFT_KEY)).toBe(false);
    creditsEnd(false, e, 'completo');
    recoverCredits(false);
    expect(queued()).toEqual([]);
    expect(creditsStart(false, FIELDS)).toBeNull();
  });

  it('el informe resume los créditos por origen y por primera vez', () => {
    const ev = (o: Partial<CreditsEvent>) => ({ ...creditsEvent({ ...FIELDS, end: 'completo', ...o }, CTX) });
    const md = report([
      ev({ reached: 84 }), ev({ reached: 20, maxStall: 7.5, end: 'salida' }), ev({ reached: 40, end: 'despues' }),
      ev({ from: 'menu', first: false, reached: 72, skips: 1, end: 'saltado' }), ev({ end: 'error', reached: 5, maxStall: 0.2 }),
    ], { now: '2026-11-17' });
    expect(md).toContain('### Créditos');
    expect(md).toContain('| Total | 0 | 0 | 0 | 5 |');
    expect(md).toContain('| Victoria | Primera | 4 (pocas) | 1 | 0 | 1 | 1 | 1 | 30,0 | 0,10 | 7,50 | 1 |');
    expect(md).toContain('| Menú | Repetida | 1 (pocas) | 0 | 1 | 0 | 0 | 0 | 72,0 | 0,00 | 0,00 | 0 |');
  });
});
