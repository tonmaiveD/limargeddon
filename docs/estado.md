# Estado del proyecto

**Al 30 de octubre de 2026.** Este documento resume qué está hecho, cómo se trabaja y qué sigue. El detalle de cada decisión está en `docs/adr/`, y el plan de etapas en `docs/plan-etapas.md`.

## Publicado
- Juego: https://tonmaived.github.io/limargeddon/ (GitHub Pages, deploy automático en cada push a `main`).
- Repo público: `tonmaiveD/limargeddon`. PR #1 a #56 fusionados.
- Selector de etapas: el menú muestra las ya desbloqueadas para volver a ellas (ADR 0039). Con `?prueba` en la dirección muestra todas.
- Receptor de datos anónimos: https://limargeddon-datos.limargeddon-datos.workers.dev (Cloudflare Workers con D1, en la cuenta del dueño; código en `server/`).
- Parámetros de la dirección para revisar:
  - `?prueba`: todas las etapas, sin datos ni tutorial gastado.
  - `?graficos`: galería visual.
  - `?colisiones`: zonas de choque.
  - `?popurri`: escuchar la música de los créditos.
  - `?prueba&creditos=segundos`: créditos quietos en ese instante (`&claxon` para la respuesta del jefe).
  - `?tester=nombre`: etiqueta del equipo de pruebas en los datos.

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
- **Créditos y poscrédito** (ADR 0048 a 0050, 0052 y 0053): al ganar la Línea Amarilla.
  - Popurrí con un gancho que cada distrito toca con su género.
  - Despegue, desfile manejable por los diez distritos con fichas de reparto y nombres del equipo en el asfalto, cierre con agradecimientos y vuelo de regreso hasta "CONTINUARÁ".
  - La primera vez no se saltan. Después, un toque completo sobre el juego los salta, y "Ver créditos" aparece en el menú.
- **Datos anónimos de partidas** (ADR 0051): peleas, salidas al menú y compras, sin nombre ni identificador del equipo.
  - Se envían solos a un receptor estricto, salvo que el jugador lo apague en el menú.
  - La página `privacidad.html` explica qué se envía.
- **UX vertical** (ADR 0054): el juego se diseña para jugar en vertical.
  - Los controles táctiles solo se ven en el combate y los créditos.
  - El menú tiene "Jugar etapa N" fijo abajo y la dificultad como selector.
  - El taller deja comparar varias mejoras.
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

Cada punto es un PR. El dueño autoriza cada fusión por separado.

### Siguiente
1. **Informe de datos (PR C de la ADR 0051):** `npm run datos` descarga del receptor (clave en `.env.datos`, fuera del repo) y arma un informe.
   - Victorias y derrotas, tiempos, daño por fuente, salidas al menú, compras y fluidez por tipo de equipo.
   - Separado por versión del juego, etapa, dificultad y modo, y separando al equipo de pruebas del público.
   - Las peleas recibidas antes del PR #54 no traen modo: van como "modo desconocido".
   - "Abandono" significa solo volver al menú a mitad de pelea, no cerrar la app.
   - No se pueden contar jugadores únicos ni seguir a una persona, por diseño.
   - Conviene hacerlo cuando haya unos días de partidas.
2. **Bloque E · Ajustar con datos reales**, cuando el informe los muestre:
   - Candidatos del análisis de capturas del 30 de octubre:
     - Multas más suaves en Miraflores, la etapa tutorial, donde se llevan más de un tercio del cobro.
     - Revisar si el final (Callao y Línea Amarilla) queda fácil, sin endurecerlo solo por pocas partidas.
     - Mostrar "1 falta perdonada" en resultados, porque "Sin faltas" apagada junto a cero papeletas confunde.
   - De auditorías anteriores: la vida del jefe en el modo por toque, el aviso del enrosque (1,0 o 1,2 s) solo si no se ve la salida, y explicar en el taller que las mejoras de aguante alargan la pelea.
   - Mantener la fórmula de puntaje v2 y el ranking local.
