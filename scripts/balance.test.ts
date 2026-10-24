import { it } from 'vitest';
import type { DiffKey, FireMode, StageConfig } from '../src/core/config';
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

function run(cfg: StageConfig, fn: (G: any, k: any) => void, dk: DiffKey, mode?: FireMode) {
  const ts: number[] = []; let wins = 0;
  for (let s = 1; s <= SEEDS; s++) {
    const r = seedRandom(s * 97);
    try {
      const G = startPort(dk, cfg);
      if (mode) G.fireMode = mode;
      for (let i = 0; i < 60 * 300 && G.mode === 'play'; i++) {
        fn(G, G.keys);
        // por toque: el bot toca el botón unas 10 veces por segundo mientras quiere disparar
        if (G.fireMode === 'toque' && G.keys.cone) G.keys.cone = i % 6 === 0;
        stepPort(G, 1 / 60);
      }
      if (G.result?.win) { wins++; ts.push(G.t); }
    } finally { r(); }
  }
  ts.sort((a, b) => a - b);
  const med = ts[ts.length >> 1];
  return `gana ${String(wins).padStart(2)}/${SEEDS}  mediana ${med ? med.toFixed(0).padStart(3) : '  -'} s  rango ${ts.length ? `${ts[0].toFixed(0)}-${ts.at(-1)!.toFixed(0)}` : '-'}`;
}

it('duraciones', () => {
  const rows: string[] = [];
  const si = STAGES['san-isidro'].cfg, mf = STAGES.miraflores.cfg, ce = STAGES.centro.cfg;
  const only = process.env.ETAPA; // npm run balance con ETAPA=miraflores (o san-isidro) para correr solo una
  const variants: [string, StageConfig, FireMode | undefined][] = ([
    ['prototipo', PROTOTYPE_CFG, undefined], ['si-toque', si, 'toque'], ['si-acelerar', si, 'acelerar'],
    ['mf-toque', mf, 'toque'], ['mf-acelerar', mf, 'acelerar'],
    ['ce-toque', ce, 'toque'], ['ce-acelerar', ce, 'acelerar'],
  ] as [string, StageConfig, FireMode | undefined][]).filter(([l]) => !only || l.startsWith(({ miraflores: 'mf', centro: 'ce', 'san-isidro': 'si' } as Record<string, string>)[only] ?? only));
  for (const [label, cfg, mode] of variants) {
    for (const [name, fn] of BOTS) for (const dk of ['facil', 'normal', 'dificil'] as const) {
      rows.push(`${label.padEnd(12)} ${name.padEnd(8)} ${dk.padEnd(8)} ${run(cfg, fn, dk, mode)}`);
    }
  }
  console.log('\n' + rows.join('\n'));
}, 600_000);
