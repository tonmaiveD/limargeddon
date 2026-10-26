import { describe, expect, it, vi } from 'vitest';
vi.mock('phaser', () => ({ default: {} }));
import { Gfx } from '../src/core/gfx';
import { roadWarp } from '../src/core/road';
import { FrameMeter, stats } from '../src/core/frames';
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
    m.add(5000); // ni un salto de más de un segundo (pestaña oculta)
    const s = m.summary();
    expect(s.warm).toMatchObject({ n: 150, p50: 20, over20: 0 });
    expect(s.play).toMatchObject({ n: 100, p50: 16, p95: 16, p99: 25, max: 40, over20: 5, over33: 1 });
  });

  it('los percentiles salen del orden de los intervalos', () => {
    const ms = Array.from({ length: 100 }, (_, i) => i + 1);
    expect(stats(ms)).toMatchObject({ p50: 50, p95: 95, p99: 99, max: 100 });
    expect(stats([])).toBeNull();
  });
});

describe('Vista de colisiones', () => {
  it('dibuja el contorno de cada zona de choque donde la simulación la usa', () => {
    const G = startPort('normal', structuredClone(cv) as StageConfig), f = fakeScene(), g = new Gfx(f.scene, 20);
    G.traffic = [{ ...G.p, x: 120, y: 200, w: 30, h: 52 } as unknown as Game['traffic'][number]];
    G.foes = [{ x: 200, y: 300, vx: 0, vy: 0, r: 9, dmg: 10, col: '#fff' }];
    drawHitboxes(g, G);
    expect(f.lines.some((l) => l.pts.length === 4 && l.pts[0].x === G.p.x - G.p.w / 2 && l.pts[0].y === G.p.y - G.p.h / 2)).toBe(true);
    expect(f.lines.some((l) => l.pts.length === 4 && l.pts[0].x === 105 && l.pts[0].y === 174)).toBe(true);
    const foe = f.lines.find((l) => l.pts.length > 8)!;
    expect(Math.max(...foe.pts.map((q) => dist(q, { x: 200, y: 300 })))).toBeCloseTo(9, 5);
  });
});
