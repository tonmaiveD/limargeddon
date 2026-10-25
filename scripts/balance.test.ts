import { it } from 'vitest';
import type { DiffKey, FireMode, StageConfig } from '../src/core/config';
import { PROTOTYPE_CFG, startPort, stepPort } from '../tests/harness/port';
import { seedRandom } from '../tests/harness/rng';
import { bot } from '../tests/harness/bot';
import { evitaCuerpo, rutaBot, semaforoBot } from '../tests/harness/evita';
import { STAGES } from '../src/stages';
import { applyUpgrades } from '../src/garage/upgrades';

// Reporte de duración de la pelea con bots de tres niveles (30 semillas cada uno). No es un test de CI: npm run balance.
// Compara la config del prototipo con la del juego. Las personas tardan más que los bots: validar con el registro del dispositivo.

// bot "casual": solo conos, detrás del jefe, sin aceite ni claxon
function casual(G: any, k: any) { bot(G, k); const tx = G.b.x; k.left = tx < G.p.x - 6; k.right = tx > G.p.x + 6; k.oil = false; k.horn = false; }
// bot "medio": como el experto pero claxon y aceite solo a veces (reacción tardía)
function medio(G: any, k: any) { bot(G, k); if (Math.floor(G.t * 2) % 3) { k.oil = false; k.horn = false; } }

const conCuerpo = (fn: (G: any, k: any) => void) => (G: any, k: any) => { fn(G, k); evitaCuerpo(G, k); rutaBot(G, k); semaforoBot(G, k); };
const BOTS = [['experto', conCuerpo(bot)], ['medio', conCuerpo(medio)], ['casual', conCuerpo(casual)]] as const;
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
  const si = STAGES['san-isidro'].cfg, mf = STAGES.miraflores.cfg, ce = STAGES.centro.cfg, jp = STAGES['javier-prado'].cfg, ga = STAGES.gamarra.cfg, ca = STAGES.callao.cfg, ve = STAGES['via-expresa'].cfg, pa = STAGES.panamericana.cfg, cv = STAGES['costa-verde'].cfg, la = STAGES['linea-amarilla'].cfg;
  const only = process.env.ETAPA; // npm run balance con ETAPA=miraflores (o san-isidro) para correr solo una
  const variants: [string, StageConfig, FireMode | undefined][] = ([
    ['prototipo', PROTOTYPE_CFG, undefined], ['si-toque', si, 'toque'], ['si-acelerar', si, 'acelerar'],
    ['mf-toque', mf, 'toque'], ['mf-acelerar', mf, 'acelerar'],
    ['ce-toque', ce, 'toque'], ['ce-acelerar', ce, 'acelerar'],
    // con las mejoras típicas al llegar al Centro (~S/ 1.300 gastados)
    ['ce-mej-toque', applyUpgrades(ce, { conos: 1, llantas: 1, parachoques: 1, motor: 1 }), 'toque'],
    ['jp-toque', jp, 'toque'], ['jp-acelerar', jp, 'acelerar'],
    // con las mejoras típicas al llegar a la Javier Prado (~S/ 2.600 gastados)
    ['jp-mej-toque', applyUpgrades(jp, { conos: 2, llantas: 1, parachoques: 1, motor: 1, blindaje: 1 }), 'toque'],
    ['ga-toque', ga, 'toque'], ['ga-acelerar', ga, 'acelerar'],
    // con las mejoras típicas al llegar a Gamarra (~S/ 3.700 gastados)
    ['ga-mej-toque', applyUpgrades(ga, { conos: 2, llantas: 2, parachoques: 1, motor: 1, blindaje: 1, aceite: 1 }), 'toque'],
    ['ca-toque', ca, 'toque'], ['ca-acelerar', ca, 'acelerar'],
    // con las mejoras típicas al llegar al Callao (~S/ 5.000 gastados)
    ['ca-mej-toque', applyUpgrades(ca, { conos: 2, llantas: 2, parachoques: 2, motor: 2, blindaje: 1, aceite: 1 }), 'toque'],
    ['ve-toque', ve, 'toque'], ['ve-acelerar', ve, 'acelerar'],
    // con las mejoras típicas al llegar a la Vía Expresa (~S/ 6.300 gastados)
    ['ve-mej-toque', applyUpgrades(ve, { conos: 2, llantas: 2, parachoques: 2, motor: 2, blindaje: 2, aceite: 1, claxon: 1 }), 'toque'],
    ['pa-toque', pa, 'toque'], ['pa-acelerar', pa, 'acelerar'],
    // con las mejoras típicas al llegar a la Panamericana (~S/ 7.600 gastados)
    ['pa-mej-toque', applyUpgrades(pa, { conos: 2, llantas: 2, parachoques: 2, motor: 2, blindaje: 2, aceite: 2, claxon: 1 }), 'toque'],
    ['cv-toque', cv, 'toque'], ['cv-acelerar', cv, 'acelerar'],
    // con las mejoras típicas al llegar a la Costa Verde (~S/ 9.000 gastados)
    ['cv-mej-toque', applyUpgrades(cv, { conos: 2, llantas: 2, parachoques: 2, motor: 2, blindaje: 2, aceite: 2, claxon: 2 }), 'toque'],
    ['la-toque', la, 'toque'], ['la-acelerar', la, 'acelerar'],
    ['la-mej-toque', applyUpgrades(la, { conos: 2, llantas: 2, parachoques: 2, motor: 2, blindaje: 2, aceite: 2, claxon: 2, turbo: 2, reparacion: 1 }), 'toque'],
  ] as [string, StageConfig, FireMode | undefined][]).filter(([l]) => !only || l.startsWith(({ miraflores: 'mf', centro: 'ce', 'san-isidro': 'si', 'javier-prado': 'jp', gamarra: 'ga', callao: 'ca', 'via-expresa': 've', panamericana: 'pa', 'costa-verde': 'cv', 'linea-amarilla': 'la' } as Record<string, string>)[only] ?? only));
  for (const [label, cfg, mode] of variants) {
    for (const [name, fn] of BOTS) for (const dk of ['facil', 'normal', 'dificil'] as const) {
      rows.push(`${label.padEnd(12)} ${name.padEnd(8)} ${dk.padEnd(8)} ${run(cfg, fn, dk, mode)}`);
    }
  }
  console.log('\n' + rows.join('\n'));
}, 600_000);
