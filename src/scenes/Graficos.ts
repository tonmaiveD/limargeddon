import Phaser from 'phaser';
import { H, W, ZOOM } from '../core/constants';
import { drawCar } from '../core/damage-render';
import { FONT, Gfx } from '../core/gfx';
import { bakeCar, type CarArt } from '../core/art/bake';
import { drawVehicle } from '../core/art/vehicles';
import { drawFoe, drawObstacle, drawPickupB, drawShot } from '../core/art/props';
import { STAGES, STAGE_ORDER } from '../stages';
import { createGame, newKeys, type Car, type Game } from '../core/state';
import { update as stepGame } from '../core/world';

const BAKE_SCALE = 4;

/*
 * Prueba de gráficos (ADR 0041, en evaluación): se abre con ?graficos en la dirección y no cambia nada del juego.
 * Compara el dibujo actual con el nivel B (vehículos horneados con sombreado) en el Tico, un sedán y una combi,
 * sanos y dañados. Tocar la pantalla alterna entre la vista completa, cada vehículo al doble de tamaño y la galería
 * de todo el tráfico de las diez etapas (sano y dañado), dibujado con el mismo código del juego (ADR 0042).
 */

// Un vehículo de cada tipo distinto del tráfico de las diez etapas, con su primer color.
function gallery(): Car[] {
  const seen = new Set<string>(), out: Car[] = [];
  for (const id of STAGE_ORDER) for (const t of STAGES[id].cfg.traffic.types) {
    const key = t.k + JSON.stringify(t.look ?? {});
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ k: t.k, x: 0, y: 0, w: t.w, h: t.h, vy: 0, hp: 1, max: 1, col: t.cols[0], spin: 0, seed: out.length, look: t.look } as Car);
  }
  return out;
}

interface Row { name: string; art: CarArt; now: { body: string; roof?: string; extra?: (g: Gfx, w: number, h: number) => void }; y: number }

const ROWS: Row[] = [
  {
    name: 'Tico', y: 200, art: { kind: 'tico', w: 28, h: 48, body: '#f2c230', taxi: true },
    now: { body: '#f2c230', roof: '#e0ae1a', extra: (g, _w, h) => {
      g.fillStyle = '#111'; g.fillRect(-8, -h / 2 + h * 0.42, 16, 6);
      g.fillStyle = '#ffe14d'; g.font = FONT(5); g.textAlign = 'center'; g.fillText('TAXI', 0, -h / 2 + h * 0.42 + 5);
    } },
  },
  { name: 'Sedán', y: 340, art: { kind: 'sedan', w: 28, h: 50, body: '#8a2f3f' }, now: { body: '#8a2f3f' } },
  {
    name: 'Combi', y: 495, art: { kind: 'combi', w: 30, h: 60, body: '#f2c230', roof: '#1f9e5a', band: '#d93b3b', label: 'JAVIER PRADO', labelCol: '#f4f1e6' },
    now: { body: '#f2c230', roof: '#1f9e5a', extra: (g, w, h) => {
      g.fillStyle = '#d93b3b'; g.fillRect(-w / 2, -h / 2 + h * 0.55, w, 5);
      g.fillStyle = '#1f9e5a'; g.font = FONT(5); g.textAlign = 'center'; g.fillText('JAVIER PRADO', 0, -h / 2 + h * 0.5);
    } },
  },
];
const COLS = { nowOk: 52, nowHit: 122, newOk: 238, newHit: 308 };
const ZCOLS = { nowOk: 108, nowHit: 146, newOk: 214, newHit: 252 }; // vista ampliada: una fila, más junta
const HIT = 0.65, SEED = 3;

export class GraficosScene extends Phaser.Scene {
  private bg!: Gfx;
  private cars!: Gfx;
  private ui!: Gfx;
  private view = 0; // 0 todo, 1..3 un vehículo al doble, 4 y 5 galería sana y dañada
  private cars2!: Gfx;
  private carsFx!: Gfx;
  private list: Car[] = gallery();
  private bosses: { id: string; G: Game }[] = [];
  private imgs: Phaser.GameObjects.Image[][] = [];

  constructor() { super('Graficos'); }

  create(): void {
    this.bg = new Gfx(this, 0); this.cars = new Gfx(this, 10); this.ui = new Gfx(this, 30);
    this.cars2 = new Gfx(this, 15); this.carsFx = new Gfx(this, 16);
    ROWS.forEach((r, i) => {
      this.imgs[i] = [0, HIT].map((d) => {
        const key = `art-${i}-${d}`;
        if (!this.textures.exists(key)) this.textures.addCanvas(key, bakeCar(r.art, d, SEED, BAKE_SCALE));
        return this.add.image(0, r.y, key).setDepth(10).setScale(1 / BAKE_SCALE); // la imagen es BAKE_SCALE veces más grande
      });
    });
    this.input.on('pointerdown', () => { this.view = (this.view + 1) % (ROWS.length + 9); });
    // un juego por jefe, avanzado hasta que el jefe entra, para dibujarlo con su propio código (ADR 0043)
    for (const id of STAGE_ORDER) {
      const def = STAGES[id], G = createGame(structuredClone(def.cfg), 'normal', newKeys(), def.ai);
      for (let i = 0; i < 600 && (G.b.state === 'enter' || (def.cfg.boss.body && !G.chains.length)); i++) { stepGame(G, 1 / 60); G.traffic = []; G.p.hp = G.p.max; }
      for (const ch of G.chains) ch.segs.length = Math.min(ch.segs.length, 2);
      this.bosses.push({ id, G });
    }
    document.getElementById('menu')!.hidden = true;
  }

