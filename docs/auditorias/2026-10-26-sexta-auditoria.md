# Limargeddon · Sexta auditoría

26 de octubre de 2026. Versión `7a749a36ef55303627e960150d0c3cb5c6a86d92`, PR #40 y #41. Comparación con la quinta auditoría, `1a540eb`.

## 1. Resumen ejecutivo

- El balance y la economía se conservan en las muestras repetidas: 7.830 peleas de balance y 180 campañas completas.
- La flecha de salida del enrosque queda alineada en 9.000 estados dirigidos y las correas del carguero están en una capa superior al Tico. Q01 y Q02 quedan cerrados al nivel de código y sondas geométricas.
- Los paisajes, obstáculos y proyectiles amplían la coherencia del arte nivel B sin exigir cambios en las reglas de las etapas.
- El nuevo registro de fluidez recibe tiempos suavizados: puede ocultar tirones y no sirve todavía para aprobar los objetivos de rendimiento del piloto.
- La vista de colisiones es una ayuda aproximada, pero no representa todas las formas ni su proyección exacta. Puede inducir a diagnosticar mal un choque.
- Falta validar la legibilidad y el rendimiento en teléfonos reales. Las simulaciones sin dibujo no resuelven esa incertidumbre.
- Recomiendo corregir los dos instrumentos de diagnóstico, conservar el balance y seguir con el piloto de Costa Verde antes de ampliar la producción de arte.

### Alcance y límites

184 pruebas del proyecto aprobadas y compilación aprobada. Balance completo, 261 filas × 30 semillas = 7.830 peleas. Campañas oficiales, 30 semillas × dos modos × tres políticas = 180 campañas, todas completan las diez etapas. Las 180 campañas instrumentadas repiten estas combinaciones: sus 2.134 peleas no son una muestra independiente adicional.

Se revisaron las diferencias respecto a `1a540eb`, el estado del proyecto, las ADR 0044–0045 y el código de dibujo, medición y colisiones, conservando los criterios de diseño de las auditorías anteriores. Se consultó además el código instalado de Phaser 3.90.0 para verificar qué intervalo recibe la escena.

Se inspeccionó visualmente la galería pública de obstáculos y proyectiles, y se observó una partida de Costa Verde en modo prueba, sin conducir ni atacar, hasta su pantalla de derrota. Esta observación no se usa para estimar dificultad. Las capturas prueban esos estados visibles, no una campaña humana completa ni la correspondencia exacta del despliegue con el SHA auditado. No se midieron FPS reales, latencia táctil ni preferencias humanas. La revisión de las correas usa objetos de escena sustitutos, no una captura del cierre real.

No se modificó código de producción, no se hicieron commits ni PR. Se usó un checkout aislado con las dependencias existentes de la misma versión; el único archivo no seguido en él es el enlace local a esas dependencias. Todos los experimentos están fuera del checkout.

### Seguimiento

| Hallazgo anterior | Estado actual | Evidencia |
|---|---|---|
| Q01 · Flecha desplazada sobre la curva | Corregido | Error máximo de anclaje <0,000001 px lógicos en 9.000 estados; dirección coincidente con el vector proyectado de un paso lógico. |
| Q02 · Correas bajo el Tico | Corregido en composición | Las dos correas tienen profundidad 30,5; la imagen del Tico, 30. |
| R01–R02 · Memoria e interrupción de ayudas | Se mantiene la corrección | Los resultados de ayudas y semáforos coinciden con la quinta auditoría. |
| R03–R04 · Regreso a etapas y medallas por nombre | Sin cambios relevantes en este diff | No se reabren. |
| Colisiones de autos inclinados del anillo | Ya reconocido en ADR 0045 | No se presenta como descubrimiento nuevo ni se propone cambiar el daño sin pruebas humanas. |

## 2. Circuito de acción y recompensa

| Escala | Recompensa o señal | Evaluación actual |
|---|---|---|
| Inmediata | Golpe, sonido, destello y cifra de daño | Sin cambios de reglas; sigue siendo esencial leer el impacto aunque la carrocería cambie en escalones. |
| Segundos | Conos, racha, aceite, claxon, bonus y protección | Los sprites nuevos refuerzan identidad. Debe comprobarse que proyectiles pequeños y avisos destaquen sobre el paisaje. |
| Fases | Aviso del jefe, esquive y ventana de ataque | La salida corregida elimina una contradicción geométrica; no demuestra por sí sola que se comprenda a tiempo. |
| Pelea | Cobro, medallas, puntaje y cierre | Mismo incentivo al dominio; las correas mejoran la coherencia del remate. |
| Campaña | Taller, distrito siguiente y regreso por medallas | La economía y sus diferencias entre políticas se conservan. No hace falta aumentar premios por mejorar los gráficos. |

