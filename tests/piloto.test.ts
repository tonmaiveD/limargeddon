import { describe, expect, it } from 'vitest';
import { STAGES } from '../src/stages';
import { setSkin, skin } from '../src/core/art/skin';
import { pilotEvent, pilotSurveyEvent } from '../src/core/telemetry';
import { toRow } from '../server/src/validate';
import { ART_IDS, CART_LEFT, bossId, cartId, flockId, foeId, obstacleId, pilotSkin, rowId, ticoId, vehicleId } from '../src/piloto/skin';
import { cliffAt, coastAt, farCliffAt, shoreAt } from '../src/piloto/world';
import { firstFor, freeVariant, fromLetter, letterFor, nextCount, roundStats, surveyStats, variantFor } from '../src/piloto/flujo';
import { report, type Ev } from '../scripts/datos';
import { startPort, stepPort } from './harness/port';
import { seedRandom } from './harness/rng';
import type { Car, Foe, Obstacle } from '../src/core/state';

/* Demo del piloto de arte de la Costa Verde (ADR 0067). */

const CV = STAGES['costa-verde'].cfg;
// texturas que arma la demo al cargar, además de las entregadas
const DERIVED = new Set([CART_LEFT, 'orilla_mar_arena', 'orilla_arena_mar']);
const exists = (id: string | null) => !!id && (ART_IDS.has(id) || DERIVED.has(id));
const CTX = { build: 'abc123' };

describe('arte del piloto', () => {
  it('el juego no instala arte alterno: sin la demo todo se dibuja como siempre', () => {
    expect(skin()).toBeNull();
    setSkin(pilotSkin); expect(skin()).toBe(pilotSkin);
    setSkin(null); expect(skin()).toBeNull();
  });

  it('las 76 imágenes de la V2.1.1 están en el índice', () => {
    expect(ART_IDS.size).toBe(76);
    expect(ART_IDS.has('derrumbe')).toBe(false);
  });

  it('todo lo que pide la demo existe en el arte entregado', () => {
    for (const t of CV.traffic.types) for (const hp of [1, 0.4]) {
      const id = vehicleId({ k: t.k, hp, max: 1 } as Car);
      expect(exists(id), `${t.k} ${hp}`).toBe(true);
    }
    for (const d of [0, 0.4, 0.8]) expect(exists(ticoId(d))).toBe(true);
    expect(ticoId(0)).toBe('tico_sano'); expect(ticoId(0.5)).toBe('tico_danado'); expect(ticoId(0.9)).toBe('tico_muy_danado');
    const G = startPort('normal', CV);
    (CV.obstacles ?? []).forEach((_o, i) => { for (const hit of [false, true]) expect(exists(obstacleId(G, { i, hit } as Obstacle))).toBe(true); });
    for (const k of Object.keys(CV.powers)) expect(exists(pilotSkin.pickup!(G, { k } as never)), k).toBe(true);
    for (let i = 0; i < 6; i++) expect(exists(foeId({ look: 'piedra' } as Foe))).toBe(true);
    expect(foeId({ look: 'moneda' } as Foe)).toBeNull();
    for (const t of [0, 0.2]) for (const s of [false, true]) expect(exists(flockId(t, s))).toBe(true);
    expect(cartId(1)).toBe('carretilla'); expect(cartId(-1)).toBe(CART_LEFT);
    const cols = CV.boss.body!.cols;
    for (const c of cols) for (const hp of [1, 0.3]) expect(exists(rowId(cols, c, hp, 1))).toBe(true);
    expect(new Set(cols.map((c) => rowId(cols, c, 1, 1))).size).toBe(6);
    for (const hp of [1, 0.3]) expect(exists(bossId(hp, 1))).toBe(true);
  });

  it('los costados existen, no repiten un tramo seguido y la costa calza en cada unión', () => {
    // material del borde de arriba y de abajo de cada tramo de costa
    const edges = (id: string): [string, string] => id === 'transicion_mar_arena' ? ['mar', 'arena'] : id === 'transicion_arena_mar' ? ['arena', 'mar']
      : id === 'arena_base' || id === 'hito_agua_dulce' ? ['arena', 'arena'] : ['mar', 'mar'];
    const seen = new Set<string>();
    for (let idx = -300; idx < 300; idx++) {
      for (const id of [coastAt(idx), cliffAt(idx), farCliffAt(idx, 1), farCliffAt(idx, 2), shoreAt(idx)]) { expect(exists(id), `${idx} ${id}`).toBe(true); seen.add(id); }
      // el tramo idx + 1 va arriba en la pantalla: su borde de abajo toca el de arriba de idx
      expect(edges(coastAt(idx + 1))[1], `costa ${idx}`).toBe(edges(coastAt(idx))[0]);
      expect(cliffAt(idx + 1), `acantilado ${idx}`).not.toBe(cliffAt(idx));
      // la orilla cambia con la arena
      expect(shoreAt(idx).includes('arena') || !edges(coastAt(idx)).includes('arena')).toBe(true);
    }
    for (const id of ['hito_bajada', 'hito_muelle', 'hito_agua_dulce', 'hito_morro_solar', 'transicion_mar_arena', 'transicion_arena_mar', 'orilla_mar_arena', 'orilla_arena_mar'])
      expect(seen, id).toContain(id);
  });
});

