import { beforeEach, describe, expect, it } from 'vitest';
import { abandonEvent, buyEvent, cleanTester, coarseDevice, enqueue, fightEvent, flush, queued } from '../src/core/telemetry';
import { readTester, sharing, track } from '../src/core/share';
import { getSettings, setSettings, type FightRecord } from '../src/core/save';

/* Datos anónimos de partidas (ADR 0051). */

const CTX = { build: 'abc123' };
const fight = (): Omit<FightRecord, 'at'> => ({
  stage: 'callao', dk: 'normal', win: true, t: 29.4, fireMode: 'toque', bestCombo: 26, upgrades: { motor: 2 }, bossPct: 0,
  gross: 1200, fines: 0, earned: 1200, replay: false, points: 9822, lastHit: 'CONO', dmgBy: { BARRERA: 10 },
  frames: { warm: null, play: null, stalls: [], stallCount: 0, stallsCut: false, anomalies: [], device: '390x844@3 · Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)' },
});
const ok = (async () => ({ ok: true })) as unknown as typeof fetch;
const fail = (async () => ({ ok: false })) as unknown as typeof fetch;

describe('Datos anónimos de partidas', () => {
  beforeEach(() => {
    // las pruebas nunca salen a internet: el envío por defecto se reemplaza por uno que responde bien
    globalThis.fetch = (async () => ({ ok: true })) as unknown as typeof fetch;
    const mem = new Map<string, string>();
    (globalThis as unknown as { localStorage: Storage }).localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => mem.set(k, v) } as unknown as Storage;
  });

  it('describe el equipo solo por tipo, nunca con el texto completo del navegador', () => {
    expect(coarseDevice('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/152.0 Mobile Safari/537.36', 412, 915, true)).toBe('Android · Chrome · mediana · táctil');
    expect(coarseDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1', 390, 844, true)).toBe('iOS · Safari · mediana · táctil');
    expect(coarseDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15', 1024, 1366, true)).toBe('iOS · Safari · tablet · táctil'); // iPad
    expect(coarseDevice('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/152.0 Safari/537.36 Edg/152.0', 1920, 1080, false)).toBe('Windows · Edge · grande');
    expect(coarseDevice('Mozilla/5.0 (Linux; Android 13; SM-A135F) SamsungBrowser/26.0 Chrome/122.0 Mobile Safari/537.36', 360, 800, true)).toBe('Android · Samsung · mediana · táctil');
  });

  it('una pelea se envía sin nombre, sin hora y sin la descripción completa del equipo', () => {
    const e = fightEvent(fight(), CTX), json = JSON.stringify(e);
    expect(json).not.toMatch(/Mozilla|iPhone OS|390x844/);
    expect(e).not.toHaveProperty('at'); expect(e).not.toHaveProperty('playerName'); expect(e).not.toHaveProperty('name');
    expect(e.frames).not.toHaveProperty('device');
    expect(e.day).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(e).toMatchObject({ kind: 'pelea', v: 1, build: 'abc123', stage: 'callao', win: true, t: 29.4, upgrades: { motor: 2 }, dmgBy: { BARRERA: 10 } });
  });

  it('cada registro lleva su propio número al azar', () => {
    const ids = new Set(Array.from({ length: 50 }, () => fightEvent(fight(), CTX).id));
    expect(ids.size).toBe(50);
  });

  it('abandonos y compras llevan lo justo', () => {
    expect(abandonEvent({ stage: 'gamarra', dk: 'normal', fireMode: 'toque', t: 41.2, phase: 2, bossPct: 55, hpPct: 12 }, CTX)).toMatchObject({ kind: 'abandono', phase: 2, bossPct: 55 });
    expect(buyEvent({ upgrade: 'motor', level: 2, price: 600, wallet: 120, unlocked: 4 }, CTX)).toMatchObject({ kind: 'compra', upgrade: 'motor', level: 2 });
  });

  it('nunca se envía en el modo prueba ni con el interruptor apagado', () => {
    expect(sharing(true)).toBe(false);
    expect(sharing(false)).toBe(true); // activado por defecto, con aviso
    track(true, (c) => fightEvent(fight(), c));
    expect(queued()).toHaveLength(0);
    setSettings({ share: false });
    track(false, (c) => fightEvent(fight(), c));
    expect(queued()).toHaveLength(0);
    setSettings({ share: true });
    track(false, (c) => fightEvent(fight(), c));
    expect(queued()).toHaveLength(1);
  });

  it('la etiqueta de probador se pone con ?tester= y va en cada registro', () => {
    readTester('?prueba&tester=Noam!');
    expect(getSettings().tester).toBe('noam');
    track(false, (c) => fightEvent(fight(), c));
    expect(queued()[0].tester).toBe('noam');
    readTester('?tester=');
    expect(getSettings().tester).toBeUndefined();
    expect(cleanTester('Pablo_2026-XL')).toBe('pablo2026xl');
  });

  it('lo enviado sale de la cola solo si el receptor respondió bien', async () => {
    for (let i = 0; i < 3; i++) enqueue(fightEvent(fight(), CTX));
    expect(await flush('', ok)).toBe(0); // sin receptor no se manda nada
    expect(await flush('https://receptor.test', fail)).toBe(0);
    expect(queued()).toHaveLength(3);
    expect(await flush('https://receptor.test', ok)).toBe(3);
    expect(queued()).toHaveLength(0);
  });

  it('manda en grupos de 50 hasta vaciar la cola, también lo que se anota mientras tanto', async () => {
    for (let i = 0; i < 70; i++) enqueue(fightEvent(fight(), CTX));
    const sizes: number[] = [];
    let extra = 1; // durante el primer envío se anota una pelea más
    const post = (async (_u: string, init: RequestInit) => {
      sizes.push(JSON.parse(init.body as string).events.length);
      if (extra-- > 0) enqueue(fightEvent(fight(), CTX));
      return { ok: true };
    }) as unknown as typeof fetch;
    expect(await flush('https://receptor.test', post)).toBe(71);
    expect(sizes).toEqual([50, 21]);
    expect(queued()).toHaveLength(0);
  });

  it('si el receptor falla a mitad de camino, lo no enviado queda en la cola', async () => {
    for (let i = 0; i < 70; i++) enqueue(fightEvent(fight(), CTX));
    let calls = 0;
    const post = (async () => ({ ok: calls++ === 0 })) as unknown as typeof fetch;
    expect(await flush('https://receptor.test', post)).toBe(50);
    expect(queued()).toHaveLength(20);
  });

  it('sin conexión por mucho tiempo, la cola guarda los 200 más nuevos', () => {
    for (let i = 0; i < 230; i++) enqueue(abandonEvent({ stage: 'centro', dk: 'normal', t: i, phase: 1, bossPct: 90, hpPct: 50 }, CTX));
    const q = queued();
    expect(q).toHaveLength(200);
    expect((q[0] as { t: number }).t).toBe(30);
  });
});