Tasas del primer intento de las 30 campañas con compra barata, incluyendo derrotas. Eventos por minuto simulado, no lecturas o estímulos percibidos. Daño = textos agrupados al jefe, racha = anuncios destacados, dinero = textos +S/, bonus = recogidas.

| Etapa | Modo | Daño/min | Racha/min | Dinero/min | Bonus/min | Máx. textos simultáneos |
|---|---|---:|---:|---:|---:|---:|
| miraflores | toque | 42.9 | 4.2 | 4.9 | 3.7 | 13 |
| costa-verde | toque | 63.7 | 5.2 | 2.7 | 3.1 | 10 |
| linea-amarilla | toque | 0.0 | 0.0 | 10.5 | 5.5 | 4 |
| miraflores | acelerar | 44.1 | 5.5 | 4.6 | 3.8 | 12 |
| costa-verde | acelerar | 54.8 | 4.3 | 3.2 | 3.0 | 14 |
| linea-amarilla | acelerar | 0.0 | 0.0 | 11.0 | 5.4 | 4 |


Las tasas coinciden con la quinta auditoría. No se midió el intervalo máximo sin estímulo. En la ruta, cero daño al jefe es intencional: el avance, la marea y el embarque ocupan ese lugar. Los gráficos añaden información simultánea, por lo que conviene medir reconocimiento antes de aumentar efectos o frecuencias de recompensa.

## 3. Hallazgos nuevos

S = cambio acotado, M = ajuste de varias piezas con validación, L = trabajo de producción amplio.

