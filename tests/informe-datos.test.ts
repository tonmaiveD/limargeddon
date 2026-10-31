import { describe, expect, it } from 'vitest';
import { parseBatch } from '../server/src/validate';
import { abandonEvent, buyEvent, fightEvent } from '../src/core/telemetry';
import { FEW, MIN_WIN_S, median, report, type Ev } from '../scripts/datos';

/* Informe de datos anónimos (ADR 0051, PR C): lee lo que guarda el receptor, tal como lo arma el juego. */

const PUB = { build: 'b1' }, TEAM = { build: 'b1', tester: 'noam' };
const STAGES = [{ id: 'miraflores', name: 'Miraflores' }, { id: 'callao', name: 'Callao' }];
// pasa por el receptor y devuelve lo guardado, como lo entrega la descarga
const stored = (events: unknown[]): Ev[] => parseBatch(JSON.stringify({ v: 1, events }))!.map((r) => JSON.parse(r.payload));
const pelea = (o: Partial<Parameters<typeof fightEvent>[0]>, c: { build: string; tester?: string } = PUB) =>
  fightEvent({ stage: 'miraflores', dk: 'normal', win: true, t: 40, fireMode: 'toque', ...o }, c);

describe('Informe de datos', () => {
  it('calcula la mediana', () => {
    expect(median([])).toBeNull();
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });

  it('separa al público del equipo de pruebas y cuenta cada tipo', () => {
    const md = report(stored([pelea({}), pelea({ win: false, bossPct: 30 }), pelea({}, TEAM),
      abandonEvent({ stage: 'miraflores', dk: 'normal', t: 20, phase: 1, bossPct: 80, hpPct: 40 }, PUB),
      buyEvent({ upgrade: 'motor', level: 1, price: 300, wallet: 50, unlocked: 2 }, TEAM)]), { stages: STAGES, now: '2026-10-30' });
    expect(md).toContain('| Público | 2 | 1 | 0 |');
    expect(md).toContain('| Equipo de pruebas | 1 | 0 | 1 |');
    expect(md).toContain('## Equipo de pruebas (noam)');
    expect(md).toContain('| Miraflores | normal | toque | 2 (pocas) | 1 (50 %) | 40,0 | 30 |');
    // salidas sobre peleas empezadas: 1 de 3 en el público
    expect(md).toContain('| Miraflores | 1 | 33 % |');
    expect(md).toContain('| motor | 1 | 1 | 300 | 50 |');
  });

  it('marca como modo desconocido las peleas sin modo, sin suponer ninguno', () => {
    const md = report(stored([pelea({ fireMode: undefined })]), { stages: STAGES });
    expect(md).toContain('| Miraflores | normal | desconocido |');
    expect(md).toContain('1 pelea llegó sin modo de disparo');
  });

  it('ordena las etapas como el juego y resume daño, último golpe y multas', () => {
    const md = report(stored([
      pelea({ stage: 'callao', win: false, lastHit: 'TRÁILER', dmgBy: { 'TRÁILER': 60, 'DESVÍO · SANEAMIENTO': 40 }, gross: 0 }),
      pelea({ gross: 1000, fines: 400, dmgBy: { SILBATO: 10 } }),
    ]), { stages: STAGES });
    expect(md.indexOf('| Miraflores |')).toBeLessThan(md.indexOf('| Callao |'));
    expect(md).toContain('| Callao | 1 | TRÁILER 60 %, DESVÍO · SANEAMIENTO 40 % | TRÁILER (1) |');
    expect(md).toMatch(/\| Miraflores \| normal \| toque \| 1 \(pocas\) \| 1 \(100 %\) \| 40,0 \| · \| 40 % \|/);
  });

  it(`deja de marcar "(pocas)" desde ${FEW} peleas`, () => {
    const md = report(stored(Array.from({ length: FEW }, () => pelea({}))), { stages: STAGES });
    expect(md).toContain(`| Miraflores | normal | toque | ${FEW} | ${FEW} (100 %) |`);
  });

  it('filtra por fecha y por versión', () => {
    const ev = stored([pelea({}), pelea({}, { build: 'b2' })]);
    ev[0].day = '2026-10-01';
    expect(report(ev, { since: '2026-10-15' })).toContain('| Total | 1 | 0 | 0 |');
    expect(report(ev, { build: 'b1' })).toContain('| Total | 1 | 0 | 0 |');
    expect(report([], {})).toContain('Sin partidas.');
  });

  it('resume la fluidez por tipo de equipo', () => {
    const frames = { warm: null, play: { n: 1000, p50: 16.7, p95: 18, p99: 30, max: 120, over20: 20, over33: 5 }, stalls: [120], stallCount: 1, stallsCut: false, anomalies: [], device: 'texto completo' };
    const md = report(stored([pelea({ frames }), pelea({ frames: { ...frames, play: { ...frames.play, p95: 22, over33: 15 }, anomalies: [6000] } })]));
    // dos peleas del mismo equipo: p95 mediano 20, 20 de 2000 cuadros pasan de 33 ms, una con anomalía
    expect(md).toMatch(/\| 2 \| 20,0 \| 30,0 \| 1,0 % \| 1 \| 1 \|\n/);
    expect(md).not.toContain('texto completo');
  });

  it('no deja que un rótulo rompa la tabla', () => {
    const md = report([{ kind: 'compra', build: 'b|x', day: '2026-10-30', device: 'd', upgrade: 'a|b', level: 1, price: 1, wallet: 1 }]);
    expect(md).toContain('| a/b |');
    expect(md).toContain('| b/x |');
  });

  it(`deja fuera las victorias en menos de ${MIN_WIN_S} s, que son pruebas forzadas`, () => {
    const md = report(stored([pelea({ t: 0.2 }), pelea({ t: 2.1 }), pelea({ t: 3, win: false }), pelea({ t: 40 })]));
    expect(md).toContain('| Total | 2 | 0 | 0 |');
    expect(md).toContain(`2 victorias en menos de ${MIN_WIN_S} s quedan fuera`);
  });
});
