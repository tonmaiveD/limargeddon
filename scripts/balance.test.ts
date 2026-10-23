import { it } from 'vitest';
import type { DiffKey, StageConfig } from '../src/core/config';
import { PROTOTYPE_CFG, startPort, stepPort } from '../tests/harness/port';
import { seedRandom } from '../tests/harness/rng';
import { bot } from '../tests/harness/bot';
import { STAGES } from '../src/stages';

// Reporte de duración de la pelea con bots de tres niveles (30 semillas cada uno). No es un test de CI: npm run balance.
// Compara la config del prototipo con la del juego. Las personas tardan más que los bots: validar con el registro del dispositivo.

// bot "casual": solo conos, detrás del jefe, sin aceite ni claxon
function casual(G: any, k: any) { bot(G, k); const tx = G.b.x; k.left = tx < G.p.x - 6; k.right = tx > G.p.x + 6; k.oil = false; k.horn = false; }
// bot "medio": como el experto pero claxon y aceite solo a veces (reacción tardía)
function medio(G: any, k: any) { bot(G, k); if (Math.floor(G.t * 2) % 3) { k.oil = false; k.horn = false; } }

const BOTS = [['experto', bot], ['medio', medio], ['casual', casual]] as const;
const SEEDS = 30;

function run(cfg: StageConfig, fn: (G: any, k: any) => void, dk: DiffKey) {
  const ts: number[] = []; let wins = 0;
  for (let s = 1; s <= SEEDS; s++) {
    const r = seedRandom(s * 97);
    try {
      const G = startPort(dk, cfg);
      for (let i = 0; i < 60 * 300 && G.mode === 'play'; i++) { fn(G, G.keys); stepPort(G, 1 / 60); }
      if (G.result?.win) { wins++; ts.push(G.t); }
    } finally { r(); }
  }
  ts.sort((a, b) => a - b);
  const med = ts[ts.length >> 1];
  return `gana ${String(wins).padStart(2)}/${SEEDS}  mediana ${med ? med.toFixed(0).padStart(3) : '  -'} s  rango ${ts.length ? `${ts[0].toFixed(0)}-${ts.at(-1)!.toFixed(0)}` : '-'}`;
}

it('duraciones', () => {
  const rows: string[] = [];
  for (const [label, cfg] of [['prototipo', PROTOTYPE_CFG], ['juego', STAGES['san-isidro'].cfg]] as const) {
    for (const [name, fn] of BOTS) for (const dk of ['facil', 'normal', 'dificil'] as const) {
      rows.push(`${label.padEnd(10)} ${name.padEnd(8)} ${dk.padEnd(8)} ${run(cfg, fn, dk)}`);
    }
  }
  console.log('\n' + rows.join('\n'));
}, 600_000);
