# 0053. Los gestos del sistema no saltan los créditos

**Estado:** aceptada (30 de octubre de 2026). Ajusta la regla de salto de las ADR 0050 y 0052.

## Contexto
Al probar en los simuladores de iPad y iPhone apareció un problema: cuando los créditos ya se pueden saltar (al volver a verlos, o en el modo prueba), algunos gestos del sistema llegaban al juego como "Toca para saltar":
- El toque que cierra el centro de control o una notificación.
- Un deslizamiento desde el borde inferior.

Saltaban los créditos sin que el jugador quisiera.

## Decisión
- **Saltar exige un toque completo sobre el juego:** el dedo baja y sube en el mismo lugar (menos de 20 px) en menos de medio segundo (`isTap` en `src/core/credits.ts`).
- **Gestos que no cuentan:**
  - Un deslizamiento.
  - Un dedo apoyado mucho tiempo.
  - Un gesto que el sistema canceló (`pointercancel`).
  - El final de un gesto que empezó fuera del juego.
- **Margen al volver:** durante 0,7 s después de que el teléfono devuelve la pantalla al juego (`focus`, `pageshow` o la página visible otra vez) no se salta.
- **Sin cambios:**
  - Enter sigue saltando, y los controles de manejo y el claxon siguen sin saltar.
  - La primera vez los créditos siguen sin poder saltarse.
  - En pausa, cualquier toque la levanta.

## Pruebas
- `tests/creditos.test.ts`:
  - El toque normal salta.
  - No saltan: el final suelto, el deslizamiento, el dedo apoyado ni el toque dentro del margen.
- En el simulador del iPhone 17, con la versión local y `?prueba`:
  - Cerrar el centro de control con un toque ya no salta, y los créditos siguen a tiempo.
  - Un toque a propósito sobre el juego sí salta al poscrédito.
