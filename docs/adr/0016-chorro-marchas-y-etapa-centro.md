# 0016. Ataque de chorro, obstáculos con vaivén y Etapa 3 Centro

**Estado:** aceptada, Hito 4 (etapas).

## Contexto
El Centro de Lima (`docs/plan-etapas.md`) necesita dos cosas que el motor no tenía: un jefe que ataca a distancia (el Rochabús con su chorro de agua) y marchas que cierran media pista con un hueco que cambia de lugar.

## Decisión
- **Ataque `jet`** del jefe genérico (`BossPhase.jet`: `tele`, `dur`, `w`, `push`, `dmg`):
  - Aviso: el jefe se alinea con el carril del Tico, la boquilla brilla y una línea punteada marca el carril.
  - Disparo: una columna de agua desde su frente hasta abajo que empuja de lado al Tico y al tráfico, y hace daño una sola vez por chorro.
  - El escudo SOAT evita el daño, y el claxon, la combi y el metro lo interrumpen, igual que a los demás ataques.
  - **El chorro nunca llega a las personas:** se corta en el primer grupo de peatones que tenga delante. Visualmente no se le apunta a la gente, y el jugador puede refugiarse detrás de una marcha.
- **`ObstacleDef.drift`**: vaivén lateral (amplitud y frecuencia), siempre dentro de la pista.
- **Etapa 3, Centro de Lima · Av. Abancay**:
  - Paisaje: casonas de colores con balcones de celosía, una iglesia de dos torres y una plaza con pileta.
  - Tráfico: combis con ruta "ABANCAY", patrulleros (papeleta), motos Delivery y taxis.
  - Peligros: rejas, carretillas de emoliente, el "DESVÍO TEMPORAL · DESDE 2019" que ocupa dos carriles y marchas de tres carriles que se corren de lado. Las marchas solo empujan: no hacen daño ni dan papeleta, porque el chiste es la ciudad cerrada, no la gente.
  - Enjambre de combis en diagonal en Difícil.
  - **Jefe: El Rochabús**, en tres fases: disuasión con chorros y frenazos; contención con chorros, embestidas y patrulleros de refuerzo; estado de emergencia con todo más el sirenazo que aturde y motos de escolta. Las frases apuntan a la burocracia y al exceso de control ("El desvío es temporal desde 2019"), no a quienes marchan.

## Balance (bot medio)
- Normal: ~78 s por toque (gana 21 de 30) y ~75 s acelerando (27 de 30).
- Difícil: gana 12 de 30.
- El bot casual pierde casi siempre en Normal porque nunca esquiva el chorro, que es la habilidad que pide esta etapa.

## Consecuencias
- El chorro sirve para otros jefes que ataquen a distancia, y el vaivén para cualquier obstáculo móvil.
- La paridad con el prototipo y los números de Miraflores y San Isidro no cambian.