  update(): void {
    const cam = this.cameras.main, t0 = this.time.now / 1000;
    const gal = this.view > ROWS.length, bossView = this.view >= ROWS.length + 3 && this.view <= ROWS.length + 5, propsView = this.view >= ROWS.length + 6;
    this.cars2.begin(); this.carsFx.begin();
    if (bossView) { // galería de jefes: sanos, dañados y el carguero
      const page = this.view - (ROWS.length + 3);
      this.bosses.forEach(({ id, G }, i) => {
        G.t = t0; G.b.flash = null; G.b.hitFlash = 0; G.b.hp = page === 1 ? G.b.max * 0.3 : G.b.max; G.b.state = 'cruise'; G.b.ang = 0;
        if (id === 'linea-amarilla') {
          if (page !== 2) return;
          G.route.plane = { phase: 'hold', x: W / 2, y: H / 2, t: 1 };
        } else {
          if (page === 2) return;
          const n = i; G.b.x = 62 + (n % 3) * 118; G.b.y = 150 + Math.floor(n / 3) * 175;
          for (const ch of G.chains) ch.segs.forEach((sg, k) => { sg.x = G.b.x + (k + 1) * 4; sg.y = G.b.y + G.b.h / 2 + 24 + k * 46; sg.hp = page === 1 ? sg.max * 0.3 : sg.max; });
        }
        STAGES[id].drawBoss(this.carsFx, G, this.cars2);
      });
    }
    const labels: [string, number, number][] = [];
    if (propsView) { // obstáculos de las diez etapas (dos páginas) y proyectiles con bonus (ADR 0044)
      const page = this.view - (ROWS.length + 6);
      if (page < 2) {
        const all = this.bosses.flatMap(({ G }) => (G.cfg.obstacles ?? []).map((o, i) => ({ G, o, i })));
        all.slice(page * 13, page * 13 + 13).forEach(({ G, o, i }, row) => {
          const w = o.w ?? Math.min(o.lanes * G.cfg.road.laneWidth, 130), y = 90 + row * 42;
          G.t = t0; drawObstacle(this.cars2, G, { i, x: 220, y, w, h: o.h, hit: false, ph: 0 } as never);
          labels.push([`${G.cfg.id.slice(0, 8)} · ${o.k}`.toUpperCase(), 60, y]);
        });
      } else {
        const G = this.bosses[1].G; G.t = t0;
        const foes = [['moneda', 5, '#ffd23f'], ['rollo', 7, '#ff2e88'], ['contenedor', 8, '#d93b3b'], ['rompellantas', 6, '#2a2632'], ['piedra', 9, '#8a7a5a']] as const;
        foes.forEach(([look, r, col], k) => { drawFoe(this.cars2, G, { x: 50 + k * 65, y: 130, vx: 0, vy: 0, r, dmg: 0, col, look } as never); labels.push([look.toUpperCase(), 50 + k * 65, 165]); });
        (['cone', 'picaron', 'oil', 'kernel'] as const).forEach((k, n) => { drawShot(this.cars2, G, { k, x: 70 + n * 75, y: 250, vx: 0, vy: 0, r: 5 }); labels.push([k.toUpperCase(), 70 + n * 75, 280]); });
        (Object.keys(G.cfg.powers) as (keyof typeof G.cfg.powers)[]).forEach((k, n) => {
          const x = 50 + (n % 4) * 87, y = 380 + Math.floor(n / 4) * 90;
          drawPickupB(this.cars2, G, { k, x, y, r: 12, rot: t0 * 3 } as never); labels.push([G.cfg.powers[k].label.toUpperCase(), x, y + 34]);
        });
      }
    }
    if (gal && !bossView && !propsView) { // galería: todo el tráfico, en grilla de cuatro columnas
      const hurt = this.view === ROWS.length + 2;
      this.list.forEach((c, i) => {
        c.x = 50 + (i % 4) * 87; c.y = 120 + Math.floor(i / 4) * 92; c.hp = hurt ? 0.35 : 1; c.brakeT = hurt ? 0 : (i % 3 === 0 ? 1 : 0);
        drawVehicle(this.cars2, this.carsFx, t0, c);
      });
    }
    this.cars2.end(); this.carsFx.end();
    for (const row of this.imgs) for (const im of row) im.setVisible(!gal);
    if (gal) {
      cam.setZoom(ZOOM).centerOn(W / 2, H / 2);
      const g0 = this.bg; g0.begin(); g0.fillStyle = '#2b2733'; g0.fillRect(-100, 0, W + 200, H); g0.end();
      this.cars.begin(); this.cars.end();
      const u = this.ui; u.begin(); u.textAlign = 'center'; u.fillStyle = '#ffe14d'; u.font = FONT(11);
      const titles = ['TRÁFICO · NIVEL B', 'TRÁFICO DAÑADO', 'JEFES · NIVEL B', 'JEFES DAÑADOS', 'EL CARGUERO', 'OBSTÁCULOS 1', 'OBSTÁCULOS 2', 'PROYECTILES Y BONUS'];
      u.fillText(titles[this.view - ROWS.length - 1], W / 2, 40);
      u.font = FONT(5); u.fillStyle = '#b9b4c4';
      for (const [txt, x, y] of labels) u.fillText(txt, x, y);
      if (propsView) { u.end(); return; }
      if (!bossView) this.list.forEach((c) => u.fillText(c.k.toUpperCase(), c.x, c.y + c.h / 2 + 12));
      else if (this.view < ROWS.length + 5) this.bosses.forEach(({ G }) => { if (G.cfg.route) return; u.fillText(G.cfg.boss.title.toUpperCase(), G.b.x, G.b.y - G.b.h / 2 - 10); });
      u.end(); return;
    }
    if (this.view === 0) cam.setZoom(ZOOM).centerOn(W / 2, H / 2);
    else cam.setZoom(ZOOM * 2).centerOn(W / 2, ROWS[this.view - 1].y);
    const t = this.time.now / 1000;
    const g = this.bg; g.begin();
    g.fillStyle = '#2b2733'; g.fillRect(-100, 0, W + 200, H);
    g.fillStyle = 'rgba(255,255,255,.35)';
    for (const x of [87, 180, 273]) for (let y = (t * 60) % 40 - 40; y < H; y += 40) g.fillRect(x - 1, y, 2, 20);
    g.fillStyle = '#f2c230'; g.fillRect(4, 0, 3, H); g.fillRect(W - 7, 0, 3, H);
    g.end();
    const c = this.cars, K = this.view ? ZCOLS : COLS; c.begin();
    ROWS.forEach((r, i) => {
      const on = !this.view || this.view === i + 1;
      this.imgs[i][0].setPosition(K.newOk, r.y).setVisible(on); this.imgs[i][1].setPosition(K.newHit, r.y).setVisible(on);
      if (!on) return;
      drawCar(c, t, { x: K.nowOk, y: r.y, w: r.art.w, h: r.art.h }, { ...r.now, seed: SEED, dmg: 0 });
      drawCar(c, t, { x: K.nowHit, y: r.y, w: r.art.w, h: r.art.h }, { ...r.now, seed: SEED, dmg: HIT });
    });
    c.end();
    const u = this.ui; u.begin(); u.textAlign = 'center';
    u.fillStyle = '#ffe14d'; u.font = FONT(13); u.fillText('PRUEBA DE GRÁFICOS', W / 2, 34);
    if (this.view) { // vista ampliada: rótulos junto a la fila
      const r = ROWS[this.view - 1], top = r.y - r.art.h / 2 - 14;
      u.font = FONT(6); u.fillStyle = '#fff';
      u.fillText('ACTUAL', (K.nowOk + K.nowHit) / 2, top - 8); u.fillText('NIVEL B', (K.newOk + K.newHit) / 2, top - 8);
      u.font = FONT(4); u.fillStyle = '#b9b4c4';
      for (const x of [K.nowOk, K.newOk]) u.fillText('SANO', x, top);
      for (const x of [K.nowHit, K.newHit]) u.fillText('DAÑADO', x, top);
      u.font = FONT(6); u.fillStyle = '#ffe14d'; u.fillText(r.name.toUpperCase(), W / 2, r.y + r.art.h / 2 + 16);
      u.end(); return;
    }
    u.font = FONT(10); u.fillStyle = '#fff';
    u.fillText('ACTUAL', (COLS.nowOk + COLS.nowHit) / 2, 78); u.fillText('NIVEL B', (COLS.newOk + COLS.newHit) / 2, 78);
    u.font = FONT(7); u.fillStyle = '#b9b4c4';
    for (const x of [COLS.nowOk, COLS.newOk]) u.fillText('SANO', x, 98);
    for (const x of [COLS.nowHit, COLS.newHit]) u.fillText('DAÑADO', x, 98);
    for (const r of ROWS) { u.fillStyle = '#ffe14d'; u.fillText(r.name.toUpperCase(), W / 2, r.y + 2); }
    u.fillStyle = '#b9b4c4'; u.fillText('TOCA PARA AMPLIAR CADA UNO', W / 2, H - 24);
    u.end();
  }
}
