import { describe, expect, it } from 'vitest';
import { startPort, stepPort } from './harness/port';
import { seedRandom } from './harness/rng';
import { STAGES, STAGE_ORDER } from '../src/stages';
import { SONGS } from '../src/core/audio/songs';
import { lightGreen } from '../src/core/lights';
import { startEnding, updateEnding } from '../src/core/ending';

/* Ambiente (ADR 0038): música por distrito, semáforos en ola de la Javier Prado y animaciones de cierre. */

const DT = 1 / 60;
function withSeed<T>(seed: number, fn: () => T): T { const r = seedRandom(seed); try { return fn(); } finally { r(); } }

describe('música por distrito', () => {
  it('cada etapa tiene su canción y son todas distintas', () => {
    const ids = STAGE_ORDER.map((id) => STAGES[id].cfg.music);
    for (const id of ids) expect(SONGS[id!], String(id)).toBeDefined();
    expect(new Set(ids).size).toBe(STAGE_ORDER.length);
    expect(STAGES['san-isidro'].cfg.music).toBe('cumbia'); // la del prototipo se queda en San Isidro
  });

  it('las canciones están bien formadas', () => {
    for (const [id, s] of Object.entries(SONGS)) {
      expect(s.bpm, id).toBeGreaterThan(60); expect([2, 3, 4]).toContain(s.sub);
      for (const v of [s.bass, s.lead, s.chords].filter(Boolean)) {
        expect(v!.notes.length, id).toBeGreaterThan(0);
        for (const n of v!.notes.flat()) expect(n === 0 || (n >= 24 && n <= 96), `${id} ${n}`).toBe(true);
      }
      for (const pat of Object.values(s.drums)) expect(pat, id).toMatch(/^[xX.]+$/);
    }
  });
});

describe('semáforos en ola', () => {
  const jp = STAGES['javier-prado'].cfg;
  function game() {
    const G = startPort('normal', jp); G.p.pw.soat = 99;
    for (let i = 0; i < 400 && G.b.state === 'enter'; i++) stepPort(G, DT);
    G.traffic = []; G.trafficT = 99; G.obstacles = []; G.obsT = G.obsT.map(() => 99); G.b.act = 99; G.lightT = 99;
    return G;
  }

  it('llegan en olas y se ponen en verde uno tras otro al bajar', () => withSeed(1, () => {
    const G = game(); G.lightT = 0.001; stepPort(G, DT);
    expect(G.lights).toHaveLength(jp.lights!.wave);
    expect(lightGreen(G, jp.lights!.greenY - 1)).toBe(false);
    expect(lightGreen(G, jp.lights!.greenY)).toBe(true);
  }));

  it('en la línea de crucero pasas en verde, adelantado es papeleta', () => withSeed(2, () => {
    const cross = (y: number) => {
      const G = game(); G.lights = [{ y: y - 20, done: false, boss: true }];
      for (let i = 0; i < 60 && G.lights.length && !G.lights[0].done; i++) { G.p.y = y; G.p.vy = 0; G.b.act = 99; stepPort(G, DT); }
      return G.stats.infractions;
    };
    expect(cross(jp.player.y)).toBe(0);
    expect(cross(jp.lights!.greenY - 120)).toBe(1);
  }));

  it('la combi se pasa la roja sin papeleta y lo dice', () => withSeed(3, () => {
    const G = game(); G.lights = [{ y: G.b.y + 2, done: true, boss: false }];
    stepPort(G, DT);
    expect(G.lights[0].boss).toBe(true);
    expect(G.fines).toBe(0);
    expect(G.floats.some((f) => f.text === 'SE PASÓ LA ROJA')).toBe(true);
  }));
});

describe('animaciones de cierre', () => {
  it('Costa Verde: Don Frío cruza la meta primero y el cierre termina solo', () => withSeed(4, () => {
    const G = startPort('normal', STAGES['costa-verde'].cfg); G.result = { win: true }; G.mode = 'over';
    startEnding(G);
    expect([G.traffic.length, G.chains.length]).toEqual([0, 0]);
    let done = false;
    for (let i = 0; i < 60 * 6 && !done; i++) done = updateEnding(G, DT);
    expect(done).toBe(true);
    expect(G.ending!.crossed).toBe(true);
    expect(G.ending!.t).toBeCloseTo(STAGES['costa-verde'].cfg.ending!.dur, 1);
  }));

  it('solo la Costa Verde y la Línea Amarilla tienen cierre, con textos sin puntuación prohibida', () => {
    const with_ = STAGE_ORDER.filter((id) => STAGES[id].cfg.ending);
    expect(with_).toEqual(['costa-verde', 'linea-amarilla']);
    for (const id of with_) expect(STAGES[id].cfg.ending!.text).not.toMatch(/[:;—]/);
    expect(STAGES['linea-amarilla'].cfg.ending!.kind).toBe('carguero');
  });
});
