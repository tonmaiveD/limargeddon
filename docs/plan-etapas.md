# Plan de etapas y de desarrollo

**Estado:** propuesta del 23 de octubre de 2026, para revisión del dueño del producto y del proyecto advisory de claude.ai. Amplía `concepto.md`, no lo reemplaza: si algo choca, manda `concepto.md` hasta que se actualice.

## 1. Tono

La sátira apunta a la mala conducción, al privilegio, a las autoridades y a la infraestructura (obras eternas, peajes, huecos, desvíos "temporales"). Ambulantes, mototaxistas, estibadores o cobradores aparecen como parte del caos de la calle, nunca como el chiste. Las marcas reales van siempre en parodia.

## 2. Pendientes ya acordados

- **Renombrar el jefe de San Isidro a "La Loca del Q8"**: nombre, título, frases ("¡Mi Q8 cuesta más que tu casa!") y archivos internos (`q6.ts` → `q8.ts`). Sigue siendo la parodia de cuatro anillos con uno deformado.
- **Motos "Delivery"** en San Isidro y Miraflores, como parodia genérica.
- **Enjambres por distrito y dificultad**: grupos que se mueven juntos, declarados en el JSON.
- **Peligros idiosincráticos por etapa**, como obstáculos genéricos del motor (ver sección 4).
- **Balance por modo de disparo**: esperar 3 o 4 peleas más por modo antes de ajustar (ADR 0013).

## 3. Las etapas

| # | Etapa | Peligros propios | Enjambre (difícil) | Jefe |
|---|---|---|---|---|
| 1 | Miraflores · Malecón y Av. Larco (tutorial) | Ciclovía que termina de golpe, turistas cruzando para la foto, scooters eléctricos tirados, serenazgo que multa el claxon | Motos Delivery | Camioneta de serenazgo |
| 2 | San Isidro · Av. Camino Real (hecha) | Valets en doble fila, rompemuelles, conos de "reservado" | Motos Delivery | La Loca del Q8 |
| 3 | Centro · Av. Abancay | Rejas policiales que cierran carril, carretillas de jugos y emolientes, marchas que avanzan como muro, el "desvío temporal" de 2019 | Combis peleando el paradero | Rochabús (chorros que empujan de carril) |
| 4 | Av. Javier Prado | By-pass en obra eterna ("Pronto, para tu comodidad"), semáforos en ola, camiones de obra en un carril, cráteres | Combis en manada | Combi Asesina con cobrador ("¡al fondo hay sitio!") |
| 5 | Vía Expresa · el Zanjón | Rampas y puentes, cráteres que hacen saltar, carril exclusivo que nadie respeta | Autos de aplicación que frenan en seco | Bus del Metropolitano articulado |
| 6 | Gamarra y La Victoria | Triciclos con fardos, carretillas saliendo de galerías, rumas de cajas, cables bajos que castigan acelerar | Mototaxis y triciclos | Camión de mercadería (rollos de tela rodando) |
| 7 | Av. Colonial y Callao | Contenedores mal amarrados, grúas, camiones de obra cerrando carriles, cráteres con agua, desvíos de saneamiento | Mototaxis (carcochas) y combis asesinas | Tráiler portacontenedores |
| 8 | Panamericana Norte | Garúa que reduce la visibilidad, casetas de peaje abandonadas con barreras que bajan solas, buses interprovinciales adelantando en curva | Patrulleros según nivel de búsqueda (1 a 5 estrellas) | Escuadrón policial (rompellantas, bloqueos) |
| F | Costa Verde de noche | Neblina, curvas junto al mar, deslizamientos de piedras, enemigos de todas las etapas | Mezcla de todos | Sorpresa (por definir) |
| S | **Línea Amarilla del Terror** (secreta) | Ver sección 5 | Todos los enjambres mezclados | Final de precisión: el avión carguero |

## 4. Motor común que hace falta

Para que cada etapa sea solo datos, el motor necesita estas piezas. Cada una se construye una sola vez, en la primera etapa que la usa:

| Pieza | Qué permite declarar en el JSON | Primera etapa |
|---|---|---|
| **Vehículos declarativos** | Forma, colores, rótulo y comportamiento (zigzag, frenazos, cambio de carril) sin código nuevo por tipo | Hito 3 (motos Delivery) |
| **Enjambres** | Grupos con formación, dificultad mínima y frecuencia | Hito 3 |
| **Obstáculos** | Tipo (bloqueo de carril, cráter, muro móvil, barrera), carriles, duración, daño o papeleta | Hito 3 (base) y Javier Prado (obras, cráteres) |
| **Jefe más declarativo** | Ataques reutilizables (frenazo, reversa, embestida, proyectiles, escoltas, valets) combinables por fase | Miraflores |
| **Selector y desbloqueo de etapas** | Orden, requisitos y etapa secreta | Hito 5 |
| **Clima y luz** | Garúa, neblina, noche y túnel como capas de visibilidad | Panamericana |
| **Saltos y rampas** | Desniveles que lanzan al Tico | Vía Expresa |
| **Nivel de búsqueda** | Estrellas de 1 a 5 que escalan la persecución policial | Panamericana |
| **Escenas de cierre** | Secuencias cortas al final de una etapa (el avión) | Línea Amarilla |