describe('prueba de arte', () => {
  it('el orden se alterna entre una prueba y la siguiente, y A es siempre la primera', () => {
    const mem = new Map<string, string>(), store = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
    const firsts = [0, 1, 2, 3].map(() => firstFor(nextCount(store)));
    expect(firsts).toEqual(['actual', 'nuevo', 'actual', 'nuevo']);
    expect(firstFor(nextCount(null))).toBe('actual');
    expect([variantFor(1, 'nuevo'), variantFor(2, 'nuevo')]).toEqual(['nuevo', 'actual']);
    expect([letterFor(1), letterFor(2)]).toEqual(['A', 'B']);
    expect([fromLetter('A', 'nuevo'), fromLetter('B', 'nuevo'), fromLetter('igual', 'nuevo')]).toEqual(['nuevo', 'actual', 'igual']);
  });

  it('?arte=nuevo abre directo una versión y cualquier otro valor deja la prueba completa', () => {
    expect(freeVariant('?arte=nuevo')).toBe('nuevo');
    expect(freeVariant('?prueba&arte=actual')).toBe('actual');
    for (const q of ['', '?arte=', '?arte=Nuevo', '?arte=otro', '?tester=pablo']) expect(freeVariant(q), q).toBeNull();
  });

  it('el receptor guarda la partida y la encuesta tal como las arma la demo, sin nombre', () => {
    const restore = seedRandom(5);
    try {
      const G = startPort('normal', CV);
      for (let i = 0; i < 600; i++) stepPort(G, 1 / 60);
      G.p.hp = 0; stepPort(G, 1 / 60);
      const stats = roundStats(G, { session: 'abc-123', round: 2, first: 'nuevo', end: 'fin' });
      expect(stats).toMatchObject({ variant: 'actual', first: 'nuevo', round: 2, win: false, hpPct: 0 });
      const row = toRow(pilotEvent(stats, CTX));
      expect(row).toMatchObject({ kind: 'piloto', stage: 'costa-verde', build: 'abc123' });
      const s = toRow({ ...pilotSurveyEvent(surveyStats('abc-123', 'nuevo', { prefer: 'A', readable: 'igual', lima: 'si', recognized: 'nose' }), CTX), playerName: 'NOAM' });
      expect(JSON.parse(s!.payload)).toMatchObject({ kind: 'piloto-encuesta', first: 'nuevo', prefer: 'nuevo', readable: 'igual', lima: 'si', recognized: 'nose' });
      expect(JSON.parse(s!.payload)).not.toHaveProperty('playerName');
      const e = pilotEvent(stats, CTX);
      for (const bad of [{ variant: 'otro' }, { round: 0 }, { session: 'a b' }, { stage: 'miraflores' }, { hpPct: 120 }, { end: 'x' }]) expect(toRow({ ...e, ...bad })).toBeNull();
      const { win: _w, ...noWin } = e;
      expect(toRow(noWin)).toBeNull();
    } finally { restore(); }
  });

  it('el informe de datos resume la prueba por versión del arte, por orden y la encuesta', () => {
    const base = { build: 'b', day: '2026-11-22', device: 'iOS · Safari · mediana', stage: 'costa-verde' };
    const r = (o: Partial<Ev>): Ev => ({ ...base, kind: 'piloto', end: 'fin', t: 90, bossPct: 0, hpPct: 40, ...o } as Ev);
    const md = report([
      r({ variant: 'actual', first: 'actual', round: 1, win: false, bossPct: 30, dmgBy: { 'EMBESTIDA': 20 } }), r({ variant: 'nuevo', first: 'actual', round: 2, win: true }),
      r({ variant: 'nuevo', first: 'nuevo', round: 1, win: true }), r({ variant: 'actual', first: 'nuevo', round: 2, end: 'abandono', win: false }),
      r({ variant: 'nuevo', first: 'nuevo', round: 1, win: true, t: 5 }), // victoria forzada: queda fuera
      { ...base, kind: 'piloto-encuesta', first: 'actual', prefer: 'nuevo', readable: 'igual', lima: 'si', recognized: 'si' } as Ev,
      { ...base, kind: 'piloto-encuesta', first: 'nuevo', prefer: 'nuevo', readable: 'nuevo', lima: 'no', recognized: 'nose' } as Ev,
    ], { now: '2026-11-22' });
    expect(md).toContain('## Prueba de arte de la Costa Verde');
    expect(md).toContain('4 partidas y 2 encuestas.');
    expect(md).toContain('| Actual | 2 (pocas) | 0 % | 1 | 90 | 30 | 40 |');
    expect(md).toContain('| Nuevo | 2 (pocas) | 100 % | 0 |');
    expect(md).toContain('| Actual | 1 | 0 % | 0 | · |');
    expect(md).toContain('| Se veía mejor | 0 | 2 | 0 |');
    expect(md).toContain('| Vive o vivió en Lima | 1 | 1 | 0 | 0 |');
    expect(md).toContain('| EMBESTIDA | 10,0 | 0,0 |');
  });
});
