import Phaser from 'phaser';
import { showDeck } from '../core/layout';
import { setupCamera } from '../core/camera';
import type { DiffKey } from '../core/config';
import { W } from '../core/constants';
import { Sfx } from '../core/audio/sfx';
import { bakeCar } from '../core/art/bake';
import { ART_SCALE, ticoArt } from '../core/art/vehicles';
import { FONT } from '../core/gfx';
import { beginLayers, createLayers, endLayers, type Layers } from '../core/render';
import { buyUpgrade, getGarage, getSettings, setGoal, unlockedStage, type Garage } from '../core/save';
import { C } from '../core/util';
import { CATEGORIES, UPGRADES, applyUpgrades, isLocked, nextGoal, nextLevel, picks } from '../garage/upgrades';
import { STAGES, TEST_MODE, itemUses, stageNumber, wonItems } from '../stages';
import { track } from '../core/share';
import { buyEvent } from '../core/telemetry';

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
    showDeck(this.game, false);
    setupCamera(this);
    this.L = createLayers(this);
    this.garage = getGarage();
    const P = picks(this.garage.levels, this.garage.wallet, unlockedStage(stageNumber), this.mode()), first = P.ataque ?? P.aguante;
    if (first) this.cat = UPGRADES.find((u) => u.id === first)!.cat; // abre en la categoría de la primera recomendación
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

  private mode(): 'toque' | 'acelerar' { return getSettings().fireMode === 'acelerar' ? 'acelerar' : 'toque'; }

  private paint(bought?: string): void {
    const { wallet, levels } = this.garage;
    this.look = applyUpgrades(STAGES[this.data0.stageId].cfg, levels).player.look;
    const w = $('gWallet'); w.textContent = money(wallet);
    if (bought) { w.classList.remove('bump'); void w.offsetWidth; w.classList.add('bump'); }
    const unlocked = unlockedStage(stageNumber);
    // meta de ahorro: la elegida por el jugador; si no eligió, la mejora más cercana que todavía no alcanza
    const chosen = this.garage.goal ? UPGRADES.find((u) => u.id === this.garage.goal) : undefined, chosenL = chosen && nextLevel(chosen, levels);
    const goal = nextGoal(levels, wallet, unlocked);
    $('gGoal').textContent = chosen && chosenL
      ? (chosenL.price <= wallet ? `¡Ya te alcanza para tu meta, ${chosen.name}!` : `Ahorrando para ${chosen.name} · te faltan ${money(chosenL.price - wallet)}.`)
      : goal ? `Te faltan ${money(goal.missing)} para ${goal.name}.` : 'Te alcanza para cualquier mejora. ¡Elige bien!';
    // por qué se recomienda lo que se recomienda
    const P = picks(levels, wallet, unlocked, this.mode()), nameOf = (id?: string) => UPGRADES.find((u) => u.id === id)?.name;
    const why = [P.ataque && `Para atacar, <b>${nameOf(P.ataque)}</b>.`, P.aguante && `Para aguantar, <b>${nameOf(P.aguante)}</b>.`].filter(Boolean).join(' ');
    $('gWhy').innerHTML = why ? `${why} Elegidas por las pruebas con tu modo de disparo.` : '';
    // objetos de victoria y dónde sirve cada uno
    const items = wonItems(unlocked), it = $('gItems');
    it.hidden = !items.length;
    $('gItemsSum').textContent = `Tus objetos (${items.length}) · dónde sirven`;
    $('gItemsList').innerHTML = items.map((x) => { const at = itemUses(x.effect); return `<li><b>${x.name}</b> · ${x.desc}.${at.length === Object.keys(STAGES).length ? ' Sirve en todas las etapas.' : at.length ? ` Sirve en ${at.join(', ')}.` : ''}</li>`; }).join('');
    const cats = $('gCats'); cats.innerHTML = '';
    for (const c of CATEGORIES) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'seg'; b.textContent = c.name; b.setAttribute('role', 'tab');
      b.setAttribute('aria-checked', String(c.id === this.cat));
      b.onclick = () => { this.cat = c.id; this.paint(); };
      cats.appendChild(b);
    }
    const list = $('gList'); list.innerHTML = '';
    for (const u of UPGRADES.filter((x) => x.cat === this.cat)) {
      const lvl = levels[u.id] ?? 0, next = nextLevel(u, levels), card = document.createElement('div'), locked = isLocked(u, unlocked);
      const tag = u.id === P.ataque ? '<em>PARA ATACAR</em>' : u.id === P.aguante ? '<em class="def">PARA AGUANTAR</em>' : '';
      card.className = 'upg' + (tag ? ' rec' : '') + (u.id === bought ? ' flash' : '') + (locked ? ' locked' : '');
      const pips = u.levels.map((_, i) => `<i class="${i < lvl ? 'on' : ''}"></i>`).join('');
      card.innerHTML = `<h3>${u.name}${tag}</h3><div class="lv">${pips}</div><p>${next ? next.desc : 'Al máximo.'}${locked ? ` <b>Disponible desde la Etapa ${u.requires}.</b>` : ''}</p>`;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = locked ? `Etapa ${u.requires}` : next ? money(next.price) : 'MÁX';
      btn.disabled = locked || !next || next.price > wallet;
      btn.onclick = () => {
        if (!next || locked) return;
        const res = buyUpgrade(u.id, next.price, u.levels.length);
        if (!res) return;
        track(TEST_MODE, (c) => buyEvent({ upgrade: u.id, level: res.levels[u.id], price: next.price, wallet: res.wallet, unlocked: unlockedStage(stageNumber) }, c));
        this.garage = res; Sfx.init(); Sfx.play('pickup');
        this.paint(u.id);
      };
      card.appendChild(btn);
      if (next && !locked) { // elegirla como meta de ahorro (o quitarla)
        const g = document.createElement('button'), mine = this.garage.goal === u.id;
        g.type = 'button'; g.className = 'goal'; g.setAttribute('aria-pressed', String(mine));
        g.textContent = mine ? '★ Tu meta de ahorro' : '☆ Ahorrar para esta';
        g.onclick = () => { setGoal(mine ? null : u.id); this.garage = getGarage(); this.paint(); };
        card.appendChild(g);
      }
      list.appendChild(card);
    }
  }

  update(_t: number, delta: number): void {
    setupCamera(this); // la vista cambia de ancho al ocultar o mostrar los controles
    this.t += Math.min(0.05, delta / 1000);
    const g = this.L.world;
    beginLayers(this.L);
    // piso del taller con franjas de seguridad
    g.fillStyle = '#1b1526'; g.fillRect(-100, 0, W + 200, 640);
    g.fillStyle = '#2a2238'; for (let x = -100; x < W + 100; x += 40) g.fillRect(x, 0, 2, 150);
    g.fillStyle = C.yellow; for (let x = -100; x < W + 100; x += 24) g.fillRect(x, 144, 12, 4);
    g.fillStyle = C.pink; g.font = FONT(14); g.textAlign = 'center'; g.fillText('TALLER DE LA VICTORIA', W / 2, 26);
    // el Tico, girando apenas, con las piezas compradas (imagen horneada a su tamaño, ADR 0042); más chico desde la
    // ADR 0054 para que el catálogo tenga espacio y se puedan comparar mejoras
    const look = this.look, s = 1.8, wob = Math.sin(this.t * 1.5) * 0.06, art = ticoArt(look);
    const key = `tico-taller-${!!look?.bumper}-${!!look?.plates}`;
    if (!this.textures.exists(key)) this.textures.addCanvas(key, bakeCar(art, 0, 7, s * ART_SCALE));
    this.L.cars.image(key, W / 2, 84, 1 / ART_SCALE, wob);
    endLayers(this.L);
  }
}
