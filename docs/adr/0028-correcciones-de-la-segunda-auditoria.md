# 0028. Correcciones de la segunda auditoría

**Estado:** aceptada por el dueño del producto.

## Contexto
Una auditoría externa del commit `fd87432` (jugabilidad, acción y recompensa, simulaciones) encontró reglas que no coincidían con su efecto y propuso ajustes medidos. Este cambio aplica las correcciones rápidas. Las propuestas grandes quedan en `docs/estado.md`.

## Decisión
- **El rompellantas aturde de verdad:** el proyectil que lanza el jefe copia `throw.stun`. Antes se perdía al crearlo. El test anterior no lo detectaba porque fabricaba el proyectil a mano.
- **Pegarle al cuerpo de la serpiente conserva la racha:** un impacto aceptado por `hitShot` cuenta como impacto válido. No la sube ni cuenta como golpe por la derecha.
- **El primer claxon de cada fase respeta `hornFirst`,** con o sin escoltas. Antes solo se aplicaba si la fase traía escoltas.
- **El salto ya no promete de más:** el consejo de la Vía Expresa dice que el salto evita choques y coletazos, pero que el claxon igual aturde.
- **Ayudas en pantalla:** Gamarra ("Pasa los cables sin acelerar", a los 7 s) y Vía Expresa ("Acelera sobre la rampa para saltar", a los 2 s), antes del primer encuentro con cada regla.
- **Simulación:** el ayudante `evitaCuerpo` pasa a `tests/harness/evita.ts`, así la campaña ya no corre también el balance completo.
- **Ajuste tras volver a medir:**
  - Gamarra: daño en Normal ×1.3 → ×1.15, porque el claxon a tiempo la endureció.
  - Cadencia de conos del modo "acelerar": 0,55 → 0,68 en la Vía Expresa y 0,55 → 0,62 en la Costa Verde.
  - Vida del jefe de la Costa Verde: 2500 → 2750, para que el final no sea más corto que las peleas anteriores.
- **Campaña** (30 por modo, bot medio, Normal, gana al primer intento):

  | Modo | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
  |---|---|---|---|---|---|---|---|---|---|
  | Por toque | 93% | 77% | 90% | 83% | 80% | 70% | 83% | 70% | 83% |
  | Acelerando | 97% | 90% | 97% | 77% | 77% | 87% | 87% | 87% | 67% |

  La Costa Verde dura 81 s por toque y 67 s acelerando.

## Consecuencias
- Las tres reglas corregidas (rompellantas, racha en el cuerpo y claxon) ya hacen lo que el juego comunica.
- **Quedan para después, con decisión del dueño:**
  - El enrosque final de la serpiente (plan 5b).
  - Un taller que explique opciones y dónde sirve cada objeto.
  - Agrupar los números de daño.
  - La fórmula de puntaje y ranking que propuso la auditoría.
