# Traspaso a Claude Code

## Estado al 22 de octubre de 2026
- Concepto aprobado (`docs/concepto.md`).
- Prototipo v3 jugable de la Etapa 2, San Isidro (`prototipo/san-isidro-v3.html`): un solo HTML con canvas 2D, sin dependencias salvo Google Fonts.
- Validado por el dueño del producto: concepto, fases del jefe, bonus, sonido y deformación por daño.

## Qué contiene el prototipo y cómo portarlo

| Bloque del prototipo | Destino en Phaser |
|---|---|
| `Sfx` (WebAudio, motor, efectos, cumbia chicha) | `src/core/audio/` como servicio independiente de Phaser |
| `DIFF`, `POWERS`, `LINES`, `STREETS` | `src/stages/san-isidro/config.json` |
| `updateBoss`, `chooseAction`, fases | `src/bosses/q6.ts`, máquina de estados genérica por fases |
| `updatePlayer`, `fire`, cooldowns | `src/core/vehicle.ts` y `src/core/weapons.ts` |
| `activate` y bonus | `src/core/powerups.ts` |
| `carPath`, `drawCar` (deformación) | `src/core/damage-render.ts`, render a RenderTexture o Graphics |
| `drawSide`, cruces, rompemuelles | `src/stages/san-isidro/scenery.ts` |
| Controles táctiles HTML | Botones en escena UI de Phaser o capa DOM |

## Plan por hitos
1. **Base:** git init, Vite + TS + Phaser 3, escalado FIT 360x640, escenas Boot, Menu, Stage, Results vacías. Deploy inicial.
2. **Paridad:** portar la Etapa 2 hasta igualar el prototipo en feeling. Criterio: misma duración de pelea (90 a 120 s en Normal) y mismos tiempos de aviso.
3. **Motor común:** separar todo lo reutilizable; la Etapa 2 queda como datos.
4. **Etapa 1 Miraflores:** primera etapa construida solo con datos más su jefe.
5. **Taller y progresión:** escena Garage, economía en soles, guardado.
6. **Resto de etapas** en el orden de `docs/concepto.md`.

## Reglas
- No modificar `prototipo/`; es la referencia.
- Decisiones de arquitectura como ADR breves en `docs/adr/`.
- Las auditorías y propuestas del proyecto de claude.ai llegan como cambios a `docs/`; aplicarlas en su propia rama.
