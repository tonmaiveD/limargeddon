import { describe, expect, it } from 'vitest';
import { startPort, stepPort } from './harness/port';
import { seedRandom } from './harness/rng';
import { STAGES, nextStage } from '../src/stages';
import { dmgBoss } from '../src/core/state';
import { rampBox } from '../src/bosses/route-ai';
import type { Game } from '../src/core/state';

/* Etapa secreta, la Línea Amarilla del Terror (ADR 0030): ruta por tramos, intentos, peajes de pago, túnel, marea y carguero. */

const DT = 1 / 60;
const la = STAGES['linea-amarilla'].cfg;
function withSeed<T>(seed: number, fn: () => T): T { const r = seedRandom(seed); try { return fn(); } finally { r(); } }
function game(): Game {
  const G = startPort('normal', la); stepPort(G, DT); // el primer cuadro arma la ruta
  G.p.pw.soat = 0; G.traffic = []; G.obstacles = []; G.obsT = G.obsT.map(() => 99); G.trafficT = 99; G.swarmT = G.swarmT.map(() => 99); G.pickT = 99;
  return G;
}
const goTo = (G: Game, id: string) => { // avanza el recorrido hasta el comienzo del tramo
  const i = la.route!.tramos.findIndex((t) => t.id === id);
  G.route.dist = la.route!.tramos.slice(0, i).reduce((a, t) => a + t.len, 0) - 0.001; stepPort(G, DT);
};

