# Prompt para la versión 2 del arte de la Costa Verde

**20 de noviembre de 2026.** Este prompt junta todos los comentarios de `docs/revision-arte-costa-verde-v1.md` para pedir una versión corregida del paquete generado con IA. Se pega tal cual en el mismo chat que produjo la versión 1, junto con `docs/encargo-arte-limargeddon.md`. Copiar desde la línea de abajo.

---

Necesito la **versión 2** del paquete `limargeddon-costa-verde-v1.zip`. La versión 1 se revisó contra el motor del juego. Lo técnico está bien y el estilo se aprueba, así que **no cambies nada que no esté en esta lista**: mantén el estilo, la paleta, la luz desde arriba a la izquierda, la escala de 3 veces, las anclas, los nombres de ID y el formato de `manifest.json`. Las piezas nuevas o corregidas tienen que verse de la misma familia que las aprobadas.

## A. Correcciones obligatorias, por diferencias con el motor

1. **Columnas lejanas de 42 de ancho, no de 48.** El motor dibuja todas las columnas de costado con 42 de ancho lógico, separadas cada 46. Rehacer `acantilado_alto` y `mar_lejano` en **42 × 110 lógicos (126 × 330 PNG)**. Tienen que unir sin costura entre sí, de arriba abajo, igual que las otras familias.

2. **Morro Solar en 42 de ancho, que una con el acantilado alto.** `hito_morro_solar` ya mide 42. Después de rehacer `acantilado_alto` en 42, sus bordes de arriba y de abajo tienen que coincidir píxel a píxel con los de `acantilado_alto`.

3. **Carretilla de costado.** En el juego la carretilla **cruza la pista de lado**, de izquierda a derecha o al revés, y baja un poco con la pista. Rehacer `carretilla` en vista cenital con la carretilla avanzando hacia la **derecha** y el heladero detrás, a la izquierda, empujándola. Todo el conjunto, carretilla y heladero, cabe en **30 × 22 lógicos (90 × 66 PNG)**, que es la caja de choque del juego. El motor la espeja para el otro sentido. Se mantienen los colores, el toldo verde pistacho y el cuerpo ciruela, sin marca ni texto.

4. **Gaviotas que bajan hacia el Tico.** En el juego la bandada **baja en picada hacia el jugador**, en V con la punta hacia abajo, y al espantarla con el claxon se va hacia la **derecha**. Rehacer `gaviotas_01` y `gaviotas_02`, los dos cuadros de aleteo, con las aves mirando **hacia abajo** de la pantalla en formación de V con el vértice abajo. Medida de **70 × 28 lógicos (210 × 84 PNG)**, misma ancla y mismo encuadre en los dos cuadros. Agregar `gaviotas_huida_01` y `gaviotas_huida_02`, del mismo tamaño, con las aves mirando a la **derecha**. **Sin sombra**, porque el motor dibuja la sombra aparte.

5. **Derrumbe en piedras sueltas.** El juego no usa un montón. Hace caer piedras sueltas de **14 de diámetro**. Reemplazar `derrumbe` por tres piedras distintas, `piedra_01`, `piedra_02` y `piedra_03`, de **14 × 14 lógicos (42 × 42 PNG)** cada una, de canto rodado y tierra del acantilado, con exterior transparente.

6. **Tico con fierro y blindaje a la vez.** El taller permite comprar las dos mejoras juntas. Agregar `tico_fierro_blindaje_sano`, `tico_fierro_blindaje_danado` y `tico_fierro_blindaje_muy_danado`, de **28 × 48 lógicos (84 × 144 PNG)**, en el mismo encuadre que los otros Ticos.

7. **Tramo de transición de arena a mar.** La arena no une con el mar, la diferencia de color en el borde llega a 115 de 255. Agregar `transicion_mar_arena`, de **42 × 110 lógicos**, con mar arriba y arena abajo, y `transicion_arena_mar`, con arena arriba y mar abajo. El borde de mar tiene que coincidir píxel a píxel con `mar_01`, `mar_02` y `mar_03`, y el borde de arena con `arena_base`. El paso de una a otra va en diagonal suave, con espuma, no en línea recta horizontal.

8. **Serenazgo sin circulina pintada.** El motor ya dibuja la circulina roja y azul intermitente encima del vehículo. Rehacer `serenazgo_sano` y `serenazgo_danado` **sin las luces del techo pintadas**. Puede quedar la base de la barra de luces, apagada y en gris oscuro.

