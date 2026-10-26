# 0040. Curva rígida por objeto en la Costa Verde

**Estado:** aceptada (pedido del dueño, 25 de octubre de 2026).

## Contexto
La pista curva de la Costa Verde (ADR 0026) se aplica solo al dibujo: a cada punto se le suma un corrimiento lateral según su altura (`Gfx.warp`). Eso sirve para el asfalto, pero deformaba lo que debería ser rígido:
- **Autos, jefe y obstáculos:** la parte de arriba y la de abajo de cada uno se corrían distinto, así que salían chuecos.
- **Rectángulos:** se cortaban en franjas de 16 px, y cada franja se corría por su cuenta, así que salían escalonados.
- **Textos:** "TAXI", "DOBLE FILA" y "DON FRÍO" quedaban despegados de su vehículo.

## Decisión
- `Gfx.rigid(x, y, dibujo)` dibuja un objeto entero: lo corre según la curva a la altura de su centro y lo gira con la pendiente de la pista en ese punto, para que apunte hacia donde va el camino. Los textos giran con él. Sin curva no hace nada.
- **Lo que se dibuja rígido:**
  - Vehículos del tráfico, el Tico y la combi aliada.
  - Cada auto de la doble fila y su cabeza, con su marca de punto ciego.
  - El aviso del enrosque.
  - Obstáculos, bonus, conos y proyectiles.
  - La carretilla, también en el cierre, y la bandada con su sombra.
  - Los anillos del claxon.
- **Lo que sigue la curva punto a punto:** el asfalto, las líneas, el paisaje, la neblina, la marea, la línea de meta, las bandas de los semáforos y las partículas.

## Consecuencias
- La simulación, las colisiones y la paridad no cambian: todo sigue ocurriendo en la pista recta y esto es solo dibujo.
- En las etapas rectas no cambia nada.
- Revisado en el navegador a 393×852 en la Costa Verde, con la doble fila, el tráfico, la carretilla y obstáculos.
