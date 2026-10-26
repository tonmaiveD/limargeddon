# 0044. Paisaje, obstáculos y proyectiles en nivel B

**Estado:** aceptada (pedido del dueño, 26 de octubre de 2026). Cierra el nivel B de las ADR 0041 a 0043.

## Contexto
Faltaban en nivel B los costados de la pista de los diez distritos, la pista misma, los obstáculos, los bonus y los proyectiles. Reescribir a mano todo ese dibujo habría sido largo y fácil de equivocar, así que se reutiliza el que ya existe.

## Decisión
- **Pintor en Canvas 2D** (`src/core/art/canvas-painter.ts`):
  - Tiene la misma interfaz que `Gfx`, recogida en la interfaz `Painter`.
  - El dibujo de siempre se hace una sola vez sobre un canvas y se hornea como imagen.
  - **Relieve automático:** cada figura opaca que no es fondo proyecta una sombra suave, y los textos también.
- **Costados de la pista** (`drawSides`):
  - Cada tramo de 110 se hornea con su mismo dibujo, con relieve, grano fino y la sombra que proyecta la vereda del lado de la pista.
  - Se dibuja como imagen en una capa nueva de fondo, debajo de la pista.
  - En la pista curva cada tramo se corta en franjas de 8 que siguen la curva. Con 16 se veían escalones en el borde del mar y letreros partidos.
  - La caché (`art/cache.ts`) borra los tramos que llevan dos segundos sin dibujarse, así la memoria no crece con el scroll.
  - Los dibujos de los costados ahora reciben un `Painter`.
  - La Línea Amarilla distingue el paisaje de cada tramo de la ruta.
  - Arreglo de paso: en Miraflores las luces de las ventanas dependían de la posición en pantalla y parpadeaban al bajar. Horneadas, quedan fijas.
- **Pista**, dibujada cada cuadro, curvada punto a punto:
  - Vereda con borde claro y cordón oscuro.
  - Huellas de llantas por carril.
  - Por tramo, grietas y manchas de aceite fijas.
  - Rayas con desgaste distinto cada una, y el borde amarillo con su filo.
  - Se descartaron los parches de asfalto: aun tenues, parecían cajas en la pista.
- **Obstáculos, bonus y proyectiles** (`art/props.ts`): el dibujo de cada uno se hornea como sprite con relieve. Lo que cambia cada cuadro se dibuja en vivo:
  - **Peaje:** las casetas se hornean y las barreras que suben y bajan van en vivo.
  - **Peatones:** cada persona se hornea y se mueve en vivo.
  - **Bonus:** el rombo se hornea; el halo que late y la letra van en vivo.
  - **Proyectiles:** se hornean, y el giro de la piedra, el contenedor y el picarón se aplica al dibujar. El rollo tiene cuatro cuadros de vuelta. La cancha es tan chica que sigue en vivo.
  - Los rótulos de las barreras van en una placa que contrasta con el color del texto, para leerse sobre las franjas.
- **`?graficos`** suma tres páginas: dos con los obstáculos de las diez etapas y una con proyectiles y bonus.

## Consecuencias
- La simulación, la paridad y el balance no cambian.
- **Rendimiento:** con el navegador en tamaño de teléfono, un cuadro completo (simulación y dibujo) tomó cerca de 1 ms. Falta medir en un teléfono real, con la Costa Verde, que corta los tramos en franjas.
- Con esto todo lo que se ve en pista está en nivel B. Quedan con su estilo los textos flotantes, partículas, HUD y menús.
