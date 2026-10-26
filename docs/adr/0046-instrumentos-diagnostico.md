# 0046. Instrumentos de diagnóstico fieles: fluidez sin suavizar y colisiones por regla

**Estado:** aceptada (pedido del dueño, 26 de octubre de 2026). Bloque G de la sexta auditoría (`docs/auditorias/2026-10-26-sexta-auditoria.md`), hallazgos S01 y S02. Corrige las herramientas de la ADR 0045.

## Contexto
- **S01:** el medidor de fluidez recibía el `delta` que Phaser 3.90 le pasa a la escena. Phaser lo suaviza con las últimas diez muestras, así que un tirón de 300 ms quedaba como un cuadro normal. Además, el contador usaba 33,4 ms y la especificación 33,3 ms.
- **S02:** la vista de colisiones dibujaba el Tico siempre como caja y giraba los contornos en la curva. Frente a proyectiles y bonus el juego usa círculos de otro radio, y la caja girada podía correrse hasta 7 px del área lógica.

## Decisión
- **Fluidez** (`src/core/frames.ts`):
  - Se mide `game.loop.rawDelta` (función `frameMs`), el intervalo crudo del navegador. La simulación sigue usando el delta suavizado, sin cambios.
  - Umbrales con nombre y unidad: `SLOW_MS` = 20 ms (objetivo del percentil 95) y `JANK_MS` = 33,3 ms (objetivo del percentil 99 y cuadro perdido).
  - Los bloqueos de 100 ms o más con el juego en primer plano se guardan uno por uno en `stalls`, hasta 30.
  - Solo se descarta lo que no mide el dibujo: el primer cuadro, la vuelta de una pausa (el juego se pausa al ocultarse o perder el foco) y saltos de más de 5 s (equipo suspendido).
- **Vista de colisiones** (`src/core/hitboxes.ts`), cada forma según la regla que la resuelve:
  - Tico: caja de contacto (tráfico, obstáculos, jefe, peligros), círculo de radio `w/2` (proyectiles del jefe) y círculo de radio `h/2` (bonus). Dos formas se tocan justo cuando la regla se cumple.
  - Conos: raya horizontal de ancho `2r`, porque la regla compara su centro con la caja ensanchada por `r`.
  - Enrosque: un sector por auto del anillo, con el ancho de banda y el alcance angular de `ringBlock`.
  - Peaje: rosado si la barrera del carril del Tico está cerrada, amarillo si cobra.
  - Lo que no puede chocar en ese cuadro (en el aire, ya golpeado) se ve tenue.
  - Los contornos se proyectan punto a punto sobre la curva, en tramos de 4 unidades, como el área lógica. Los dibujos siguen rígidos, así la diferencia entre dibujo y choque queda a la vista.
  - Leyenda en el HUD con los cinco colores.

## Pruebas
En `tests/graficos.test.ts`:
- Secuencias con picos de 40, 120 y 300 ms conservan el máximo, el percentil 99 y el número de picos.
- El medidor usa el intervalo crudo, y el umbral es 33,3 ms.
- La caja del Tico, proyectada en 300 tramos de la curva de la Costa Verde, queda a menos de 1 px del área lógica.
- Los dos casos de la auditoría, el proyectil a 30 unidades que no golpea y el bonus a 30 unidades que sí se recoge, se ven igual que lo que decide la regla.
- En el aire la caja se ve tenue y los círculos no.
- Un sector por auto del anillo.

## Consecuencias
- Los registros del teléfono ya sirven para aprobar o rechazar los objetivos de fluidez del piloto.
- La vista de colisiones sirve para comparar arte y contacto. No cambia ninguna regla del juego.
