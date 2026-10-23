# 0006. Prueba de paridad determinista contra el prototipo

**Estado:** aceptada, Hito 2.

## Contexto
El criterio de cierre del Hito 2 es que la pelea se sienta igual que el prototipo. Jugarla a mano no basta para detectar diferencias finas de tiempos o daño.

## Decisión
- `tests/parity.test.ts` carga `prototipo/san-isidro-v3.html` en Node sin modificar el archivo: extrae el script, le agrega en memoria una línea que expone `start/update/G/keys` y lo corre con stubs de DOM y canvas.
- Prototipo y port corren con el mismo `Math.random` sembrado, el mismo `dt` (1/60) y el mismo bot (`tests/harness/bot.ts`), y se compara cuadro a cuadro vida, posición y estado del jefe y del jugador, tráfico, disparos, bonus, papeletas y estadísticas.
- Para que sea posible, el port respeta el orden exacto de los sorteos aleatorios del prototipo.
- `npm run balance` (`scripts/balance.test.ts`) reporta duraciones con bots de tres niveles; no corre en CI.

## Consecuencias
- Resultado al cierre del Hito 2: 9 partidas (tres dificultades por tres semillas, unos 41 000 cuadros) idénticas, incluida una derrota.
- Al rebalancear a propósito, esta prueba fallará por diseño. Se puede fijar el prototipo a un commit de referencia o reemplazar la prueba por instantáneas del port.
