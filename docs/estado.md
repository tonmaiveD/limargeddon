# Estado del proyecto

**Al 23 de octubre de 2026.** Este documento resume qué está hecho, cómo se trabaja y qué sigue. El detalle de cada decisión está en `docs/adr/`, y el plan de etapas en `docs/plan-etapas.md`.

## Publicado
- Juego: https://tonmaived.github.io/limargeddon/ (GitHub Pages, deploy automático en cada push a `main`).
- Repo público: `tonmaiveD/limargeddon`. PR #1 a #12 fusionados.
- Modo prueba: `?prueba` en la dirección muestra el selector de etapas.

## Lo que tiene el juego
- **Tres etapas, en orden y con desbloqueo** (ADR 0017):
  1. Miraflores (tutorial), con la Camioneta del Serenazgo.
  2. San Isidro, con La Loca del Q8.
  3. Centro de Lima, con El Rochabús.
- **Controles** (ADR 0008, 0011, 0013): acelerador sin freno (soltar es esquivar). El pulgar izquierdo gira y el derecho tiene aceite, claxon, acelerar y conos. Dos modos de disparo elegibles en el menú: "por toque" (reserva de 3 conos y combo de punto ciego) y "acelerar es atacar".
- **Taller entre etapas** (ADR 0018): billetera, diez mejoras y dos de lujo desde la Etapa 3. La primera victoria en una etapa paga completo y repetirla paga la mitad.
- **Pantalla móvil** (ADR 0010, 0012): canvas a todo el ancho, vista que se ensancha con más ciudad a los costados, pausa automática e instalable en la pantalla de inicio.
- **Registro de peleas** en el dispositivo, con el botón "Copiar registro" en resultados (ADR 0009).

## Motor (resumen)
- Cada etapa es datos (`src/stages/<distrito>/config.json`) más su paisaje (`scenery.ts`) y el dibujo de su jefe (`src/bosses/<jefe>-render.ts`). La IA es `PhaseBoss` para todos (ADR 0015).
- Piezas declarables en el JSON:
  - Vehículos con `look` y `move`.
  - Enjambres por dificultad.
  - Obstáculos (bloques, huecos, peatones, vaivén).
  - Jefe por fases: frenazo, reversa, embestida, chorro, invocaciones, claxon y escoltas.
  - `dmgMult` por dificultad.
  - Premio y consejo por etapa.
- Guía para construir etapas: `docs/guia-etapas.md`.
- Prueba de paridad: el motor reproduce el prototipo v3 cuadro a cuadro con `tests/fixtures/san-isidro-prototipo.json` (ADR 0006 y 0009).

## Cómo se trabaja
- Todo en local, una tarea a la vez, sin sesiones en la nube.
- Una rama por tarea y un PR a `main`. Cada PR se fusiona solo con autorización explícita del dueño para ese PR.
- Antes de abrir un PR:
  - `npm test` y `npm run build` en verde.
  - `ETAPA=<distrito> npm run balance` dentro de la meta.
  - Prueba en el navegador en viewport móvil (393×852 o 430×780).
  - ADR si se agregó una pieza al motor.
  - Textos del juego sin guiones largos, dos puntos ni punto y coma.
- Metas de balance (bot medio, Normal): 75 a 85 s, ganando 22 a 27 de 30. El tutorial es más corto y fácil. Difícil, cerca de la mitad de victorias. Las personas tardan unas 1.5 veces más que el bot.

## Pendiente
- **Pruebas del dueño en el teléfono** de Miraflores, el Centro y el taller, y su registro de peleas. Con eso se decide si la vida del jefe baja solo en el modo por toque: las dos primeras peleas en San Isidro por toque duraron 2:03 y 2:06, algo largas.
- **Etapas siguientes:** Javier Prado, Gamarra o Callao (medianas). Después Vía Expresa (saltos) y Panamericana (clima y nivel de búsqueda), la Costa Verde (final) y la Línea Amarilla del Terror (secreta), según `docs/plan-etapas.md`.
- **Correo en commits viejos:** la API de GitHub todavía muestra el correo personal del dueño en tres commits de fusión antiguos (`e43f439`, `dcced2c`, `bea5938`). Solo el soporte de GitHub puede purgarlos.
