# 0010. Layout móvil: canvas a todo el ancho y deck rediseñado

**Estado:** aceptada, Hito 3. Ajusta la ADR 0001 (cómo se dimensiona el canvas) y la ADR 0008 (distribución del deck).

## Contexto
En un iPhone real (Chrome iOS), el dueño vio el juego en una cajita centrada, mucho menor que el espacio disponible, y un deck con botones chicos, flechas dibujadas como emoji azules y un hueco al medio.
- Causa del canvas chico: `#stage` sí tenía la caja 9:16 correcta, pero Phaser se quedó con el tamaño del contenedor que midió al arrancar, antes de que iOS acomodara la barra del navegador, y no volvió a medir.
- iOS dibuja ◀ ▶ como emoji si no se fuerza la presentación de texto.

## Decisión
- El canvas llena `#stage` por CSS (`width/height: 100%`), con Phaser en FIT sin centrado. El tamaño lo decide solo `fitStage()`, que además se recalcula al rotar y cuando cargan las fuentes. Ya no depende de la primera medición de Phaser.
- Backing del canvas según la densidad de pantalla: `ZOOM` de 2 a 3 (3 en la mayoría de los teléfonos), para que el juego se vea nítido a todo el ancho.
- Alto con `100dvh` para respetar las barras dinámicas de los navegadores móviles.
- Deck a todo el ancho, hasta 520 px, con alto entre 132 y 190 px (21% de la pantalla) y margen para el área segura inferior:
  - Mitad izquierda: volante y acelerador (franja superior ACELERAR al 44%, ◀ ▶ grandes debajo).
  - Mitad derecha: CONOS, el arma más usada, como botón alto en el borde derecho, donde cae el pulgar; ACEITE y CLAXON apilados a su lado.
- Los íconos llevan el selector de variación de texto (U+FE0E) para que no se vean como emoji.

## Consecuencias
- Probado en emulación de 393×852: canvas de 361×642 y deck de 179 px, sin desbordes. Falta confirmarlo en el teléfono del dueño.
