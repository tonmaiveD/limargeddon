# 0067. Demo del piloto de arte de la Costa Verde

**Estado:** aceptada (22 de noviembre de 2026). Pedido del dueño: integrar el arte entregado por el tercero en una demo jugable de la Costa Verde, sin tocar el juego actual, para hacer pruebas con estadísticas. Usa la V2.1.1 del paquete, auditada en `datos/auditoria-arte-v2/INFORME.md` (fuera del repositorio).

## Decisiones del dueño
- **Publicación:** en GitHub Pages, en una dirección aparte. Las imágenes generadas con IA quedan públicas en el repositorio.
- **Comparación:** dos versiones alternadas, el arte actual y el nuevo, con una encuesta al final.
- **Estadísticas:** al receptor actual, marcadas como "piloto".
- **Partida:** fija, en Normal, con el Tico de serie y sin mejoras.

## Decisión
- **Página aparte:** `piloto-costa-verde/index.html`, en `https://tonmaived.github.io/limargeddon/piloto-costa-verde/`.
  - Tiene su propio build (`vite.piloto.config.ts`), que corre después del del juego y escribe en el mismo `dist`. El juego conserva su paquete de siempre (`index-*.js`) y no lleva nada de la demo.
  - No tiene menú, taller, guardado, medallas ni ranking, y no toca `limargeddon.save`. Tampoco con `?tester=`, cuya etiqueta en la demo vale solo mientras la página está abierta y no queda en el guardado del juego.
- **Arte:** los 76 PNG de la V2.1.1, copiados sin cambios a `public/piloto-costa-verde/arte/`, con su índice en `src/piloto/arte.json`.
  - Al cargar, la demo arma tres texturas derivadas: la carretilla espejada y las dos orillas de las transiciones, que cambian de piedra a arena a mitad del tramo.
- **Ganchos en el motor (`src/core/art/skin.ts`):** el arte alterno se instala con `setSkin`.
  - El juego nunca lo instala, así que queda en `null` y cada dibujo sale igual que antes.
  - Hay ganchos en el tráfico, el Tico, la combi aliada, los obstáculos, los bonus, las piedras, la carretilla y la bandada. Cada gancho devuelve la clave de una textura o `null`.
  - Solo cambia el dibujo. La simulación, las colisiones, los avisos, la noche y las luces que cambian, como el freno, la circulina y las balizas del jefe, siguen siendo del motor.
  - `Gfx.tile` acepta el alto de las franjas, que por defecto sigue siendo 8.
- **Costados (`src/piloto/world.ts`):**
  - Las columnas están donde las pone el motor: la cercana de cada lado junto a la vereda y las exteriores cada 46, de 42 de ancho.
  - Siempre va al menos una columna exterior, porque la curva corre la cercana hasta 30. Cada exterior se repite 4 más adentro, detrás, para tapar la junta. Las franjas son de 4, porque los tramos entregados no traen el margen que tienen los horneados del juego.
  - La orilla va en franjas de 2, en la capa de la pista.
  - El recorrido es de doce tramos, como el de la prueba del paquete: mar, transición, arena con Agua Dulce, transición, mar y el muelle. A la izquierda están el acantilado y la bajada, y en la columna exterior el Morro Solar.
  - El índice de tramo del motor crece hacia arriba, así que las listas se leen al revés. Así cada transición tiene el mar y la arena del lado que corresponde, y la prueba lo comprueba.
- **Jefe (`src/piloto/boss.ts`):** la Doble Fila con sus imágenes, en el mismo orden y con los mismos avisos que en el juego. Las balizas son las capas entregadas, van sobre la noche y parpadean al ritmo del juego.
- **Flujo (`src/piloto/main.ts` y `flujo.ts`):**
  - Hay una pantalla de inicio que explica la prueba y avisa sobre los datos.
  - La versión A se juega primero y la B después, con una pantalla entre las dos.
  - Al final hay cuatro preguntas:
    - qué versión se veía mejor;
    - en cuál se veían mejor los peligros y los avisos;
    - si la persona vive o vivió en Lima;
    - si reconoció la Costa Verde.
  - El orden se alterna entre una prueba y la siguiente en el mismo aparato, con un contador aparte del guardado (`limargeddon.piloto`).
  - Las letras A y B no dicen cuál es el arte nuevo. Las respuestas se guardan ya traducidas a "actual" o "nuevo".
  - La etapa (`PilotoStage`) copia el ciclo de `Stage` sin guardado. Al ganar pasa por el cierre de Don Frío. Las ayudas leídas en la versión A no se repiten en la B.
- **Datos:** hay dos registros nuevos en `telemetry.ts` y `validate.ts`, que se cambian juntos:
  - `piloto`: uno por partida. Lleva sesión, ronda, arte, arte que salió primero, si terminó o se abandonó, resultado, tiempo, vida restante del jefe y del Tico, multas, último golpe, daño por fuente y fluidez.
  - `piloto-encuesta`: la sesión y las cuatro respuestas.
  - La sesión es un número al azar por prueba. Une las dos partidas con la encuesta y nada más. La página de privacidad lo explica.
  - Usan el mismo permiso que el juego, y con `?prueba` no se envía nada.
  - `npm run datos` tiene la sección "Prueba de arte de la Costa Verde": partidas por arte, por orden, daño por fuente y encuesta, con quién reconoció la Costa Verde según viva o no en Lima.

## Verificación
- **`tests/piloto.test.ts`** comprueba que:
  - el juego no instala arte alterno;
  - todo lo que pide la demo existe en el arte;
  - la costa calza en cada unión y no se repite un tramo seguido. La prueba falla con la orientación al revés;
  - el orden se alterna y las letras se traducen bien;
  - el receptor acepta los dos registros y rechaza los que no calzan;
  - el informe resume la prueba.
- **Escena nueva en `npm run escenas`:**
  - se juegan las dos versiones y la nueva dibuja el Tico entregado;
  - las dos partidas y la encuesta quedan con la misma sesión, y la B se traduce bien;
  - la prueba siguiente empieza por la otra versión;
  - el guardado del juego no cambia, tampoco al abrir la demo con `?tester=`, y no hay errores;
  - el juego sigue dibujando con su arte.
- **Campaña:** `npm run campana` da exactamente lo mismo que en `main`.
- **Juego intacto:** el paquete del juego no trae nada de la demo, ni sus imágenes ni su código, y su CSS es idéntico. El JavaScript del juego sí cambia, porque lleva los ganchos del motor, que en el juego quedan en `null` y dejan cada dibujo como en `main`. La campaña igual a la de `main` y la escena que confirma que el juego dibuja con su arte lo comprueban.

## Pendiente
- **Receptor:** publicado el 22 de noviembre de 2026 (versión 99d1533d) con los dos registros nuevos. Un envío de prueba guardó dos partidas y una encuesta sin descartes, y luego se borró.
- **Hacer la prueba** con 6 a 8 personas, en dos teléfonos, y leer la sección del informe.
- **Créditos y procedencia:** el arte es de un generador de OpenAI. La pantalla final de la demo avisa que una de las versiones usa un dibujo hecho con un generador de imágenes. El aviso va después de la encuesta para no influir en las respuestas. Si el arte pasa al juego, falta decidir cómo se acredita.
