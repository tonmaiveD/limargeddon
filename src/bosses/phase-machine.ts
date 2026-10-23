import type { BossPhase } from '../core/config';

// Máquina de estados genérica para jefes por fases.
// Las fases se eligen por porcentaje de vida según `from` del JSON; los estados son funciones por nombre.

// Fase activa: la de mayor id cuyo umbral `from` es >= vida restante (1, .66, .33 reproduce r>.66?1:r>.33?2:3).
export function phaseFor(phases: readonly BossPhase[], ratio: number): number {
  let id = phases[0].id;
  for (const ph of phases) if (ratio <= ph.from) id = ph.id;
  return id;
}

export function phaseDef(phases: readonly BossPhase[], id: number): BossPhase {
  return phases.find((p) => p.id === id) ?? phases[0];
}

export type StateTable<Ctx> = Record<string, (ctx: Ctx, dt: number) => void>;

export function runState<Ctx>(table: StateTable<Ctx>, state: string, ctx: Ctx, dt: number): void {
  const fn = table[state];
  if (!fn) throw new Error(`Estado de jefe desconocido: ${state}`);
  fn(ctx, dt);
}
