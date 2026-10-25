# 0034. Enrosque de la serpiente

**Estado:** aceptada (bloque 3 del orden acordado el 25 de octubre de 2026). Decisiones del dueño el mismo día.

## Contexto
El plan del jefe final (plan de etapas, sección 5b) dejaba pendiente el último ataque de la Doble Fila de Agua Dulce: enroscarse dejando un solo hueco. Las auditorías lo marcaron como el clímax que le falta a la pelea final.

## Decisión
- **Forma:**
  - Los autos del cuerpo principal dejan la fila y rodean al Tico en un anillo.
  - El anillo tiene un casillero por auto más uno vacío, que es la salida.
  - Si la serpiente perdió autos, los casilleros vacíos se juntan con la salida y el hueco crece. Romper el cuerpo tiene premio.
  - Con menos de 3 autos en el cuerpo principal no se enrosca.
- **Momento:**
  - Es un ataque más de la fase 3, Agua Dulce.
  - El primero llega a los 4 s de empezar la fase, y luego uno cada 16 s, ajustado por la frecuencia de la dificultad.
  - Solo arranca si la cabeza está en crucero y el Tico no va en el aire.
  - Mientras dura, la cabeza no ataca ni toca el claxon.
- **Aviso:**
  - Durante 1 s el anillo se forma alrededor de donde estaba el Tico. Si el Tico sale antes de que se cierre, cuenta como escape. En Difícil son 0,75 s.
  - Un círculo de puntos rosados marca dónde se formará el anillo.
  - Una flecha verde con "SALIDA" late en el hueco.
  - La serpiente grita una frase de encierro.
- **Hueco:** nunca da fuera de la pista ni más abajo de lo que el Tico puede bajar. Con el acelerador, eso es la línea de crucero.
- **Anillo sólido:** durante 2,2 s el Tico no puede cruzarlo, salvo por el hueco. Mientras se forma y se deshace, los autos no hacen daño por contacto.
- **Atrapado:** si al final el Tico sigue adentro, el anillo aprieta.
  - Quita 6 de daño base, que con el multiplicador de cada dificultad son 19 en Normal.
  - Aturde 0,7 s y muestra "¡TE APRETÓ!" con la fuente "ENROSQUE".
  - El SOAT lo bloquea.
- **Escape:**
  - Salir por el hueco muestra "¡ESCAPASTE!" y deja la cabeza quieta y con balizas 3 s, con "CABEZA EXPUESTA".
  - En ese lapso la fila entera está aturdida: empuja pero no quita vida.
  - Al terminar, el Tico tiene 1 s de respiro de contacto para apartarse de la fila.
- **Bot de prueba:** si queda dentro del anillo, sale derecho por el hueco. En la campaña escapa de todos los enroscos.

## Medición
Campaña de 90 partidas por modo, contando las que se ganan al primer intento.

| Costa Verde | Por toque | Acelerando |
|---|---|---|
| Sin enrosque | 83% | 81% |
| Con enrosque | 69% | 70% |

El jefe final queda a la altura de la etapa más difícil hasta ahora, la Javier Prado (67%). Se dejó así por ser el clímax. Se revisa con datos reales en el bloque 6.

## Consecuencias
- Solo cambia la Costa Verde. La paridad y las demás etapas no se tocan.
- El guardado no cambia.
- `Seg` suma `ang` para dibujar los autos girados en el anillo, y `Game` suma `coil`.
