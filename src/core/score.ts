import type { Game } from './state';
import { clamp } from './util';

/*
 * Puntaje de una victoria (ADR 0029), hasta 10.000. Premia la habilidad de esa pelea y no se acumula repitiendo:
 * el ranking guarda la mejor pelea de cada etapa. Fórmula propuesta por la segunda auditoría.
 *   4000 base por ganar
 *   2000 tiempo: completo si se gana en scoreTref s o menos, cero al doble
 *   1500 daño por la derecha sobre el total
 *   1000 racha (techo en 8)
 *   1000 limpieza: cada falta resta un tercio, cuente o no después un perdón
 *    500 objetivo: carretilla intacta donde la hay; si no, la vida que no se perdió
 * En una etapa de ruta (no hay jefe) el punto ciego se reemplaza por los intentos que sobraron y la racha por
 * esquivar la marea (cada toque resta un quinto).
 * Por dificultad se multiplica: Fácil ×0.7, Normal ×1, Difícil ×1.25 (así no conviene farmear en Fácil).
 */
export const DIFF_SCORE: Record<string, number> = { facil: 0.7, normal: 1, dificil: 1.25 };
export interface ScoreParts { time: number; right: number; streak: number; clean: number; goal: number }

export function scoreParts(G: Game): ScoreParts {
  const s = G.stats, tref = G.cfg.rewards.scoreTref ?? 120, R = G.cfg.route;
  if (R) return {
    time: clamp((2 * tref - G.t) / tref, 0, 1),
    right: clamp((G.route.attempts - 1) / Math.max(1, R.attempts - 1), 0, 1),
    streak: clamp(1 - G.route.tideHits / 5, 0, 1),
    clean: Math.max(0, 1 - s.infractions / 3),
    goal: clamp(1 - s.dmgTaken / G.p.max, 0, 1),
  };
  return {
    time: clamp((2 * tref - G.t) / tref, 0, 1),
    right: s.effTotal ? clamp(s.effRight / s.effTotal, 0, 1) : 0, // daño efectivo (auditoría N07)
    streak: Math.min(G.combo.best, 8) / 8,
    clean: Math.max(0, 1 - s.infractions / 3),
    goal: G.cfg.hazards?.cart ? (G.cart.hits === 0 ? 1 : 0) : clamp(1 - s.dmgTaken / G.p.max, 0, 1),
  };
}

export function scoreFight(G: Game): number {
  if (!G.result?.win) return 0;
  const k = scoreParts(G);
  return Math.round((4000 + 2000 * k.time + 1500 * k.right + 1000 * k.streak + 1000 * k.clean + 500 * k.goal) * (DIFF_SCORE[G.dk] ?? 1));
}
