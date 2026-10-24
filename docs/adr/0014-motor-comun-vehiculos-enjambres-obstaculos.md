# 0014. Motor común: vehículos declarativos, enjambres y obstáculos

**Estado:** aceptada, Hito 3. Cumple la parte de la ADR 0005 que quedaba pendiente.

## Contexto
`docs/plan-etapas.md` pide que cada etapa nueva sea solo datos. Hasta ahora el dibujo y el movimiento del tráfico dependían del nombre del tipo en el código (`scooter`, `sereno`, `valet`, `amiga`). Además, no había forma de declarar grupos de vehículos ni obstáculos.

## Decisión
- **Vehículos declarativos:** cada tipo de `traffic.types` trae su `look` (moto o auto, techo, panel, circulina, rótulo, franja, caja de reparto, lentes) y su `move` (zigzag). El render y el movimiento leen esos datos. Valets y escoltas del jefe usan el mismo `look`.
- **Enjambres** (`swarms`): grupos de un tipo, en formación columna, V o diagonal, con el zigzag sincronizado, solo en las dificultades declaradas.
- **Obstáculos** (`obstacles`): avanzan con el asfalto.
  - Los **bloques** (conos, barrera, caja) son sólidos: empujan al Tico, hacen daño o generan papeleta una sola vez, y desvían al tráfico. Con turbo se apartan de un golpe.
  - Los **huecos** se cruzan y castigan, salvo con turbo.
  - Si un auto queda atrapado entre un bloque y el jefe, espera detrás del bloque.
- **San Isidro** estrena las piezas: motos **Delivery** con caja de reparto en lugar del scooter genérico, un **enjambre Delivery** en V en Difícil y **conos de "RESERVADO"** cada 14 a 22 s.
- **El jefe pasa a llamarse La Loca del Q8** (`q8.ts`, `q8-render.ts`, nombre, título y frases).
- **`docs/guia-etapas.md`**: guía corta para construir etapas, pensada para sesiones en la nube.

## Consecuencias
- El JSON del prototipo (`tests/fixtures`) recibió las declaraciones equivalentes (`look` y `move` del serenazgo y el scooter). La prueba de paridad confirma que el comportamiento no cambió.
- Balance después del cambio (bot medio, Normal): ~74 s por toque y ~76 s acelerando, dentro de la variación normal.
- Lo que sigue en el motor (jefe más declarativo, clima, saltos, nivel de búsqueda, selector de etapas) se agrega en la primera etapa que lo necesite, según `docs/plan-etapas.md`.
