# 0030. Etapa secreta, la Línea Amarilla del Terror

**Estado:** aceptada por el dueño del producto (decisiones del 25 de octubre de 2026), pendiente de prueba en el teléfono.

## Contexto
El plan (sección 5) pide una etapa secreta que se desbloquea al vencer la Costa Verde. Es una ruta sin pausa hasta el aeropuerto, que termina subiendo el Tico a un avión carguero. El dueño decidió:
- Tramos con un avión como meta, sin jefe que pelear.
- Peajes donde se elige entre pagar y romper.
- Un túnel oscuro con eco.
- Si el avión se va sin ti, reintentas el tramo.

Pidió además tres cosas:
- Incluir el caso del puente de acceso al nuevo aeropuerto Jorge Chávez. El acceso provisional son dos puentes modulares de solo dos carriles cada uno sobre el río Rímac (el aeropuerto anterior tenía ocho), con alertas de colapso vehicular, mientras el puente definitivo Santa Rosa sigue sin terminarse.
- Que el avión sea tipo C-5 Galaxy.
- Que detrás persiga una marea con todos los personajes de las etapas anteriores.

## Decisión
- **Etapa de ruta** (`route` en la config y `RouteAI`):
  - No hay jefe. La barra muestra lo que falta del recorrido, y cada tramo es una "fase" con su nombre.
  - El avance se mide en segundos de recorrido a velocidad normal, y el turbo lo acorta.
  - Cada tramo puede cambiar el ancho de la pista, la densidad del tráfico y cuánto sube el Tico.
  - El tráfico, los obstáculos y los enjambres declaran en qué tramos aparecen (`tramos`).
  - `dmgBoss` no hace nada en una ruta, y la etapa no ofrece los bonus que dañan al jefe.
- **Intentos:** 3. Morir o perder el avión gasta uno y retoma el tramo actual con la vida llena, sin perder los anteriores (`BossAI.onDeath`).
- **Tramos:**
  1. **Vía de Evitamiento:** peajes de pago (`payLanes`, `toll`). Dos carriles abiertos cobran S/ 20, que se descuentan del cobro. Los cerrados se rompen con daño y una estrella de búsqueda.
  2. **Túnel bajo el Rímac:**
     - Tres carriles, todo oscuro salvo el cono de los faros, y enjambres mezclados.
     - El claxon hace eco: aparta tráfico más lejos, pero pegado a la pared te aturde.
  3. **Puente provisional:** la pista se angosta a dos carriles con tráfico muy denso, y aparecen los carteles "PUENTE PROVISIONAL · 2 CARRILES" y "PUENTE DEFINITIVO, PRONTO". Empieza la marea.
  4. **Pista del aeropuerto:**
     - El carguero "GALAXIA CARGO" (parodia tipo C-5) baja, rueda meciéndose 5 s con la rampa abierta y despega.
     - Subirse a la rampa gana la etapa. Hay carros de equipaje y vehículos de seguridad.
- **Marea:** desde el puente, todos los personajes anteriores apretados detrás del Tico. Avanza si no aceleras y retrocede si aceleras, y mientras te toca quita vida y te empuja.
- **Secreto:**
  - La etapa es la número 10 (`secret: true`) y se desbloquea al ganar la Costa Verde.
  - Desde la mitad del recorrido, el menú anticipa "Hay una línea amarilla que todavía no conoces".
  - Al ganar la Costa Verde aparece el aviso de la línea amarilla, y el taller dice "Seguir a la Línea Amarilla".
- **Cierre:** "¡Subiste al carguero!" y "El Tico sube al carguero y Lima se aleja por la ventanilla. Deuda saldada... por ahora."
- **Puntaje:** sin jefe, el punto ciego se reemplaza por los intentos que sobraron, y la racha por esquivar la marea.
- **Balance** (bot de ruta, 30 semillas):
  - En Normal, por toque gana 25 de 30, acelerando 29 de 30. En Difícil, por toque gana 18 de 30.
  - La etapa dura unos 85 s, porque depende del recorrido y no del daño.
  - Con las mejoras de la campaña, el bot siempre gana.

## Consecuencias
- El bot no sufre la oscuridad del túnel ni suelta el acelerador, así que la marea no lo alcanza. Para una persona la etapa es más difícil de lo que dicen los números. Hay que confirmarlo con partidas reales.
- La escena del Tico dentro del avión es texto en resultados. Una animación queda como pulido posible.
- Las piezas de ruta (tramos, angostamiento, intentos, meta) sirven para futuras etapas especiales.
