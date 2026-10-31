# 0054. UX vertical: controles solo en combate, "Jugar" fijo y taller para comparar

**Estado:** aceptada (30 de octubre de 2026). Iteración 1 de la auditoría UX en iPhone 15 (`docs/auditorias/2026-10-30-ux-iphone-15.md`), hallazgos UX15-01 y UX15-02, acotada por decisión del dueño a la experiencia vertical: el juego se diseña y se juega en vertical, y no se suma nada para horizontal.

## Contexto
En un teléfono con las barras de Safari visibles, los controles táctiles ocupaban la parte de abajo también en el menú, el taller y los resultados.
- En el menú, los botones de dificultad, que además arrancaban la partida, quedaban fuera de la vista inicial, y había que adivinar que el panel se desplazaba.
- En el taller solo entraba una mejora a la vez.

## Decisión
- **Controles solo donde se maneja** (`showDeck` en `src/core/layout.ts`):
  - El panel táctil se muestra en el combate y en el desfile de los créditos, y se oculta en el menú, el taller y los resultados.
  - Al cambiar, la escena se vuelve a medir (`fitStage`) para que el canvas y los toques coincidan.
  - El documento arranca con los controles ocultos, sin un salto inicial.
- **Menú:**
  - Un botón **"Jugar etapa N"** (o "Jugar · Línea Amarilla") en una tarjeta fija abajo, siempre visible aunque el menú se desplace. Debajo resume la dificultad y el modo de disparo.
  - La dificultad pasa a ser un selector, como el de disparo, y elegirla no arranca la partida.
  - Las medallas y los bonus de la etapa quedan en una sección desplegable.
- **Taller:**
  - El Tico es más chico y el panel empieza más arriba.
  - Las categorías van en una sola fila que se desliza.
  - Las tarjetas son más compactas y "Ahorrar para esta" tiene más área táctil.
  - "Seguir" y "Menú" quedan fijos abajo.

## Verificación
- **iPhone 17 simulado:**
  - El menú entra completo con "Jugar" visible.
  - Al jugar vuelven los controles, y la flecha derecha mueve el Tico.
  - El taller muestra tres mejoras sin desplazarse.
- **Chrome emulando un iPhone táctil:**
  - Los controles se ocultan en el menú, aparecen en el combate y se ocultan en los resultados.
  - "Al taller", "Revancha" y "Dificultad" se ven sin desplazarse, y la revancha los vuelve a mostrar.
- **iPad Pro 13" simulado:**
  - El menú entra completo y al jugar aparecen los controles.
  - Ahí apareció una franja oscura detrás del pie fijo, y por eso pasó a ser una tarjeta del ancho del botón.

## Pendiente
Las iteraciones siguientes de la auditoría van aparte: aprendizaje y lectura, con prueba de jugadores, y la derrota resumida.
