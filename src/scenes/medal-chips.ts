import type { StageConfig } from '../core/config';
import { medalsFor } from '../core/medals';

// Fila de las tres medallas de una etapa (ADR 0037): ganadas en color, las nuevas con su marca.
export function medalChips(cfg: StageConfig, have: string[], fresh: string[] = []): string {
  return medalsFor(cfg).map((m) => {
    const on = have.includes(m.id), isNew = fresh.includes(m.id);
    return `<span class="medal${on ? ' on' : ''}" title="${m.desc}" aria-label="${m.name}, ${m.desc}${on ? ', ganada' : ', pendiente'}">`
      + `<b>${on ? '★' : '☆'} ${m.name}</b><small>${isNew ? '¡Nueva!' : m.desc}</small></span>`;
  }).join('');
}
