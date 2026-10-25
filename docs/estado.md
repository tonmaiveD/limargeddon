# Estado del proyecto

**Al 23 de octubre de 2026.** Este documento resume qué está hecho, cómo se trabaja y qué sigue. El detalle de cada decisión está en `docs/adr/`, y el plan de etapas en `docs/plan-etapas.md`.

## Publicado
- Juego: https://tonmaived.github.io/limargeddon/ (GitHub Pages, deploy automático en cada push a `main`).
- Repo público: `tonmaiveD/limargeddon`. PR #1 a #27 fusionados.
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
  10. **Secreta:** Línea Amarilla del Terror, ruta por tramos hasta el carguero, con el puente provisional y la marea (ADR 0030).
- **Controles** (ADR 0008, 0011, 0013): acelerador sin freno (soltar es esquivar). El pulgar izquierdo gira y el derecho tiene aceite, claxon, acelerar y conos. Dos modos de disparo elegibles en el menú: "por toque" (reserva de 3 conos y combo de punto ciego) y "acelerar es atacar".
- **Taller entre etapas** (ADR 0018): billetera, diez mejoras y dos de lujo desde la Etapa 3. La primera victoria en una etapa paga completo y repetirla paga la mitad.
- **Pantalla móvil** (ADR 0010, 0012): canvas a todo el ancho, vista que se ensancha con más ciudad a los costados, pausa automática e instalable en la pantalla de inicio.
- **Objetos de victoria** (ADR 0020): Silbato, Bolso y Poncho protegen una vez por pelea desde que se ganan.
- **Tutorial**: ayudas breves sobre el Tico en Miraflores (ADR 0019).
- **Jugador y ranking** (ADR 0029): nombre de hasta 12 caracteres, puntaje de hasta 10.000 por victoria, ranking local de los 12 mejores y opción de empezar de nuevo.
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
Orden acordado con el dueño el 25 de octubre de 2026. Cada bloque es un PR.

**En paralelo y desde ya (dueño y tester, sin código)**
- Partidas reales con "Copiar registro": Gamarra, Costa Verde y la Línea Amarilla, en el teléfono. Confirman la dificultad (ADR 0027 y 0031) y la del túnel y la marea, que el bot no puede medir.
- Correo en commits viejos: la API de GitHub todavía muestra el correo personal del dueño en tres commits de fusión antiguos (`e43f439`, `dcced2c`, `bea5938`). Solo el soporte de GitHub puede purgarlos.

1. ~~Claridad del combate~~: hecho (ADR 0032).
2. **Taller que explique:**
   - Dos opciones, ofensiva y supervivencia, con su efecto.
   - Dónde sirve cada objeto de victoria.
   - Meta de ahorro elegida.
3. **Clímax del jefe final:** el enrosque de la serpiente con un solo hueco (plan 5b).
4. **Aprender y volver:**
   - Tutorial completo.
   - Objetivos opcionales por etapa y récord personal, sin presión.
5. **Ambiente:**
   - Música sintetizada por distrito.
   - Animaciones de cierre: la carretilla Don Frío cruzando la meta y el Tico dentro del carguero.
   - Semáforos en ola de la Javier Prado como mecánica.
6. **Con los datos reales:**
   - Ajustar la dificultad, incluida la vida del jefe en el modo por toque.
   - Bot con restricciones de pulgar.
   - Las propuestas aplazadas de las auditorías, solo si los datos las piden.
7. **Opcional:** ranking compartido entre dispositivos. Necesita servicio externo, validación de puntajes y moderación de nombres.
