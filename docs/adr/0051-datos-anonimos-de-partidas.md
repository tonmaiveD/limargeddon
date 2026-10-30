# 0051. Datos anónimos de partidas

**Estado:** aceptada (plan aprobado por el dueño, 30 de octubre de 2026). Primera entrega, PR A: el envío desde el juego. El receptor (PR B), el informe (PR C) y el cierre de la documentación (PR D) vienen después.

## Contexto
Calibrar el balance dependía de capturas de pantalla: solo victorias, recortadas y sin mejoras, daño por fuente ni fluidez. El dueño eligió la recopilación automática de todos los jugadores, el nivel de menos fricción, frente a compartir el registro a mano o enviarlo a una hoja de Google.

## Decisiones del dueño
- **Permiso:** sin pregunta inicial. Un aviso la primera vez, un interruptor en el menú y una página de privacidad.
- **Sin identificador por dispositivo:** los datos son anónimos de verdad, así que no hay forma de unir dos partidas de la misma persona.
- **Equipo de pruebas:** cada uno se marca una vez con `?tester=nombre`, con su consentimiento. `?tester=` borra la etiqueta.
- **Retención:** 12 meses. La aplica el receptor.

## Decisión, PR A
- **Contrato de datos** (`src/core/telemetry.ts`, esquema 1). Hay tres tipos de registro, todos con un número al azar, la versión del juego, el día sin hora, el tipo de equipo y la etiqueta de probador si existe:
  - `pelea`: lo mismo que el registro local, sin la descripción completa del equipo.
  - `abandono`: salir al menú a mitad de pelea, con etapa, dificultad, modo, tiempo, fase, vida del jefe y vida del Tico.
  - `compra`: mejora, nivel, precio, billetera tras la compra y etapa desbloqueada.
- **Nunca se envía:** el nombre del jugador, el ranking, el texto completo del navegador ni nada que identifique al teléfono. El tipo de equipo es solo sistema, navegador y tamaño, por ejemplo "Android · Chrome · mediana · táctil".
- **Envío:**
  - Cada registro va a una cola en el teléfono, de hasta 200, y se pierden los más viejos.
  - Sale en grupos de 50 al terminar una pelea, al abrir el juego y al esconder o cerrar la app (`sendBeacon`).
  - Solo se quita de la cola lo que el receptor confirmó. Los repetidos los ignora el receptor por su número.
  - El cuerpo va como texto plano, para evitar la consulta previa del navegador.
- **Cuándo se envía** (`src/core/share.ts`): salvo que el jugador lo apague, y nunca en el modo prueba.
- **Interfaz:**
  - En el menú, el aviso "Este juego envía datos anónimos de tus partidas para mejorarlo" con "Entendido".
  - El interruptor "Datos anónimos activados/desactivados" y el enlace a `privacidad.html`.
- **Mientras no esté el receptor:** la dirección (`TELEMETRY_URL`) está vacía, así que no se envía nada. Los registros se acumulan en la cola de cada teléfono y saldrán cuando el receptor exista.

## Pruebas
`tests/datos.test.ts`:
- El tipo de equipo nunca lleva el texto del navegador.
- La pelea va sin nombre, sin hora y sin descripción del equipo.
- Los números son únicos.
- Abandonos y compras llevan lo justo.
- No se envía nada en el modo prueba ni con el interruptor apagado.
- La etiqueta de probador funciona.
- Solo sale de la cola lo confirmado.
- Los grupos son de 50.
- La cola guarda los 200 más nuevos.

En el navegador:
- El aviso y el interruptor del menú funcionan.
- La etiqueta se guarda.
- Un abandono y una pelea quedan en la cola con su forma esperada.
