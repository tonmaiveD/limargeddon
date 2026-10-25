# Limargeddon · Cuarta auditoría

25 de octubre de 2026. Revisión del código en `5682fc0d210a1033c92ae56938cc1f5a91afbf6e`, posterior a los bloques A, B, C y D. Comparación con la auditoría sobre `fb996cd`.

## 1. Resumen ejecutivo

- Las correcciones principales funcionan: ruta sin bloqueo de Socio de Combi, intentos limitados y exposición segura de la cabeza.
- El puntaje cuenta daño efectivo, castiga barreras rotas y conserva el contexto del récord.
- Medallas permanentes, música por distrito y cierres saltables refuerzan identidad y dominio sin presión por volver.
- El tutorial se da por completado aunque queden instrucciones sin mostrar, incluso al cambiar de modo de disparo.
- Algunas ayudas desaparecen antes de poder leerse porque una urgencia las sustituye y las consume definitivamente.
- Las medallas invitan a repetir etapas, pero el menú normal no permite regresar libremente a las ya superadas.
- No encontré nuevos bloqueos del motor en las pruebas ejecutadas. Priorizaría esas tres fricciones antes de retocar daño o vida de los jefes.

### Alcance y límites

174 pruebas del proyecto aprobadas y compilación aprobada. Balance completo dividido por etapa, 261 filas de 30 semillas, **7.830 peleas**. Campaña oficial de **30 semillas × 2 modos × 3 políticas = 180 campañas**, todas completas. Instrumentación independiente sobre esas mismas 180 combinaciones, con 2.134 peleas y cero excepciones. No son otras 180 muestras independientes. Además, 240 variantes del enrosque, 240 de la ruta, 600 primeras peleas instrumentadas para ayudas y 180 comparaciones de semáforos.

