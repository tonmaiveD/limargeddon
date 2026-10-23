# 0007. El ajuste de duración de la pelea pasa al Hito 3

**Estado:** aceptada por el dueño del producto, cierre del Hito 2.

## Contexto
El criterio del Hito 2 pedía dos cosas: que la pelea se sienta igual que el prototipo y que dure de 90 a 120 s en Normal. La prueba de paridad (ADR 0006) muestra que el port es idéntico al prototipo, pero el reporte de `npm run balance` da, en Normal, una mediana de unos 55 s para las victorias (rango de 29 a 92 s con bots de tres niveles). El prototipo mismo no cumple la duración pedida, así que ambas condiciones no se pueden cumplir a la vez sin cambiar números.

## Decisión
- El Hito 2 se cierra con paridad exacta: no se cambia ningún parámetro del prototipo.
- El ajuste de duración se hace en una rama propia del Hito 3, editando `src/stages/san-isidro/config.json` y midiendo con `npm run balance`.

## Consecuencias
- Al rebalancear, `tests/parity.test.ts` va a fallar a propósito. En esa rama habrá que fijar la paridad a la configuración original del prototipo (por ejemplo, correr el port con una copia del JSON original) o reemplazarla por instantáneas del port, según se documente en un ADR nuevo.
- Antes de cambiar números conviene validar con partidas humanas, porque los bots apuntan mejor que una persona.
