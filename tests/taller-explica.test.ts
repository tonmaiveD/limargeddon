import { beforeEach, describe, expect, it } from 'vitest';
import { UPGRADES, picks } from '../src/garage/upgrades';
import { itemUses, STAGES } from '../src/stages';
import { addEarnings, buyUpgrade, getGarage, setGoal } from '../src/core/save';

/* Taller que explica (ADR 0033): dos recomendaciones según el modo, dónde sirve cada objeto y meta de ahorro. */

function memStorage(): void {
  const mem = new Map<string, string>();
  (globalThis as any).localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => mem.set(k, v) };
}

describe('taller que explica', () => {
  it('cada mejora declara para qué sirve y cuánto ayudó en cada modo', () => {
    for (const u of UPGRADES) {
      expect(['ataque', 'aguante']).toContain(u.role);
      expect(u.value.toque).toBeGreaterThanOrEqual(0); expect(u.value.acelerar).toBeGreaterThanOrEqual(0);
    }
  });

  it('recomienda una para atacar y otra para aguantar, distintas según el modo de disparo', () => {
    expect(picks({}, 300, 9, 'toque')).toEqual({ ataque: 'aceite', aguante: 'llantas' });
    expect(picks({}, 500, 9, 'acelerar')).toEqual({ ataque: 'claxon', aguante: 'reparacion' }); // claxon y conos empatan, gana el más barato
    expect(picks({}, 100, 9, 'toque')).toEqual({ ataque: undefined, aguante: undefined }); // nada alcanza
    expect(Object.values(picks({}, 99999, 2, 'acelerar'))).not.toContain('socio-combi'); // lujo bloqueado
  });

  it('dice en qué etapas sirve cada objeto de victoria, leyendo las configs', () => {
    expect(itemUses('jetHit')).toEqual([STAGES.centro.cfg.district]);
    expect(itemUses('swingHit')).toEqual([STAGES['via-expresa'].cfg.district]);
    expect(itemUses('birdHit')).toEqual([STAGES['costa-verde'].cfg.district]);
    expect(itemUses('wantedHit')).toContain(STAGES['linea-amarilla'].cfg.district);
  });

  describe('meta de ahorro', () => {
    beforeEach(memStorage);
    it('se elige, se quita y se cumple al comprar', () => {
      setGoal('blindaje'); expect(getGarage().goal).toBe('blindaje');
      setGoal(null); expect(getGarage().goal).toBeUndefined();
      setGoal('blindaje'); addEarnings(1000);
      expect(buyUpgrade('blindaje', 450, 2)!.goal).toBeUndefined();
      expect(getGarage().goal).toBeUndefined();
    });
  });
});
