import { describe, expect, it } from 'vitest';
import { startPort, stepPort } from './harness/port';
import { seedRandom } from './harness/rng';
import { bot } from './harness/bot';
import { evitaCuerpo, rutaBot } from './harness/evita';
import { STAGES, STAGE_ORDER } from '../src/stages';
import { UPGRADES, applyUpgrades, type Levels } from '../src/garage/upgrades';
import type { FireMode } from '../src/core/config';

/*
 * Ninguna compra del taller puede romper una etapa (auditoría N01): cada nivel de cada mejora se aplica en las diez
 * etapas, y con el último nivel de cada una (y con todas juntas) se juega 15 s con el bot, más que los 12 s que tarda
 * en llegar la combi del Socio.
 */

const DT = 1 / 60;
const drive = (G: any, k: any) => { bot(G, k); evitaCuerpo(G, k); rutaBot(G, k); };

function run(id: string, levels: Levels, mode: FireMode): void {
  const r = seedRandom(STAGE_ORDER.indexOf(id) * 31 + 7);
  try {
    const G = startPort('normal', applyUpgrades(STAGES[id].cfg, levels));
    G.fireMode = mode;
    for (let i = 0; i < 60 * 15 && G.mode === 'play'; i++) { drive(G, G.keys); stepPort(G, DT); }
    expect(Number.isFinite(G.p.hp) && Number.isFinite(G.b.hp)).toBe(true);
    if (G.cfg.route) expect(G.route.attempts).toBeGreaterThanOrEqual(0);
  } finally { r(); }
}

describe('Mejoras en todas las etapas', () => {
  it('cada nivel de cada mejora se aplica en las diez etapas', () => {
    for (const id of STAGE_ORDER) for (const u of UPGRADES) for (let n = 1; n <= u.levels.length; n++) {
      expect(() => applyUpgrades(STAGES[id].cfg, { [u.id]: n }), `${u.id} ${n} en ${id}`).not.toThrow();
    }
  });

  for (const id of STAGE_ORDER) {
    it(`se juega ${id} con cada mejora al máximo y con todas juntas`, () => {
      const all: Levels = Object.fromEntries(UPGRADES.map((u) => [u.id, u.levels.length]));
      for (const u of UPGRADES) run(id, { [u.id]: u.levels.length }, 'toque');
      run(id, all, 'toque');
      run(id, all, 'acelerar');
    });
  }
});
