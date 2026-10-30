import { describe, expect, it } from 'vitest';
import { MAX_EVENTS, originOk, parseBatch, toRow } from '../server/src/validate';
import { abandonEvent, buyEvent, fightEvent } from '../src/core/telemetry';

/* Receptor de datos anónimos de partidas (ADR 0051): solo guarda lo que tiene la forma exacta que manda el juego. */

const CTX = { build: 'abc123', tester: 'noam' };
const pelea = () => fightEvent({ stage: 'callao', dk: 'normal', win: true, t: 29.4, fireMode: 'toque', bestCombo: 26, upgrades: { motor: 2 }, bossPct: 0, gross: 1200, fines: 0, earned: 1200, points: 9822, dmgBy: { BARRERA: 10 } }, CTX);
const batch = (events: unknown[]) => JSON.stringify({ v: 1, events });

describe('Receptor de datos', () => {
  it('acepta los tres tipos de registro tal como los arma el juego', () => {
    const rows = parseBatch(batch([pelea(), abandonEvent({ stage: 'gamarra', dk: 'normal', t: 41.2, phase: 2, bossPct: 55, hpPct: 12 }, CTX), buyEvent({ upgrade: 'motor', level: 2, price: 600, wallet: 120, unlocked: 4 }, CTX)]))!;
    expect(rows.map((r) => r.kind)).toEqual(['pelea', 'abandono', 'compra']);
    expect(rows[0]).toMatchObject({ v: 1, build: 'abc123', tester: 'noam', stage: 'callao' });
    expect(JSON.parse(rows[0].payload).points).toBe(9822);
    expect(rows[2].stage).toBeNull();
  });

  it('descarta uno por uno los registros que no calzan, sin perder los buenos', () => {
    const malos = [
      { ...pelea(), kind: 'otra' }, { ...pelea(), v: 2 }, { ...pelea(), day: 'ayer' }, { ...pelea(), stage: '<script>' },
      { ...pelea(), t: -1 }, { ...pelea(), dk: 'imposible' }, { ...pelea(), tester: 'Con Espacios' }, { ...pelea(), id: 'a b' },
      { ...pelea(), upgrades: { motor: 'mucho' } }, { ...pelea(), points: 1e9 }, { ...pelea(), device: 'x'.repeat(200) }, null, 'texto', [],
    ];
    const rows = parseBatch(batch([pelea(), ...malos]))!;
    expect(rows).toHaveLength(1);
    for (const m of malos) expect(toRow(m)).toBeNull();
  });

  it('rechaza envíos enteros que no tienen la forma del juego', () => {
    expect(parseBatch('no es json')).toBeNull();
    expect(parseBatch(JSON.stringify({ v: 2, events: [pelea()] }))).toBeNull();
    expect(parseBatch(JSON.stringify({ v: 1, events: [] }))).toBeNull();
    expect(parseBatch(batch(Array.from({ length: MAX_EVENTS + 1 }, pelea)))).toBeNull();
    expect(parseBatch('x'.repeat(70 * 1024))).toBeNull();
  });

  it('solo acepta envíos desde el juego publicado y el servidor de desarrollo', () => {
    expect(originOk('https://tonmaived.github.io')).toBe(true);
    expect(originOk('http://localhost:5173')).toBe(true);
    expect(originOk('https://otro-sitio.com')).toBe(false);
    expect(originOk(null)).toBe(false);
  });

  it('nunca guarda campos que no son del contrato, aunque alguien los mande', () => {
    const row = toRow({ ...pelea(), playerName: 'PABLO', ip: '1.2.3.4', ua: 'Mozilla/5.0' })!;
    expect(row).not.toBeNull();
    expect(row.payload).not.toMatch(/PABLO|1\.2\.3\.4|Mozilla|playerName/);
  });
});
