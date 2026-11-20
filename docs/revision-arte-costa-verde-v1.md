# Revisión del paquete de arte · Costa Verde v1

**20 de noviembre de 2026.** Se revisa `limargeddon-costa-verde-v1.zip`, entregado el 20 de noviembre como respuesta al encargo `docs/encargo-arte-limargeddon.md` (versión 1, PR #75). Es solo revisión y documentación: nada del paquete se integró al juego.

## Resumen
- **Lo técnico está bien hecho.**
  - Están las 67 imágenes del encargo, cada una al triple exacto de su medida lógica.
  - Pesan 2,04 MB en total.
  - Los tramos encajan sin costura dentro de cada familia.
  - No hay textos, rótulos ni logos.
  - Trae fuentes PSD por estado y un manifiesto completo.
- **Lo visual es un salto claro sobre el arte actual**, sobre todo en los vehículos y en el muelle. La doble fila va a la derecha, como pide el encargo.
- **Hay un punto que decide el dueño antes que todo lo demás: la procedencia.** El arte no lo hizo un artista externo. Se generó con un generador de imágenes dentro de un chat, y la cesión de derechos no está firmada. El repositorio es público.
- **Hay diferencias con el motor** que impiden integrarlo tal cual: la medida de las columnas lejanas, la orientación de la carretilla y de las gaviotas, el derrumbe, la combinación de mejoras del Tico y la transición de arena a mar. Están en la sección 4.
- **No se probó en el juego.** Faltan la integración, la medición en dos teléfonos y la prueba con 6 a 8 personas. El paquete lo reconoce.

## 1. Qué trae el paquete
| Carpeta o archivo | Contenido |
|---|---|
| `png/` | 67 PNG RGBA a 3 veces: 9 del Tico, 2 del jefe, 12 autos de la fila, 12 de tráfico, 10 costados, 2 orillas, 4 obstáculos, 4 peligros o cuadros, 4 hitos, 6 bonus y 2 capas de balizas |
| `fuentes/` | 37 PSD raster por familia, con grupos de estado |
| `manifest.json` | ID, medida lógica y en píxeles, ancla, ruta, fuente y peso de cada imagen. No falta ninguna |
| `integracion.mjs` | adaptador de referencia para Canvas 2D. No se ejecutó, solo se leyó |
| `catalogo.html` | inventario visual con la noche al 62 % |
| `documentacion/` | guía de integración, procedencia, los prompts usados, QA y tres capturas de prueba |

**Falta `prueba-jugable.html`.** El LEEME dice que hay que abrirlo primero, pero no está en el zip.

## 2. Comprobaciones hechas
Se hicieron sobre una copia extraída aparte, sin ejecutar nada del paquete.

| Comprobación | Resultado |
|---|---|
| Medida de cada PNG contra el manifiesto, al triple de la medida lógica | 67 de 67 bien |
| Canal alfa | todas RGBA. Los costados, hitos y orillas son opacos |
| Peso total | 2,04 MB, dentro de los 4 MB propuestos en el encargo |
| Uniones dentro de cada familia, la última fila de un tramo contra la primera de otro | diferencia 0 en acantilado, mar, acantilado alto y mar lejano |
| Uniones de los hitos con sus vecinos | la bajada con el acantilado, el muelle con el mar y Agua Dulce con la arena dan 0. El Morro Solar no encaja con el acantilado alto, porque mide 42 y la columna lejana del paquete mide 48 |
| Arena contra mar | no encajan: la diferencia llega a 115 de 255. Falta un tramo de transición |
| Textos y marcas | no hay textos ni logos en las imágenes. Los prompts piden expresamente "sin logo" y "sin marca" |
| Alfa interior de los vehículos | entre 250 y 254, no 255. La carrocería deja pasar del 1 al 2 % del fondo. Casi no se nota, pero conviene que sea opaca |

## 3. Cumplimiento del encargo, pieza por pieza
| Pieza | Estado | Observación |
|---|---|---|
| Tico, 3 estados × 3 equipos | parcial | Los daños se leen bien. El parachoques de fierro y el blindaje casi no se distinguen del Tico de serie a tamaño de juego. Falta el Tico con fierro y blindaje a la vez, que el taller permite |
| Jefe, sano y dañado | bien | Es un SUV claro y genérico, sin marca. El daño se nota poco |
| Autos de la fila, 6 colores × 2 | bien | Llevan detalles de playa en el techo, como pide el encargo |
| Tráfico, 6 tipos × 2 | bien, con un ajuste | La camioneta de serenazgo trae la circulina pintada, y el motor también dibuja la suya. Una de las dos sobra |
| Acantilado, 4 tramos | bien | Tiene tierra y canto rodado. Las mallas antiderrumbe se ven poco |
| Mar, 3 tramos | bien | |
| Columnas lejanas | no calzan | Miden 48 de ancho. El motor usa columnas de 42 separadas cada 46 |
| Orillas, piedra y arena | bien | Miden 14 × 110. En el juego la orilla ya se dibuja en vivo sobre la curva (ADR 0066) |
| Obstáculos | bien | El hueco mide 65 × 22 y la barrera 130 × 14, igual que en el juego |
| Carretilla Don Frío | no calza | El heladero empuja hacia arriba, pero en el juego la carretilla cruza la pista de lado. Mide 30 × 42 y la caja de choque es de 30 × 22. Sin marca y con colores propios, bien |
| Gaviotas, 2 cuadros | no calza | Vuelan hacia la izquierda. En el juego bajan hacia el Tico y, espantadas, se van a la derecha |
| Derrumbe | no calza | Es un montón de 30 × 30. En el juego caen piedras sueltas de 14 de diámetro |
| Hitos | parcial | La bajada y el muelle se reconocen. A Agua Dulce le faltan las sombrillas y la torre de salvavidas, y las carpas son cuadrados planos. El Morro Solar no se lee como cerro ni muestra sus luces en la cima |
| Bonus | bien | Hay seis íconos claros |
| Balizas en capa aparte | bien | Sirven para dibujarlas sobre la noche |

## 4. Diferencias con el motor
Habría que resolverlas antes de integrar, con una versión 2 o con ajustes en el motor:
1. **Columnas lejanas de 48.** El motor dibuja las columnas extra con el mismo ancho de 42. Opciones: pedirlas en 42, o cambiar el motor para que las columnas lejanas midan 48.
2. **Carretilla de costado.** Hace falta una vista de costado, y que la caja de choque de 30 × 22 cubra el dibujo. Basta una dirección si se puede espejar.
3. **Gaviotas.** Tienen que bajar hacia el Tico y, al espantarse, irse a la derecha. Puede bastar con espejarlas, pero hay que confirmarlo con su sombra.
4. **Derrumbe.** Hacen falta dos o tres piedras sueltas de 14 en vez de un montón.
5. **Tico con fierro y blindaje** a la vez, en sus tres estados.
6. **Transición de arena a mar.** Hace falta un tramo que pase de la playa al agua, o la regla de que la arena solo aparezca junto a Agua Dulce y vuelva al mar por un tramo de transición.
7. **Circulina.** Hay que decidir si la pone el arte o el motor.
8. **Alfa interior opaco** en los vehículos.

El adaptador del paquete dibuja la orilla fila por fila sobre la curva. Funciona, pero el juego ya la dibuja en vivo con polígonos, que es más barato. Conviene integrar solo la textura de la orilla.

## 5. Procedencia y derechos
- **Cómo se hizo.** Según `documentacion/PROCEDENCIA.txt`, el arte se generó con el generador de imágenes de un chat y la dirección visual se aprobó en ese mismo chat. Los PSD son separaciones raster de lo generado, no bocetos ni modelos.
- **Fotos de referencia.** Se consultaron fotos de terceros de la Costa Verde, las mallas, Agua Dulce, el muelle y el Morro Solar, con sus créditos. Se declara que no se usaron para construir los sprites.
- **Derechos.** Los campos comerciales y de cesión del encargo quedaron en blanco, y el paquete aclara que no es un contrato firmado con un artista externo.
- **Qué falta decidir.** El encargo pedía acordar los derechos por escrito antes de integrar, porque el repositorio es público. Falta que el dueño decida si acepta arte generado de esta forma y en qué condiciones se puede publicar.

## 6. Qué no se revisó
- La integración en el juego, la vista `?colisiones` y las capturas de pelea con el arte nuevo.
- La fluidez en dos teléfonos y la prueba con 6 a 8 personas.
- Los PSD por dentro. Solo se contaron y se leyó su descripción.
- La prueba jugable, que no vino en el zip.

## 7. Siguientes pasos, para decidir el dueño
1. **Procedencia y derechos.** Decidir si se acepta arte generado y en qué condiciones se publica.
2. **Versión 2.** Si se acepta, pedir al proveedor los ajustes de la sección 4 y la prueba jugable que falta.
3. **Integración.** Después de eso, integrar en una rama propia y medir con los criterios del encargo.
4. **El zip.** Queda fuera del repositorio hasta resolver los derechos. Hoy está en `docs/` sin versionar, y pesa 14 MB.
