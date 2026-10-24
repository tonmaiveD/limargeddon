# 0020. Objetos de victoria con efecto

**Estado:** aceptada por el dueño del producto.

## Contexto
Cada etapa entregaba un objeto al ganar (Silbato, Bolso, Poncho) con un texto que prometía un efecto, pero el juego solo lo mostraba como rótulo. La auditoría de octubre lo marcó como el problema más grave de confianza. El dueño eligió que tengan efecto real.

## Decisión
- **Cuándo se tienen:** desde que se gana la etapa que los da, en toda pelea siguiente, incluidas las repeticiones. Se derivan del progreso (`wonItems(unlocked)`), sin un campo nuevo en el guardado.
- **Cuánto protegen:** una vez por pelea.
- **Efectos**, declarados en `rewards.item` de cada etapa con `effect`:
  - `contactFine`, **Silbato confiscado** (Miraflores): el primer roce con un intocable, como un sereno o un policía, no tiene multa. No perdona los disparos.
  - `anyFine`, **Bolso de Diseñador** (San Isidro): anula la primera papeleta, venga de donde venga. Se suma al Silbato. En un roce se gasta primero el Silbato, así que con los dos se perdonan hasta dos papeletas.
  - `jetHit`, **Poncho impermeable** (Centro): el primer chorro no hace daño. El empujón se mantiene. Servirá también en las etapas futuras con agua.
- **A la vista:**
  - Una ficha por objeto junto a la barra de vida del Tico, que se apaga al gastarse.
  - Al usarse, el nombre del objeto aparece sobre el Tico, con el sonido de bloqueo.
  - El taller lista "Tus objetos".
  - Resultados muestra el nombre y el efecto del objeto de la etapa.
- **Motor:** `player.items` (lo llena la escena al empezar), `Game.perks` (las cargas de la pelea) y `usePerk(G, effect)`. `fine` recibe si la papeleta viene de un roce.
- El sticker de lujo "Mi papá es socio del Golf" anula todas las papeletas antes de que se gasten los objetos.

## Consecuencias
- Una etapa nueva puede dar un objeto con uno de estos tres efectos solo con datos. Un efecto nuevo necesita código en el motor y un ADR.
- La prueba de paridad no cambia, porque el prototipo no tiene objetos.
- El bot de balance juega sin objetos. Su efecto es pequeño (una papeleta o un chorro por pelea) y no cambia las metas.
