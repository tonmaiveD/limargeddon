# 0060. Créditos completos en las pruebas y datos anónimos de los créditos

**Estado:** aceptada (17 de noviembre de 2026). Fase 4 de `docs/plan-fases-2026-11-16.md`, hallazgos C05 y C06 de `docs/auditorias/2026-11-16-graficos-ux-ui-creditos.md`. Amplía el contrato de datos de la ADR 0051.

## Contexto
- **C05:** `npm run escenas` nunca recorría los 84 s de los créditos, ni con mejoras ni con el audio cortado.
- **C06:** los créditos no dejaban rastro en los datos. Un cuelgue como el de C01 no aparecía en `npm run datos`.

## Decisión
- **Recorrido completo en `npm run escenas`.** Corre con el reloj acelerado (`game.step`) y el guardado con todas las mejoras al máximo, desde el menú, con los créditos empezados y no vistos.
  - En el segundo 30 corta el audio como en C01: lo suspende y deja su reloj quieto.
  - Pide que en 5 s de juego la imagen avance al menos 3 s.
  - Exige llegar al título final, volver al menú, no tener errores en la consola y un registro "completo" con menos de 1 s de imagen quieta.
- **Registro anónimo `creditos`**, sin etapa, nombre ni identificador del jugador. Lleva:
  - `from`: "victoria" o "menu".
  - `first`: si era la primera vez.
  - `reached`: hasta qué segundo llegaron.
  - `maxStall`: el mayor rato en segundos con la imagen quieta, fuera de la pausa, medido en tiempo real.
  - `skips`: cuántas veces se saltaron.
  - `end`: "completo", "saltado", "despues", "salida" o "error".
- **Contrato:** cambiado junto en `src/core/telemetry.ts` y `server/src/validate.ts`. El validador revisa cada campo con su tipo y rango.
- **Borrador para las salidas.** Al entrar a los créditos el registro se guarda en el teléfono (`limargeddon.creditos`) con "salida" como final, y se pone al día cada 3 s, al pausar y en `pagehide`.
  - Al terminar, se borra y sale el registro con su final.
  - Si la página se cierra o se recarga a mitad, el borrador sale al abrir el juego otra vez. Así llegan también los cuelgues que terminan con el jugador cerrando la app.
  - Apagar el envío borra el borrador.
- **El modo prueba y la vista quieta `?creditos=` no anotan nada.** Con el envío apagado no se arma el registro.
- **Informe:** `npm run datos` suma la sección "Créditos" por origen y por primera vez. Muestra:
  - cómo terminaron;
  - hasta qué segundo llegaron, como mediana;
  - la imagen quieta, en mediana y máximo;
  - cuántos estuvieron quietos más de 1 s.

  El resumen suma una columna "Créditos".
- **Privacidad:** `public/privacidad.html` describe el registro nuevo.

## Publicación
El receptor se publica a mano con `npx wrangler deploy` desde `server/`, antes de fusionar el cliente. El esquema de la base no cambia, porque el registro va en `payload` y la etapa queda nula. Si el cliente llega antes, el receptor viejo descarta estos registros uno por uno y no pierde los demás.

## Verificación
- `tests/creditos-datos.test.ts`, de punta a punta:
  - el registro tal como lo arma el juego pasa por el receptor;
  - los valores fuera de contrato se descartan;
  - el borrador va y vuelve, y se recupera una sola vez;
  - el modo prueba y el envío apagado no anotan nada;
  - el informe arma la sección.
- `npm run escenas` revisa el registro en la cola de cada recorrido de créditos: "despues", "saltado" con dos saltos, "salida" tras recargar, "error" y "completo".
- **Comprobado que detecta la falla:** con la imagen esperando otra vez a la música, el recorrido completo falla con "0,1 s en 5 s de juego".
