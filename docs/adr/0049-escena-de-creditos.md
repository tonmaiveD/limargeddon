# 0049. Escena de créditos y poscrédito del vuelo de regreso

**Estado:** aceptada (plan de créditos aprobado por el dueño, 27 de octubre de 2026). Segunda entrega del plan; la música es la ADR 0048.

## Contexto
Al ganar la Línea Amarilla del Terror, el juego mostraba la bodega del carguero y pasaba a resultados. El dueño pidió créditos que unan tres ideas, todas en una sola escena:
- El desfile manejable.
- La vista desde la ventanilla del avión.
- Las fichas de reparto.

También pidió un poscrédito con el vuelo de regreso, que duren de 60 a 90 s, que la primera vez no se puedan saltar y después sí con un toque, y un botón "Ver créditos" en el menú.

## Decisión
- **Escena `Credits`** (`src/scenes/Credits.ts`). Sigue las secciones del popurrí con su propio reloj, así no depende de que el audio esté disponible:
  1. **Despegue:** Lima de noche desde arriba. Una ventanilla se abre sobre el carguero y aparece el título.
  2. **Desfile:** un tramo por distrito, en orden, con su paisaje, su curva y su jefe:
     - El jefe entra, se queda frente al Tico y se adelanta.
     - El Tico se maneja sin daño ni puntaje.
     - El claxon hace contestar al jefe.
     - Arriba va la ficha de reparto: el distrito, el jefe "como él mismo" o "como ella misma" y lo que pasó después.
     - En el asfalto va el nombre del equipo cuando esté definido. Mientras tanto, el del distrito.
     - En la Línea Amarilla el reparto es el puente provisional, con el letrero "PUENTE DEFINITIVO, PRONTO".
  3. **Cierre:** de vuelta al avión, "Gracias por manejar", y la ventanilla se cierra.
  4. **Poscrédito**, 12 s: "Más tarde...", el anuncio de cabina "Por mantenimiento, este vuelo regresa a Lima" y el avión que da media vuelta. Después, la Vía de Evitamiento: el Tico baja por la rampa, la marea lo espera y termina en "CONTINUARÁ", sin desbloquear nada.
- **Duración:** 83,6 s en total, 71,6 s de créditos y 12 s de poscrédito.
- **Textos como datos** (`src/stages/creditos.json`): título, agradecimiento, fichas, respuestas al claxon, poscrédito y `staff`, la lista de roles y nombres que define el dueño más adelante. La línea de tiempo y las reglas están en `src/core/credits.ts`, sin dibujo, para probarlas.
- **Flujo:**
  - La Línea Amarilla declara `ending.credits`. Tras el cierre del carguero, `Stage` se pausa, lanza los créditos y al terminar muestra los resultados.
  - La primera vez no se saltan. Al verlos completos se guarda `credits` en el guardado, que empezar de nuevo no borra.
  - Desde ahí un toque salta los créditos y otro el poscrédito, y aparece "Ver créditos" en el menú. El modo prueba siempre deja saltar y siempre muestra el botón.
  - No tocan cobro, puntaje, ranking ni medallas.
- **Revisión:** en el modo prueba, `?creditos=segundos` deja la escena quieta en ese instante y sin música, y `&claxon` muestra la respuesta del jefe. Sirve para capturas.
- **Reutiliza** el paisaje horneado de cada distrito, el dibujo de cada jefe, el Tico con sus mejoras, el carguero y la marea. `drawTico` y `drawMarea` se exportan desde `render.ts`.

## Pruebas
`tests/creditos.test.ts`:
- Duración entre 60 y 90 s.
- Orden de las partes y de los distritos.
- Cada distrito con su ficha y su respuesta.
- Puntuación de los textos.
- La ficha cabe en tres líneas.
- Reglas para saltar.
- Guardado que sobrevive a empezar de nuevo.
- Solo la Línea Amarilla termina en créditos.

En el navegador:
- Capturas de cada parte.
- El flujo completo: ganar la Línea Amarilla, cierre, créditos con el `Stage` en pausa, dos toques y resultados, sin errores.

## Equipo y frases (29 de octubre de 2026)
- El dueño definió siete roles con sus nombres. Van pintados en el asfalto de los siete primeros distritos, y el nombre se achica hasta caber.
- Los agradecimientos especiales van en el cierre, debajo de "Gracias por manejar".
- El dueño aprobó las frases de los jefes tal como están.
