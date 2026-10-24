# Plan de etapas y de desarrollo

**Estado:** propuesta del 23 de octubre de 2026 (el resumen del proyecto está en `docs/estado.md`), para revisión del dueño del producto y del proyecto advisory de claude.ai. Actualizada el mismo día: el dueño decidió no usar sesiones en la nube; todo se construye en local, una etapa a la vez. Amplía `concepto.md`, no lo reemplaza: si algo choca, manda `concepto.md` hasta que se actualice.

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

| Bloque | Tamaño | Qué incluye | Estado |
|---|---|---|---|
| Renombrar a La Loca del Q8 | S | Textos, JSON, nombres de archivo | Hecho (ADR 0014) |
| Hito 3, motor común | L | Vehículos declarativos, enjambres, obstáculos, guía de etapas | Hecho (ADR 0014) |
| Hito 4, Miraflores | M | Etapa tutorial, jefe genérico por fases, selector mínimo de etapa | Hecho (ADR 0015) |
| Hito 5, taller y progresión | L | Escena Garage, soles, mejoras, parada entre etapas | Hecho (ADR 0017 y 0018) |
| Centro | M | Paisaje, marchas como muro móvil, Rochabús | Hecho (ADR 0016) |
| Javier Prado | M | Obras y cráteres, semáforos, Combi Asesina | Hecho (ADR 0021) |
| Gamarra | M | Cables que castigan acelerar, rollos de tela, camión | Hecho (ADR 0022) |
| Callao | M | Contenedores que caen, tráiler | Pendiente |
| Vía Expresa | L | Saltos y rampas (motor), bus articulado | Pendiente |
| Panamericana | L | Clima, nivel de búsqueda (motor), escuadrón | Pendiente |
| Costa Verde (final) | L | Neblina, curvas, desprendimientos, jefe sorpresa | Pendiente |
| Línea Amarilla (secreta) | XL | Tres tramos, peajes, túnel, escena del avión, desbloqueo | Pendiente |

## 7. Orden

Todo en local, una etapa a la vez, cada una en su rama y su PR, probada por el dueño en su teléfono antes de la siguiente. Primero las etapas que solo usan piezas existentes; las que agregan piezas al motor (Vía Expresa, Panamericana) van cuando su pieza haga falta. El Hito 5 puede ir antes o después de las etapas medianas, según prefiera el dueño.

## 8. Eficiencia de tokens

- **`docs/guia-etapas.md`** resume cómo construir una etapa: se lee eso en vez de toda la historia del proyecto.
- **Encargos cerrados** con criterio de cierre (tests, `ETAPA=<distrito> npm run balance` dentro de la meta y build), para evitar idas y vueltas.
- **Verificar con tests y simulación, no con capturas:** una o dos capturas por etapa bastan.
- **No releer lo que no cambia:** el prototipo y las etapas terminadas se consultan solo en lo puntual.
- **Comentarios del dueño agrupados por etapa.**
