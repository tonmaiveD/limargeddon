import { it } from 'vitest';
import { startPort, stepPort } from '../tests/harness/port';
import { seedRandom } from '../tests/harness/rng';
import { bot } from '../tests/harness/bot';
// bot "casual": solo conos, detrás del jefe, sin aceite ni claxon
function casual(G: any, k: any) { bot(G, k); const tx = G.b.x; k.left = tx < G.p.x - 6; k.right = tx > G.p.x + 6; k.oil = false; k.horn = false; }
// bot "medio": como el experto pero claxon y aceite solo a veces (reacción tardía)
function medio(G: any, k: any) { bot(G, k); if (Math.floor(G.t * 2) % 3) { k.oil = false; k.horn = false; } }
// Reporte de duración de la pelea con bots de tres niveles (30 semillas cada uno). No es un test de CI: npm run balance.
it('duraciones', () => {
  for (const [name, fn] of [['experto', bot], ['medio', medio], ['casual', casual]] as const) for (const dk of ['facil', 'normal', 'dificil'] as const) {
    const ts: number[] = []; let wins = 0;
    for (let s = 1; s <= 30; s++) { const r = seedRandom(s * 97); try { const G = startPort(dk); for (let i = 0; i < 60 * 300 && G.mode === 'play'; i++) { fn(G as any, G.keys); stepPort(G, 1 / 60); } if (G.result?.win) { wins++; ts.push(G.t); } } finally { r(); } }
    ts.sort((a, b) => a - b);
    console.log(name.padEnd(8), dk.padEnd(8), 'gana', wins + '/30', 'mediana', ts[ts.length >> 1]?.toFixed(0), 's', 'rango', ts[0]?.toFixed(0), '-', ts.at(-1)?.toFixed(0));
  }
});
