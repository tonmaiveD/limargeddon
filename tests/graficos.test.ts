import { describe, expect, it, vi } from 'vitest';
vi.mock('phaser', () => ({ default: {} }));
import { Gfx } from '../src/core/gfx';
import { roadWarp } from '../src/core/road';
import { FrameMeter, JANK_MS, STALL_MS, frameMs, stats } from '../src/core/frames';
import { drawCoil, EXIT_R } from '../src/bosses/doblefila-render';
import { drawEndingUI } from '../src/core/ending';
import { drawHitboxes } from '../src/core/hitboxes';
import { STAGES } from '../src/stages';
import { startPort } from './harness/port';
import { fakeScene, type Pt } from './harness/fake-scene';
import type { StageConfig } from '../src/core/config';
import type { Game } from '../src/core/state';

/* Hallazgos gráficos de la quinta auditoría (ADR 0045): la flecha del enrosque y las correas del carguero. */

const cv = STAGES['costa-verde'].cfg;
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
const angDiff = (a: number, b: number) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
const ARROW = 7; // la flecha es el único polígono de siete puntos

function coilGame(gap: number): Game {
  const G = startPort('normal', structuredClone(cv) as StageConfig);
  Object.assign(G.coil, { st: 'hold', cx: 180, cy: 470, r: 54, gap, half: 0.4 });
  G.t = 0.1;
  return G;
}

describe('Flecha de salida del enrosque sobre la pista curva', () => {
  // barrido de regresión: varias salidas y varios tramos de la curva de la Costa Verde
  const cases = [0, 1, 2, 3, 4, 5].flatMap((i) => [400, 1250, 2600, 3900].map((scroll) => ({ gap: (i / 6) * Math.PI * 2 + 0.3, scroll })));

  it('la flecha queda sobre la proyección real del hueco, con error menor de 1 px', () => {
    let worstOld = 0;
    for (const { gap, scroll } of cases) {
      const G = coilGame(gap), c = G.coil, f = fakeScene(), g = new Gfx(f.scene, 12.5);
      const warp = roadWarp(cv, scroll)!;
      g.warp = warp;
      drawCoil(g, G);
      const arrow = f.shapes.find((s) => s.pts.length === ARROW)!;
      // la base de la flecha es el punto medio entre sus dos barbas; la punta va hacia afuera
      const base = { x: (arrow.pts[1].x + arrow.pts[6].x) / 2, y: (arrow.pts[1].y + arrow.pts[6].y) / 2 }, tip = arrow.pts[0];
      const gx = c.cx + Math.cos(gap) * (c.r + EXIT_R), gy = c.cy + Math.sin(gap) * (c.r + EXIT_R);
      const real = { x: gx + warp(gy), y: gy }, out = { x: gx + Math.cos(gap) * 10, y: gy + Math.sin(gap) * 10 };
      const realOut = { x: out.x + warp(out.y), y: out.y };
      expect(dist(base, real)).toBeLessThan(1);
      expect(angDiff(Math.atan2(tip.y - base.y, tip.x - base.x), Math.atan2(realOut.y - real.y, realOut.x - real.x))).toBeLessThan(0.02);
      // con el dibujo anterior (rígido en el centro del anillo) la base se corría
      const old = new Gfx(f.scene, 0); old.warp = warp;
      let oldBase: Pt = { x: 0, y: 0 };
      old.rigid(c.cx, c.cy, () => { oldBase = old.project(gx, gy); });
      worstOld = Math.max(worstOld, dist(oldBase, real));
    }
    expect(worstOld).toBeGreaterThan(3); // el barrido sí pasa por tramos donde el error anterior se notaba
  });

  it('el letrero SALIDA se lee derecho y sigue al hueco', () => {
    const G = coilGame(1.1), f = fakeScene(), g = new Gfx(f.scene, 12.5), warp = roadWarp(cv, 1250)!;
    g.warp = warp;
    drawCoil(g, G);
    const t = f.texts.find((x) => x.text === 'SALIDA' && x.visible)!, c = G.coil;
    const ly = c.cy + Math.sin(1.1) * (c.r + 34);
    expect(Math.abs(t.x - (c.cx + Math.cos(1.1) * (c.r + 34) + warp(ly)))).toBeLessThan(1);
  });

  it('sin curva dibuja igual que antes', () => {
    const G = coilGame(0.7), f = fakeScene(), g = new Gfx(f.scene, 12.5);
    drawCoil(g, G);
    const a = f.shapes.find((s) => s.pts.length === ARROW)!, c = G.coil;
    expect(dist(a.pts[0], { x: c.cx + Math.cos(0.7) * (c.r + EXIT_R + 16), y: c.cy + Math.sin(0.7) * (c.r + EXIT_R + 16) })).toBeLessThan(0.01);
  });
});

