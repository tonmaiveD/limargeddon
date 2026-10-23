# 0003. Render procedural con un adaptador tipo canvas sobre Phaser.Graphics

**Estado:** aceptada, Hito 2.

## Contexto
No hay sprites todavía y la deformación por daño debe seguir siendo procedural (CLAUDE.md, concepto). El prototipo dibuja todo con la API 2D de canvas: trazados, elipses rotadas, textos dentro de los autos. El HANDOFF sugiere RenderTexture o Graphics.

## Decisión
- `src/core/gfx.ts` expone un subconjunto de la API de `CanvasRenderingContext2D` (`fillStyle`, `fillRect`, `beginPath/moveTo/lineTo/arc/ellipse`, `fill`, `stroke`, `save/restore/translate/rotate`, `globalAlpha`, `fillText`, `measureText`) implementado sobre `Phaser.GameObjects.Graphics` (WebGL) con matriz de transformación propia.
- Los textos usan un pool de `Phaser.GameObjects.Text` por fuente; solo se re-rasterizan si cambia el contenido o el color.
- Cuatro capas con profundidad fija: mundo, entidades, efectos y UI. Cada una es un `Gfx` con su pool de textos encima.
- El halo `shadowBlur` de las luces de freno y reversa se reemplaza por tres rectángulos translúcidos; es el único efecto sin equivalente directo.
- Se descartó una `CanvasTexture` redibujada cada cuadro: obligaba a subir 720x1280 a la GPU por cuadro, caro en móviles modestos.

## Consecuencias
- `damage-render.ts`, `scenery.ts` y `render.ts` son un port casi línea por línea del prototipo, fácil de auditar contra él.
- Cuando lleguen sprites, la carrocería base pasa a ser imagen y `carPath` se usa como máscara o capa de abolladuras; la API de `Gfx` no cambia.
- Costo medido: ~0.3 ms por cuadro de CPU para simular y armar la geometría.
