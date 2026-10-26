# 0045. Paso previo a la mejora gráfica: salida del enrosque, correas, fluidez y colisiones

**Estado:** aceptada (pedido del dueño, 26 de octubre de 2026). Paso previo de la especificación de mejora gráfica (versión 1.0, 25 de octubre de 2026), que pide resolver primero los hallazgos Q01 y Q02 de la quinta auditoría y medir antes del piloto de Costa Verde.

## Contexto
La especificación propone un piloto de arte en la Costa Verde. Antes de producir arte nuevo pide cuatro cosas que no dependen del arte:
- La flecha de salida del anillo debe caer sobre la salida real, con un error menor de 1 píxel lógico (Q01, IN01).
- Las correas del carguero deben quedar por encima del Tico (Q02, IN03).
- La fluidez se mide con percentiles del tiempo entre cuadros, separando el calentamiento del resto (PE01 y criterios de fluidez).
- Una vista de diagnóstico debe mostrar las zonas de choque sobre el dibujo (IN02).

## Decisión
- **Flecha del enrosque** (`drawCoil` en `src/bosses/doblefila-render.ts`):
  - Antes se dibujaba rígida en el centro del anillo. Sobre la curva se corría respecto al hueco, porque cada auto del anillo se ubica en su propia altura.
  - Ahora se ancla con `Gfx.pin` a la proyección del punto de salida, y apunta en la dirección ya proyectada.
  - El letrero SALIDA también se ancla a su punto y se lee derecho.
  - Los puntos del aviso siguen la curva uno por uno, como los autos.
- **Correas del carguero** (`src/core/ending.ts`):
  - El Tico es una imagen, y Phaser dibuja las imágenes de una capa sobre sus figuras, así que las correas quedaban debajo.
  - El HUD tiene una capa de encima (`uiTop`, profundidad 30,5, enlazada como `ui.over`). Las correas van ahí.
- **Fluidez en el registro** (`src/core/frames.ts`):
  - Cada pelea guarda en `frames` el tiempo entre cuadros con su mediana, percentil 95, percentil 99 y máximo, y cuántos cuadros pasan de 20 ms y de 33,3 ms.
  - Separa los primeros tres segundos, cuando se hornean las imágenes, del resto.
  - No cuentan el primer cuadro, la vuelta de una pausa ni los saltos de más de un segundo (pestaña oculta).
  - Guarda también la pantalla, la densidad de píxeles y el navegador.
  - Sale en "Copiar registro" sin cambiar la versión del guardado.
- **Vista de colisiones** (`src/core/hitboxes.ts`):
  - Con `?colisiones` en la dirección se dibuja el contorno de cada zona de choque tal como la usa la simulación. Cada contorno va rígido en su centro, igual que su dibujo.
  - Colores: verde el Tico, rosado lo que daña, blanco lo sólido, amarillo lo bueno y celeste los proyectiles.
  - No cambia nada del juego.

## Pruebas
`tests/graficos.test.ts`, con una escena de Phaser de mentira (`tests/harness/fake-scene.ts`) que guarda cada figura, imagen y texto con su profundidad:
- Un barrido de 24 casos (seis salidas y cuatro tramos de la curva) verifica que la base de la flecha queda a menos de 1 px de la salida proyectada y que apunta hacia afuera. El mismo barrido comprueba que el dibujo anterior se corría más de 3 px.
- Las correas quedan en una capa más alta que la imagen del Tico. La prueba falla sin el arreglo.
- Percentiles, calentamiento y pausas del medidor.
- Contornos de la vista de colisiones en su lugar.

## Observación de la vista de colisiones
Los autos del anillo se dibujan girados, pero chocan como cajas derechas. En el enrosque la caja de un auto inclinado sobresale un poco de su dibujo. No se cambia aquí porque tocaría el daño del enrosque. Queda para decidir con datos del bloque E.

## Consecuencias
- El piloto de arte puede empezar sobre una base medida, con la vista de colisiones a mano.
- Los registros del bloque E ya traen la fluidez de cada teléfono.