3. **V04 de la novena auditoría (baja):** al volver de una pausa, la imagen de los créditos salta entre 0,2 y 0,3 s. Hay que guardar el instante efectivo al pausar y retomar desde ahí.
4. **Iteraciones 2 a 4 de la auditoría UX en iPhone 15**, solo en vertical. Necesitan decisiones del dueño y una prueba con 5 jugadores nuevos:
   - Introducción opcional de tres pasos: mover, atacar por la derecha y soltar ante una embestida.
   - Poder jugar como JUGADOR y ponerse nombre después.
   - Textos esenciales más grandes (hoy de 10 a 13 px) y una señal de punto ciego más clara.
   - Derrota resumida, con "Ver detalle".

### En pausa por decisión del dueño
- **Piloto de arte de Costa Verde** (especificación de mejora gráfica, 25 de octubre): falta decidir quién produce el arte. Debe mostrar una mejora visible sobre el nivel B actual, y el esfuerzo de 25 a 45 jornadas se vuelve a estimar al cerrar el piloto.
- **Indexación en Google:** un PR chico mío (descripción, imagen para compartir, dirección canónica, mapa del sitio y datos estructurados) más la verificación del dueño en Search Console. En `tonmaived.github.io/limargeddon` no se puede poner `robots.txt`, y un dominio propio es opcional.
- **Ranking compartido:** opcional. Necesita servicio externo, validación de puntajes y moderación de nombres.
- **Modo horizontal:** no se hace. El juego es vertical.

### En paralelo (dueño y tester, sin código)
- Partidas reales en el teléfono, con `?tester=pablo` y `?tester=noam` abiertos una vez.
- Confirmar en el iPad que los créditos llegan hasta "CONTINUARÁ" (ADR 0052).
- Correo en commits viejos: la API de GitHub todavía muestra el correo personal del dueño en tres commits de fusión antiguos (`e43f439`, `dcced2c`, `bea5938`). Solo el soporte de GitHub puede purgarlos.

## Deuda técnica
- **Pruebas lentas bajo carga:** las simulaciones de `fisica`, `mejoras-etapas`, `centro`, `miraflores` y `motor-comun` pueden pasarse del límite de 5 s si la máquina está cargada (simuladores de iOS encendidos). No son fallas de lógica. Opciones: subir `testTimeout` para esos archivos o apagar los simuladores antes de `npm test`.
- **Sin pruebas de integración de escenas:** el paso Stage → créditos → resultados, el menú y el taller se verifican a mano (simulador de iOS, Chrome sin ventana con el protocolo de DevTools). Las pruebas cubren la lógica pura (`credits.ts`, `telemetry.ts`, `validate.ts`, `frames.ts`).
- **Receptor de datos:**
  - Responde 204 por lote sin decir cuántos registros guardó.
  - No tiene límite de frecuencia propio, solo origen permitido y validación estricta.
  - La cola del teléfono se divide por cantidad (50), no por bytes.
  - Se publica a mano con `npx wrangler deploy` desde `server/`, con la sesión de Wrangler del dueño, que vence.
- **Contrato de datos:** `scoreV` no se envía, así que el informe debe asociar la versión del puntaje con el build. Cualquier cambio de campos va junto en `telemetry.ts` y `server/src/validate.ts`, con su prueba de punta a punta.
- **Un solo paquete de JavaScript de unos 1,46 MB:** no se separa en partes. Revisar si la carga inicial en teléfonos lentos lo pide.
- **`docs/HANDOFF.md` es histórico**, del 22 de octubre. Este documento es la referencia vigente.
- **Mantener:** la prueba de paridad con el prototipo (`tests/fixtures/`) y `prototipo/` no se tocan.

**Aplazado (apuesta de mayor alcance):** un contrato por datos de qué bloquea cada estado del jefe (ataques, claxon, contacto). Se retoma si vuelven a aparecer parches sueltos como el de la cabeza expuesta.

## Historial de bloques
Hechos, con su ADR:
- Auditorías 3 y 4: claridad del combate (0032), taller que explica (0033), clímax del jefe final (0034), bloques A a D y F (0035 a 0039).
- Gráficos nivel B (0040 a 0044).
- Instrumentos de diagnóstico (0045 a 0047).
- Créditos (0048 a 0050, 0052 y 0053).
- Datos anónimos (0051, con V01 a V03 de la novena auditoría).
- UX vertical (0054).

Las auditorías están en `docs/auditorias/`, de la segunda a la novena, más la de UX en iPhone 15 y las capturas consolidadas del 30 de octubre.
