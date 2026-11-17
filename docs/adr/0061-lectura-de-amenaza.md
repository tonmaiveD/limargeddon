# 0061. Lectura de amenaza y de costo

**Estado:** aceptada (17 de noviembre de 2026). Fase 5 de `docs/plan-fases-2026-11-16.md`, aviso de embestida y hallazgos U3 y U4 de `docs/auditorias/2026-11-16-graficos-ux-ui-creditos.md`. Ajusta la señal del punto ciego de la ADR 0032.

## Contexto
- **Embestida:** es el 42 % del daño en San Isidro y el último golpe en 8 de 10 derrotas. El rótulo de daño "EMBESTIDA" cubre la embestida y la reversa. El aviso era solo el claxon del jefe o sus luces, y nada en la pista.
- **U3:** "PUNTO CIEGO" iba en verde oscuro y 7 px sobre asfalto oscuro.
- **U4:** las papeletas eran un texto de 9 px junto a la pausa. Se llevan el 47 % del cobro en Miraflores normal, y no se veía qué las causaba.

## Decisión
- **Carril de la carga en rojo.** Mientras el jefe avisa una embestida (`teleRam`) o una reversa (`teleRev`), el carril por donde va a pasar se pinta en el asfalto, bajo el tráfico. Es una franja roja con bordes y flechas hacia abajo, más fuerte a medida que se acaba el aviso.
  - En la reversa es su carril, recto.
  - En la embestida apunta adonde está el Tico, porque al terminar el aviso el jefe carga hacia ahí. La franja lo sigue, y salir de ella es esquivar.
  - Solo lee el estado del jefe. Los tiempos de aviso y la simulación no cambian.
- **Sonido y vibración.** Al empezar el aviso suena una alarma propia, tres pitidos agudos que bajan (`alarm`), distinta de los claxon. Donde existe `navigator.vibrate` vibra 120 ms. La vibración se apaga con el sonido. iOS no la tiene. La escena detecta el cambio de estado, sin tocar la IA del jefe.
- **Punto ciego (U3).** Una banda verde luminosa, con halo, pegada al costado derecho del jefe y a lo alto de él. Reemplaza a la flecha con la palabra. Sigue la regla de la ADR 0032: se muestra hasta el tercer golpe por la derecha. Sin pulso con `reduceMotion`.
- **Papeletas (U4).** Un contador fijo en el HUD desde la primera multa, "PAPELETAS -S/ total", debajo de la barra del jefe.
  - Con cada papeleta late y, por 1,8 s, dice la causa y el monto, por ejemplo "CLAXON -S/ 50". Después vuelve al total.
  - Va en una sola fila, para no chocar con el globo del jefe.
  - El dato sale de `G.lastFine`, que anota `fine()` y que solo usa el HUD.
- **Pieza del motor, no declarable.** El aviso vale para todo jefe que use embestida o reversa, sin cambios en los JSON. Si una etapa necesita apagarlo, se agrega entonces una opción.

## Verificación
- La simulación no cambia: `ETAPA=san-isidro npm run balance` y `ETAPA=miraflores npm run balance` dan las mismas cifras antes y después. La prueba de paridad pasa.
- `tests/claridad.test.ts`: la última papeleta queda con su causa y su monto, y una perdonada no la cambia.
- `npm run escenas`, aviso de reversa en San Isidro:
  - suena `alarm` y no un claxon;
  - vibra una vez, corto;
  - con el sonido apagado no vibra.

  Quitando el disparo, el recorrido falla con su motivo.
- Capturas a 393 × 852, táctil, en San Isidro y Costa Verde, antes y después.
- **Pendiente en equipo real:** la vibración en un Android y la alarma con el volumen real.
