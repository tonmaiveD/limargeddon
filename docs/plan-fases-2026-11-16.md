# Plan por fases · créditos, UX, UI y gráficos

16 de noviembre de 2026. Consolida `docs/auditorias/2026-11-16-graficos-ux-ui-creditos.md` y las decisiones del dueño del mismo día en fases para ejecutar en Claude Code, una por una. Cada fase es una rama y un PR. Los códigos (C01, U3, G2) remiten a esa auditoría, que tiene el detalle y la evidencia.

## Cómo usar este plan

Pegar en Claude Code, cambiando el número:

> Lee `docs/plan-fases-2026-11-16.md` y `docs/auditorias/2026-11-16-graficos-ux-ui-creditos.md`. Ejecuta solo la Fase N. Cumple las reglas comunes y los criterios de cierre de esa fase. Al terminar abre el PR, resume lo hecho y lo que no pudiste verificar, y detente. No empieces la fase siguiente ni fusiones sin mi autorización.

## Reglas comunes a todas las fases

- Una rama por fase desde `main` actualizado, con el nombre indicado. Commits en español.
- No tocar `prototipo/` ni `tests/fixtures/`. La prueba de paridad debe seguir pasando sin cambios.
- Ninguna fase cambia la simulación ni el balance, salvo que lo diga. Si un cambio visual obliga a tocar la simulación, detenerse y preguntar.
- Antes de abrir el PR: `npm test`, `npm run build` y `npm run escenas` en verde, y prueba en el navegador en vertical (393×852).
- ADR nueva si se agrega una pieza al motor o se cambia una decisión anterior. La próxima es la 0057. Actualizar `docs/adr/README.md` y `docs/estado.md`.
- Textos del juego en español neutro, sin guiones largos, dos puntos ni punto y coma.
- Respetar `reduceMotion` en todo efecto nuevo.
- El PR indica qué se verificó en simulador o navegador y qué queda por probar en un equipo real.

## Resumen

| Fase | Rama | Contenido | Tamaño | Depende de |
|---|---|---|---|---|
| 1 | `creditos-reloj` | C01, V04 y prueba del reloj | M | · |
| 2 | `creditos-acceso` | C02a, C03 y C04 | S | 1 |
| 3 | `creditos-pausa` | C02b | S | 2 |
| 4 | `creditos-pruebas-datos` | C05 de escenas y C06 | M | 1 a 3 |
| 5 | `lectura-amenaza` | Aviso de embestida, U3 y U4 | M | · |
| 6 | `un-solo-disparo` | Retirar "Acelerar es atacar" | M | · |
| 7 | `menu-taller` | U1, U2 y U5 | S | 6 |
| 8 | `pista-por-distrito` | G1 y G5 | M | · |
| 9 | `noche-costa-verde` | G2 | M | 8 |
| 10 | `costa-verde-piloto` | G3 y G4 | M | 9 |

Las fases 1 a 4 van primero y en orden. Las fases 5 a 10 no dependen de los créditos. El arreglo de Centro de Lima del 17 de noviembre sigue su propio plan y puede intercalarse entre fases.

## Decisiones del dueño (16 de noviembre de 2026)

- **D1, sí:** los créditos tienen pausa con "Continuar" y "Ver después" también la primera vez. La regla de no saltar se mantiene, salir no es saltar. Va en la Fase 3.
- **D2, se retira:** el modo "Acelerar es atacar" sale del juego. Tuvo 0 de 72 peleas. Queda un solo modo de disparo, por toque. Va en la Fase 6.
- **D3, se queda:** "¡AHÍ VIENE!" sigue en el centro de la pista mientras el jefe entra. El hallazgo U6 de la auditoría se cierra sin cambios.

---

## Fase 1 · El reloj de los créditos no espera a la música

**Rama:** `creditos-reloj`. **Archivos:** `src/core/credits.ts`, `src/core/audio/sfx.ts`, `src/core/audio/medley.ts`, `src/scenes/Credits.ts`, `tests/creditos.test.ts`.

