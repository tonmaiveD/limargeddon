# 0041. Prueba de gráficos nivel B: vehículos horneados con sombreado

**Estado:** aceptada. El dueño aprobó el estilo el 25 de octubre de 2026 y se integró al juego en la ADR 0042.

## Contexto
El dueño ve los gráficos "de los 80". Se evaluaron tres niveles:
- **A:** pulir el dibujo actual.
- **B:** dibujar cada vehículo una vez con Canvas 2D completo y usarlo como imagen.
- **C:** sprites de un artista.

Se recomendó el B y se pidió una prueba con el Tico y dos autos antes de invertir más.

## Qué se hizo
- `src/core/art/bake.ts` dibuja ("hornea") un vehículo en un canvas a cuatro veces su tamaño, con:
  - Sombra difusa y ruedas que asoman.
  - Carrocería con degradado de volumen, contorno y un brillo largo en el costado.
  - Vidrios con degradado y reflejo diagonal, y techo sombreado.
  - Espejos, faros con halo y luces traseras.
  - Letrero de taxi o rótulo.
- **Tres carrocerías:** el Tico (hatchback), el sedán y la combi.
- **El daño sigue siendo procedural, como pide CLAUDE.md:**
  - Se hornea con el mismo contorno abollado de `carPath`, el frente hundido, las abolladuras (ahora con relieve), el parabrisas trizado y el capó levantado.
  - En el juego se hornearía una imagen por etapa de daño (0, 35%, 65% y 90%) por color y semilla, guardadas en caché.
  - El destello del golpe, las luces de freno y las balizas seguirían dibujándose encima cada cuadro.
- **Vista de comparación:** se abre con `?graficos` en la dirección (`src/scenes/Graficos.ts`). Muestra el actual y el nivel B, sanos y al 65% de daño, y tocar la pantalla amplía cada fila al doble.

## Para decidir
- Si el estilo convence, sigue el resto del tráfico (unos 15 tipos con sus `look`), luego los diez jefes con sus estados y al final paisaje y efectos.
- Ajustes vistos en la prueba:
  - Con mucho daño, las ruedas quedan por fuera del contorno abollado.
  - En la combi, el techo verde tapa casi toda la franja roja.
- Se notó de paso que en el dibujo actual el rótulo "JAVIER PRADO" de la combi se sale del vehículo. En el nivel B entra.

## Consecuencias
- No cambia nada del juego ni de la simulación. La vista solo existe con `?graficos`.
