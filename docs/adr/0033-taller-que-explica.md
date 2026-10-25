# 0033. Taller que explica

**Estado:** aceptada (bloque 2 del orden acordado el 25 de octubre de 2026).

## Contexto
Las dos auditorías vieron que el taller no ayuda a decidir:
- Recomendaba la mejora más barata, sin decir para qué sirve.
- Los objetos de victoria aparecían en una línea suelta, sin decir en qué etapas importan.
- No había forma de ahorrar con un objetivo propio.

## Decisión
- **Dos recomendaciones, ataque y aguante:**
  - Cada mejora tiene un rol (`role`), ataque o aguante, y un valor por modo de disparo (`value`).
  - El valor sale del experimento E3 de la segunda auditoría: victorias ganadas en el Callao, en Normal, sobre 30 semillas.
  - `picks()` elige, por rol, el mejor siguiente nivel que alcanza la billetera y que la etapa ya desbloqueó. Si hay empate, gana el más barato.
  - El taller lo dice en una línea ("Para atacar, X. Para aguantar, Y.") y marca las tarjetas con PARA ATACAR o PARA AGUANTAR.
  - Abre en la categoría de la recomendación de ataque.
  - `recommended()`, la más barata, se mantiene solo para el bot de la campaña.
- **Dónde sirven los objetos:**
  - Un desplegable "Tus objetos (n) · dónde sirven" lista cada objeto con su efecto y los distritos donde aplica.
  - `itemUses()` lo calcula leyendo las configs de las etapas. Por ejemplo, el casco sirve donde alguna fase dispara proyectiles. Si sirve en todas, lo dice así.
  - Va cerrado por defecto para no quitarle espacio a las mejoras.
- **Meta de ahorro:**
  - Cada tarjeta tiene "☆ Ahorrar para esta". La meta se guarda en `garage.goal`.
  - Mientras no alcanza, el taller muestra "Ahorrando para X · te faltan S/ Y". Cuando alcanza, lo celebra.
  - Al comprarla, la meta se borra. Sin meta elegida, sigue la sugerencia automática de antes.

## Consecuencias
- No cambia la simulación ni la campaña. El guardado suma un campo opcional, sin cambiar de versión.
- Los valores por rol se recalculan cuando se rebalancee con datos reales (bloque 6).
