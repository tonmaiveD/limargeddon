import { describe, expect, it } from 'vitest';
import type { Painter } from '../src/core/gfx';
import { drawSide as costaSide } from '../src/stages/costa-verde/scenery';
import { buildingKind, HITO_EVERY, type BuildingKind } from '../src/stages/miraflores/scenery';

/* Costa Verde como piloto de arte interno (ADR 0066). */

// un lienzo que anota qué colores rellena y qué textos escribe
function recorder() {
  const fills: string[] = [], texts: string[] = [];
  const p = new Proxy({ fillStyle: '#000' } as Record<string, unknown>, {
    get: (o, k) => {
      if (k === 'fillRect' || k === 'fill') return () => fills.push(String(o.fillStyle));
      if (k === 'fillText') return (t: string) => texts.push(t);
      if (k === 'measureText') return () => ({ width: 0 });
      return k in o ? o[k as string] : () => {};
    },
    set: (o, k, v) => { o[k as string] = v; return true; },
  });
  return { p: p as unknown as Painter, fills, texts };
}

describe('Costa Verde, costados', () => {
  it('el mar horneado es solo agua: la arena, la espuma y los letreros van en vivo sobre la curva', () => {
    for (let idx = -300; idx < 300; idx++) {
      const r = recorder();
      costaSide(r.p, 0, 0, 42, 110, idx, 1);
      expect(r.fills.length).toBeGreaterThan(0);
      expect(r.fills).not.toContain('#5a4e3a'); // arena
      expect(r.fills.some((f) => f.startsWith('rgba(244,246,251'))).toBe(false); // espuma
      expect(r.texts).toEqual([]);
    }
  });

  it('el acantilado no lleva la trama cruzada de antes', () => {
    const r = recorder();
    for (let idx = 0; idx < 50; idx++) costaSide(r.p, 0, 0, 42, 110, idx, 0);
    expect(r.fills).not.toContain('rgba(160,160,170,.35)');
  });
});

describe('Miraflores, edificios', () => {
  it('ningún tipo de edificio sale dos veces seguidas, en ninguna columna', () => {
    for (const side of [1, 3, 5]) for (let idx = -600; idx < 600; idx++) expect(buildingKind(idx, side), `${side} ${idx}`).not.toBe(buildingKind(idx + 1, side));
  });

  it('salen los cuatro tipos y las tiendas, y un hito distinto en cada tramo junto a la pista', () => {
    const seen = new Set<BuildingKind>();
    for (let idx = 0; idx < 600; idx++) seen.add(buildingKind(idx, 1));
    for (const k of ['claro', 'ladrillo', 'vidrio', 'casona', 'tiendas', 'kennedy', 'huaca', 'pizzas'] as const) expect(seen, k).toContain(k);
    const hitos = ['kennedy', 'huaca', 'pizzas'];
    let last = '';
    for (let tramo = -20; tramo < 20; tramo++) {
      const ks = Array.from({ length: HITO_EVERY }, (_, i) => buildingKind(tramo * HITO_EVERY + i, 1)).filter((k) => hitos.includes(k));
      expect(ks, String(tramo)).toHaveLength(1);
      expect(ks[0]).not.toBe(last); last = ks[0];
    }
    for (let idx = 0; idx < 600; idx++) expect(hitos).not.toContain(buildingKind(idx, 3)); // los hitos solo junto a la pista
  });
});
