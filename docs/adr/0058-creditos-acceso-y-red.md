# 0058. Acceso a los créditos y red de seguridad

**Estado:** aceptada (16 de noviembre de 2026). Fase 2 de `docs/plan-fases-2026-11-16.md`, hallazgos C02a, C03 y C04 de `docs/auditorias/2026-11-16-graficos-ux-ui-creditos.md`. Ajusta la ADR 0049 en cuándo aparece "Ver créditos".

## Contexto
- **C02a:** "Ver créditos" aparecía recién cuando los créditos se habían visto completos, a los 71,6 s. Quien recargaba, cerraba o se quedaba colgado antes perdía el acceso y tenía que ganar otra vez la etapa secreta.
- **C03:** si un error escapaba de `update`, Phaser dejaba de pedir cuadros, y la imagen y la música quedaban quietas para siempre.
- **C04:** `Sfx.init()` solo reanudaba el audio en estado `suspended`. Safari en iOS usa también `interrupted`, y la música podía no volver en el resto de la sesión.

## Decisión
- **Créditos empezados** (`creditsOpened` en el guardado, sin cambiar la versión). Se marcan al entrar a la escena, salvo en el modo prueba y en la vista quieta `?creditos=`. Desde ahí el menú ofrece "Ver créditos".
  - La regla de no saltar la primera vez no cambia. Saltar sigue pidiendo `credits`, que se marca al verlos completos.
  - Quien los dejó a medias puede volver a verlos desde el menú, pero sin saltarlos hasta terminarlos una vez.
  - "Empezar de nuevo" no borra ninguno de los dos.
- **Red de seguridad:** el cuerpo de `update` de `Credits` va en un `try/catch`. Ante un error, el error queda en la consola y los créditos terminan, siguiendo a los resultados o al menú según de dónde vinieron. Si seguir a la escena siguiente también falla, se vuelve al menú.
- **Audio interrumpido:** `wake()` reanuda el contexto en cualquier estado que no sea `running` ni `closed`, lo que incluye `interrupted`. Se llama desde `Sfx.init()`, al volver la página visible y en `pageshow`, sin esperar a que el jugador toque algo.

## Verificación
- `tests/creditos.test.ts`: los créditos empezados se ofrecen sin poder saltarse, y "empezar de nuevo" no los borra.
- `npm run escenas` suma tres recorridos:
  1. Ganar la Línea Amarilla, recargar a los 10 s de créditos, y el menú ofrece "Ver créditos". Al abrirlos, siguen sin poder saltarse.
  2. Un dibujo de los créditos que lanza a propósito: la escena termina y aparecen los resultados.
  3. El audio suspendido se reanuda solo con `pageshow`.
- Comprobado que detectan la falla: deshaciendo cada arreglo por separado, falla su recorrido, con su motivo.
- **Pendiente en equipo real:** bloquear y desbloquear un iPad durante los créditos y comprobar que vuelve la música. El estado `interrupted` solo existe en Safari de iOS y no se puede reproducir en Chrome.