## 5. Nivel secreto: "Línea Amarilla del Terror"

- **Desbloqueo:** al vencer la etapa final. El menú muestra un candado con una línea amarilla como pista.
- **Ruta:** Vía de Evitamiento → túnel bajo el río Rímac → Av. Morales Duárez → aeropuerto, en tres tramos sin pausa:
  1. **Peajes:** casetas que cobran aunque no haya obra. Pagar descuenta soles; romper la barrera suma una estrella de búsqueda.
  2. **Túnel:** oscuro y estrecho, el eco distorsiona el claxon, con todos los enjambres mezclados.
  3. **Pista del aeropuerto:** un avión carguero de una aerolínea ficticia rueda con la rampa trasera abierta. Hay que acelerar a fondo, esquivar carritos de equipaje y patrulleros y alinearse con la rampa antes del despegue; el turbo es clave. Si fallas, la rampa se cierra y reintentas.
- **Cierre:** el Tico dentro del avión, Lima alejándose por la ventanilla, y el cartel "Deuda saldada... por ahora".

## 6. Esfuerzo por bloque

Tamaños relativos, medidos contra lo ya hecho. Como referencia, el Hito 2 (portar San Isidro completo con prueba de paridad) es **L**.

| Bloque | Tamaño | Qué incluye | Dónde |
|---|---|---|---|
| Renombrar a La Loca del Q8 | S | Textos, JSON, nombres de archivo, ADR | Nube o local |
| Hito 3, motor común | L | Vehículos declarativos, enjambres, obstáculos base, motos Delivery, guía para etapas nuevas | **Local** |
| Hito 4, Miraflores | M | Etapa tutorial, paisaje, jefe de serenazgo, jefe más declarativo | Nube |
| Hito 5, taller y progresión | L | Escena Garage, soles, mejoras, guardado v2, selector y desbloqueo de etapas | **Local** |
| Centro | M | Paisaje, marchas como muro móvil, Rochabús | Nube |
| Javier Prado | M | Obras y cráteres, semáforos, Combi Asesina | Nube |
| Gamarra | M | Cables que castigan acelerar, rollos de tela, camión | Nube |
| Callao | M | Contenedores que caen, tráiler | Nube |
| Vía Expresa | L | Saltos y rampas (motor), bus articulado | Nube |
| Panamericana | L | Clima, nivel de búsqueda (motor), escuadrón | Nube |
| Costa Verde (final) | L | Neblina, curvas, desprendimientos, jefe sorpresa | Local para el diseño, nube para construirla |
| Línea Amarilla (secreta) | XL | Tres tramos, peajes, túnel, escena del avión, desbloqueo | Local para el diseño, nube por tramos |

## 7. Orden y paralelismo

1. **Primero, en local:** el Hito 3 (motor común) y el renombre. Definen las piezas y la guía que usan todas las demás etapas.
2. **Después, en la nube y en paralelo:** las etapas que solo usan piezas ya existentes, cada una en su sesión, su rama y su PR: Miraflores, Centro, Javier Prado, Gamarra y Callao.
3. **En la nube, de a una:** las etapas que agregan piezas al motor (Vía Expresa con saltos, Panamericana con clima y búsqueda). Si dos sesiones tocaran el motor a la vez, chocarían.
4. **En local:** el Hito 5, porque está lleno de decisiones de diseño (economía, precios de mejoras), y el diseño de la etapa final y la secreta.
5. **Siempre:** cada PR se publica al fusionarse, y el dueño lo prueba en su teléfono.

## 8. Eficiencia de tokens

- **Una guía corta en el repo** (`docs/guia-etapas.md`, que se escribe en el Hito 3): pasos para crear una etapa, convenciones, cómo probar y metas de balance. Cada sesión en la nube lee esa guía y el ADR que le toca, no toda la historia del proyecto.
- **Encargos cerrados:** cada sesión recibe una sola etapa con criterio de cierre explícito (tests, `npm run balance` dentro de la meta, build) y termina en un PR. Menos idas y vueltas, menos tokens.
- **Modelo según la tarea:** el más capaz para piezas del motor y jefes con fases nuevas; uno más liviano para paisajes, textos, datos del JSON y el renombre.
- **Verificar con tests y simulación, no con capturas:** cada captura de pantalla cuesta bastante. Basta con la simulación sin pantalla y los tests, más una o dos capturas por etapa.
- **No releer lo que no cambia:** el prototipo y las etapas terminadas no se vuelven a leer completos; se consulta lo puntual.
- **Comentarios del dueño agrupados por etapa:** probar una etapa completa y mandar todas las observaciones juntas, en vez de una por una.
