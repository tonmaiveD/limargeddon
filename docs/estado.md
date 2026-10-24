# Estado del proyecto

**Al 23 de octubre de 2026.** Este documento resume qué está hecho, cómo se trabaja y qué sigue. El detalle de cada decisión está en `docs/adr/`, y el plan de etapas en `docs/plan-etapas.md`.

## Publicado
- Juego: https://tonmaived.github.io/limargeddon/ (GitHub Pages, deploy automático en cada push a `main`).
- Repo público: `tonmaiveD/limargeddon`. PR #1 a #21 fusionados.
- Modo prueba: `?prueba` en la dirección muestra el selector de etapas.

## Lo que tiene el juego
- **Nueve etapas, en orden y con desbloqueo** (ADR 0017):
  1. Miraflores (tutorial), con la Camioneta del Serenazgo.
  2. San Isidro, con La Loca del Q8.
  3. Centro de Lima, con El Rochabús.
  4. Javier Prado, con La Combi Asesina (ADR 0021).
  5. Gamarra, con El Camión de Gamarra (ADR 0022).
  6. Callao, con El Tráiler del Puerto (ADR 0023).
  7. Vía Expresa, con El Expreso Articulado (ADR 0024).
  8. Panamericana Norte, con El Comandante (ADR 0025).
  9. Costa Verde (final), con La Doble Fila de Agua Dulce y la carretilla Don Frío (ADR 0026).
- **Controles** (ADR 0008, 0011, 0013): acelerador sin freno (soltar es esquivar). El pulgar izquierdo gira y el derecho tiene aceite, claxon, acelerar y conos. Dos modos de disparo elegibles en el menú: "por toque" (reserva de 3 conos y combo de punto ciego) y "acelerar es atacar".
- **Taller entre etapas** (ADR 0018): billetera, diez mejoras y dos de lujo desde la Etapa 3. La primera victoria en una etapa paga completo y repetirla paga la mitad.
- **Pantalla móvil** (ADR 0010, 0012): canvas a todo el ancho, vista que se ensancha con más ciudad a los costados, pausa automática e instalable en la pantalla de inicio.
- **Objetos de victoria** (ADR 0020): Silbato, Bolso y Poncho protegen una vez por pelea desde que se ganan.
- **Tutorial**: ayudas breves sobre el Tico en Miraflores (ADR 0019).
- **Registro de peleas** en el dispositivo, con el botón "Copiar registro" en resultados (ADR 0009). Desde la ADR 0019 guarda el build, las mejoras, la vida que le quedó al jefe y el cobro.

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
- Metas de balance (bot medio, Normal): en las etapas 1 a 4, 75 a 85 s, ganando 22 a 27 de 30 (`npm run balance`). Desde la Etapa 5 manda la campaña con compras en el taller (`npm run campana`, ADR 0027): gana al primer intento entre 65 y 80%. Las personas tardan unas 1.6 veces más que el bot.

## Pendiente
Ordenado como se acordó: primero datos reales y balance, después la etapa secreta, y en paralelo el pulido.

1. **Partidas reales:** que el tester juegue 3 o 4 peleas por modo con la versión actual y comparta "Copiar registro". Con eso se confirma la pasada de dificultad (ADR 0027) y se decide si la vida del jefe baja solo en el modo por toque.
2. **Línea Amarilla del Terror** (secreta): se desbloquea al ganar la Costa Verde. Tiene peajes, túnel, pista del aeropuerto y la escena del avión. Hay que decidir mecánicas con el dueño antes de construir.
3. **Pista de la secreta:** cuando exista, reemplazar "¡Completaste todas las etapas disponibles!" y mostrar en el menú el candado con la línea amarilla.
4. **Música sintetizada por distrito** (cumbia chicha, criolla, salsa), como pide el concepto. Hoy solo hay efectos.
5. **Animación del cierre:** la carretilla Don Frío cruzando la meta (hoy es texto).
6. **Semáforos en ola** de la Javier Prado como mecánica (hoy son paisaje).
7. **Auditoría de octubre, lo que queda:**
   - Tutorial completo.
   - Señal del punto ciego.
   - Daño por fuente en la pista.
   - Aviso de reversa del Q8 en Difícil.
   - Blancos táctiles de 44 px.
   - Meta de ahorro elegida.
   - Bot con restricciones de pulgar.
   - Las propuestas aplazadas (gracia de aceleración, pagos por fase, repetición mejor pagada) solo si los datos lo piden.
8. **Menú en modo prueba:** con nueve etapas se aprieta en pantallas chicas.
9. **Pruebas en el teléfono** de Javier Prado a Costa Verde: el salto, la garúa, la curva y la serpiente.
10. **Correo en commits viejos:** la API de GitHub todavía muestra el correo personal del dueño en tres commits de fusión antiguos (`e43f439`, `dcced2c`, `bea5938`). Solo el soporte de GitHub puede purgarlos.
