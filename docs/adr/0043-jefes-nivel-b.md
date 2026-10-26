# 0043. Jefes y combi aliada en nivel B

**Estado:** aceptada (pedido del dueño, 25 de octubre de 2026). Sigue a las ADR 0041 y 0042.

## Decisión
- **Jefes:** los diez jefes y la combi aliada del Socio se dibujan con imágenes horneadas, como el tráfico.
  - Cada jefe arma su carrocería con el ayudante común `bossCar` (`src/core/art/bosses.ts`).
  - Las imágenes van en la capa del jefe. Encima va una capa nueva (`bossFx`) con lo que cambia cada cuadro.
  - `drawBoss` recibe las dos capas.
- **Detalles fijos que se hornean** (campos nuevos de `CarArt`):
  - Conductor visto por el parabrisas, con gorra, lentes o insignia.
  - Anillos del Q8.
  - Parrilla de techo, rejillas y torreta con cañón del Rochabús.
  - Carga de rollos de tela o de contenedores.
  - Rótulo sobre la franja.
  - Marca verde del punto ciego.
  - Mitades de articulado, con el fuelle en la de atrás.
- **Lo que va encima, cada cuadro:**
  - Luces de freno y reversa, y balizas.
  - La circulina, que acelera cuando el jefe va a atacar.
  - Las puertas traseras que parpadean antes de soltar carga.
  - El cobrador, con el brazo y el sencillo.
  - La boquilla del Rochabús con su brillo.
  - El celular de la conductora del Q8.
  - El grito del claxon y el destello del golpe.
- **Carrocerías por jefe:**

  | Jefe | Carrocería |
  |---|---|
  | Serenazgo, Q8 y Comandante | Camioneta, con sus colores y detalles |
  | Rochabús | Blindado con torreta |
  | Combi Asesina | Combi con parrilla y cobrador |
  | Camión de Gamarra y Tráiler | Cabina adelante y carga atrás |
  | Expreso | Dos mitades de bus que giran sobre el fuelle |
  | Doble Fila | Camioneta y autos estacionados con balizas, rígidos sobre la curva (ADR 0040) |
  | Carguero de la Línea Amarilla | Avión horneado (alas, motores, fuselaje con volumen, cola en T); la rampa "SUBE" parpadea encima |

- **Daño:** cada jefe tiene sus cuatro etapas horneadas, con el contorno abollado.
- **`?graficos`** suma tres páginas: los jefes sanos, los jefes dañados y el carguero, cada uno dibujado con el código del juego.

## Consecuencias
- La simulación, la paridad y el balance no cambian.
- Algunos rótulos ganan legibilidad: los del camión y el tráiler van claros sobre placa oscura.
- Ya no queda nada dibujado con `drawCar` en el juego. Solo lo usa la vista de comparación.
- Siguen con el dibujo anterior los escenarios, las rampas, los obstáculos y los proyectiles. Son la última tanda del nivel B.
