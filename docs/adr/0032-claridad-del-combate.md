# 0032. Claridad del combate

**Estado:** aceptada (bloque 1 del orden acordado el 25 de octubre de 2026).

## Contexto
Las dos auditorías coincidieron en que el combate comunica mal:
- Llegaba a haber 20 textos a la vez en pantalla.
- No se decía qué te golpeó.
- El punto ciego dependía de descubrirlo solo.
- La reversa del Q8 en Difícil llegaba casi sin aviso (0,05 s).
- Varios botones medían menos de 44 px.
- Con diez etapas, el menú del modo prueba ya no cabía.

## Decisión
- **Números de daño agrupados:** los golpes al jefe del mismo lado dentro de 120 ms se suman en un solo número. La posición se sigue sorteando siempre, así la secuencia aleatoria (y la paridad) no cambia.
- **Racha:**
  - El contador fijo del HUD lleva la cuenta.
  - Sobre el jefe solo se avisa al arrancar ("¡PUNTO CIEGO!") y al llegar al techo ("RACHA MÁXIMA · DAÑO +30%"), en lugar de un texto en cada impacto.
- **Qué te pegó:**
  - Cada golpe al Tico muestra el daño con su fuente ("-7 COMBI", "-5 CHORRO", "-4 CABLES").
  - La derrota muestra "Último golpe".
  - `hurt` recibe la fuente, y `hitName` traduce el tipo de vehículo o de proyectil.
  - Los avisos sueltos que repetían la fuente ("¡CHORRO!", "¡COLETAZO!", "¡LA MAREA!", "¡ROMPEMUELLES!") se reemplazan por ese texto.
- **Señal del punto ciego:** una flecha verde con "PUNTO CIEGO" late junto al costado derecho del jefe hasta el tercer golpe por la derecha (`stats.rightHits`). Va en la capa de efectos para seguir la pista curva, y no aparece en la etapa de ruta.
- **Reversa del Q8 en Difícil:** el aviso pasa de 0,05 s a 0,35 s.
- **Blancos táctiles:**
  - La pausa, los botones de opción y los enlaces del menú miden al menos 44 px.
  - Las pantallas superpuestas usan centrado seguro y no encogen a sus hijos: si el menú no cabe, se desplaza en vez de montar un texto sobre otro.
- **Menú en modo prueba:** las etapas aparecen como números (1 a 10), con el nombre completo en el título accesible.

## Consecuencias
- La simulación no cambia, salvo el aviso de la reversa en Difícil de San Isidro.
- Pendiente de este bloque, de las auditorías: ninguno. Lo siguiente en el orden es el taller que explique (bloque 2).
