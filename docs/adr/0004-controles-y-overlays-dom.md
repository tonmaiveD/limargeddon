# 0004. Controles táctiles y overlays en capa DOM

**Estado:** aceptada por el dueño del producto, Hito 2.

## Contexto
El HANDOFF deja abierto si los controles táctiles van como botones de Phaser o como capa DOM. El prototipo los pone debajo del canvas, que se achica para dejarles espacio.

## Decisión
- Deck táctil HTML debajo del canvas, igual que el prototipo (elegido por el dueño del producto): pad de cuatro direcciones y tres armas con sombra de cooldown. Solo visible con `pointer: coarse`.
- Teclado y deck escriben el mismo objeto `keys` (`src/core/input.ts`); el teclado de Phaser está desactivado.
- Menú y resultados también son overlays DOM, controlados por las escenas `Menu` y `Results`: botones accesibles con foco y el mismo CSS del prototipo.
- Dos ajustes respecto al prototipo, ambos de robustez y sin efecto en la simulación:
  - Un toque más corto que un cuadro se mantiene 60 ms para que la simulación lo lea (antes se perdía).
  - En pantallas de 400 px o menos el deck usa botones algo más angostos; en 375 px el botón CLAXON quedaba cortado.

## Consecuencias
- El pulgar no tapa la pista, que es donde maneja el Tico.
- `fitStage()` reparte la altura entre canvas 9:16 y deck; se recalcula con `ResizeObserver`.