describe('Línea Amarilla del Terror', () => {
  it('es la etapa secreta, después de la Costa Verde', () => {
    expect(la.secret).toBe(true);
    expect(nextStage('costa-verde')).toBe('linea-amarilla');
    expect(la.boss.phases.map((p) => p.name)).toEqual(la.route!.tramos.map((t) => t.name));
  });

  it('avanza por tramos y la pista se angosta en el túnel y en el puente', () => withSeed(1, () => {
    const G = game();
    expect(G.route.i).toBe(0); expect(G.cfg.road.lanes).toBe(4);
    goTo(G, 'tunel'); expect([G.route.i, G.cfg.road.lanes]).toEqual([1, 3]);
    goTo(G, 'puente'); expect([G.route.i, G.cfg.road.lanes]).toEqual([2, 2]);
    expect(STAGES['linea-amarilla'].cfg.road.lanes).toBe(4); // la config original no se toca
  }));

  it('nada daña la barra del recorrido', () => withSeed(2, () => {
    const G = game(), hp = G.b.hp;
    expect(dmgBoss(G, 500, true)).toBe(0); expect(G.b.hp).toBe(hp);
  }));

  it('el peaje cobra en los carriles abiertos y romper uno cerrado daña y suma estrella', () => withSeed(3, () => {
    const pay = (closed: boolean) => {
      const G = game(), i = la.obstacles!.findIndex((o) => o.k === 'peaje'), o = la.obstacles![i];
      for (let ph = 0; ph < 1; ph += 0.1) { // fase del peaje que deja el carril del Tico abierto o cerrado
        const lane = Math.floor((G.p.x - G.cfg.road.left) / G.cfg.road.laneWidth);
        if ((((lane + Math.floor(ph * 10)) % G.cfg.road.lanes) >= o.payLanes!) === closed) {
          G.obstacles.push({ i, x: 180, y: G.p.y, w: 260, h: o.h, hit: false, ph }); break;
        }
      }
      const hp = G.p.hp; stepPort(G, DT);
      return { tolls: G.tolls, stars: G.stars, hurt: G.p.hp < hp, faltas: G.stats.infractions, multas: G.fines };
    };
    // pagar no es falta; romper la barrera es una falta para la limpieza, sin multa en soles (ADR 0036)
    expect(pay(false)).toEqual({ tolls: la.obstacles!.find((o) => o.k === 'peaje')!.toll, stars: 0, hurt: false, faltas: 0, multas: 0 });
    expect(pay(true)).toEqual({ tolls: 0, stars: 1, hurt: true, faltas: 1, multas: 0 });
  }));

  it('en el túnel el claxon pegado a la pared te aturde', () => withSeed(4, () => {
    const G = game(); goTo(G, 'tunel');
    G.p.x = G.cfg.road.left + 18; G.p.cd.horn = 0; G.keys.horn = true; stepPort(G, DT);
    expect(G.p.stun).toBeGreaterThan(0.3);
  }));

  it('la marea avanza si no aceleras y te quita vida', () => withSeed(5, () => {
    const G = game(); goTo(G, 'puente');
    const hp = G.p.hp; G.keys.up = false;
    for (let i = 0; i < 60 * 6 && G.route.tideHits === 0; i++) { G.traffic = []; G.obstacles = []; stepPort(G, DT); }
    expect(G.route.tideHits).toBeGreaterThan(0); expect(G.p.hp).toBeLessThan(hp);
  }));

  it('morir gasta un intento y retoma el tramo, hasta que no quedan', () => withSeed(6, () => {
    const G = game(); goTo(G, 'tunel');
    const start = G.route.dist, n = G.route.attempts;
    G.p.hp = 0; G.p.lives = 0; stepPort(G, DT);
    expect([G.route.attempts, G.route.i, G.mode]).toEqual([n - 1, 1, 'play']);
    expect(G.p.hp).toBe(G.p.max); expect(G.route.dist).toBeLessThan(start + 0.1);
    G.route.attempts = 1; G.p.hp = 0; G.p.lives = 0; stepPort(G, DT);
    expect(G.result).toEqual({ win: false });
  }));

  it('subirse a la rampa del carguero gana, y si despega sin ti pierdes un intento', () => withSeed(7, () => {
    const G = game(); goTo(G, 'pista');
    for (let i = 0; i < 400 && G.route.plane.phase !== 'hold'; i++) stepPort(G, DT);
    const r = rampBox(G)!; G.p.x = r.x; G.p.y = r.y; stepPort(G, DT);
    expect(G.result).toEqual({ win: true });
    const H = game(); goTo(H, 'pista'); const n = H.route.attempts;
    for (let i = 0; i < 60 * 20 && H.route.attempts === n; i++) { H.p.x = 60; H.p.y = 600; H.p.hp = H.p.max; stepPort(H, DT); }
    expect(H.route.attempts).toBe(n - 1);
  }));

  it('perder el avión tres veces termina la partida y el contador nunca baja de 0 (auditoría N02)', () => withSeed(8, () => {
    const G = game(); goTo(G, 'pista');
    expect(G.route.attempts).toBe(3);
    for (let i = 0; i < 60 * 120 && G.mode === 'play'; i++) { G.p.x = 60; G.p.y = 600; if (G.p.hp > 0) G.p.hp = G.p.max; stepPort(G, DT); }
    expect(G.result).toEqual({ win: false });
    expect(G.route.attempts).toBe(0);
    expect(G.lastHit).toBe('SE FUE EL AVIÓN');
    // el SOAT de verdad no salva de perder el avión, y muerte y avión comparten los intentos
    const H = game(); goTo(H, 'pista'); H.p.lives = 1;
    H.p.hp = 0; stepPort(H, DT); // la vida extra salva la muerte, no gasta intento
    H.p.lives = 0; H.p.hp = 0; stepPort(H, DT); // muerte: quedan 2
    expect(H.route.attempts).toBe(2);
    for (let i = 0; i < 60 * 120 && H.mode === 'play'; i++) { H.p.x = 60; H.p.y = 600; if (H.p.hp > 0) H.p.hp = H.p.max; stepPort(H, DT); }
    expect(H.result).toEqual({ win: false }); expect(H.route.attempts).toBe(0);
  }));

  it('el Socio de la Combi no rompe la ruta y despeja el tráfico delante del Tico (auditoría N01)', () => withSeed(9, () => {
    const cfg = structuredClone(la); cfg.player.allyEvery = 25; cfg.player.allyDmg = 80;
    const G = startPort('normal', cfg); stepPort(G, DT);
    G.p.pw.soat = 99; G.p.hp = 9999; G.p.max = 9999;
    let seen = false;
    for (let i = 0; i < 60 * 14; i++) {
      if (G.allies.length && !seen) { seen = true; G.traffic.push({ ...G.traffic[0] ?? {}, k: 'auto', x: G.allies[0].x, y: 300, w: 28, h: 48, vy: 0, hp: 30, max: 30, seed: 777, spin: 0, col: '#fff' } as never); }
      stepPort(G, DT);
    }
    expect(seen).toBe(true);
    expect(G.mode).toBe('play');
    expect(G.traffic.some((c) => c.seed === 777 && c.hp > 0)).toBe(false); // la combi se lo llevó
    expect(G.b.hp).toBeGreaterThan(0);
  }));

  it('textos sin dos puntos, punto y coma ni guiones largos', () => {
    const texts = [la.tip, la.rewards.defeatTip!, la.rewards.winLine!, ...la.route!.tramos.flatMap((t) => [t.name, t.banner ?? '']), ...(la.obstacles ?? []).map((o) => o.label ?? '')];
    for (const t of texts) expect(t).not.toMatch(/[:;—]/);
  });
});
