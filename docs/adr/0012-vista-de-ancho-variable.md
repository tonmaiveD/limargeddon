# 0012. Vista de ancho variable: más ciudad a los costados

**Estado:** aceptada, Hito 3. Ajusta las ADR 0001 y 0010.

## Contexto
En el teléfono del dueño, dentro del navegador de una app, el espacio disponible sobre el deck era más ancho que 9:16. El juego, fijo en 360×640, quedaba limitado por el alto, con franjas vacías de unos 65 px a cada lado.

## Decisión
- El alto lógico sigue fijo en 640, y la pista y toda la simulación siguen en 0..360. Lo único que crece es el **ancho visible**: `view.w = 640 × ancho/alto` disponible, entre 360 y `MAX_VIEW_W` = 540.
- `fitStage()` ajusta el backing del canvas con `game.scale.resize(view.w × ZOOM, 640 × ZOOM)` y dimensiona `#stage` con ese mismo aspecto. La cámara sigue centrada en (180, 320), así que la vista crece igual hacia ambos lados.
- El paisaje de San Isidro dibuja columnas extra de cuadras a los costados (torres y El Olivar; la Huaca y el Golf siguen siendo únicos), y las barras del HUD se estiran a todo el ancho. Los textos y barras del HUD siguen anclados a la zona 0..360.
- El tope de 540 evita que, en pantallas muy anchas como un escritorio, la pista quede angosta en medio de demasiada ciudad.

## Consecuencias
- Probado: 430×780 da una vista de 453 y un canvas a todo el ancho; 375×812, una vista de 378; un escritorio de 1280×800 queda en el tope de 540.
- Las etapas futuras deben dibujar su paisaje en `-view.extra .. 360 + view.extra`. Un paisaje que no lo haga deja franjas lisas del color de fondo, no vacías.
