import type { Car, Foe, Game, Obstacle, Pickup } from '../state';

/*
 * Arte en imágenes entregadas (ADR 0067): solo lo instala la demo del piloto de la Costa Verde. En el juego queda en
 * null y cada dibujo sale exactamente como siempre. Cada función devuelve la clave de una textura ya cargada, a
 * SKIN_SCALE píxeles por unidad lógica, o null para dibujar como siempre. Solo cambia el dibujo: la simulación, las
 * colisiones y los avisos no se enteran.
 */
export const SKIN_SCALE = 3;

export interface Skin {
  vehicle?(c: Car): string | null;                       // tráfico
  tico?(dmg: number): string | null;                     // el Tico del jugador (dmg de 0 a 1)
  ally?(): string | null;                                // la combi aliada del bonus
  obstacle?(G: Game, ob: Obstacle): string | null;
  pickup?(G: Game, u: Pickup): string | null;
  foe?(f: Foe): string | null;                           // proyectiles y piedras del derrumbe
  cart?(dir: number): string | null;                     // la carretilla, mirando hacia donde avanza
  flock?(G: Game, scared: boolean): string | null;       // la bandada de gaviotas
}

let current: Skin | null = null;
export const skin = (): Skin | null => current;
export const setSkin = (s: Skin | null): void => { current = s; };