describe('Correas del carguero', () => {
  it('quedan por encima del Tico amarrado', () => {
    const f = fakeScene(), ui = new Gfx(f.scene, 30), top = new Gfx(f.scene, 30.5);
    ui.over = top;
    const G = startPort('normal', structuredClone(STAGES['linea-amarilla'].cfg) as StageConfig);
    const E = G.cfg.ending;
    expect(E?.kind).toBe('carguero');
    G.ending = { t: 1, crossed: true };
    drawEndingUI(ui, G, (g, box) => g.image('tico', box.x, box.y, 1));
    const tico = f.images.find((i) => i.key === 'tico')!;
    const straps = f.shapes.filter((s) => s.color === 0x6c717c && s.pts[0].y >= 316 && s.pts[0].y <= 344);
    expect(straps.length).toBe(2);
    for (const s of straps) expect(s.depth).toBeGreaterThan(tico.depth);
  });
});

describe('Medición de fluidez para el registro', () => {
  it('separa el calentamiento, ignora las pausas y resume en percentiles', () => {
    const m = new FrameMeter();
    m.add(500); // el primer intervalo mide la carga, no el dibujo
    for (let i = 0; i < 150; i++) m.add(20); // justo tres segundos de calentamiento
    for (let i = 0; i < 95; i++) m.add(16);
    for (let i = 0; i < 4; i++) m.add(25);
    m.add(40);
    m.resume(); m.add(900); // la vuelta de una pausa no cuenta
    m.add(6000); // ni un salto de más de cinco segundos (equipo suspendido)
    const s = m.summary();
    expect(s.warm).toMatchObject({ n: 150, p50: 20, over20: 0 });
    expect(s.play).toMatchObject({ n: 100, p50: 16, p95: 16, p99: 25, max: 40, over20: 5, over33: 1 });
    expect(s.stalls).toEqual([]);
  });

  // sexta auditoría, S01: con el intervalo suavizado de Phaser estos picos desaparecían
  it.each([40, 120, 300])('conserva picos de %i ms en máximo, p99 y conteo', (spike) => {
    const m = new FrameMeter();
    m.add(16.67);
    for (let i = 0; i < 180; i++) m.add(16.67); // calentamiento
    for (let i = 1; i <= 600; i++) m.add(i % 60 === 0 ? spike : 16.67);
    const s = m.summary().play!;
    expect(s.max).toBe(spike);
    expect(s.p99).toBe(spike);
    expect(s.over33).toBe(10);
    expect(s.over20).toBe(10);
    expect(m.summary().stalls).toEqual(spike >= STALL_MS ? Array(10).fill(spike) : []);
  });

  it('mide el intervalo crudo del bucle y no el suavizado', () => {
    expect(frameMs({ rawDelta: 300, delta: 16.7 } as { rawDelta: number })).toBe(300);
  });

  it('el umbral de cuadro perdido es el del criterio de aceptación', () => {
    expect(JANK_MS).toBe(33.3);
    expect(stats([33.3, 33.4])!.over33).toBe(1);
  });

  it('los percentiles salen del orden de los intervalos', () => {
    const ms = Array.from({ length: 100 }, (_, i) => i + 1);
    expect(stats(ms)).toMatchObject({ p50: 50, p95: 95, p99: 99, max: 100 });
    expect(stats([])).toBeNull();
  });
});

