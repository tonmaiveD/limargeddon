# 0066. Costa Verde como piloto de arte interno

**Estado:** aceptada (19 de noviembre de 2026). Fase 10 de `docs/plan-fases-2026-11-16.md`, hallazgos G3 y G4 de `docs/auditorias/2026-11-16-graficos-ux-ui-creditos.md`. Amplía los costados horneados del nivel B (ADR 0044).

## Contexto
- **G3:** la Costa Verde mezclaba estilos.
  - Los vehículos tienen acabado suave.
  - El borde del mar se veía en escalones. Los tramos horneados se dibujan sobre la curva en franjas de 8 que se corren enteras, así que una línea vertical horneada, como la arena y la espuma, queda escalonada.
  - El acantilado tenía una trama cruzada ruidosa, con estratos que se cortaban de un tramo al otro.
- **G4:** en Miraflores el mismo edificio claro salía cinco veces seguidas.

## Decisión
- **Degradados al hornear.** `CanvasPainter` tiene `linear` y `radial`. El próximo relleno usa el degradado y después lo olvida. Un relleno con degradado no proyecta sombra.
- **Costa Verde:**
  - **Acantilado.** La ladera va en degradado, más clara junto a la pista. Los estratos ondulados dependen de la posición en la pista, no del tramo, así siguen de un tramo al otro. Las rocas tienen luz arriba a la izquierda, como los vehículos. La malla queda como cables verticales tenues en vez de la trama cruzada.
  - **Mar.** El tramo horneado es solo agua, en degradado y con reflejos suaves.
  - **Orilla en vivo (`drawShore`).** La arena, la arena mojada y la espuma se dibujan en la capa de la pista, punto a punto sobre la curva, así el borde no tiene escalones. La espuma va y viene con el tiempo. Los letreros de playa también van en vivo, rígidos sobre la curva, para que el texto no se corte en franjas.
- **Miraflores:**
  - **Cuatro tipos de edificio** y las tiendas de Larco: claro con balcones, terracota con terrazas, torre de vidrio y casona con patio.
  - **Sin repetir.** Los tramos pares eligen por semilla entre claro, terracota y tiendas. Los impares eligen entre vidrio y casona. Así ningún tipo sale dos veces seguidas en ninguna columna.
  - **Un hito cada doce tramos** en la columna junto a la pista, unos 4 s de pelea. Rotan el Parque Kennedy con sus gatos, la Huaca Pucllana y la Calle de las Pizzas. Son lugares públicos, no marcas.
- **Comparación en `?graficos`.** Hay dos páginas nuevas al final del recorrido con toques: la Costa Verde sobre su curva y Miraflores, cada una con el antes y el después bajando como en la pelea. El antes vive en `scenery-antes.ts` de cada etapa y solo lo usa esa página. `drawSideColumn` dibuja una columna suelta de costado.
- **Regla para las etapas que vienen:** una línea larga que corre a lo largo de la pista, como una orilla o un borde de vereda, va en vivo y no horneada, si la etapa tiene curva.

## Verificación
- **`tests/paisaje-piloto.test.ts`** comprueba que:
  - el mar horneado de la Costa Verde no tiene arena, espuma ni letreros;
  - el acantilado ya no lleva la trama cruzada;
  - ningún tipo de edificio de Miraflores sale dos veces seguidas, en tres columnas y 1200 tramos;
  - salen los cuatro tipos y las tiendas, y hay un hito por tramo, distinto del anterior, solo junto a la pista.
- **`npm run campana`** da exactamente lo mismo que en `main`.
- **Capturas** a 393 × 852 de la pelea y de las páginas de `?graficos`:
  - el borde del mar es una curva continua, sin escalones;
  - en Miraflores no se repite el mismo edificio seguido y aparece el Parque Kennedy.
- **Fluidez** en Chrome con tarjeta de video, en 8 s de pelea en la Costa Verde, con noche y orilla en vivo: p95 de 16,8 ms, igual que en la Fase 9.

## Decisión del dueño
- El 19 de noviembre, con este resultado a la vista, el dueño decidió **encargar el arte afuera**.
- El piloto interno queda en el juego como base. Quien produzca el arte debe mejorarlo de forma visible.
- Para el encargo sirven de referencia:
  - las páginas de comparación de `?graficos`;
  - la regla de las líneas largas en vivo;
  - la regla de no repetir el mismo módulo seguido.
