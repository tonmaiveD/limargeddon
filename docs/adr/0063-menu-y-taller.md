# 0063. Menú con hoja de ajustes y taller que dice cuánto falta

**Estado:** aceptada (18 de noviembre de 2026). Fase 7 de `docs/plan-fases-2026-11-16.md`, hallazgos U1, U2 y U5 de `docs/auditorias/2026-11-16-graficos-ux-ui-creditos.md`. Ajusta el menú vertical de la ADR 0054. "¡AHÍ VIENE!" no se toca (decisión D3).

## Contexto
- **U1:** la tarjeta fija de "Jugar" medía 344 px y tenía las esquinas redondeadas. Al desplazar el menú, el contenido se veía por debajo y alrededor de ella.
- **U2:** había diez enlaces subrayados en cuatro filas, y "Empezar de nuevo" estaba al nivel de "Ranking".
- **U5:** en el teléfono las cinco categorías del taller ocupaban 403 px de 357 y la quinta quedaba cortada. Una mejora que no alcanzaba mostraba el precio apagado, sin decir cuánto faltaba.

## Decisión
- **Tarjeta de "Jugar" (U1).** Ocupa todo el ancho del menú y llega al borde de abajo. Es opaca, con un degradado arriba. El botón conserva su ancho de hasta 344 px.
- **Menú (U2).** Lo principal son tres botones de 44 px o más: Taller, Ranking y Ajustes.
- **Hoja de ajustes (U2).** Un diálogo con "Volver" arriba y, en filas de 48 px:
  - sonido;
  - ayudas;
  - jugador;
  - "Ver créditos", cuando corresponde;
  - datos anónimos;
  - privacidad;
  - acerca del juego.

  "Empezar de nuevo" va al fondo, separado y en rosa, con su confirmación de siempre. El diálogo del jugador y el de reinicio se abren encima de la hoja. La hoja se cierra al salir del menú y al abrir los créditos.
  - Los controles conservan su `id`, así que sus manejadores no cambian.
  - "Ver ayudas otra vez" sigue junto al consejo de la etapa, porque es de la etapa.
- **Taller (U5).**
  - Las cinco categorías comparten el ancho, con letra de 11 px, sin cortarse ni desplazarse.
  - Cada mejora que todavía no alcanza dice "Te faltan S/ X", sin partir el monto.
- **Restos de la ADR 0062:**
  - "Más conos" ya no menciona "Acelerando".
  - Las recomendaciones del taller ya no dicen "con tu modo de disparo".

## Verificación
- `npm run escenas` suma un recorrido de menú y taller. Comprueba que:
  - "Jugar" se ve sin desplazar;
  - con el menú desplazado, en los bordes de la tarjeta y de la pantalla a su altura solo está la tarjeta;
  - Taller, Ranking y Ajustes miden 44 px o más;
  - jugador, datos, ayudas, créditos y reinicio ya no están en el menú;
  - la hoja los tiene, con "Empezar de nuevo" al fondo y todo de 44 px o más;
  - el diálogo del jugador queda encima;
  - "Volver" cierra la hoja;
  - las cinco categorías entran;
  - una mejora dice cuánto falta;
  - el taller ya no habla del modo de disparo.
- Los recorridos de créditos abren "Ver créditos" desde los ajustes.
- **Comprobado que detecta la falla:** con el CSS anterior de la tarjeta, el recorrido falla en "nada del menú se ve debajo ni alrededor de la tarjeta".
- **Capturas** antes y después en 393 × 852 y en iPad (1024 × 1366): "Jugar" a la vista sin desplazar y ningún blanco táctil de menos de 44 px.
- **Pendiente en equipo real:** la hoja de ajustes con el dedo en un iPhone y en el iPad.
