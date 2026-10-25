import { it } from 'vitest';
import type { DiffKey, FireMode, StageConfig } from '../src/core/config';
import { startPort, stepPort } from '../tests/harness/port';
import { seedRandom } from '../tests/harness/rng';
import { bot } from '../tests/harness/bot';
import { STAGES, STAGE_ORDER, wonItems } from '../src/stages';
import { UPGRADES, applyUpgrades, nextLevel, picks, recommended, type Levels } from '../src/garage/upgrades';
import { summarize } from '../src/core/world';
import { evitaCuerpo, rutaBot } from '../tests/harness/evita';

/*
 * Simulador de campaña (npm run campana): el bot medio juega las etapas en orden con lo que va comprando en el taller.
 * Cobra cada pelea como el juego (la etapa repetida paga la mitad), y después de cada victoria compra hasta quedarse
 * sin plata según una política (auditoría N05, ADR 0036):
 * - barata: la mejora más barata que alcanza (la comparación histórica).
 * - ataque: la recomendación "para atacar" del taller y, si no hay, la de aguante.
 * - aguante: la recomendación "para aguantar" y, si no hay, la de ataque.
 * POLITICA=barata|ataque|aguante corre una sola; por defecto corre las tres. Un error del motor se cuenta aparte, no
 * como derrota.
 */

export type Politica = 'barata' | 'ataque' | 'aguante';
const POLITICAS: Politica[] = process.env.POLITICA ? [process.env.POLITICA as Politica] : ['barata', 'ataque', 'aguante'];

function compra(pol: Politica, levels: Levels, wallet: number, unlocked: number, mode: FireMode): string | null {
  if (pol === 'barata') return recommended(levels, wallet, unlocked);
  const p = picks(levels, wallet, unlocked, mode === 'toque' ? 'toque' : 'acelerar');
  return pol === 'ataque' ? p.ataque ?? p.aguante ?? null : p.aguante ?? p.ataque ?? null;
}

const CAMPANAS = Number(process.env.CAMPANAS ?? 20), INTENTOS = 6;
function medio(G: any, k: any) { bot(G, k); if (Math.floor(G.t * 2) % 3) { k.oil = false; k.horn = false; } evitaCuerpo(G, k); rutaBot(G, k); }

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

export function campana(dk: DiffKey, mode: FireMode, seedBase: number, pol: Politica = 'barata') {
  let wallet = 0; const levels: Levels = {}; const out: { stage: string; tries: number; wonAt: number; t: number; spent: number; wallet: number; error?: string }[] = [];
  let spent = 0;
  for (const id of STAGE_ORDER) {
    const def = STAGES[id], n = def.cfg.number;
    let tries = 0, won = false, t = 0, error: string | undefined;
    const arrival = wallet;
    while (!won && !error && tries < INTENTOS) {
      tries++;
      const cfg = applyUpgrades(def.cfg, levels); cfg.player.items = wonItems(n);
      try {
        const s = pelea(cfg, dk, mode, seedBase * 1000 + n * 37 + tries * 7);
        wallet += s.pay; won = s.win; t = s.seconds;
      } catch (e) { error = String(e); }
    }
    out.push({ stage: id, tries, wonAt: won ? tries : 0, t, spent, wallet: arrival, error });
    if (!won) break;
    // taller: compra según la política mientras alcance
    for (let id2 = compra(pol, levels, wallet, n + 1, mode); id2; id2 = compra(pol, levels, wallet, n + 1, mode)) {
      const u = UPGRADES.find((x) => x.id === id2)!, L = nextLevel(u, levels)!;
      wallet -= L.price; spent += L.price; levels[id2] = (levels[id2] ?? 0) + 1;
    }
  }
  return out;
}

it.skipIf(!process.env.CAMPANA)('campaña', () => {
  for (const pol of POLITICAS) for (const [dk, mode] of [['normal', 'toque'], ['normal', 'acelerar']] as [DiffKey, FireMode][]) {
    const rows = STAGE_ORDER.map(() => ({ reached: 0, first: 0, tries: 0, ts: [] as number[], spent: 0, errors: 0 }));
    for (let c = 1; c <= CAMPANAS; c++) {
      campana(dk, mode, c, pol).forEach((r, i) => {
        const R = rows[i]; R.reached++; R.tries += r.tries; R.spent += r.spent;
        if (r.wonAt === 1) R.first++;
        if (r.wonAt) R.ts.push(r.t);
        if (r.error) { R.errors++; if (R.errors === 1) console.log(`ERROR ${pol} ${mode} campaña ${c} en ${r.stage}: ${r.error}`); }
      });
    }
    console.log(`\n${dk} ${mode} · compra ${pol} (${CAMPANAS} campañas, bot medio)`);
    rows.forEach((R, i) => {
      const ts = R.ts.sort((a, b) => a - b), med = ts[ts.length >> 1];
      console.log(`${String(i + 1).padStart(2)} ${STAGE_ORDER[i].padEnd(13)} llegan ${String(R.reached).padStart(2)}  gana al 1.º ${String(R.first).padStart(2)}  intentos ${(R.tries / Math.max(1, R.reached)).toFixed(1)}  mediana ${med ? med.toFixed(0).padStart(3) : '  -'} s  gastado S/ ${Math.round(R.spent / Math.max(1, R.reached))}${R.errors ? `  ERRORES ${R.errors}` : ''}`);
    });
  }
}, 3_600_000);
