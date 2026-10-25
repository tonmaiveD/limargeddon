# 0035. Correcciones de la tercera auditoría, bloque A

**Estado:** aceptada (bloque A del orden recalibrado el 25 de octubre de 2026, `docs/estado.md`).

## Contexto
La tercera auditoría (`docs/auditorias/2026-10-25-tercera-auditoria.md`) encontró cuatro fallos que rompen reglas en la versión publicada. Las 140 pruebas existentes pasaban igual.
- **N01:** comprar el Socio de la Combi rompía la Línea Amarilla a los 12 s. La ruta no tiene el bonus de la combi y el motor leía su velocidad sin comprobarlo.
- **N02:** perder el avión no respetaba los intentos. El contador bajaba a 0 y a negativos, y la partida seguía.
- **N03:** con la cabeza expuesta tras escapar del enrosque, la cabeza seguía tocando el claxon y haciendo daño por contacto.
- **N04:** el hueco del anillo se calculaba al empezar. Romper autos durante el enrosque no abría espacio real, y la barrera seguía aunque no quedaran autos.

## Decisión
- **Socio de la Combi en la ruta** (decisión del dueño):
  - En una etapa de ruta, la combi aliada sube recta por el carril del Tico y se lleva el tráfico que encuentra.
  - No busca al jefe, que no existe, y no pasa bajo el carguero, donde se deshace.
  - El taller lo dice en la descripción de la mejora.
  - Los accesos a `powers.combi` quedan protegidos para cualquier etapa sin ese bonus.
- **Intentos de la ruta:**
  - Morir y perder el avión gastan intento con la misma función.
  - Si era el último, la partida se pierde de una sola vez. El contador queda en 0, no se cura ni se reinicia el tramo, y el último golpe es "SE FUE EL AVIÓN".
  - La vida extra del SOAT salva de morir, pero no de perder el avión.
- **Cabeza expuesta segura:**
  - Mientras dura la ventana, la cabeza no toca el claxon y su contacto no quita vida.
  - El contacto sigue empujando, y el golpe del Tico a la cabeza sigue dañándola.
  - Al terminar, el claxon espera al menos 1 s.
- **Anillo con geometría compartida:**
  - El choque del anillo sale de los casilleros de los autos que quedan, los mismos que se dibujan.
  - Romper un auto libera su casillero en el mismo cuadro. Si se rompe uno del medio, la cola se suelta y deja el anillo.
  - Con menos de 3 autos en la fila, el anillo se deshace con "¡SE ROMPIÓ EL ANILLO!" y no queda barrera.
- **Prueba de mejoras en las diez etapas:**
  - Cada nivel de cada mejora se aplica en todas las etapas.
  - Con el último nivel de cada mejora, y con todas juntas en ambos modos de disparo, se juegan 15 s con el bot.
  - La prueba falla sin la corrección del Socio.

## Medición
Campaña de 90 por modo:
- **Costa Verde:** se gana al primer intento en el 70% de las campañas por toque y en el 71% acelerando, igual que en la ADR 0034.
- **Línea Amarilla:** sin derrotas.

## Consecuencias
- La paridad no cambia. Las protecciones de la cabeza solo actúan cuando hay exposición, que solo ocurre en la Costa Verde.
- Pruebas nuevas:
  - En `tests/linea-amarilla.test.ts`: avión, intentos y Socio.
  - En `tests/enrosque.test.ts`: cabeza expuesta y anillo que se rompe.
  - Nuevo `tests/mejoras-etapas.test.ts`.
- Sigue el bloque B: puntaje y resultados honestos.
