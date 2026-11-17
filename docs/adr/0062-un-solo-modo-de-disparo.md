# 0062. Un solo modo de disparo, por toque

**Estado:** aceptada (17 de noviembre de 2026). Fase 6 de `docs/plan-fases-2026-11-16.md` y decisión D2 del dueño del 16 de noviembre. Reemplaza a las ADR 0011 y 0013 en lo que toca al segundo modo, "acelerar es atacar". El disparo por toque, con su reserva de conos y su racha, sigue como lo dejaron.

## Contexto
"Acelerar es atacar" tuvo 0 de 72 peleas en los datos anónimos. Mantenerlo costaba:
- un selector y su texto en el menú;
- una variante del deck;
- un valor por modo en cada mejora;
- ayudas por modo;
- filas de balance y de campaña duplicadas.

## Decisión
- **Toda pelea es por toque.** La escena ya no lee el modo guardado. Un guardado viejo con `fireMode: 'acelerar'` abre y juega por toque, sin cambiar la versión del guardado. El campo queda en los ajustes viejos y no se lee.
- **Menú:** sin selector "Disparo" ni su texto. Bajo "Jugar" va solo la dificultad.
- **Deck:** sin la variante sin botón de conos (`mode-acelerar`).
- **HUD de escritorio:** sin el rótulo "↑ CONOS".
- **Motor:** `FireMode` queda en `toque` y `mantener`, y sale la rama que disparaba al acelerar.
  - `mantener` sigue, porque es el disparo del prototipo y lo usa la prueba de paridad.
  - `SavedFireMode` incluye "acelerar" para leer guardados y datos viejos.
- **Taller:** cada mejora tiene un solo valor, el de por toque, y las recomendaciones ya no dependen del modo.
- **Resultados:** sin la fila "Disparo". "Tus victorias en..." cuenta todas las peleas de la etapa y dificultad, también las viejas acelerando.
- **Récords:** el texto del récord ya no nombra el modo. El ranking nunca lo distinguió.
- **Ayudas:** sale la ayuda de "acelerar" de Miraflores. Las leídas por toque se conservan, y "Ver ayudas otra vez" mira solo esas.
- **Balance y campaña:** `npm run balance` y `npm run campana` corren solo por toque. Las metas de `docs/estado.md` no cambian, porque ya eran por toque.
- **Datos:** `fireMode` sigue en el contrato y llega siempre como "toque". El receptor sigue aceptando "acelerar" para lo que esperaba en la cola de algún teléfono, y los informes viejos no cambian.

## Verificación
- La prueba de paridad pasa sin cambios.
- `npm run balance` da las mismas cifras por toque y del prototipo en las diez etapas; solo desaparecen las filas de "acelerar".
- `npm run escenas` suma un recorrido con un guardado viejo en "acelerar", con récord y medalla. Comprueba que:
  - el menú no tiene selector y bajo "Jugar" va solo "Normal";
  - el récord sigue en el ranking;
  - la pelea es por toque, con el botón de conos, y acelerar no lanza conos;
  - el récord y las medallas siguen en el guardado.

  Si la escena vuelve a leer el modo guardado, falla en "la pelea es por toque".
