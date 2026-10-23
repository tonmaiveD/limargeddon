# 0011. Un pulgar, una tarea; disparo por toque con combo y modo de prueba "acelerar es atacar"

**Estado:** aceptada por el dueño del producto, Hito 3. Reemplaza la distribución del deck de las ADR 0008 y 0010.

## Contexto
Con el layout de la ADR 0010, el pulgar izquierdo tenía que mantener el acelerador y girar a la vez. El dueño descartó el disparo automático porque le quitaba gracia, y pidió la opción con más enganche según buenas prácticas de juegos para celular.

## Decisión
- **Deck:** el pulgar izquierdo solo gira (◀ ▶ a media altura completa). El derecho tiene ACEITE y CLAXON arriba y ACELERAR y CONOS abajo, con CONOS en la esquina inferior derecha por ser lo que más se usa.
- **Modos de disparo** (`weapons.cone.mode`, tipo `FireMode`):
  - `toque` (por defecto): cada toque lanza un cono. Hay una reserva de 3 que se recarga de a uno cada 0.7 s, y mantener el botón no dispara en ráfaga. Cada toque es una decisión.
  - `acelerar`: mientras se acelera, el Tico lanza conos solo, a la cadencia original. Atacar obliga a acercarse. En este modo el deck oculta CONOS y ACELERAR ocupa la fila completa.
  - `mantener`: el comportamiento del prototipo; solo lo usa la prueba de paridad.
- **Selector temporal en el menú** ("Disparo (prueba)") para comparar ambos modos jugando. Se guarda en el dispositivo, y cada pelea registra su modo y su mejor combo.
- **Combo de punto ciego** (`weapons.cone.combo`): cada cono seguido que pega por la derecha suma 10% de daño, hasta +30%. Si un cono pega por la izquierda, se pierde o choca con el tráfico, el combo se corta. Desde x2 se muestra "¡x2 PUNTO CIEGO!" con números más grandes, un sonido que sube de tono y 40 ms de congelamiento de impacto. El congelamiento lo aplica la escena, así que la simulación sigue siendo determinista.
- **Pantalla:** en el celular el HUD no muestra atajos de teclado (lo hace el deck) y la barra de vida se alarga. Hay un botón de pausa con el sonido adentro, y pausa automática al salir de la app o perder el foco. Los márgenes son menores.
- **Instalable** en la pantalla de inicio (`manifest.webmanifest`, íconos, metas de Apple): se abre a pantalla completa, sin barras del navegador.

## Balance (`npm run balance`, bot medio, Normal)
- Por toque: gana 23 de 30, mediana ~83 s (recarga 0.7 s, combo hasta x1.3). Con recarga de 0.5 s y combo hasta x1.4, la pelea bajaba a ~60 s.
- Acelerar es atacar: gana 29 de 30, mediana ~82 s.
- Referencia del modo `mantener` del Hito 3: ~81 s.

## Consecuencias
- Tras la prueba del dueño se elige un modo y se quita el selector, o se deja como opción.
- La prueba de paridad no cambia: la config del prototipo no tiene `mode` ni `combo`.
