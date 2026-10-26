# 0042. Tráfico y Tico en nivel B

**Estado:** aceptada (el dueño aprobó la prueba de la ADR 0041 el 25 de octubre de 2026 y pidió integrarla al tráfico).

## Decisión
- **Todo el tráfico de las diez etapas y el Tico se dibujan con imágenes horneadas** (`src/core/art/bake.ts`), con la técnica de la ADR 0041. El Tico también aparece así en el taller y en el cierre del carguero.
  - El horneado se hace a la resolución real de la pantalla (`ZOOM`).
  - En el taller, el Tico se hornea a su tamaño grande para que no se vea borroso.
- **Carrocerías** (`src/core/art/vehicles.ts`). Salen del tamaño y del `look` que ya declara cada JSON, así que ninguna etapa cambia:

  | Carrocería | Cuándo se usa |
  |---|---|
  | Bus interprovincial | Largo de 80 o más |
  | Camión, con cabina y carga | Largo de 66 o más |
  | Combi | Largo de 58 o más |
  | Patrullero | Tiene circulina o panel: serenazgo, policía, seguridad |
  | Carcocha, con óxido y pintura gastada | Tipo `carcocha` |
  | SUV | Ancho de 32 o más |
  | Sedán | Todo lo demás: taxi, auto de app, auto, sedán |
  | Moto, bici, mototaxi y triciclo | Lo declara su `look` |

- **Daño procedural, como pide CLAUDE.md:**
  - Cada auto se hornea en cuatro etapas de daño (0, 35%, 65% y 90%) con el contorno abollado de siempre, las abolladuras con relieve, el parabrisas trizado y el capó levantado.
  - Hay dos variantes de abolladuras para que no se repitan.
  - Las texturas se crean la primera vez que se necesitan y quedan en caché.
  - Los vehículos chicos no tienen etapas de daño.
- **Encima de la imagen, cada cuadro, va lo que cambia:**
  - Luces de freno o reversa con halo, sobre las luces apagadas que trae la imagen.
  - Circulina roja y azul.
  - Balizas.
  - El destello del golpe, que rellena la imagen de blanco.
  - El giro por patinar en aceite y la vibración con mucho daño.
- **Correcciones pedidas sobre la prueba:**
  - Con mucho daño, las ruedas se meten junto con el costado abollado.
  - La franja de la combi va sobre el techo, de lado a lado, y se ve completa.
- **Correcciones vistas al revisar la galería:**
  - Los rótulos sin panel llevan una placa oscura, para que se lean aunque tengan el color del techo (por ejemplo, "ABANCAY" rojo sobre techo rojo).
  - La circulina va delante del panel y ya no tapa el rótulo.
- **Capas de dibujo**, de abajo hacia arriba:
  - Asfalto.
  - Bonus.
  - Tráfico y sus luces.
  - Jefe, proyectiles, neblina y peligros.
  - El Tico y sus luces.
  - Efectos.
  - Interfaz.

  La neblina sigue tapando el tráfico y el jefe queda por encima, como antes. `Gfx.image` dibuja una imagen con la transformación y la curva rígida de la capa (ADR 0040).
- **La vista `?graficos`** (ADR 0041) suma una galería con un vehículo de cada tipo, sano y dañado, dibujada con el mismo código del juego.

## Consecuencias
- La simulación, la paridad y el balance no cambian.
- Los jefes, la combi aliada y los escenarios siguen con el dibujo anterior. Son la siguiente tanda del nivel B.
- Las texturas no se liberan durante la sesión. Son pocas por etapa (carrocería, color, etapa de daño y variante), pero si crecen se puede agregar un límite.
- Pendiente probar en el teléfono el rendimiento con la Panamericana o la Línea Amarilla llenas de tráfico.
