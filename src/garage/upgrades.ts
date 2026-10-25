import type { StageConfig } from '../core/config';
import catalog from './upgrades.json';

/*
 * Mejoras del taller (ADR 0018). Cada nivel declara qué valores de la config de la etapa cambia, así el motor
 * no tiene código por mejora: applyUpgrades devuelve una copia de la config con las mejoras compradas aplicadas.
 */

export interface UpgradeOp { path: string; op: 'add' | 'mul' | 'set'; value: number | boolean }
export interface UpgradeLevel { price: number; desc: string; ops: UpgradeOp[] }
// requires: número de etapa que hay que tener desbloqueada para comprarla (mejoras de lujo)
// role y value (ADR 0033): para qué sirve (atacar o aguantar) y cuánto ayudó en las simulaciones según el modo de disparo
export type Role = 'ataque' | 'aguante';
export interface Upgrade { id: string; cat: string; name: string; requires?: number; levels: UpgradeLevel[]; role: Role; value: Record<'toque' | 'acelerar', number> }
export interface Category { id: string; name: string }

export const CATEGORIES = catalog.categories as Category[];
export const UPGRADES = catalog.upgrades as unknown as Upgrade[];
export type Levels = Record<string, number>;

function applyOp(root: Record<string, unknown>, op: UpgradeOp): void {
  const keys = op.path.split('.'), last = keys.pop()!;
  let obj = root;
  for (const k of keys) { if (obj[k] === undefined) obj[k] = {}; obj = obj[k] as Record<string, unknown>; }
  const cur = obj[last];
  if (op.op === 'set') obj[last] = op.value;
  else if (op.op === 'add') obj[last] = ((cur as number | undefined) ?? 0) + (op.value as number);
  else if (cur !== undefined) obj[last] = (cur as number) * (op.value as number);
}

export function applyUpgrades(cfg: StageConfig, levels: Levels): StageConfig {
  const out = structuredClone(cfg) as unknown as Record<string, unknown>;
  for (const u of UPGRADES) {
    const n = Math.min(levels[u.id] ?? 0, u.levels.length);
    for (let i = 0; i < n; i++) for (const op of u.levels[i].ops) applyOp(out, op);
  }
  return out as unknown as StageConfig;
}

export const nextLevel = (u: Upgrade, levels: Levels): UpgradeLevel | null => u.levels[levels[u.id] ?? 0] ?? null;
export const isLocked = (u: Upgrade, unlocked: number): boolean => (u.requires ?? 1) > unlocked;

// Recomendación simple: la mejora más barata que alcanza, para que siempre haya un premio a mano.
export function recommended(levels: Levels, wallet: number, unlocked = Infinity): string | null {
  let best: { id: string; price: number } | null = null;
  for (const u of UPGRADES) {
    if (isLocked(u, unlocked)) continue;
    const L = nextLevel(u, levels);
    if (L && L.price <= wallet && (!best || L.price < best.price)) best = { id: u.id, price: L.price };
  }
  return best?.id ?? null;
}

// La meta más cercana que todavía no alcanza: "Te faltan S/ X para ...".
export function nextGoal(levels: Levels, wallet: number, unlocked = Infinity): { name: string; missing: number } | null {
  let best: { name: string; missing: number } | null = null;
  for (const u of UPGRADES) {
    if (isLocked(u, unlocked)) continue;
    const L = nextLevel(u, levels);
    if (L && L.price > wallet && (!best || L.price - wallet < best.missing)) best = { name: u.name, missing: L.price - wallet };
  }
  return best;
}

/*
 * Dos recomendaciones explicadas (ADR 0033): la mejora para atacar y la mejora para aguantar que más ayudaron en las
 * simulaciones en tu modo de disparo, entre las que te alcanzan. A igual valor, la más barata.
 */
export function picks(levels: Levels, wallet: number, unlocked = Infinity, mode: 'toque' | 'acelerar' = 'toque'): Partial<Record<Role, string>> {
  const out: Partial<Record<Role, { id: string; v: number; price: number }>> = {};
  for (const u of UPGRADES) {
    if (isLocked(u, unlocked)) continue;
    const L = nextLevel(u, levels);
    if (!L || L.price > wallet) continue;
    const v = u.value[mode], best = out[u.role];
    if (!best || v > best.v || (v === best.v && L.price < best.price)) out[u.role] = { id: u.id, v, price: L.price };
  }
  return { ataque: out.ataque?.id, aguante: out.aguante?.id };
}
