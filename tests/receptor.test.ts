import { describe, expect, it } from 'vitest';
import { MAX_EVENTS, MAX_ROW, originOk, parseBatch, toRow } from '../server/src/validate';
import { FrameMeter } from '../src/core/frames';
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

  // novena auditoría, V03: lo de adentro de los objetos también se revisa
  it('rehace frames con sus campos y descarta lo que sobra adentro', () => {
    const m = new FrameMeter(); m.add(16); for (let i = 0; i < 400; i++) m.add(i % 50 ? 16 : 140);
    const frames = { ...m.summary(), device: 'Mozilla/5.0 iPhone', playerName: 'PABLO' };
    const row = toRow({ ...pelea(), frames })!;
    expect(row).not.toBeNull();
    const saved = JSON.parse(row.payload).frames;
    expect(saved).not.toHaveProperty('device'); expect(saved).not.toHaveProperty('playerName');
    expect(saved.play.n).toBeGreaterThan(0); expect(saved.stallCount).toBe(m.summary().stallCount);
    expect(row.payload).not.toMatch(/PABLO|Mozilla/);
  });

  it('rechaza los tipos equivocados en modo, último golpe, repetición y frames', () => {
    const malos = [
      { ...pelea(), fireMode: { x: 1 } }, { ...pelea(), fireMode: 'turbo' }, { ...pelea(), lastHit: { nombre: 'x' } },
      { ...pelea(), lastHit: '<img src=x>' }, { ...pelea(), replay: 'si' }, { ...pelea(), frames: 'lento' },
      { ...pelea(), frames: { play: { n: 'cien' } } }, { ...pelea(), frames: { stalls: Array(31).fill(120) } },
      { ...pelea(), dmgBy: { '<b>': 3 } }, { ...pelea(), upgrades: { motor: -1 } },
    ];
    for (const m of malos) expect(toRow(m), JSON.stringify(m).slice(0, 80)).toBeNull();
  });

  it('acepta todos los rótulos de obstáculos de las etapas', async () => {
    const { STAGES } = await import('../src/stages');
    const labels = Object.values(STAGES).flatMap((d) => (d.cfg.obstacles ?? []).map((o) => o.label ?? o.k.toUpperCase()));
    expect(labels.length).toBeGreaterThan(10);
    for (const l of labels) expect(toRow({ ...pelea(), lastHit: l, dmgBy: { [l]: 5 } }), l).not.toBeNull();
  });

  it('acepta los rótulos reales del juego como fuente de daño y último golpe', () => {
    const row = toRow({ ...pelea(), lastHit: 'DOBLE FILA', dmgBy: { 'LA MAREA': 12, BARRERA: 10, '¡HUECO!': 5, CAMIÓN: 3, 'DESVÍO · SANEAMIENTO': 2, 'PRONTO, PARA TU COMODIDAD': 1 } })!;
    expect(JSON.parse(row.payload)).toMatchObject({ lastHit: 'DOBLE FILA', dmgBy: { 'LA MAREA': 12, CAMIÓN: 3 } });
  });

  it('mide los límites en bytes, no en letras', () => {
    const big = { ...pelea(), dmgBy: Object.fromEntries(Array.from({ length: 40 }, (_, i) => ['ÁÉÍÓÚÑÁÉÍÓÚÑÁÉÍÓÚÑÁÉÍÓ' + i, 1])) };
    const text = JSON.stringify(big);
    expect(new TextEncoder().encode(text).length).toBeGreaterThan(text.length);
    const row = toRow(big);
    if (row) expect(new TextEncoder().encode(row.payload).length).toBeLessThanOrEqual(MAX_ROW);
  });
});