| ID | Evidencia | Hallazgo | Principio | Severidad | Propuesta concreta | Tipo | Esfuerzo | Cómo medir |
|---|---|---|---|---|---|---|---|---|
| S01 | [src/scenes/Stage.ts:100](https://github.com/tonmaiveD/limargeddon/blob/7a749a36ef55303627e960150d0c3cb5c6a86d92/src/scenes/Stage.ts#L100), [src/core/frames.ts:22](https://github.com/tonmaiveD/limargeddon/blob/7a749a36ef55303627e960150d0c3cb5c6a86d92/src/core/frames.ts#L22) y `diagnosticos.json` | `meter.add(delta)` recibe el intervalo suavizado de Phaser. Diez pausas sintéticas de 300 ms desaparecen como picos y quedan en 16,7 ms. | Medir la experiencia real antes de aprobar rendimiento | Media, prioritaria para el piloto | Alimentar el medidor con `this.game.loop.rawDelta` o diferencias de marcas temporales sin suavizar. Conservar el delta de simulación. Excluir pausas por estado explícito y registrar bloqueos largos en primer plano. Unificar el umbral publicado de 33,3 ms con el contador, hoy >33,4. | Motor / diagnóstico | S | Secuencias conocidas de 40, 120 y 300 ms deben conservar máximo, p99 y número de picos. Luego medir dos teléfonos reales. |
| S02 | [src/core/hitboxes.ts:19](https://github.com/tonmaiveD/limargeddon/blob/7a749a36ef55303627e960150d0c3cb5c6a86d92/src/core/hitboxes.ts#L19), [src/core/hitboxes.ts:44](https://github.com/tonmaiveD/limargeddon/blob/7a749a36ef55303627e960150d0c3cb5c6a86d92/src/core/hitboxes.ts#L44), [src/core/world.ts:269](https://github.com/tonmaiveD/limargeddon/blob/7a749a36ef55303627e960150d0c3cb5c6a86d92/src/core/world.ts#L269), [src/core/world.ts:292](https://github.com/tonmaiveD/limargeddon/blob/7a749a36ef55303627e960150d0c3cb5c6a86d92/src/core/world.ts#L292) y `diagnosticos.json` | El contorno del Tico es siempre una caja, aunque frente a proyectiles y bonus se usan círculos de radios distintos. En curva, las esquinas también se giran rígidamente en vez de proyectar el área lógica punto a punto. | Diagnóstico fiel a la regla de contacto | Media para validar arte; baja para el juego normal | Mostrar por separado caja de contacto, círculo de daño de radio `p.w/2` y de recogida de radio `p.h/2`; proyectar sus contornos según la transformación del mundo. Diferenciar zonas activas por estado, incluyendo barreras y salto. | Motor / UI de diagnóstico | M | Estados dirigidos a ambos lados del umbral deben concordar con la simulación; error de proyección <1 px lógico. |


S01 no demuestra que los gráficos provoquen pausas de 300 ms. Demuestra que, si ocurren, el registro puede ocultarlas. S02 no modifica las colisiones existentes: afecta la confianza en una herramienta recién añadida. No se detectaron nuevos bloqueos de severidad alta en el alcance ejecutado.

No se convierte en hallazgo nuevo la diferencia ya documentada entre autos girados y cajas de choque derechas. Aquí se aporta otra evidencia: la vista no representa las formas usadas para proyectiles/bonus y ni siquiera la proyección completa de la caja lógica del jugador.

## 4. Resultados y experimentos

### Base y comparación

Se ejecutaron `npm test`, `npm run build`, `CAMPANAS=30 npm run campana` y `ETAPA=<id> npm run balance` para los once grupos, incluyendo prototipo. Las 261 filas de balance coinciden con la quinta auditoría. Los 1.800 registros instrumentados de etapa y sus 2.134 peleas son idénticos en todos los campos. Cero excepciones en las ejecuciones finalizadas.

Semillas de balance `s*97`, s=1..30. Campaña `c*1000 + etapa*37 + intento*7`, c=1..30. Paso 1/60 s y límite de 300 s por pelea. Hasta seis intentos por etapa. El informe de campaña usa bot medio en Normal. Cada celda es victorias al primer intento / 30 y mediana del intento victorioso en segundos, siguiendo el cálculo del comando oficial.

| Etapa | Barata toque | Barata acelerar | Ataque toque | Ataque acelerar | Aguante toque | Aguante acelerar |
|---|---|---|---|---|---|---|
| miraflores | 29/30 · 81 s | 30/30 · 68 s | 29/30 · 81 s | 30/30 · 68 s | 29/30 · 81 s | 30/30 · 68 s |
| san-isidro | 27/30 · 71 s | 26/30 · 65 s | 27/30 · 70 s | 27/30 · 72 s | 27/30 · 70 s | 27/30 · 66 s |
| centro | 27/30 · 80 s | 24/30 · 72 s | 25/30 · 76 s | 25/30 · 70 s | 30/30 · 92 s | 28/30 · 84 s |
| javier-prado | 22/30 · 81 s | 21/30 · 71 s | 21/30 · 69 s | 23/30 · 61 s | 27/30 · 88 s | 30/30 · 88 s |
| gamarra | 20/30 · 79 s | 25/30 · 71 s | 24/30 · 72 s | 24/30 · 68 s | 26/30 · 105 s | 28/30 · 94 s |
| callao | 23/30 · 81 s | 19/30 · 79 s | 20/30 · 63 s | 22/30 · 56 s | 25/30 · 110 s | 26/30 · 88 s |
| via-expresa | 25/30 · 88 s | 26/30 · 98 s | 26/30 · 80 s | 22/30 · 71 s | 30/30 · 108 s | 24/30 · 108 s |
| panamericana | 24/30 · 80 s | 22/30 · 62 s | 26/30 · 72 s | 29/30 · 61 s | 29/30 · 105 s | 29/30 · 98 s |
| costa-verde | 23/30 · 75 s | 15/30 · 74 s | 24/30 · 88 s | 24/30 · 76 s | 26/30 · 126 s | 26/30 · 100 s |
| linea-amarilla | 30/30 · 83 s | 30/30 · 83 s | 30/30 · 82 s | 30/30 · 84 s | 30/30 · 85 s | 30/30 · 83 s |

**Lectura de balance.** Costa Verde con compra barata conserva 23/30 victorias iniciales por toque y 15/30 acelerando. La asimetría persiste, pero no es una regresión gráfica ni una razón nueva para ajustar daño. Con aguante por toque se mantienen 26/30 y 126 s frente a 23/30 y 75 s comprando barato. El taller sigue cambiando supervivencia y duración. El bot no ve los gráficos ni aprende de los textos; estas comparaciones no predicen por sí solas el efecto de una señal más clara en personas.

### Experimento 1 · Correcciones del enrosque y del cierre

Hipótesis: la nueva implementación alinea la señal con la salida y coloca ambas correas sobre el auto. Se generaron 30 anillos con la IA real, semillas 1–30, y se barrió scroll 0–5.980 en pasos de 20. Se ejecutó `drawCoil` con `Gfx` real y una escena sustituta que registra polígonos. A diferencia de la prueba anterior, se mide el dibujo corregido real.

| Medida | Quinta auditoría | Sexta auditoría |
|---|---:|---:|
| Máximo error de anclaje, 9.000 casos | 18,60 px | <0,000001 px |
| Dirección frente al vector proyectado de un paso | No certificada | Error <0,000001 rad |
| Capa correas / Tico | 30 / 30, correas debajo por orden | 30,5 / 30 |

Conclusión: cerrar Q01 y Q02 en estos alcances. La orientación se compara con el vector proyectado local de un paso, no con una trayectoria humana completa. Las 9.000 muestras son un barrido dirigido, no 9.000 peleas ni una distribución de uso real.

### Experimento 2 · Registro de tirones

Hipótesis: medir el `delta` de la escena conserva los picos del tiempo entre cuadros. Se extrajo y ejecutó la función `smoothDelta` del Phaser 3.90.0 instalado, usando su historial predeterminado de 10 muestras, límite de 200 ms y foco activo tras calentamiento. Se generaron 600 intervalos a 16,67 ms, sustituyendo uno cada 60 por un pico. Son tres secuencias sintéticas independientes, diez picos por secuencia. También se alimentó el `FrameMeter` del juego con los intervalos originales y con los filtrados.

| Pico original | p99 original | p99 tras suavizado | Máximo tras suavizado | Intervalos >33,4 ms, original → filtrado |
|---:|---:|---:|---:|---:|
| 40 ms | 40 ms | 19 ms | 19 ms | 10 → 0 |
| 120 ms | 120 ms | 27 ms | 27 ms | 10 → 0 |
| 300 ms | 300 ms | 16,7 ms | 16,7 ms | 10 → 0 |

Conclusión: hipótesis refutada. No basta con que la función de percentiles esté bien probada si recibe una señal filtrada. Con picos de 120 ms también se altera el recuento >20 ms, de 10 a 100, al repartir cada pico entre diez muestras. No se propone desactivar el suavizado del juego: solo medir el intervalo original por separado.

Fuente técnica de versión fija: [TimeStep de Phaser 3.90.0](https://github.com/phaserjs/phaser/blob/v3.90.0/src/core/TimeStep.js). Su paso conserva `rawDelta`, suaviza `delta` y pasa este último al juego. La configuración de Limargeddon no cambia el suavizado predeterminado. La documentación web actual de Phaser corresponde a otra versión; la prueba se apoya en el código instalado 3.90.0.

### Experimento 3 · Exactitud de la vista de colisiones

Hipótesis: el contorno dibujado representa la región usada por la simulación. Se comprobó el dibujo real de una caja del Tico en `(180,500)` para 300 valores de scroll de Costa Verde. La referencia son las esquinas de su caja lógica proyectadas con `roadWarp`.

- Error máximo entre esquina proyectada y contorno rígido: **6,94 px lógicos**. Es un desacuerdo entre representaciones, no una nueva fuerza o daño.
- Tico de 28×48 y proyectil de radio 9 a 30 unidades verticales: el círculo dibujado del proyectil invade la caja del Tico, pero la regla real no golpea, pues compara 30 con 9+14=23.
- Bonus de radio 9 a 30 unidades horizontales: su círculo no toca la caja dibujada, pero la regla real sí recoge, pues compara 30 con 9+24=33.

Los dos últimos son casos aritméticos dirigidos de las condiciones de `world.ts`, no partidas ni mediciones de frecuencia. Conclusión: la vista actual sirve para localizar entidades, pero no para aprobar correspondencia exacta entre arte y contacto. Conviene añadir formas por tipo de interacción y mostrar qué condición está activa.

### Experimento 4 · Continuidad del combate y de las ayudas

Hipótesis: la renovación visual y sus herramientas no alteran combate, economía ni enseñanza simulada. Se repitieron las campañas instrumentadas, 240 variantes del anillo, 240 variantes de ruta, 600 primeros intentos para ayudas y 180 variantes de semáforos. Los JSON de experimentos y de ayudas/semáforos coinciden íntegramente con la quinta auditoría.

Sin enrosque, Costa Verde mantiene 26/30 por toque y 20/30 acelerando, frente a 23/30 y 15/30 actuales. Soltar el acelerador 0, 0,5, 1 o 2 s de cada ciclo de 5 s desde el tercer tramo de la ruta mantiene 30/30 victorias por modo. Las sondas de reglas anteriores también se ejecutaron. No se reabren como novedades problemas ya resueltos.

Conclusión: continuidad respaldada para el motor sin renderizado. No demuestra igualdad de experiencia, rendimiento, consumo de memoria ni comportamiento con entradas humanas.

## 5. Mejoras rápidas

1. **Corregir la fuente del medidor**, `src/scenes/Stage.ts:103`. Medir `this.game.loop.rawDelta` y mantener el delta de simulación. Añadir las tres secuencias del experimento 2 como regresión de la integración.
2. **Unificar umbrales**, `src/core/frames.ts:41`. Usar una constante compartida de 33,3 ms si ese será el criterio de aceptación y nombrar explícitamente la unidad. El cambio actual de >33,4 es pequeño, pero hace inconsistente la especificación.
3. **Etiquetar temporalmente la vista**, `src/core/hitboxes.ts`. Indicar que muestra cajas de entidades y formas parciales hasta completar S02. No presentarla como prueba exacta de colisión.
4. **Actualizar el alcance del piloto**, `docs/estado.md`. El nivel B de paisaje y objetos ya está implementado; el piloto siguiente debe demostrar una mejora perceptible sobre esa base actual. La línea que dice PR #1 a #40 está atrasada frente al #41 auditado.

No recomiendo cambiar vida, multiplicador de daño, duración del aviso, recompensa ni fórmula de puntaje en esta pasada. Completar S02 puede exceder una tarde y debe planificarse aparte.

## 6. Apuestas grandes

1. **Piloto de Costa Verde sobre el nivel B actual.** Comparar identidad del entorno, lectura de peligros, impactos y reconocimiento de mejoras. El relieve automático de todo el juego no sustituye la dirección de arte propia propuesta en la especificación. Riesgo: invertir en detalle que no se distingue a escala de teléfono. Validar con 6–8 personas, alternando el orden de versiones, y reportar conteos junto con porcentajes.
2. **Validación móvil con el medidor corregido.** Dos teléfonos de capacidades diferentes, al menos diez minutos por versión y dispositivo, separando carga inicial, primera aparición de elementos y juego sostenido. Mantener como objetivos propuestos p95 ≤20 ms y p99 ≤33,3 ms, no como resultados logrados. Riesgo: aprobar por métricas suavizadas o por una ventana pequeña. Además del resumen, registrar número y duración de bloqueos largos en primer plano.
3. **Diagnóstico compartido con las reglas.** Reutilizar las funciones o descriptores que determinan contacto para dibujar cajas y círculos por interacción. Riesgo: acabar reescribiendo la física para acomodarla a una herramienta. Primero corregir la representación y decidir cambios de jugabilidad con evidencia aparte.

La estimación anterior de 25–45 jornadas era de producción de la mejora recomendada, no una medida del trabajo pendiente exacto después de estos PR. Conviene reestimar tras inventariar qué piezas del nivel B se conservan y cerrar el piloto. No descontaría días automáticamente por la cantidad de archivos nuevos.

## 7. Puntaje y ranking

Mantener la fórmula versión 2 y el ranking local. Normal suma hasta 10.000: 4.000 por victoria, 2.000 por tiempo, 1.500 por daño efectivo derecho, 1.000 por racha, 1.000 por limpieza y 500 por objetivo. La ruta sustituye derecha por intentos y racha por marea. Fácil ×0,7, Normal ×1 y Difícil ×1,25.

No puntuar detalle gráfico, FPS ni cantidad bruta de partidas. Conservar los mejores resultados por etapa y su contexto de equipo y modo. Las medallas sin soles extra y el regreso voluntario a etapas siguen ofreciendo dominio sin castigo por ausentarse. No hay motivo nuevo para incorporar plazos, rachas diarias o recompensas por asistencia. Un ranking compartido continúa siendo una decisión separada de identidad, validación de puntajes y moderación.

## 8. Preguntas que requieren personas

- ¿La salida corregida se identifica antes del cierre del anillo, especialmente con garúa y tráfico?
- ¿Los proyectiles pequeños se distinguen del ruido visual del nuevo asfalto y los paisajes?
- ¿Qué impactos parecen injustos al comparar el juego con las formas de contacto correctas?
- ¿Las cuatro etapas de daño visual comunican suficiente deterioro y se reconocen las mejoras del taller?
- ¿El relieve nuevo mejora la percepción en un teléfono o solo al ampliar una captura?
- ¿En qué dispositivos y estados concretos aparecen tirones una vez corregido el medidor?
- ¿El deseo de repetir nace de dominar una etapa o de no entender la causa de una derrota?

### Archivos de entrega

`REPRODUCIR.md` fija versión, comandos, semillas y alcance. `evidencia/` contiene las salidas completas, JSON y capturas públicas. `comparacion.json` documenta la igualdad con la quinta auditoría. Los scripts son sondas de auditoría: que terminen correctamente significa que produjeron la medición, no que todos los comportamientos medidos sean correctos. Los 184 tests del proyecto sí son pruebas de aserción del repositorio.
