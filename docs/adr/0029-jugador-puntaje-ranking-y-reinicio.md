# 0029. Nombre del jugador, puntaje, ranking local y empezar de nuevo

**Estado:** aceptada por el dueño del producto (decisiones del 24 de octubre de 2026).

## Contexto
El dueño pidió poder poner nombre al jugador, un ranking de los 12 mejores con su puntaje y una forma de empezar todo de nuevo. Eligió:
- Un ranking local por ahora.
- El puntaje como suma de la mejor pelea de cada etapa.
- Pedir el nombre al empezar, editable después.
- Que "empezar de nuevo" borre el progreso y el taller, conserve el ranking y el nombre, y pida advertencia y una segunda confirmación.

## Decisión
- **Nombre:**
  - Se pide la primera vez que se abre el juego, sin opción de saltarlo, y se cambia desde el menú ("Jugador · NOMBRE").
  - Hasta 12 letras o números. Se admiten tildes y ñ, y el resto se descarta mientras se escribe.
  - Vacío queda como TAXISTA.
  - Se guarda en `settings.playerName`.
- **Puntaje por victoria** (`src/core/score.ts`), la fórmula de la segunda auditoría:
  - 4000 base.
  - 2000 por tiempo (completo hasta `rewards.scoreTref`, 120 s por defecto y 90 en Miraflores; cero al doble).
  - 1500 por la proporción de daño por la derecha.
  - 1000 por la racha (techo en 8).
  - 1000 por limpieza (cada falta resta un tercio).
  - 500 por el objetivo de la etapa: la carretilla intacta en la Costa Verde, y en el resto la vida que no se perdió.
  - Las faltas se cuentan antes de que el Silbato, el Bolso o el sticker las perdonen (`stats.infractions`). El daño recibido no lo borra la reparación (`stats.dmgTaken`).
  - Por dificultad se multiplica: Fácil ×0.7, Normal ×1 y Difícil ×1.25, para que no convenga farmear en Fácil. El máximo es 10.000 en Normal.
  - Perder no da puntaje.
- **Ranking local** (`save.scores`):
  - Guarda la mejor pelea de cada jugador en cada etapa. Repetir una pelea igual no suma.
  - Muestra los 12 mejores del dispositivo por total, con desempate por etapas ganadas, y marca al jugador actual.
  - El modo prueba (`?prueba`) muestra el puntaje pero no lo registra.
- **Resultados:** al ganar se ve el puntaje, y "¡Récord personal en esta etapa!" cuando supera el anterior.
- **Empezar de nuevo:**
  - Primero una advertencia y después "¿Seguro? Esto no se puede deshacer". En los dos pasos el botón destacado es "Volver".
  - Deja `progress.unlocked = 1` de forma explícita, porque si faltara se reconstruiría desde el registro de peleas. También deja la billetera en cero y sin mejoras.
  - Los objetos de victoria se derivan del progreso, así que también se pierden.
  - Conserva el nombre, el ranking y el registro de peleas.

## Consecuencias
- **El ranking es por dispositivo.** Uno compartido necesitaría un servicio externo, validación de puntajes (el cliente se puede falsear) y moderación de nombres. Se puede sumar después sobre esta misma fórmula.
- **La tabla mezcla jugadores con distintas mejoras compradas.** La auditoría sugiere una clasificación aparte con equipamiento fijo si se quiere comparar habilidad pura.
- **El tiempo del puntaje** es el tiempo de simulación, que no cuenta los congelamientos de impacto (unas décimas por racha).