**Problema:** `advance` hace `t = max(t, audio)`. Tras un corte de audio de D segundos con la página visible, la imagen queda congelada D segundos cuando el audio vuelve.

**Qué hacer:**
1. Primero la prueba, que debe fallar con el código actual: con el `advance` real a 60 cuadros por segundo, interrumpir el audio 5, 20 y 60 s en los instantes 10, 35 y 65, en dos variantes (reloj de audio nulo, y activo pero sin avanzar). Medir el mayor intervalo sin avance de `t` y la duración total.
2. Cambiar el reloj para que la imagen nunca espere. Si al volver el audio queda más de 0,5 s detrás de `t`, la imagen sigue con el tiempo real y la música se reubica.
3. `Sfx.seek(segundos)` para el popurrí: calcula sección y paso desde el tiempo y agenda desde ahí, sin repetir notas ya sonadas. Si reubicar a mitad de sección suena mal, seguir en silencio hasta el inicio de la siguiente sección.
4. V04: al pausar, guardar el instante narrativo efectivo y retomar desde él, separando lo ya sonado de lo solo agendado.

**Cierre:**
- Imagen detenida 0,25 s como máximo en todos los casos, y duración total de hasta 84,5 s.
- V04: pausar en 10, 35 y 65 s durante 30 s, y volver con un salto de 150 ms o menos.
- Se mantienen las pruebas de cadencia y de alineación con la música (menos de 150 ms sin interrupciones).
- ADR 0057, que ajusta las ADR 0050 y 0052.

## Fase 2 · Acceso a los créditos y red de seguridad

**Rama:** `creditos-acceso`. **Archivos:** `src/scenes/Credits.ts`, `src/core/audio/sfx.ts`, `src/core/save.ts`, `scripts/escenas.mjs`.

**Qué hacer:**
1. **C02a:** marcar los créditos como vistos al entrar a la escena, no a los 71,6 s. "Ver créditos" aparece en el menú desde la primera victoria en la Línea Amarilla. La regla de no saltar la primera vez no cambia: usar un dato aparte para "vistos completos" si hace falta, sin cambiar la versión del guardado.
2. **C03:** `try/catch` alrededor del cuerpo de `update` de `Credits`. Ante un error, terminar la escena, pasar a los resultados (o al menú, según de dónde vino) y dejar el error en consola.
3. **C04:** en `Sfx.init()` reanudar también cuando el estado es `interrupted`, y llamar a esa reanudación al volver la página (`visibilitychange` visible y `pageshow`).

**Cierre:**
- Escena nueva en `npm run escenas`: ganar la Línea Amarilla, recargar a los 10 s de créditos, y el menú ofrece "Ver créditos".
- Prueba con un dibujo que lanza a propósito: la escena termina y aparecen los resultados.
- La primera vez siguen sin poder saltarse.
- Pendiente en equipo real: bloquear y desbloquear un iPad durante los créditos y recuperar la música.

## Fase 3 · Pausa en los créditos

**Rama:** `creditos-pausa`. Decisión D1 tomada. **Archivos:** `src/scenes/Credits.ts`, `index.html`, `src/style.css`.

**Qué hacer:**
1. Mostrar el botón de pausa durante los créditos, también con P y Escape, desde la primera vez.
2. Panel con "Continuar" y "Ver después". "Ver después" termina la escena y sigue a los resultados o al menú.
3. La pausa detiene imagen y música juntas, y al continuar siguen desde el mismo punto con el mecanismo de la Fase 1.

**Cierre:**
- El botón mide 44 px o más y no tapa la ficha de reparto.
- Un toque en el botón o en el panel no cuenta como salto.
- Escena en `npm run escenas`: pausar, continuar, pausar y "Ver después".

## Fase 4 · Pruebas completas y datos de los créditos

**Rama:** `creditos-pruebas-datos`. **Archivos:** `scripts/escenas.mjs`, `src/core/telemetry.ts`, `server/src/validate.ts`, `scripts/datos.ts`, `public/privacidad.html`.