Consulté la [versión publicada](https://tonmaived.github.io/limargeddon/?prueba) en navegador y comprobé menú, medallas y texto de semáforos. La captura está incluida. No hice una prueba táctil con personas ni una evaluación auditiva. No certifico que el despliegue corresponda exactamente al SHA auditado solo por su aspecto. Los resultados cuantitativos corresponden al código local fijado a ese SHA.

Se leyeron estado, concepto, plan de etapas, guía, reglas y decisiones pertinentes, especialmente ADR 0035–0038. No se modificó el repositorio ni se crearon commits o PR. Los archivos de experimentación están fuera del checkout. Los tiempos son de simulación, sin pausas humanas ni duración de animaciones. No extrapolo automáticamente el factor histórico 1,6 a jugadores actuales, ni infiero dopamina o retención a partir de bots.

### Seguimiento de los hallazgos anteriores

| Anterior | Estado verificado |
|---|---|
| N01 · Socio de Combi en la ruta | Corregido. Sonda aislada supera 12 s sin excepción y las campañas con política de ataque completan la ruta. |
| N02 · Avión e intentos negativos | Corregido. Secuencia 2, 1, 0; al tercero hay derrota, vida cero y no sigue bajando. |
| N03 · Cabeza expuesta | Corregido. Contacto conserva 100 de vida y el claxon no aturde durante exposición. |
| N04 · Anillo sin autos | Corregido. Destruir los cinco segmentos mediante impactos lleva a `release`, con el jefe todavía vivo. |
| N05 · Política del taller en simulación | Corregido. El comando oficial incluye barata, ataque y aguante y distingue errores de derrotas. |
| N06 · Barrera e infracción | Corregido. Una barrera rota suma una falta y deja limpieza en 2/3. |
| N07 · Sobredaño | Corregido. Un último golpe de 24 sobre 1 de vida cuenta 1 en daño efectivo. Se preserva el contador antiguo para paridad. |
| N08 · Resultados de ruta | Corregidos intentos, marea, último tramo y peajes. Persiste en el menú el texto genérico sobre conos y punto ciego de la ruta, residual ya señalado, no hallazgo nuevo. |
| N09 · Contexto del récord | Implementado en guardado y resultados. Incluye versión, equipo, modo, dificultad, fecha, build y partes. Registro de pelea añade puntaje y daño por fuente. |

Las sondas son estados dirigidos para aislar reglas. No son estimaciones de frecuencia humana. Detalle en `evidencia/sondas.json`.

## 2. Mapa del circuito de recompensa

| Escala | Acción y respuesta | Ritmo y lectura |
|---|---|---|
| Fracción de segundo | Cono, sonido, destello y número de daño; racha aumenta daño hasta +30% | Números agrupados en ventanas de 120 ms. Mantener esta reducción de ruido. |
| Segundos | Aceite abre una ventana; claxon despeja; soltar acelera el regreso a posición segura | Son herramientas de control además de daño. Las instrucciones deben sobrevivir a una interrupción. |
| Segundos | Bonus, dinero, protección consumida de un objeto de victoria | Sorpresa gratuita y comprensible; no hay necesidad de añadir premios aleatorios por regresar. |
| Fase | Señal del ataque, esquive, castigo al jefe | La cabeza expuesta ahora cumple su promesa. El enrosque aún requiere validación perceptiva en teléfono. |
| Pelea | Cobro, componentes de puntaje, medalla, récord y cierre | Los cierres de 4,5–5 s pueden saltarse. La medalla no da dinero ni poder, evitando obligación de completarla. |
| Campaña | Taller, decisión de ataque o aguante, objeto de victoria y nuevo distrito | Las políticas sí producen experiencias distintas. Falta acceso de regreso a las etapas para perseguir objetivos opcionales. |

### Frecuencia observada

Primer intento de 30 campañas por modo con compra barata. Tasas = suma de eventos / suma de minutos, incluyendo derrotas. Daño cuenta objetos de texto agrupado al jefe, no proyectiles; racha cuenta anuncios destacados, no todos los aciertos. Dinero cuenta textos `+S/`; bonus cuenta recogidas. El máximo de textos es un indicador de carga, no una prueba de ilegibilidad.

| Etapa | Modo | Daño/min | Racha/min | Dinero/min | Bonus/min | Máximo de textos simultáneos |
|---|---|---:|---:|---:|---:|---:|
| miraflores | toque | 42.9 | 4.2 | 4.9 | 3.7 | 13 |
| javier-prado | toque | 53.5 | 5.7 | 5.6 | 3.5 | 12 |
| costa-verde | toque | 63.7 | 5.2 | 2.7 | 3.1 | 10 |
| linea-amarilla | toque | 0.0 | 0.0 | 10.5 | 5.5 | 4 |
| miraflores | acelerar | 44.1 | 5.5 | 4.6 | 3.8 | 12 |
| javier-prado | acelerar | 51.8 | 6.3 | 5.9 | 3.4 | 11 |
| costa-verde | acelerar | 54.8 | 4.3 | 3.2 | 3.0 | 14 |
| linea-amarilla | acelerar | 0.0 | 0.0 | 11.0 | 5.4 | 4 |

La ruta tiene cero impactos al jefe por diseño. Su respuesta está en el avance, tráfico, peajes, marea y embarque; no conviene rellenarla con rachas ficticias. Las tasas medias no descartan intervalos sin respuesta, y no se midió aquí el máximo intervalo entre premios. El hueco comprobado es educativo: una explicación puede durar 0,25–0,75 s y no regresar.

## 3. Hallazgos nuevos

La severidad se refiere al impacto de diseño y uso, no a seguridad. No clasifico pendientes humanos ni decisiones aceptadas como errores nuevos.

| ID | Evidencia | Hallazgo | Principio | Severidad | Propuesta concreta | Tipo | Esfuerzo | Medición |
|---|---|---|---|---|---|---|---|---|
| R01 | Código [src/scenes/Stage.ts:106](https://github.com/tonmaiveD/limargeddon/blob/5682fc0d210a1033c92ae56938cc1f5a91afbf6e/src/scenes/Stage.ts#L106), [src/core/save.ts:192](https://github.com/tonmaiveD/limargeddon/blob/5682fc0d210a1033c92ae56938cc1f5a91afbf6e/src/core/save.ts#L192) y sonda `nuevos.json` | Finalizar cualquier primera pelea marca toda la etapa como enseñada. Incluye ayudas nunca vistas, otro modo y modo prueba. En Costa Verde, 25/60 primeros intentos no mostraron la ayuda del anillo; 10 de esos casos terminaron perdiendo. | Aprendizaje progresivo y recuperación tras el error | Media | Persistir por identificador de ayuda y modo solo tras ≥2,4 s de exposición acumulada. No consumir aprendizaje normal en modo prueba. Añadir «Ver ayudas» sin reiniciar la campaña. | Motor + UI | M | Al reintentar, sigue disponible toda ayuda no vista; al cambiar de modo aparece su instrucción. |
| R02 | [src/core/hints.ts:59](https://github.com/tonmaiveD/limargeddon/blob/5682fc0d210a1033c92ae56938cc1f5a91afbf6e/src/core/hints.ts#L59), simulación de 60 primeras partidas de Miraflores y sonda de dos urgencias | Una ayuda urgente sustituye la actual y ambas quedan consumidas. 24/60 partidas tuvieron alguna ayuda <1 s; 18/60 abreviaron «Suelta el acelerador» a 0,75 s. Dos urgencias simultáneas pueden dejar la primera visible un solo cuadro. | Legibilidad y atención limitada | Media | Conservar el progreso de lectura y reencolar la explicación interrumpida hasta completar 2,4 s. Para peligros expirados, mostrar después la regla general, no una orden tardía. Priorizar el peligro activo más próximo. | Motor | M | Ninguna explicación esencial queda consumida con <2,4 s; ningún aviso de peligro reaparece fuera de contexto. |
| R03 | [src/scenes/Menu.ts:24](https://github.com/tonmaiveD/limargeddon/blob/5682fc0d210a1033c92ae56938cc1f5a91afbf6e/src/scenes/Menu.ts#L24), [src/scenes/Menu.ts:43](https://github.com/tonmaiveD/limargeddon/blob/5682fc0d210a1033c92ae56938cc1f5a91afbf6e/src/scenes/Menu.ts#L43), [src/stages/index.ts:65](https://github.com/tonmaiveD/limargeddon/blob/5682fc0d210a1033c92ae56938cc1f5a91afbf6e/src/stages/index.ts#L65) | Las nuevas medallas permanentes carecen de un camino normal para volver después a una etapa anterior. «Otra vez» en resultados sirve inmediatamente, pero al salir el menú elige la más avanzada. `?prueba` no guarda medallas; empezar de nuevo borra taller y progreso. | Autonomía y dominio opcional | Media | Mostrar un selector de etapas ya desbloqueadas. Mantener bloqueadas las futuras y el pago repetido al 50%. Entrar a una anterior no altera el avance. | UI | M | Desde el final, volver a Miraflores y obtener una medalla sin borrar equipo ni usar modo prueba. |
| R04 | [src/scenes/Menu.ts:35](https://github.com/tonmaiveD/limargeddon/blob/5682fc0d210a1033c92ae56938cc1f5a91afbf6e/src/scenes/Menu.ts#L35) y [src/scenes/Menu.ts:70](https://github.com/tonmaiveD/limargeddon/blob/5682fc0d210a1033c92ae56938cc1f5a91afbf6e/src/scenes/Menu.ts#L70) | Al cambiar de nombre, el callback actualiza el rótulo del jugador pero no vuelve a dibujar sus medallas. Si dos nombres tienen medallas diferentes, el menú conserva las del anterior hasta refrescar la etapa. | Consistencia de identidad y recompensa | Baja | Tras confirmar nombre, actualizar también `menuMedals` con el nombre vigente. | UI | S | Cambiar entre dos nombres con medallas distintas actualiza las tres fichas inmediatamente. |

R03 y R04 se establecen por el flujo de código; no se presentan como recorridos táctiles completados. R03 conserva el desbloqueo consecutivo acordado, solo habilita regreso a contenido ganado. R01 cuestiona con evidencia la política de apagar todo tras la primera pelea, no la existencia de ayudas en contexto.

**Señal de balance, no defecto confirmado** · En Javier Prado, un bot sin la nueva reacción a semáforos cruza aproximadamente 11 rojos por pelea. Su cobro medio baja frente al bot que conoce la regla. Esto justifica medir comprensión y tiempo hasta la primera multa antes de bajar el precio de la sanción. La regla ya figura en el menú; no afirmo que esté oculta.

## 4. Simulaciones y experimentos

### Base y campaña

Semillas de balance `97 × s`, con `s=1..30`. Tres bots, tres dificultades y variantes de equipo declaradas por el propio script. Las 261 filas están en los once archivos `balance-*.txt`; incluye prototipo y secreta. Para campaña, semilla `1000 × c + 37 × número de etapa + 7 × intento`, `c=1..30`, máximo seis intentos por etapa, 60 pasos/s y tope 300 s.

Cada celda muestra **victorias al primer intento / 30 · mediana del intento victorioso en segundos**. Se usa la mediana superior del comando oficial para que la tabla sea directamente cotejable. Todos los grupos completan las diez etapas dentro del límite de intentos.

| Etapa | Barata toque | Barata acelerar | Ataque toque | Ataque acelerar | Aguante toque | Aguante acelerar |
|---|---|---|---|---|---|---|
| miraflores | 29/30 · 81 | 30/30 · 68 | 29/30 · 81 | 30/30 · 68 | 29/30 · 81 | 30/30 · 68 |
| san-isidro | 27/30 · 71 | 26/30 · 65 | 27/30 · 70 | 27/30 · 72 | 27/30 · 70 | 27/30 · 66 |
| centro | 27/30 · 80 | 24/30 · 72 | 25/30 · 76 | 25/30 · 70 | 30/30 · 92 | 28/30 · 84 |
| javier-prado | 22/30 · 81 | 21/30 · 71 | 21/30 · 69 | 23/30 · 61 | 27/30 · 88 | 30/30 · 88 |
| gamarra | 20/30 · 79 | 25/30 · 71 | 24/30 · 72 | 24/30 · 68 | 26/30 · 105 | 28/30 · 94 |
| callao | 23/30 · 81 | 19/30 · 79 | 20/30 · 63 | 22/30 · 56 | 25/30 · 110 | 26/30 · 88 |
| via-expresa | 25/30 · 88 | 26/30 · 98 | 26/30 · 80 | 22/30 · 71 | 30/30 · 108 | 24/30 · 108 |
| panamericana | 24/30 · 80 | 22/30 · 62 | 26/30 · 72 | 29/30 · 61 | 29/30 · 105 | 29/30 · 98 |
| costa-verde | 23/30 · 75 | 15/30 · 74 | 24/30 · 88 | 24/30 · 76 | 26/30 · 126 | 26/30 · 100 |
| linea-amarilla | 30/30 · 83 | 30/30 · 83 | 30/30 · 82 | 30/30 · 84 | 30/30 · 85 | 30/30 · 83 |

**Experimento 1 · Decisiones del taller.** Hipótesis: «aguante» compra más supervivencia a cambio de ritmo. Variante: las tres políticas, mismas semillas de campaña. En Costa Verde por toque, barata 23/30 y 75 s, ataque 24/30 y 88 s, aguante 26/30 y 126 s. El resultado confirma una compensación, pero no una mejora universal por comprar ataque. El equipo, las ganancias y las trayectorias divergen desde etapas anteriores. No atribuir causalmente toda la diferencia a una sola mejora. La necesidad de explicar aguante ya estaba reconocida en `estado.md`, no se duplica como hallazgo nuevo.

### Experimento 2 · Semáforos y aprendizaje

Hipótesis: la nueva mecánica puede castigar sobre todo la economía de quien todavía no la entiende. Equipo de llegada a Javier Prado de las 30 campañas baratas por modo. Variante A usa `semaforoBot`; B conserva luces pero omite esa reacción; C quita luces. Mismas semillas y equipo inicial. Las trayectorias y el consumo aleatorio pueden divergir. «Sin aprender» es una perturbación de bot, no un modelo validado de novato humano.

| Modo | Variante | Gana / 30 | Mediana de victorias, s | Rojos por pelea | Cobro medio por pelea, S/ |
|---|---|---:|---:|---:|---:|
| toque | actual | 22 | 81.7 | 0.47 | 789.7 |
| toque | sin-aprender | 20 | 66.5 | 11.27 | 467.3 |
| toque | sin-semaforos | 20 | 62.2 | 0.00 | 799.0 |
| acelerar | actual | 21 | 65.7 | 0.73 | 689.7 |
| acelerar | sin-aprender | 23 | 64.7 | 10.90 | 473.3 |
| acelerar | sin-semaforos | 24 | 59.2 | 0.00 | 938.7 |

El cobro incluye derrotas. Sin aprender, cae S/ 322,3 por toque y S/ 216,3 acelerando respecto de la variante actual. El número de victorias no cae consistentemente en ambos modos. Por eso no recomiendo subir vida o bajar daño para «compensar» este efecto. Primero arreglar R01–R02 y probar si las personas aprenden a soltar. Si persiste la incomprensión, ensayar una primera infracción de advertencia explícita y medirla antes de adoptarla. Los resultados de esta tabla son primeros intentos; las medianas de campaña también incluyen victorias tras reintentos, por eso no siempre coinciden.

### Experimento 3 · Cobertura y legibilidad del tutorial

Hipótesis: disparar una ayuda no garantiza que se haya podido leer. Se registró cuánto tiempo permanece cada texto, cuadro a cuadro, en 60 primeros intentos por etapa con equipo de campaña barata. En Miraflores 24/60 partidas tienen al menos una ayuda inferior a 1 s. La de soltar dura 0,75 s en 18/60; la del punto ciego es breve en 5/60. En Panamericana se observó una ayuda del peaje de 0,25 s. En Costa Verde la ayuda del anillo no aparece en 25/60, y 10 de esos casos son derrotas.

No toda ausencia es mala: si el anillo no ocurre no hace falta anunciarlo. El problema es guardar como aprendido lo que no ocurrió. Una sonda dirigida activa dos urgencias a la vez y obtiene textos diferentes en cuadros consecutivos, 16,7 ms. La sonda no estima la frecuencia de esa simultaneidad en partidas normales. Conclusión: guardar por ayuda y conservar las interrumpidas, sin retrasar avisos críticos.

### Experimento 4 · Enrosque después de las correcciones

Hipótesis: una demora de reacción debería empeorar consistentemente la supervivencia si el experimento midiera solo dificultad de salida. Se reproduce el primer intento de Costa Verde con el mismo equipo, sin enrosque o reteniendo brevemente decisiones de movimiento del bot al detectarlo.

| Modo | Variante | Victorias / 30 | Mediana de victorias, s | Aplastamientos observados |
|---|---|---:|---:|---:|
| toque | actual | 23 | 74.6 | 0 |
| toque | sin-enrosque | 26 | 73.8 | 0 |
| toque | reaccion-0.5 | 26 | 74.0 | 0 |
| toque | reaccion-1 | 26 | 74.9 | 0 |
| acelerar | actual | 15 | 73.5 | 0 |
| acelerar | sin-enrosque | 20 | 74.3 | 0 |
| acelerar | reaccion-0.5 | 19 | 78.7 | 0 |
| acelerar | reaccion-1 | 21 | 75.7 | 0 |

La hipótesis no se cumple: retrasar al bot mejora varias variantes y no aparecen aplastamientos. La perturbación cambia posicionamiento y exposición a otros daños; no sirve como umbral humano de reacción. No usar esta tabla para reducir el aviso de 1 s ni para afirmar que el anillo es demasiado fácil. Sin enrosque mejoran las victorias, pero eso tampoco identifica qué parte de la trayectoria causó cada muerte. La validación dirigida sí confirma que exposición y apertura del anillo ya respetan sus reglas.

En las 60 primeras peleas actuales de Costa Verde, las fuentes agregadas de daño más altas son taxi, combi y auto de app; no la cabeza expuesta. El registro nuevo de daño por fuente permite distinguirlo. Comparar participaciones y momentos en partidas humanas antes de seguir culpando al anillo por toda derrota.

### Experimento 5 · Tolerancia de la ruta

Hipótesis: soltar durante el tramo final permite observar margen de recuperación. Variante: dejar de acelerar 0, 0,5, 1 o 2 s de cada ciclo de 5 s, desde el tercer tramo, conservando el resto del bot de ruta. Treinta semillas y equipos de llegada por modo.

| Modo | Pausa por ciclo, s | Victorias / 30 | Mediana de victorias, s |
|---|---:|---:|---:|
| toque | 0 | 30 | 81.8 |
| toque | 0.5 | 30 | 81.4 |
| toque | 1 | 30 | 82.0 |
| toque | 2 | 30 | 83.5 |
| acelerar | 0 | 30 | 83.3 |
| acelerar | 0.5 | 30 | 82.3 |
| acelerar | 1 | 30 | 83.0 |
| acelerar | 2 | 30 | 83.8 |

La ruta tolera estas interrupciones en esta muestra equipada. No es una simulación de dejar el teléfono ni justifica endurecerla. Puede funcionar como alivio y epílogo después de Costa Verde. La prueba de perder el avión, separada de este experimento, confirma que la derrota sigue existiendo al agotar tres intentos.

### Incertidumbre

Con 30 casos por celda, diferencias de dos o tres victorias son señales débiles. Un 30/30 no demuestra que todos los humanos ganen. Las políticas comparten semillas pero divergen en equipo, economía y azar consumido; no son asignación aleatoria de personas. Los bots disparan insistentemente, conocen estados internos y no reproducen la carga de dos pulgares. El estudio humano propuesto ya estaba pendiente; esta auditoría lo concreta, no lo presenta como descubrimiento.

## 5. Mejoras rápidas

1. **No apagar ayudas en modo prueba** · `src/scenes/Stage.ts:106`, excluir `TEST_MODE` de `markTutorial`. Parte pequeña de R01, no resuelve por sí sola las ayudas nunca vistas.
2. **Reactivar ayudas manualmente** · `src/core/save.ts` y menú/pausa. Añadir «Ver ayudas» por etapa sin borrar billetera, equipo o medallas. Es un puente mientras se implementa persistencia por instrucción.
3. **Actualizar medallas al cambiar nombre** · `src/scenes/Menu.ts:35`, refrescar `menuMedals` dentro del callback de confirmación. No tocar el puntaje.
4. **Aclarar la regla del semáforo** · `src/stages/javier-prado/config.json`, ayuda `light`: «Suelta el acelerador y espera el verde». Mantener por ahora `fine: 50`, `greenY: 470` y `first: 10`; verificar comprensión antes de cambiar los números.
5. **Texto de ruta específico** · `src/scenes/Menu.ts`, ocultar la explicación de racha/punto ciego cuando exista `cfg.route`, usando una explicación de acelerar y embarcar. Cierre residual de N08, no hallazgo nuevo.

No prometo que R02 o el selector completo de etapas se resuelvan correctamente en una tarde. Requieren comprobar la secuencia de avisos y los efectos sobre progreso, pago repetido y recompensas.

## 6. Apuestas grandes

1. **Tutorial persistente por instrucción** · Motor reutilizable con identificadores estables, tiempo realmente mostrado y modo. Riesgo: repetir demasiado o reponer avisos fuera de tiempo. Criterio de éxito: las personas explican la regla después de un fallo y no necesitan reiniciar progreso.
2. **Regreso a distritos y medallas** · Selector solo de etapas desbloqueadas, muestra medallas y récord; conserva compras y pago repetido reducido. Riesgo: confundir cuál sigue en la campaña. Mantener un botón claro «Seguir recorrido» separado de la elección opcional. No introducir tareas diarias ni vencimientos.
3. **Validación en teléfono de 6–8 personas** · Alternar orden de los dos modos, observar semáforos, enrosque y embarque y exportar registros con build. Riesgo: muestra pequeña y aprendizaje entre intentos. Analizar comprensión, fuentes de daño y duración además de victorias. Esta apuesta ya está acordada en estado, no es una nueva deuda del equipo.

## 7. Puntaje y ranking

Conservar la fórmula vigente de versión 2. En dificultad Normal son 4.000 por ganar, hasta 2.000 por tiempo, 1.500 por proporción de daño efectivo a la derecha, 1.000 por racha hasta ocho, 1.000 por limpieza y 500 por objetivo. En ruta, intentos restantes sustituyen derecha y marea sustituye racha. Fácil multiplica por 0,7 y Difícil por 1,25; el techo es por tanto 12.500 en Difícil, no 10.000 universal.

La nueva limitación de sobredaño resuelve el incentivo incorrecto en el último golpe. Romper barreras ya reduce limpieza aunque la multa monetaria no exista. Conservar contexto y componentes permite explicar récords; las medallas no añaden puntos ni dinero, una buena separación entre dominio opcional y economía.

Mantener ranking local como suma de mejores puntajes por etapa y doce nombres, decisión ya aceptada. No borrar récords antiguos para que encajen con la fórmula nueva. El resultado identifica los antiguos sin detalle; si después se cambia de fórmula, separar claramente el récord de fórmula vigente del histórico. No interpretar mezcla de modos, dificultad y equipo como competición homologada: se muestra contexto, no se exige convertirla en otra clasificación.

Ranking compartido sigue siendo opcional. Si se implementa, requiere versión de reglas, validación y moderación, porque un valor enviado desde almacenamiento local no es evidencia de una partida legítima. No lo pondría por delante de R01–R03 ni exigiría cuentas para jugar. No se observaron pagos reales, cajas de botín, caducidad de medallas o castigos por ausentarse en el alcance revisado.

## 8. Preguntas que necesitan partidas reales

- ¿Después del primer semáforo rojo la persona sabe que debe soltar, o cree que necesita otro botón? Registrar rojos antes y después de poder explicar la regla.
- ¿Puede leer el consejo mientras conduce? Registrar interrupciones, no solo si el texto apareció.
- ¿Reconoce la salida del anillo en 1 s y entiende que la cabeza queda segura? Ensayar 1,2 s únicamente si falla la percepción.
- ¿El cierre de Costa Verde se siente merecido y se entiende el papel de Don Frío? Contar cuántos lo saltan y preguntar por qué, sin penalizarlos.
- ¿La compra defensiva de peleas más largas resulta satisfactoria o fatigante? Comparar tiempo real, derrotas y preferencia, no solo DPS.
- ¿Volverían a un distrito por una medalla que eligieron, sin premio económico extra? Probar el acceso de regreso antes de añadir más objetivos.
- ¿Se distinguen los avisos y la música de cada distrito en un teléfono a volumen habitual? No se validó audio ni contraste táctil en esta revisión.

### Evidencia y reproducción

Ver `REPRODUCIR.md`, los tres archivos de pruebas externos y `evidencia/`. Los hallazgos enlazan al código del SHA fijado, no a `main` cambiante. La captura `evidencia/menu-publicado.png` documenta la inspección visual del menú de Javier Prado. El informe no requiere enviar datos personales ni publicar registros.
