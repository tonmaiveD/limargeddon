# 0059. Pausa en los créditos

**Estado:** aceptada (17 de noviembre de 2026). Fase 3 de `docs/plan-fases-2026-11-16.md`, hallazgo C02b de `docs/auditorias/2026-11-16-graficos-ux-ui-creditos.md` y decisión D1 del dueño del 16 de noviembre. Ajusta la ADR 0049, que dejaba la primera vez sin pausa ni salida, y el aviso "Toca para seguir" de la ADR 0052.

## Contexto
La primera vez los créditos duran 84 s y no se pueden saltar. No había botón de pausa ni forma de salir. La única pausa era la automática al salir de la app, y cualquier toque la levantaba. Quien necesitaba dejar el teléfono un momento o irse tenía que cerrar la página.

## Decisión
- **Botón de pausa** durante los créditos desde la primera vez, el mismo de la pelea (`#pauseBtn`, 44 × 44 px). También se pausa con P o Escape. En los créditos baja a la esquina inferior derecha (`body.en-creditos`), lejos de la ficha de reparto. En la vista quieta `?creditos=` no aparece.
- **Panel de pausa** de la pelea, con "Continuar" y "Ver después". "Ver después" reemplaza a "Salir al menú" mientras dura la escena, y al salir el texto vuelve a ser el de la pelea.
- **"Ver después"** termina la escena y sigue a los resultados, o al menú si se abrieron desde ahí. Salir no es saltar. No marca los créditos como vistos, y quien los deja la primera vez sigue sin poder saltarlos. Como se marcaron al entrar (ADR 0058), el menú ofrece "Ver créditos".
- **En pausa** los toques son del panel. Ya no levanta la pausa cualquier toque, y ningún toque en el botón o en el panel cuenta como salto.
- **Imagen y música juntas:** la pausa detiene las dos (`Sfx.hold`). Al continuar siguen desde el mismo instante, con `resumed` y `Sfx.seek` de la ADR 0057.
- **Salir de la app** sigue pausando solo y abre el mismo panel. Al volver, la pausa se levanta sola si fue automática. Si la pausó el jugador, sigue en pausa hasta que elija.

## Verificación
- `npm run escenas` suma un recorrido con toques reales del protocolo de DevTools, no `click()`, en créditos ya vistos, donde un toque que saltara se notaría:
  - Revisa que el botón mida 44 px o más y quede debajo de la ficha.
  - Pausar con el botón detiene la imagen sin saltar.
  - "Continuar" sigue desde el mismo punto sin saltar.
  - P pausa y Escape sigue.
  - Pausar otra vez y "Ver después" lleva a los resultados y deja la pausa de la pelea como estaba.
- El recorrido de la primera vez pausa y sale con "Ver después". Los créditos quedan empezados pero no vistos.
- Comprobado que detectan la falla:
  - Si un toque en un botón cuenta como salto, falla "el botón pausa los créditos sin saltarlos".
  - Si cualquier toque en pausa la levanta, falla "Ver después" en los dos recorridos.
- Capturas en Chrome sin ventana a 393 × 852, táctil: el botón no tapa la ficha ni "Toca para saltar".
- **Pendiente en equipo real:** pausar, continuar y "Ver después" con el dedo en un iPhone o iPad.
