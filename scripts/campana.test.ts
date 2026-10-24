import { it } from 'vitest';
import type { DiffKey, FireMode, StageConfig } from '../src/core/config';
import { startPort, stepPort } from '../tests/harness/port';
import { seedRandom } from '../tests/harness/rng';
import { bot } from '../tests/harness/bot';
import { STAGES, STAGE_ORDER, wonItems } from '../src/stages';
import { UPGRADES, applyUpgrades, nextLevel, recommended, type Levels } from '../src/garage/upgrades';
import { summarize } from '../src/core/world';
import { evitaCuerpo } from '../tests/harness/evita';

/*
 * Simulador de campaña (npm run campana): el bot medio juega las etapas en orden con lo que va comprando en el taller.
 * Cobra cada pelea como el juego (la etapa repetida paga la mitad), y después de cada victoria compra la mejora
 * recomendada (la más barata que alcanza) hasta quedarse sin plata. Reporta con qué llega a cada etapa y cómo le va.
 */

const CAMPANAS = Number(process.env.CAMPANAS ?? 20), INTENTOS = 6;
function medio(G: any, k: any) { bot(G, k); if (Math.floor(G.t * 2) % 3) { k.oil = false; k.horn = false; } evitaCuerpo(G, k); }

function pelea(cfg: StageConfig, dk: DiffKey, mode: FireMode, seed: number) {
  const r = seedRandom(seed);
  try {
    const G = startPort(dk, cfg); G.fireMode = mode;
    for (let i = 0; i < 60 * 300 && G.mode === 'play'; i++) {
      medio(G, G.keys); if (mode === 'toque' && G.keys.cone) G.keys.cone = i % 6 === 0;
      stepPort(G, 1 / 60);
    }
    return summarize(G);
  } finally { r(); }
}

export function campana(dk: DiffKey, mode: FireMode, seedBase: number) {
  let wallet = 0; const levels: Levels = {}; const out: { stage: string; tries: number; wonAt: number; t: number; spent: number; wallet: number }[] = [];
  let spent = 0;
  for (const id of STAGE_ORDER) {
    const def = STAGES[id], n = def.cfg.number;
    let tries = 0, won = false, t = 0;
    const arrival = wallet;
    while (!won && tries < INTENTOS) {
      tries++;
      const cfg = applyUpgrades(def.cfg, levels); cfg.player.items = wonItems(n);
      const s = pelea(cfg, dk, mode, seedBase * 1000 + n * 37 + tries * 7);
      wallet += s.pay; won = s.win; t = s.seconds;
    }
    out.push({ stage: id, tries, wonAt: won ? tries : 0, t, spent, wallet: arrival });
    if (!won) break;
    // taller: compra la recomendada mientras alcance
    for (let id2 = recommended(levels, wallet, n + 1); id2; id2 = recommended(levels, wallet, n + 1)) {
      const u = UPGRADES.find((x) => x.id === id2)!, L = nextLevel(u, levels)!;
      wallet -= L.price; spent += L.price; levels[id2] = (levels[id2] ?? 0) + 1;
    }
  }
  return out;
}

it.skipIf(!process.env.CAMPANA)('campaña', () => {
  for (const [dk, mode] of [['normal', 'toque'], ['normal', 'acelerar']] as [DiffKey, FireMode][]) {
    const rows = STAGE_ORDER.map(() => ({ reached: 0, first: 0, tries: 0, ts: [] as number[], spent: 0 }));
    for (let c = 1; c <= CAMPANAS; c++) {
      campana(dk, mode, c).forEach((r, i) => {
        const R = rows[i]; R.reached++; R.tries += r.tries; R.spent += r.spent;
        if (r.wonAt === 1) R.first++;
        if (r.wonAt) R.ts.push(r.t);
      });
    }
    console.log(`\n${dk} ${mode} (${CAMPANAS} campañas, bot medio)`);
    rows.forEach((R, i) => {
      const ts = R.ts.sort((a, b) => a - b), med = ts[ts.length >> 1];
      console.log(`${String(i + 1).padStart(2)} ${STAGE_ORDER[i].padEnd(13)} llegan ${String(R.reached).padStart(2)}  gana al 1.º ${String(R.first).padStart(2)}  intentos ${(R.tries / Math.max(1, R.reached)).toFixed(1)}  mediana ${med ? med.toFixed(0).padStart(3) : '  -'} s  gastado S/ ${Math.round(R.spent / Math.max(1, R.reached))}`);
    });
  }
}, 1_800_000);
