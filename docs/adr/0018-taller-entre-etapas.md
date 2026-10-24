# 0018. Taller entre etapas: billetera, mejoras y parada rápida

**Estado:** aceptada por el dueño del producto, Hito 5.

## Contexto
El concepto plantea el ciclo encargo, etapa, cobrar, taller, siguiente distrito. El dueño pidió pasar por el taller cada vez que se gana una etapa, pensando en la recompensa, la jugabilidad y el enganche, sin manipular al jugador.

## Decisión
- **Flujo:**
  - Al ganar, resultados muestra lo cobrado y la billetera, y el botón principal es **"Al taller"**. El taller tiene un botón grande **"Seguir a la Etapa N"**, para pasar en un toque sin comprar nada.
  - Al perder, "Revancha" es lo principal y "Taller" queda como opción.
  - El menú tiene acceso al taller en cualquier momento.
- **Economía:**
  - Lo cobrado (pago neto) se suma a la billetera.
  - Repetir una etapa ya ganada paga la mitad (`REPLAY_PAY`), para que no convenga quedarse juntando plata en una etapa fácil.
  - El catálogo completo cuesta S/ 19.200 (S/ 12.700 de mejoras normales más S/ 6.500 de lujo), más de lo que se gana en todo el juego, así que hay que elegir.
  - La mejora más barata (S/ 250) se puede comprar después de la Etapa 1.
- **Catálogo como datos** (`src/garage/upgrades.json`): diez mejoras en cuatro categorías.
  - Performance: motor, llantas, Turbo Chicha.
  - Armas: más conos, aceite, claxon.
  - Defensas: parachoques de fierro, blindaje, reparación.
  - Especiales: SOAT de verdad.
  - Cada nivel declara qué valores de la config cambia (`add`, `mul`, `set`), y `applyUpgrades` los aplica sobre una copia de la config de la etapa al empezar. El motor no tiene código por mejora.
- **Mejoras de lujo** (pestaña "De lujo", `requires: 3`): caras y de mucho impacto, para premiar a quien ahorra y avanza. Se ven desde el inicio con candado ("Disponible desde la Etapa 3"), y no cuentan para la recomendación ni para la meta mientras estén bloqueadas.
  - **Sticker "Mi papá es socio del Golf"** (S/ 3.000): se acaban las papeletas, y el serenazgo y la policía se corren de carril cuando el Tico viene detrás, con un "¿Usted sabe quién soy yo?". Es sátira del privilegio y guiño a La Loca del Q8.
  - **Socio de la Combi** (S/ 3.500): cada 25 s llega una combi aliada que embiste al jefe con 80 de daño.
- **Piezas de motor nuevas** (opcionales en `player`): `armor` (fracción de daño evitado), `regen` (vida por segundo), `lives` (el SOAT salva una vez por etapa con 40 de vida) y `look` (parachoques y blindaje visibles en el Tico).
- **Enganche sin manipulación:**
  - La meta más cercana siempre está a la vista ("Te faltan S/ X para..."), con una mejora recomendada: la más barata que alcanza.
  - Comprar tiene su sonido y su destello, y la pieza se ve en el Tico, tanto en el taller como en la pista.
  - No hay pagos con dinero real, cajas sorpresa ni castigos por no jugar.
- **Guardado:** `garage` (billetera y niveles) y `settings.dk` (última dificultad) son campos opcionales del esquema v1; los datos viejos siguen siendo válidos. `settleFight` cierra cada pelea en orden: decide si es repetida antes de registrarla, cobra y desbloquea.

## Consecuencias
- Las mejoras ayudan sin romper el balance. En el Centro, con unos S/ 1.300 en mejoras típicas, el bot medio en Normal gana 23 de 30 (sin mejoras, 21) con la misma duración; en Difícil, 15 de 30 (antes 12). `npm run balance` incluye esa variante.
- Las etapas futuras se balancean suponiendo las mejoras que un jugador típico tendría al llegar a ellas.
