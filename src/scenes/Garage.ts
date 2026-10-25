import Phaser from 'phaser';
import { setupCamera } from '../core/camera';
import type { DiffKey } from '../core/config';
import { W } from '../core/constants';
import { Sfx } from '../core/audio/sfx';
import { drawCar } from '../core/damage-render';
import { FONT } from '../core/gfx';
import { beginLayers, createLayers, endLayers, type Layers } from '../core/render';
import { buyUpgrade, getGarage, unlockedStage, type Garage } from '../core/save';
import { C } from '../core/util';
import { CATEGORIES, UPGRADES, applyUpgrades, isLocked, nextGoal, nextLevel, recommended } from '../garage/upgrades';
import { STAGES, stageNumber, wonItems } from '../stages';

export interface GarageData { stageId: string; dk: DiffKey }

const $ = (id: string) => document.getElementById(id)!;
const money = (n: number) => 'S/ ' + n.toLocaleString('es-PE');

/*
 * Taller de La Victoria (ADR 0018): parada rápida entre etapas. Arriba el Tico con sus piezas; abajo la billetera,
 * la meta más cercana, las mejoras por categoría y un botón grande para seguir sin comprar nada.
 */
export class GarageScene extends Phaser.Scene {
  private L!: Layers;
  private data0!: GarageData;
  private garage!: Garage;
  private cat = CATEGORIES[0].id;
  private t = 0;
  private look: { bumper?: boolean; plates?: boolean } | undefined;

  constructor() { super('Garage'); }

  init(data: GarageData): void { this.data0 = data; }

  create(): void {
    setupCamera(this);
    this.L = createLayers(this);
    this.garage = getGarage();
    const rec = recommended(this.garage.levels, this.garage.wallet, unlockedStage(stageNumber));
    if (rec) this.cat = UPGRADES.find((u) => u.id === rec)!.cat; // abre en la categoría de lo recomendado
    const cfg = STAGES[this.data0.stageId].cfg;
    const go = $('gGo') as HTMLButtonElement;
    go.textContent = cfg.secret ? `Seguir a la ${cfg.district}` : `Seguir a la Etapa ${cfg.number}`;
    go.onclick = () => { this.close(); this.scene.start('Stage', { stageId: this.data0.stageId, dk: this.data0.dk }); };
    ($('gMenu') as HTMLButtonElement).onclick = () => { this.close(); this.scene.start('Menu'); };
    this.paint();
    $('garage').hidden = false; go.focus();
    Sfx.engine(0);
  }

  private close(): void { $('garage').hidden = true; }

  private paint(bought?: string): void {
    const { wallet, levels } = this.garage;
    this.look = applyUpgrades(STAGES[this.data0.stageId].cfg, levels).player.look;
    const w = $('gWallet'); w.textContent = money(wallet);
    if (bought) { w.classList.remove('bump'); void w.offsetWidth; w.classList.add('bump'); }
    const unlocked = unlockedStage(stageNumber);
    const goal = nextGoal(levels, wallet, unlocked);
    $('gGoal').textContent = goal ? `Te faltan ${money(goal.missing)} para ${goal.name}.` : 'Te alcanza para cualquier mejora. ¡Elige bien!';
    const items = wonItems(unlocked), it = $('gItems');
    it.hidden = !items.length; it.textContent = `Tus objetos · ${items.map((x) => x.name).join(', ')}`;
    const cats = $('gCats'); cats.innerHTML = '';
    for (const c of CATEGORIES) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'seg'; b.textContent = c.name; b.setAttribute('role', 'tab');
      b.setAttribute('aria-checked', String(c.id === this.cat));
      b.onclick = () => { this.cat = c.id; this.paint(); };
      cats.appendChild(b);
    }
    const rec = recommended(levels, wallet, unlocked), list = $('gList'); list.innerHTML = '';
    for (const u of UPGRADES.filter((x) => x.cat === this.cat)) {
      const lvl = levels[u.id] ?? 0, next = nextLevel(u, levels), card = document.createElement('div'), locked = isLocked(u, unlocked);
      card.className = 'upg' + (u.id === rec ? ' rec' : '') + (u.id === bought ? ' flash' : '') + (locked ? ' locked' : '');
      const pips = u.levels.map((_, i) => `<i class="${i < lvl ? 'on' : ''}"></i>`).join('');
      card.innerHTML = `<h3>${u.name}${u.id === rec ? '<em>RECOMENDADO</em>' : ''}</h3><div class="lv">${pips}</div><p>${next ? next.desc : 'Al máximo.'}${locked ? ` <b>Disponible desde la Etapa ${u.requires}.</b>` : ''}</p>`;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = locked ? `Etapa ${u.requires}` : next ? money(next.price) : 'MÁX';
      btn.disabled = locked || !next || next.price > wallet;
      btn.onclick = () => {
        if (!next || locked) return;
        const res = buyUpgrade(u.id, next.price, u.levels.length);
        if (!res) return;
        this.garage = res; Sfx.init(); Sfx.play('pickup');
        this.paint(u.id);
      };
      card.appendChild(btn);
      list.appendChild(card);
    }
  }

  update(_t: number, delta: number): void {
    this.t += Math.min(0.05, delta / 1000);
    const g = this.L.world;
    beginLayers(this.L);
    // piso del taller con franjas de seguridad
    g.fillStyle = '#1b1526'; g.fillRect(-100, 0, W + 200, 640);
    g.fillStyle = '#2a2238'; for (let x = -100; x < W + 100; x += 40) g.fillRect(x, 0, 2, 230);
    g.fillStyle = C.yellow; for (let x = -100; x < W + 100; x += 24) g.fillRect(x, 222, 12, 4);
    g.fillStyle = C.pink; g.font = FONT(14); g.textAlign = 'center'; g.fillText('TALLER DE LA VICTORIA', W / 2, 26);
    // el Tico en grande, girando apenas, con las piezas compradas
    const look = this.look, s = 2.6, wob = Math.sin(this.t * 1.5) * 0.06;
    drawCar(g, this.t, { x: W / 2, y: 128, w: 28 * s, h: 48 * s }, {
      body: '#f2c230', roof: '#e0ae1a', ang: wob, seed: 7, extra: (g, w, h) => {
        if (look?.bumper) { g.fillStyle = '#4a4452'; g.fillRect(-w / 2 - 3, -h / 2 - 8, w + 6, 10); }
        if (look?.plates) { g.fillStyle = '#6c7a8c'; g.fillRect(-w / 2 - 5, -h / 4, 5, h / 2); g.fillRect(w / 2, -h / 4, 5, h / 2); }
        g.fillStyle = '#111'; g.fillRect(-20, -h / 2 + h * 0.42, 40, 14);
        g.fillStyle = C.yellow; g.font = FONT(12); g.textAlign = 'center'; g.fillText('TAXI', 0, -h / 2 + h * 0.42 + 12);
      },
    });
    endLayers(this.L);
  }
}
