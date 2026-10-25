import type { StageConfig } from './config';
import type { Game } from './state';

/*
 * Medallas (ADR 0037): tres objetivos opcionales y permanentes por etapa. Se ganan al vencer, una vez por jugador, y
 * no dan dinero ni puntaje. En la Costa Verde, Don Frío intacto reemplaza a la de cero faltas. En la ruta, sin jefe,
 * son la marea, los peajes y los intentos.
 */
export interface Medal { id: string; name: string; desc: string; ok: (G: Game) => boolean }

const RACHA: Medal = { id: 'racha', name: 'Racha de 8', desc: 'Ocho conos seguidos por la derecha', ok: (G) => G.combo.best >= 8 };
const CIEGO: Medal = {
  id: 'ciego', name: 'Punto ciego', desc: 'El 80% del daño por la derecha',
  ok: (G) => G.stats.effTotal > 0 && G.stats.effRight / G.stats.effTotal >= 0.8,
};
const LIMPIO: Medal = { id: 'limpio', name: 'Sin faltas', desc: 'Ninguna falta, aunque te la perdonen', ok: (G) => G.stats.infractions === 0 };
const DONFRIO: Medal = { id: 'donfrio', name: 'Don Frío intacto', desc: 'Nunca tocaste la carretilla', ok: (G) => G.cart.hits === 0 };
const SECO: Medal = { id: 'seco', name: 'Sin mojarte', desc: 'La marea nunca te tocó', ok: (G) => G.route.tideHits === 0 };
const PAGADO: Medal = { id: 'pagado', name: 'Todo pagado', desc: 'No rompiste ninguna barrera', ok: (G) => G.stats.barriers === 0 };
const PRIMERA: Medal = { id: 'primera', name: 'A la primera', desc: 'Llegaste sin perder intentos', ok: (G) => G.route.attempts === (G.cfg.route?.attempts ?? 0) };

export function medalsFor(cfg: StageConfig): Medal[] {
  if (cfg.route) return [SECO, PAGADO, PRIMERA];
  return [RACHA, CIEGO, cfg.hazards?.cart ? DONFRIO : LIMPIO];
}

// Medallas que cumple esta pelea (solo si ganó).
export function earnedMedals(G: Game): string[] {
  return G.result?.win ? medalsFor(G.cfg).filter((m) => m.ok(G)).map((m) => m.id) : [];
}