9. **Carrocerías opacas.** En los vehículos, el alfa interior está entre 250 y 254 en vez de 255, y la carrocería deja pasar del 1 al 2 % del fondo. En **todos los vehículos y en la carretilla**, todo píxel interior tiene que tener alfa 255. Solo el borde antialiasado puede ser semitransparente.

## B. Mejoras visuales pedidas

10. **Mejoras del Tico que se vean a tamaño de juego.** El fierro y el blindaje casi no se distinguen del Tico de serie a 28 × 48.
    - **Fierro:** un parachoques delantero grueso de fierro gris oscuro con remaches, que sobresalga un poco del frente.
    - **Blindaje:** planchas metálicas atornilladas en los dos costados, de un gris distinto a la carrocería amarilla.
    - Las dos mejoras se tienen que reconocer en una captura del juego sin ampliar.

11. **Daño del jefe más visible.** En `jefe_danado` el daño se nota poco. Agregar abolladuras claras en el capó y un costado, un faro roto y el parachoques colgando, sin cambiar el color ni el encuadre.

12. **Agua Dulce que se reconozca.** Hoy las carpas son cuadrados planos. Rehacer `hito_agua_dulce` en **42 × 110** con:
    - sombrillas de colores plegadas, vistas desde arriba;
    - carpas con volumen, con su sombra;
    - una torre de salvavidas de madera;
    - huellas en la arena.
    Es de noche en el juego, así que la playa está casi vacía. Los bordes de arriba y de abajo siguen coincidiendo con `arena_base`.

13. **Morro Solar que se lea como cerro.** Hoy parece una ladera con caminos. Rehacer `hito_morro_solar` con:
    - la masa del cerro en relieve claro, más alta en el centro y con sombra marcada abajo a la derecha;
    - un grupo de luces cálidas en la cima;
    - en la parte más alta, la estatua blanca iluminada del Cristo del Pacífico, que desde arriba se ve como una figura clara con un halo.
    Sigue sin texto y une con `acantilado_alto` (punto 2).

14. **Mallas antiderrumbe más visibles.** En `acantilado_01` a `acantilado_04`, la malla casi no se ve. Hacerla visible en al menos dos de las cuatro variantes, con cuadrícula metálica gris clara sobre la tierra, cables y anclajes. Que no forme una trama ruidosa. Los bordes de unión no cambian.

## C. Lo que falta en el paquete

15. **`prueba-jugable.html`.** El LEEME dice que hay que abrirla primero, pero no vino en el zip. Incluirla y actualizarla con las piezas nuevas: carretilla cruzando de lado, gaviotas bajando y huyendo a la derecha, piedras del derrumbe, Tico con fierro y blindaje, y transiciones de arena a mar.

16. **Procedencia completa.** En `documentacion/PROCEDENCIA.txt` agregar:
    - el nombre y la versión del generador de imágenes usado;
    - un resumen de los términos de uso de esas imágenes para un juego publicado en un repositorio público;
    - qué piezas se rehicieron en la versión 2.

## D. Entrega y comprobaciones

- Entregar `limargeddon-costa-verde-v2.zip` con la misma estructura que la versión 1: `png/`, `fuentes/`, `manifest.json`, `integracion.mjs`, `catalogo.html`, `prueba-jugable.html` y `documentacion/`.
- **Las piezas que no cambian se copian sin tocar**, con el mismo sha256 que en la versión 1.
- En `manifest.json`:
  - quitar `derrumbe`;
  - agregar las piezas nuevas;
  - corregir las medidas de `acantilado_alto` y `mar_lejano`.
- Actualizar `documentacion/qa-recursos.json` y comprobar, antes de entregar:
  - cada PNG mide exactamente 3 veces su medida lógica;
  - todas las uniones de los puntos 1, 2, 7, 12 y 13 dan diferencia 0 en la fila del borde;
  - el alfa interior de los vehículos y de la carretilla es 255;
  - el peso total de los PNG queda en 4 MB o menos;
  - no hay texto, rótulos, logos ni marcas en ningún PNG.
- Agregar al LEEME una lista de cambios de la versión 1 a la 2, con el número de cada punto de este pedido.
- Si algún punto no se puede cumplir, dilo explícitamente en el LEEME y explica por qué. No lo omitas en silencio.
