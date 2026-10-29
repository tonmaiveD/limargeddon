# 0050. Créditos: saltar sin chocar con el manejo, y un solo reloj con la música

**Estado:** aceptada (29 de octubre de 2026). Hallazgos U01 y U02 de la octava auditoría (`docs/auditorias/2026-10-29-octava-auditoria.md`) sobre la ADR 0049.

## Contexto
- **U01:** al volver a ver los créditos, cualquier toque los saltaba, también los del deck táctil (volante, acelerador, claxon), y la barra espaciadora era a la vez claxon y salto. Querer manejar en el desfile podía mandar al poscrédito. Poder saltar al volver a verlos es una decisión de diseño del dueño y se mantiene. Lo que se corrige es que una acción de manejo no salte.
- **U02:** la imagen avanzaba con un paso de 50 ms como máximo, y la música con el reloj del audio. Con menos de 20 cuadros por segundo la escena se alargaba y se desfasaba del popurrí (a 15 cuadros por segundo duraba 111 s en vez de 84). Además, la escena no se pausaba al salir de la app.

## Decisión
- **Qué salta** (`isSkipInput`): un toque en la pantalla o Enter. No saltan:
  - Un toque en el deck o en un botón.
  - La barra espaciadora, que es el claxon.
  - Las flechas y Escape.

  La regla de la primera vez no cambia: no se puede saltar.
- **Indicación de uso:** en el primer distrito aparece "Maneja y toca el claxon".
- **Un solo reloj** (`narrativeStep`):
  - Mientras suena el popurrí, la narración sigue al reloj de la música (`Sfx.medleyTime`, calculado con `medleyClock` desde la sección y el paso agendados).
  - Sin audio, con el audio suspendido o ya en el poscrédito, avanza con el tiempo real del cuadro, sin el tope de 50 ms. Solo se recortan los saltos de más de 0,25 s, porque ahí el juego estuvo detenido.
  - El manejo y el avance de la pista conservan su tope.
- **Pausa coordinada:** al ocultarse la app o perder el foco, la escena y la música se detienen juntas (`Sfx.hold`), y al volver siguen desde el mismo punto.

## Pruebas
`tests/creditos.test.ts`:
- Qué entradas saltan y cuáles no.
- A 10, 15, 20, 30 y 60 cuadros por segundo, sin audio, la escena termina a tiempo, dentro de un cuadro.
- Con música, cada instante queda a menos de 150 ms del reloj del audio.
- Un salto largo no se come los créditos.
- El cálculo del reloj de la música.

En el navegador, con la escena real:
- El deck y la barra espaciadora no saltan. Un toque en la pantalla salta al poscrédito y otro termina.
- Con el foco perdido no avanza nada, y al volver sigue desde el mismo punto.