**Qué hacer:**
1. **C05:** recorrido completo de los créditos en `npm run escenas` con el reloj acelerado, con el guardado con todas las mejoras al máximo, y con una suspensión simulada del audio a mitad del desfile. Debe llegar a "CONTINUARÁ" sin errores de consola.
2. **C06:** evento anónimo `credits`: origen (victoria o menú), hasta qué segundo llegó, mayor intervalo sin avance de `t`, y cómo terminó (completo, saltado, "Ver después", salida o error). Sin nombre ni identificador.
3. Sección "Créditos" en el informe de `npm run datos`.
4. Actualizar `privacidad.html` con el evento nuevo.

**Cierre:**
- Contrato de datos cambiado junto en `telemetry.ts` y `server/src/validate.ts`, con su prueba de punta a punta.
- El modo prueba no envía nada.
- El PR avisa que el receptor se publica a mano con `npx wrangler deploy` desde `server/`, antes de fusionar el cliente.

## Fase 5 · Lectura de amenaza y de costo

**Rama:** `lectura-amenaza`. **Archivos:** `src/core/render.ts`, `src/bosses/phase-boss.ts` (solo lectura del estado), `src/core/audio/sfx.ts`, `src/core/input.ts`.

**Datos:** la embestida es el 42 % del daño en San Isidro y el último golpe en 8 de 10 derrotas. Las papeletas se llevan el 47 % del cobro en Miraflores normal.

**Qué hacer:**
1. **Aviso de embestida:** durante el aviso previo a la carga, pintar en rojo el carril por donde va a pasar el jefe, con un sonido propio distinto del claxon. Vibración corta con `navigator.vibrate` donde exista, apagada si el sonido está apagado. No cambiar los tiempos de aviso.
2. **U3:** reemplazar la etiqueta "PUNTO CIEGO" por una banda luminosa pegada al costado derecho del jefe, visible sobre asfalto oscuro. Mantener la regla de mostrarla hasta el tercer golpe por la derecha.
3. **U4:** contador fijo de papeletas en el HUD, que late con cada multa y muestra la causa un momento (por ejemplo "CLAXON" o "ROCE").

**Cierre:**
- La simulación y la paridad no cambian. `ETAPA=san-isidro npm run balance` y `ETAPA=miraflores npm run balance` dan lo mismo que antes.
- Capturas de antes y después en San Isidro y en Costa Verde.
- ADR si el aviso de carril queda como pieza declarable del jefe.

## Fase 6 · Un solo modo de disparo

**Rama:** `un-solo-disparo`. Decisión D2 tomada. **Archivos:** `index.html`, `src/scenes/Menu.ts`, `src/scenes/Garage.ts`, `src/scenes/Results.ts`, `src/core/input.ts`, `src/core/render.ts`, `src/core/save.ts`, `src/core/hints.ts`, `src/garage/upgrades.ts`, `scripts/campana.test.ts`, `scripts/escenas.mjs`, `tests/disparo.test.ts`.

**Qué hacer:**
1. Quitar el selector "Disparo" del menú y su texto explicativo. El menú queda con dificultad y "Jugar". El resumen bajo "Jugar" muestra solo la dificultad.
2. Toda partida usa el modo por toque. Un guardado con `fireMode: 'acelerar'` se lee como por toque, sin cambiar la versión del guardado.
3. Quitar del deck la variante sin botón de conos (`mode-acelerar`) y del HUD de escritorio el rótulo "↑ CONOS".
4. Taller, resultados y ayudas dejan de distinguir por modo. Las ayudas ya leídas en el modo por toque se conservan.
5. Balance: `npm run campana` y las metas de `docs/estado.md` quedan con un solo modo.
6. **No borrar del motor la ruta de disparo sostenido que usa la prueba de paridad** con el prototipo (`mantener`). Se retira lo que ve el jugador, no la capacidad del motor que reproduce el prototipo.
7. Datos: el campo `fireMode` sigue en el contrato y se envía siempre como `toque`, así el receptor y los informes anteriores no cambian.

**Cierre:**
- La prueba de paridad pasa sin cambios.
- `ETAPA=<distrito> npm run balance` por toque da lo mismo que antes en las diez etapas.
- Un guardado viejo en modo acelerar abre y juega por toque, con prueba.
- Los récords y medallas existentes se conservan. El ranking no distingue por modo.
- ADR nueva que reemplaza a las ADR 0011 y 0013 en lo que toca al segundo modo, y `docs/estado.md` actualizado.

