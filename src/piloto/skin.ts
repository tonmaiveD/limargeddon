import type { Skin } from '../core/art/skin';
import type { Car, Foe, Game, Obstacle } from '../core/state';
import ARTE from './arte.json';

/*
 * Qué imagen entregada corresponde a cada cosa del juego (ADR 0067). El arte llega en la V2.1.1 del paquete del piloto
 * de la Costa Verde. Solo dibujo: estas funciones leen la pelea y nunca la cambian.
 */

export const ART_IDS = new Set(ARTE.assets.map((a) => a.id));
export const ART_VERSION = ARTE.version;

// Tráfico de la Costa Verde, por tipo del JSON de la etapa. La persecución del nivel de búsqueda es serenazgo.
const TRAFFIC: Record<string, string> = {
  sereno: 'serenazgo', persecucion: 'serenazgo', combi: 'combi', mototaxi: 'mototaxi', app: 'aplicacion', delivery: 'repartidor', taxi: 'taxi',
};
export const damaged = (hp: number, max: number): boolean => max > 0 && hp / max < 0.5;

export function vehicleId(c: Car): string | null {
  const base = TRAFFIC[c.k];
  if (!base) return null;
  return `${base}_${!c.invulnerable && damaged(c.hp, c.max) ? 'danado' : 'sano'}`;
}

// El Tico de serie (la demo juega sin mejoras): tres estados, como propone la guía del paquete.
export const ticoId = (dmg: number): string => `tico_${dmg < 1 / 3 ? 'sano' : dmg < 2 / 3 ? 'danado' : 'muy_danado'}`;

const OBSTACLES: Record<string, string> = { crater: 'hueco', bloqueo: 'barrera' };
export function obstacleId(G: Game, ob: Obstacle): string | null {
  const base = OBSTACLES[G.cfg.obstacles?.[ob.i]?.k ?? ''];
  return base ? `${base}_${ob.hit ? 'golpeado' : 'sano'}` : null;
}

// Cada piedra del derrumbe toma una de las tres y la conserva mientras cae.
const rocks = new WeakMap<Foe, number>();
let nextRock = 0;
export function foeId(f: Foe): string | null {
  if (f.look !== 'piedra') return null;
  let n = rocks.get(f);
  if (n === undefined) { n = nextRock++ % 3; rocks.set(f, n); }
  return `piedra_0${n + 1}`;
}

// Gaviotas: aleteo cada 0,15 s; al espantarlas, los cuadros de huida.
export const flockId = (t: number, scared: boolean): string => `gaviotas_${scared ? 'huida_' : ''}0${Math.floor(t / 0.15) % 2 === 0 ? 1 : 2}`;

// La carretilla entregada avanza a la derecha; hacia la izquierda va la copia espejada que arma la demo al cargar.
export const CART_LEFT = 'carretilla_izq';
export const cartId = (dir: number): string => (dir < 0 ? CART_LEFT : 'carretilla');

// La fila del jefe: los seis colores de la etapa, en orden, con los seis colores entregados.
const ROW = ['rojo', 'morado', 'plata', 'naranja', 'verde', 'azul'];
export const rowId = (cols: string[], col: string, hp: number, max: number): string =>
  `fila_${ROW[Math.max(0, cols.indexOf(col)) % ROW.length]}_${damaged(hp, max) ? 'danado' : 'sano'}`;
export const bossId = (hp: number, max: number): string => `jefe_${damaged(hp, max) ? 'danado' : 'sano'}`;

export const pilotSkin: Skin = {
  vehicle: vehicleId,
  tico: ticoId,
  ally: () => 'combi_sano',
  obstacle: obstacleId,
  pickup: (_G, u) => (ART_IDS.has(`bonus_${u.k}`) ? `bonus_${u.k}` : null),
  foe: foeId,
  cart: cartId,
  flock: (G, scared) => flockId(G.t, scared),
};
