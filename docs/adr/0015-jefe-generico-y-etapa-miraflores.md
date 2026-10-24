# 0015. Jefe genérico por fases, selector de etapa y Etapa 1 Miraflores

**Estado:** aceptada, Hito 4. Completa la ADR 0005.

## Contexto
`docs/plan-etapas.md` asigna a Miraflores la primera necesidad de un jefe más declarativo. El jefe del Q8 ya leía casi todo del JSON, pero tenía tres limitaciones: un solo ataque por fase, el valet escrito en el código y un tráfico que se comportaba según su nombre (`valet`, `amiga`).

## Decisión
- **`src/bosses/phase-boss.ts` (`PhaseBoss`)** reemplaza a `q8.ts`. La Loca del Q8 y la Camioneta del Serenazgo son el mismo jefe con distinto JSON y distinto dibujo.
  - `attacks`: varios ataques con peso por fase ("brake", "reverse", "ram"). Con un solo `attack` no se sortea nada, así que la paridad con el prototipo no cambia.
  - `summon`: invoca vehículos de cualquier tipo de `traffic.types`, desde un costado (estacionándose como el valet) o desde arriba, cada cierto tiempo y con una frase.
  - Claxon configurable: `hornSound` ("bossHorn" o "whistle"), `hornCol` y `hornText`.
  - Escoltas configurables: `look`, `w` y `h`.
  - El tráfico se comporta según sus datos: entra de costado si tiene `enter`, sigue al Tico si tiene `life`.
- **Piezas comunes nuevas:**
  - `Difficulty.dmgMult` multiplica el daño que recibe el Tico según la dificultad.
  - Vehículo `kind: "bici"`.
  - Obstáculos de estilo "peatones" y "scooter", y `w` para obstáculos más angostos que un carril.
  - `rewards.item` y `rewards.defeatTip`: premio y consejo propios de cada etapa.
  - `src/core/road.ts` (`drawSides`, `drawRoad`): costados por segmentos y pista, compartidos por todos los paisajes.
- **Selector de etapa** mínimo en el menú, con las etapas registradas en orden y la última elegida recordada. El selector completo, con desbloqueos, es del Hito 5.
- **Etapa 1, Miraflores** (tutorial):
  - Ruta: Malecón y Av. Larco, con parques, el Parque del Amor y el faro; en pantallas anchas, el acantilado y el mar.
  - Tráfico: ciclistas, motos Delivery y serenazgo.
  - Peligros: turistas cruzando para la foto (papeleta, sin daño), "fin de ciclovía" y scooters tirados.
  - Enjambre Delivery en Difícil.
  - Jefe: la Camioneta del Serenazgo, en tres fases: zona residencial con frenazos, operativo con refuerzos y tolerancia cero con pitazo y motos de escolta.

## Balance (bot medio)
- Miraflores, Normal: ~65 a 69 s, ganando 29 de 30. Es más corta y fácil que San Isidro, como corresponde a un tutorial.
- Miraflores, Difícil: ×1.7 de daño recibido; gana 15 o 16 de 30.
- San Isidro no cambia: mismos números que antes del jefe genérico.

## Consecuencias
- Las etapas siguientes declaran su jefe en JSON y solo agregan su dibujo.
- La prueba de paridad sigue en verde, sin tocar `tests/fixtures`.