## Fase 7 · Menú y taller

**Rama:** `menu-taller`. Va después de la Fase 6, porque el menú ya no tiene el selector de disparo. **Archivos:** `index.html`, `src/style.css`, `src/scenes/Menu.ts`, `src/scenes/Garage.ts`.

**Qué hacer:**
1. **U1:** el contenido que se desplaza no debe verse por debajo ni alrededor de la tarjeta fija de "Jugar": fondo opaco con degradado y margen inferior.
2. **U2:** Taller y Ranking como botones. Sonido, ayudas, jugador, datos, privacidad, acerca y créditos en una hoja de ajustes. "Empezar de nuevo" al fondo de esa hoja, con su confirmación actual.
3. **U5:** las categorías del taller entran en el ancho sin cortarse, y cada mejora inalcanzable dice "te faltan S/ X".

"¡AHÍ VIENE!" no se toca (D3).

**Cierre:**
- En 393×852 y en iPad, "Jugar" visible sin desplazar y ningún texto cortado detrás de la tarjeta.
- Todos los blancos táctiles de 44 px o más.
- Las escenas de `npm run escenas` que usan el menú y el taller siguen pasando, actualizadas a la nueva ubicación de cada control.

## Fase 8 · Pista por distrito y efectos de contacto

**Rama:** `pista-por-distrito`. **Archivos:** `src/core/road.ts`, `src/core/config.ts`, `src/stages/*/config.json`, `src/core/render.ts`, `docs/guia-etapas.md`.

**Qué hacer:**
1. **G1:** paleta de pista declarable por etapa en el JSON: tono del asfalto, desgaste y color de líneas. Valores para las diez etapas.
2. **G5:** humo de escape, marcas de frenada al girar, chispas en roces y líneas de velocidad con Turbo. Solo dibujo, sin efecto en la simulación.

**Cierre:**
- Dos capturas de distritos distintos se distinguen sin mirar los costados.
- Los efectos no tapan avisos ni proyectiles.
- Fluidez: p95 de hasta 20 ms en el navegador en tamaño de teléfono. Medición en equipo real pendiente.
- ADR y `docs/guia-etapas.md` con la pieza nueva.

## Fase 9 · Noche en la Costa Verde

**Rama:** `noche-costa-verde`. **Archivos:** `src/core/render.ts`, `src/core/config.ts`, `src/stages/costa-verde/config.json`.

**Qué hacer:**
1. **G2:** capa de oscuridad declarable por etapa, con conos de faros del Tico y del tráfico y halos de postes. Reutilizar lo que sirva del túnel (`drawDark`).
2. Los avisos del jefe, sus proyectiles, la carretilla y las aves van por encima de la oscuridad.

**Cierre:**
- Las amenazas se leen igual o mejor que hoy, con capturas de antes y después en las tres fases del jefe.
- `npm run campana` sin cambios, porque es solo dibujo.
- Fluidez igual que en la Fase 8. La Costa Verde es la etapa más pesada, así que el PR reporta la medición.
- ADR.

## Fase 10 · Costa Verde como piloto de arte interno

**Rama:** `costa-verde-piloto`. **Archivos:** `src/stages/costa-verde/scenery.ts`, `src/stages/miraflores/scenery.ts`, `src/core/art/canvas-painter.ts`.

**Qué hacer:**
1. **G3:** rehornear los costados de la Costa Verde con el acabado de los vehículos: borde del mar sin escalones y acantilado sin trama ruidosa.
2. **G4:** en Miraflores, tres o cuatro variantes de edificio por semilla y un hito reconocible por tramo.

**Cierre:**
- Sin escalones visibles en el borde del mar a 393 de ancho, y ningún módulo repetido dos veces seguidas.
- Página de comparación en `?graficos` con el antes y el después.
- El dueño decide con este resultado si el piloto de arte en pausa sigue interno o se encarga afuera.