describe('Vista de colisiones', () => {
  const ME = 0x3dff9a, HURT = 0xff2e88, GOOD = 0xffe14d;
  function view(G: Game, warp: ((y: number) => number) | null = null) {
    const f = fakeScene(), g = new Gfx(f.scene, 20);
    g.warp = warp; drawHitboxes(g, G);
    return f.lines;
  }
  function bare(): Game {
    const G = startPort('normal', structuredClone(cv) as StageConfig);
    G.traffic = []; G.obstacles = []; G.foes = []; G.pickups = []; G.shots = []; G.chains = [];
    G.p.x = 180; G.p.y = 500;
    return G;
  }
  const radius = (pts: Pt[], c: Pt) => Math.max(...pts.map((q) => dist(q, c)));

  it('proyecta la caja del Tico punto a punto, con error menor de 1 px en toda la curva', () => {
    let worst = 0;
    for (let scroll = 0; scroll < 6000; scroll += 20) {
      const G = bare(), p = G.p, warp = roadWarp(cv, scroll)!;
      const boxLine = view(G, warp).find((l) => l.color === ME)!;
      for (const q of boxLine.pts) {
        const x = q.x - warp(q.y), y = q.y; // de vuelta al espacio lógico
        const dx = Math.abs(x - p.x) - p.w / 2, dy = Math.abs(y - p.y) - p.h / 2;
        worst = Math.max(worst, Math.abs(Math.max(dx, dy))); // distancia al borde de la caja
      }
    }
    expect(worst).toBeLessThan(1);
  });

  it('el proyectil y los bonus se ven tocar al Tico solo cuando la regla los cuenta', () => {
    const G = bare(), p = G.p;
    G.foes = [{ x: p.x, y: p.y + 30, vx: 0, vy: 0, r: 9, dmg: 10, col: '#fff' }]; // 30 contra 9 + 14: no golpea
    G.pickups = [{ k: 'turbo', x: p.x + 30, y: p.y, r: 9, rot: 0 } as Game['pickups'][number]]; // 30 contra 9 + 24: recoge
    const lines = view(G);
    // círculos de ese color centrados en c (el centro de un círculo es el promedio de sus puntos)
    const mid = (pts: Pt[]) => ({ x: pts.reduce((a, q) => a + q.x, 0) / pts.length, y: pts.reduce((a, q) => a + q.y, 0) / pts.length });
    const at = (c: Pt, col: number) => lines.filter((l) => l.color === col && dist(mid(l.pts), c) < 0.5).map((l) => radius(l.pts, c));
    const meHurt = Math.max(...at(p, HURT)), foe = Math.min(...at(G.foes[0], HURT));
    const meGood = Math.max(...at(p, GOOD)), pick = Math.min(...at(G.pickups[0], GOOD));
    expect(meHurt).toBeCloseTo(p.w / 2, 3); expect(foe).toBeCloseTo(9, 3);
    expect(meGood).toBeCloseTo(p.h / 2, 3); expect(pick).toBeCloseTo(9, 3);
    expect(meHurt + foe < 30).toBe(!(Math.hypot(0, 30) < 9 + p.w / 2)); // no se tocan y no golpea
    expect(meGood + pick > 30).toBe(Math.hypot(30, 0) < p.h / 2 + 9); // se tocan y recoge
  });

  it('en el aire la caja de contacto se ve tenue y los círculos no', () => {
    const G = bare(); G.p.air = 0.5;
    const lines = view(G);
    expect(lines.find((l) => l.color === ME)!.alpha).toBeLessThan(0.5);
    expect(lines.filter((l) => l.color === HURT).every((l) => (l.alpha ?? 1) > 0.5)).toBe(true);
  });

  it('en el enrosque muestra un sector por auto del anillo', () => {
    const G = bare();
    Object.assign(G.coil, { st: 'hold', cx: 180, cy: 470, r: 54, gap: 0, half: 0.4, slots: [1, 2, 3, 4, 5] });
    const sectors = view(G).filter((l) => l.color === HURT && l.pts.length > 20 && radius(l.pts, { x: 180, y: 470 }) > 54);
    expect(sectors.length).toBe(5);
  });
});
