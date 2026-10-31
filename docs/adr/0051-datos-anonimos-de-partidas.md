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

## PR B · Receptor (30 de octubre de 2026)
- **Dónde:** Cloudflare Workers con una base D1, en la cuenta del dueño. El código está en `server/`:
  - `src/index.ts`, el receptor.
  - `src/validate.ts`, la revisión de lo que llega, sin dependencias de Cloudflare para probarla.
  - `schema.sql` y `wrangler.toml`.
- **Dirección:** `https://limargeddon-datos.limargeddon-datos.workers.dev`. El juego envía a `/v1/events` (`TELEMETRY_URL`).
- **Qué hace al recibir:**
  - Solo acepta envíos desde `https://tonmaived.github.io` y `http://localhost:5173`.
  - Rechaza envíos de más de 64 KB o de más de 50 registros.
  - Descarta uno por uno los registros que no calzan con el contrato.
  - Guarda solo los campos conocidos, aunque lleguen otros.
  - Ignora los repetidos por su número.
  - No lee ni guarda la IP, y los registros de cada pedido en Cloudflare están apagados (`observability`).
- **Descarga:** `GET /v1/export?desde=AAAA-MM-DD` con la clave `EXPORT_TOKEN`. La clave es un secreto del receptor, y en la computadora del dueño está en `.env.datos`, que git ignora.
- **Retención:** todos los días a las 9:00 UTC borra lo que llegó hace más de 12 meses.
- **Envío desde el juego:** cada llamada manda en grupos hasta vaciar la cola, como máximo 5 grupos, así lo que se anota mientras sale un grupo va en el siguiente.
- **Publicar cambios del receptor:** desde `server/`, `npx wrangler deploy`. Requiere la sesión de Wrangler en la cuenta del dueño.

### Pruebas
- `tests/receptor.test.ts`:
  - Acepta los tres tipos.
  - Descarta los registros mal formados.
  - Rechaza envíos enteros inválidos.
  - Solo acepta los orígenes permitidos.
  - No guarda campos ajenos al contrato.
- Contra el receptor publicado:
  - Origen permitido, 204. Repetido, 204 y se guarda una sola vez.
  - Origen ajeno, 403. Envío inválido, 400.
  - Descarga sin clave, 401. Con clave, devuelve los datos.
  - Un `playerName` agregado a propósito no se guardó.
- Ciclo completo desde el juego en desarrollo:
  - Un abandono y una pelea llegaron con la etiqueta de probador y el tipo de equipo.
  - Una pelea que quedó pendiente salió al volver a abrir el juego.
- Los registros de prueba se borraron de la base.

## Corrección tras la novena auditoría, V01 y V02 (30 de octubre de 2026)
- **V02:** al agregar un comentario sobre el truncado del tiempo, `fireMode` y `bestCombo` quedaron dentro del comentario y no se enviaban. Están de vuelta.
  - Una prueba los sigue de punta a punta, del registro de pelea a la fila del receptor, para los dos modos y para rachas de 0 y 26.
  - Las peleas que llegaron antes, del 30 de octubre hasta esta corrección, no traen modo ni racha. El informe las marcará como "modo desconocido" y no supondrá ninguno.
- **V01:** el interruptor se consulta en cada envío, no solo al abrir el juego.
  - Los envíos al esconder o cerrar la app miran la preferencia en ese momento, y sus manejadores quedan instalados siempre.
  - El envío en grupos revisa la preferencia antes de cada grupo, así que apagarlo a mitad de camino no deja salir ninguno más.
  - Apagar el envío borra lo que esperaba en el teléfono (`setSharing`).
  - Un grupo que ya salió no se puede retirar. La página de privacidad lo dice.
- **Privacidad:** la página explica la etiqueta voluntaria del equipo de pruebas y qué pasa con lo pendiente al apagar.
