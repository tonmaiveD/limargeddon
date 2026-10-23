# 0009. Balance de duración, paridad contra la config original y registro de peleas

**Estado:** aceptada, Hito 3. Reemplaza la parte de la ADR 0006 que comparaba la config del juego con el prototipo.

## Contexto
La ADR 0007 dejó para el Hito 3 llevar la pelea en Normal de ~55 s a 90-120 s. El dueño aprobó subir la vida del jefe y alargar las fases con más ataques, sin tocar el x2 del lado derecho, y validar con personas.

## Lo que mostraron las simulaciones (`npm run balance`, 30 semillas por caso)
- Subir solo la vida alarga la pelea, pero los bots mueren más: más tiempo expuesto significa más daño recibido, y la mediana engaña porque solo cuenta victorias.
- Más ataques del Q6 (menos cambios de carril) **acortan** la pelea: tras la reversa queda estacionada y expuesta. Por eso no se tocaron las fases.
- Lo que funciona es subir la vida del jefe y bajar en proporción el daño que recibe el Tico.

## Decisión
- Vida del jefe ×1.5: Fácil 1350, Normal 1800, Difícil 2400.
- Daño recibido ×0.7: contacto con el jefe 5 (embestida y reversa 11), autos 6, motos 3, escoltas 7. El valet y los rompemuelles no cambian.
- Objetivo con bots: el bot "medio" en ~80 s en Normal, porque las personas tardan más. Resultado: gana 26 de 30 (el prototipo, 24 de 30) con una mediana de 81 s (rango 49 a 118).
- **Paridad:** `tests/fixtures/san-isidro-prototipo.json` es una copia fija de la config del prototipo, con sus modos originales. La prueba de paridad corre el motor con esa copia, así que sigue verificando el motor cuadro a cuadro aunque el juego use otros números.
- **Registro de peleas** (`src/core/save.ts`): cada pelea se guarda en localStorage (`limargeddon.save`, esquema v1, con try/catch). Resultados muestra la mediana de tus victorias en esa dificultad, y el botón "Copiar registro" copia el historial en JSON para compartirlo.

## Consecuencias
- El criterio de cierre queda pendiente de partidas reales: Normal entre 90 y 120 s con personas. Si el registro muestra otra cosa, se ajusta la vida del jefe (palanca principal) y se vuelve a correr `npm run balance`.
- El Hito 5 extiende `save.ts` (soles, mejoras, progreso) subiendo la versión de esquema.
