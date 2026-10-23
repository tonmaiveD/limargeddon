# 0005. Etapa como datos y jefe como máquina de estados por fases

**Estado:** aceptada, Hito 2 (se completa en el Hito 3).

## Contexto
Regla del proyecto: cada etapa es datos, no código nuevo. El HANDOFF pide `src/stages/san-isidro/config.json` y una máquina de estados genérica por fases para los jefes.

## Decisión
- `config.json` tipado por `src/core/config.ts` contiene dificultades, pista, jugador, armas, bonus, tráfico (con pesos de aparición), papeletas, rompemuelles, cruces, calles, recompensas y el jefe completo: fases con umbral de vida, probabilidad de cambio de carril, tipo de ataque, tiempos de aviso, duración, velocidad, valet, claxon, escoltas, frases y réplicas.
- `src/bosses/phase-machine.ts`: elige la fase por porcentaje de vida y despacha estados por nombre.
- `src/bosses/q6.ts`: estados del Q6 (`enter`, `cruise`, `teleBrake/brake`, `teleRev/rev/park`, `teleRam/ram`, `return`). Los ataques se eligen por el campo `attack` de la fase, así que reordenar o reajustar fases es editar JSON.
- `src/stages/index.ts` registra cada etapa como `{ cfg, ai, drawBoss, drawWorld }`. Las escenas no conocen San Isidro.
- Quedan en código, a propósito, constantes de movimiento fino del prototipo (vaivén del derrape, velocidades de reposicionamiento) que no son parámetros de diseño.

## Consecuencias
- Rebalancear es editar JSON y correr `npm test` (paridad) y `npm run balance` (duración).
- El Hito 3 deberá generalizar lo que hoy es del Q6 pero reutilizable (valet, escoltas) a comportamientos declarables en JSON.
