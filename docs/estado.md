# Estado del proyecto

**Al 26 de octubre de 2026.** Este documento resume qué está hecho, cómo se trabaja y qué sigue. El detalle de cada decisión está en `docs/adr/`, y el plan de etapas en `docs/plan-etapas.md`.

## Publicado
- Juego: https://tonmaived.github.io/limargeddon/ (GitHub Pages, deploy automático en cada push a `main`).
- Repo público: `tonmaiveD/limargeddon`. PR #1 a #45 fusionados.
- Selector de etapas: el menú muestra las ya desbloqueadas para volver a ellas (ADR 0039). Con `?prueba` en la dirección muestra todas.

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
- **Tutorial en contexto** (ADR 0037 y 0039): ayudas breves sobre el Tico en las diez etapas, hasta que cada una se alcanza a leer, por modo de disparo. "Ver ayudas otra vez" e interruptor de ayudas en el menú.
- **Medallas** (ADR 0037): tres por etapa, sin dinero, visibles en el menú y en resultados.
- **Gráficos nivel B** (ADR 0041 a 0044): tráfico, Tico, jefes, combi aliada, paisaje de los diez distritos, obstáculos, bonus y proyectiles son imágenes horneadas con sombreado; el daño de los vehículos sigue siendo procedural por etapas. La pista suma vereda con cordón, huellas, grietas y manchas.
- **Ambiente** (ADR 0038): música de un género por distrito, cierres animados en la Costa Verde y la Línea Amarilla, y semáforos en ola en la Javier Prado.
- **Jugador y ranking** (ADR 0029): nombre de hasta 12 caracteres, puntaje de hasta 10.000 por victoria, ranking local de los 12 mejores y opción de empezar de nuevo.
- **Registro de peleas** en el dispositivo, con el botón "Copiar registro" en resultados (ADR 0009). Desde la ADR 0019 guarda el build, las mejoras, la vida que le quedó al jefe y el cobro. Desde la ADR 0045 guarda también la fluidez (percentiles del tiempo entre cuadros sin suavizar y bloqueos largos, ADR 0046) y el equipo.
- **Vista de colisiones** (ADR 0045): con `?colisiones` en la dirección se ven las zonas de choque sobre el dibujo, con la forma de cada regla (ADR 0046).

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
- Metas de balance (bot medio, Normal): en las etapas 1 a 4, 75 a 85 s, ganando 22 a 27 de 30 (`npm run balance`). Desde la Etapa 5 manda la campaña con compras en el taller (`npm run campana`, ADR 0027, con tres políticas de compra desde la ADR 0036): gana al primer intento entre 65 y 80%. Las personas tardan unas 1.6 veces más que el bot.

## Pendiente
Orden recalibrado con la tercera auditoría (`docs/auditorias/2026-10-25-tercera-auditoria.md`) el 25 de octubre de 2026, y con la cuarta (`docs/auditorias/2026-10-25-cuarta-auditoria.md`) el mismo día. La sexta (`docs/auditorias/2026-10-26-sexta-auditoria.md`, 26 de octubre) agrega el bloque G, y la séptima (`docs/auditorias/2026-10-26-septima-auditoria.md`) sus límites (ADR 0047). Cada bloque es un PR.

Hechos:
- Claridad del combate (ADR 0032).
- Taller que explique (ADR 0033).
- Clímax del jefe final (ADR 0034).
- A · Correcciones que rompen reglas (ADR 0035).
- B · Puntaje y resultados honestos (ADR 0036).
- C · Aprender y volver (ADR 0037).
- D · Ambiente (ADR 0038).
- F · Ayudas que se alcanzan a leer y regreso a etapas ganadas (ADR 0039, cuarta auditoría).
- Gráficos nivel B (ADR 0040 a 0044).
- Paso previo de la especificación de mejora gráfica (ADR 0045): salida del enrosque, correas del carguero, fluidez en el registro y vista de colisiones.
- G · Instrumentos de diagnóstico fieles (ADR 0046): fluidez medida sin suavizar, con bloqueos largos, y vista de colisiones con la forma de cada regla.

**En paralelo y desde ya (dueño y tester, sin código)**
- Partidas reales con "Copiar registro": Gamarra, Costa Verde y la Línea Amarilla, en el teléfono. El bloque A ya corrigió la Línea Amarilla y el enrosque.
- Protocolo sugerido por la auditoría:
  - 6 a 8 personas, alternando el modo de disparo.
  - Anotar si reconocen la salida del enrosque, si entienden pagar o romper en el peaje y si entienden qué conserva un reintento.
- Correo en commits viejos: la API de GitHub todavía muestra el correo personal del dueño en tres commits de fusión antiguos (`e43f439`, `dcced2c`, `bea5938`). Solo el soporte de GitHub puede purgarlos.

**Orden**
1. ~~A · Correcciones que rompen reglas~~: hecho (ADR 0035).
2. ~~B · Puntaje y resultados honestos~~: hecho (ADR 0036).
3. ~~C · Aprender y volver~~: hecho (ADR 0037).
4. ~~D · Ambiente~~: hecho (ADR 0038).
4b. ~~F · Cuarta auditoría (R01 a R04)~~: hecho (ADR 0039), antes del bloque E por decisión del dueño.
4c. ~~G · Instrumentos de diagnóstico~~: hecho (ADR 0046, sexta auditoría S01 y S02, y ADR 0047, séptima auditoría T01 y T02).
5. **E · Con los datos reales:**
   - Ajustar la dificultad, incluida la vida del jefe en el modo por toque.
   - Variar el aviso del enrosque (1,0 o 1,2 s) solo si las personas no ven la salida.
   - Explicar en el taller que las mejoras de aguante alargan la pelea.
   - Bot con restricciones de pulgar.
   - Las propuestas aplazadas de las auditorías, solo si los datos las piden.
   - No endurecer la Línea Amarilla solo porque el bot gana siempre.
5b. **Piloto de arte de Costa Verde** (especificación de mejora gráfica, 25 de octubre de 2026): falta decidir quién produce el arte. Según la sexta auditoría, el piloto debe mostrar una mejora visible sobre el nivel B actual, no sobre la versión anterior. El esfuerzo de 25 a 45 jornadas se vuelve a estimar al cerrar el piloto.
5c. **Créditos de la Línea Amarilla** (plan aprobado el 27 de octubre de 2026): escena que une el despegue, el desfile por los diez distritos con fichas de reparto y lo que pasó después, y el poscrédito del vuelo de regreso; 60 a 90 s; la primera vez no se salta; botón "Ver créditos" en el menú.
   - Música: hecha (ADR 0048, popurrí con `?popurri`).
   - Escena, poscrédito, botón y guardado: hechos (ADR 0049). En el modo prueba, `?creditos=segundos` los muestra quietos para revisar.
   - Pendiente: nombres y roles del equipo, y aprobar las frases de los jefes (`src/stages/creditos.json`).
6. **Opcional:** ranking compartido entre dispositivos. La auditoría recomienda no hacerlo hasta cerrar A y B y versionar el puntaje. Necesita servicio externo, validación de puntajes y moderación de nombres.

**Aplazado (apuestas de mayor alcance de la auditoría):** un contrato por datos de qué bloquea cada estado del jefe (ataques, claxon, contacto). Se retoma si vuelven a aparecer parches sueltos como el de la cabeza expuesta.
