# Limargeddon · Nueva auditoría y verificación de correcciones

25 de octubre de 2026 · Commit `fb996cddc7c72f5f58d37352eb8a3929bbeccee3`

Comparación contra `fd87432519230cd8770bd1d34d7269e0b1277793`, auditado el 24 de octubre. Incluye los PR 24–30, la Línea Amarilla, física sólida, claridad, taller y enrosque. No se modificó ningún archivo versionado del juego.

## 1. Resumen ejecutivo

- **Fortaleza** · Se corrigieron rompellantas, racha del cuerpo y primer claxon; las ayudas y el daño por fuente hacen más explícitas las reglas.
- **Fortaleza** · El taller ofrece ataque, aguante, meta de ahorro y utilidad de objetos; la decisión ya tiene más información.
- **Fortaleza** · Costa Verde tiene clímax propio y la Línea Amarilla un cierre jugable distinto, con ruta y avión.
- **Problema principal** · Comprar Socio de la Combi puede romper la ejecución de la Línea Amarilla a los 12 s, aunque los 140 tests existentes pasen.
- **Problema principal** · Perder el avión ignora el límite de intentos; el contador llega a 0 y valores negativos y la partida sigue.
- **Problema principal** · La ventana de cabeza expuesta conserva daño y claxon; el anillo tampoco recalcula su abertura al destruir segmentos durante el cierre.
- **Decisión recomendada** · Corregir estas interacciones antes de añadir contenido o endurecer la secreta; después validar campañas con las recomendaciones que realmente muestra el taller.

### Qué se comprobó

Se leyeron cambios de código y ADR 0028–0034, se ejecutaron pruebas, build, balance de las diez etapas, 30 campañas estándar por modo y tres experimentos propios. El experimento de campaña amplía la política estándar a 90 campañas por modo y compara otras dos políticas con 30 por modo. Se hicieron sondas dirigidas del motor para reproducir fallos concretos.

En la versión publicada se revisaron menú, selección de la secreta, taller, acceso a la ruta y pausa. **No se hizo una prueba humana completa de combate ni de pulgares en teléfono.** La versión publicada muestra las funciones nuevas, pero no se verificó su hash contra el commit local. [Captura del taller](evidencia/taller-publicado.png).

Las tasas corresponden a bots. El azar, los caminos y el equipo pueden divergir al cambiar una regla aunque se reutilice la semilla. Los intervalos de reacción son perturbaciones del bot, no modelos validados de habilidad humana. Los principios usados son consistencia, claridad de consecuencia, autonomía informada y recompensa de dominio; no se infieren cambios de dopamina ni de retención.

### Seguimiento de los hallazgos anteriores

| Hallazgo anterior | Estado actual | Verificación y límite |
|---|---|---|
| Rompellantas sin aturdimiento | Corregido | El proyectil real conserva `stun=0,6`. |
| Golpear cuerpo corta racha | Corregido | Sonda conserva racha 3 tras impacto válido. No sube racha ni cuenta derecho. |
| Primer claxon ignora datos sin escoltas | Corregido | Inicialización separada de escoltas; test específico existente. |
| Salto promete inmunidad total | Corregido en texto | El consejo ya advierte sobre claxon. No se introdujo inmunidad general. |
| Exceso de textos | Mejorado y medido | Daño agrupado 120 ms y dos hitos de racha; pico actual 14 en las muestras comparadas frente a 20 anteriores. No aislar el efecto de UI de otros cambios de física. |
| Taller solo recomienda lo más barato | Mejorado, con nuevo riesgo | UI usa `picks`, pero la campaña sigue usando `recommended`. Pesos derivados del antiguo ensayo de Callao se aplican a cualquier etapa y nivel. |
| Objetos sin uso próximo | Explicado, no eliminado | Se muestra dónde sirven. Poncho sigue ligado al Centro, Tarjeta a Vía Expresa y Corneta a Costa Verde, incluso con la secreta. |
| Falta enrosque final | Implementado, con defectos de integración | Ventana ofensiva y destrucción de segmentos requieren correcciones. |
| Ranking y reinicio pendientes | Implementados | Mejor pelea por etapa, suma por jugador, ranking local y doble confirmación de reinicio. Mezclar mejoras y usar tiempo simulado son decisiones documentadas. |
| Campaña ejecuta también balance por importación | Corregido | Helper extraído; ahora campaña ejecuta un solo test. |
| Secreta y pista de acceso | Implementadas | Cuatro tramos, marea, peajes y carguero. No repetirlas como pendientes. |

## 2. Circuito de acción y recompensa

La mejora más visible está en la **claridad**. La racha conserva el sonido y la pausa de impacto, pero su texto solo aparece en el segundo acierto y al llegar a +30%. El punto ciego tiene flecha hasta tres golpes derechos. El daño recibido identifica la fuente y la derrota muestra el último golpe. Se conserva una respuesta rápida sin convertir cada impacto en otro mensaje largo.

La ventana ofensiva del enrosque es una buena idea: escapar da 3 s para castigar al jefe. Actualmente la promesa no se cumple por completo, porque solo el cuerpo recibe parte de la protección especial. El nuevo premio principal por segundo es esa oportunidad de ataque, no dinero adicional.

### Frecuencia medida

Primer intento de las primeras 30 campañas estándar por modo, con equipo de llegada real. Tasas por minuto simulado, incluyendo derrotas. «Daño» cuenta nuevos textos agrupados, no golpes. «Racha» cuenta hitos positivos flotantes, no el contador fijo. «+S» es dinero por tráfico, no monedas recogibles. Los textos pueden corresponder al mismo evento y no deben sumarse como premios independientes.

| Etapa | Modo | Daño/min | Racha/min | +S/min | Bonus/min | Pico textos simultáneos |
|---|---|---|---|---|---|---|
| miraflores | toque | 42.9 | 4.2 | 4.9 | 3.7 | 13 |
| miraflores | acelerar | 44.1 | 5.5 | 4.6 | 3.8 | 12 |
| via-expresa | toque | 53.6 | 5.8 | 5.8 | 3.8 | 12 |
| via-expresa | acelerar | 47.4 | 4.7 | 5.7 | 3.5 | 11 |
| panamericana | toque | 52.8 | 5.3 | 4.6 | 3.3 | 13 |
| panamericana | acelerar | 52.4 | 5.3 | 5.6 | 3.3 | 11 |
| costa-verde | toque | 62.4 | 4.9 | 2.5 | 2.9 | 10 |
| costa-verde | acelerar | 55.0 | 4.4 | 3.2 | 3.3 | 14 |
| linea-amarilla | toque | 0.0 | 0.0 | 10.7 | 5.7 | 4 |
| linea-amarilla | acelerar | 0.0 | 0.0 | 11.1 | 5.4 | 4 |

**Lectura** · Costa Verde por toque baja de 24,6 mensajes de racha/min en la auditoría anterior a 4,9, conservando un contador fijo. El descenso de ruido es positivo; falta medir comprensión, no añadir mensajes para compensarlo. La ruta no necesita daño al jefe ni racha, porque recompensa avance, supervivencia y embarque. Aun así el menú y resultados siguen mostrando instrucciones o estadísticas de punto ciego/racha que no corresponden a esa etapa.

| Escala | Recompensa actual | Hueco o riesgo que queda |
|---|---|---|
| Inmediata | Impacto, sonido, daño por fuente, bonus | Fuentes largas compiten con amenazas; no se midió legibilidad táctil. |
| Ventana táctica | Aceite, claxon, salto, escape del enrosque | Cabeza expuesta aún puede dañar y aturdir; barrera invisible si se destruye cuerpo. |
| Pelea | Pago, objeto, puntaje, récord personal | En la ruta se omiten peajes en el desglose y se promete limpieza de «fase 3» aunque se evalúe el último tramo, que es el cuarto. |
| Sesión | Compra, ahorro elegido, siguiente distrito | La política simulada ya no coincide con la recomendación visible; las rutas de compra cambian mucho la duración. |
| Campaña | Nueve jefes y cierre secreto | Los tres intentos de la ruta no se respetan cuando falla el embarque. |

Los mecanismos nuevos enseñan varias reglas antes de exigirlas: Gamarra a 7 s, Vía Expresa a 2 s, el enrosque con círculo y flecha. Para la secreta, el menú explica ruta y avión; falta validar en personas si pagar, romper, eco y marea se distinguen durante la acción. El bot ve estado exacto y no sufre oscuridad. No hay fundamento para endurecer el túnel solo porque gane siempre.

## 3. Hallazgos actuales priorizados

Las propuestas son para el equipo. S = una tarde aproximada, M = varias jornadas, L = sistema con iteración. Los archivos se enlazan al commit auditado.

| ID | Evidencia | Hallazgo | Principio | Severidad | Propuesta concreta | Tipo | Esfuerzo | Cómo medir |
|---|---|---|---|---|---|---|---|---|
| N01 | [src/core/world.ts:184](https://github.com/tonmaiveD/limargeddon/blob/fb996cddc7c72f5f58d37352eb8a3929bbeccee3/src/core/world.ts#L184) · E1 y sonda aislada | Socio de la Combi accede a `cfg.powers.combi.vy` en una ruta sin ese bonus. Excepción a 12,0 s. | Una compra persistente no puede invalidar la campaña | Alta | Eliminar dependencia del bonus opcional. Declarar por datos si el aliado funciona en ruta; si no, suspenderlo allí y explicarlo sin borrar compra. Probar todas las mejoras en las diez etapas. | Motor + UI | S–M | Ruta completa sin excepción con Socio; 30 semillas por modo y test a los 12 s. |
| N02 | [src/bosses/route-ai.ts:78](https://github.com/tonmaiveD/limargeddon/blob/fb996cddc7c72f5f58d37352eb8a3929bbeccee3/src/bosses/route-ai.ts#L78) · cinco pérdidas dirigidas | El avión llama a retry sin comprobar intentos; quedan 2, 1, 0, −1, −2 y mode sigue play. | Regla de derrota consistente | Alta | Unificar gasto de intento para muerte y avión. Tras agotar los 3, derrota una sola vez, sin restaurar vida ni reiniciar tramo. | Motor | S | Tres fallos de embarque terminan; combinaciones muerte/avión también; nunca contador negativo. |
| N03 | [src/bosses/snake-boss.ts:147](https://github.com/tonmaiveD/limargeddon/blob/fb996cddc7c72f5f58d37352eb8a3929bbeccee3/src/bosses/snake-boss.ts#L147) y [src/bosses/phase-boss.ts:212](https://github.com/tonmaiveD/limargeddon/blob/fb996cddc7c72f5f58d37352eb8a3929bbeccee3/src/bosses/phase-boss.ts#L212) | Cabeza expuesta mantiene colisión dañina y claxon. Sondas, 100→81 HP y stun 0,8 s. | Recompensa táctica confiable | Alta | Durante exposed>0 bloquear daño de contacto y claxon de la cabeza, conservando separación sólida y la ventana de 3 s. No solo retrasar hornT. | Motor | S | Escape seguido de contacto o claxon pendiente no hace daño ni aturde durante 3 s. |
| N04 | [src/bosses/snake-boss.ts:163](https://github.com/tonmaiveD/limargeddon/blob/fb996cddc7c72f5f58d37352eb8a3929bbeccee3/src/bosses/snake-boss.ts#L163) · sonda de destrucción | El hueco se calcula al comenzar; al romper segmentos durante hold no se actualizan slots ni colisión radial. | Lo visible coincide con lo sólido | Media | Recalcular abertura tras split; al quedar menos de minSegs terminar anillo con release. Si no queda cuerpo, no conservar barrera circular. | Motor | M | Romper un segmento abre espacio real; cero segmentos implica cero barrera, jefe aún vivo. |
| N05 | [scripts/campana.test.ts:48](https://github.com/tonmaiveD/limargeddon/blob/fb996cddc7c72f5f58d37352eb8a3929bbeccee3/scripts/campana.test.ts#L48) y [src/garage/upgrades.ts:69](https://github.com/tonmaiveD/limargeddon/blob/fb996cddc7c72f5f58d37352eb8a3929bbeccee3/src/garage/upgrades.ts#L69) · E1 | Bot compra por precio, UI por rol. Aguante eleva Costa Verde a 93% pero 126,6 s por toque; ataque expone N01. | Balance representa decisiones ofrecidas | Alta | Añadir políticas barata, ataque y aguante al informe de campaña. No recalibrar todo alrededor de una sola. | Motor de simulación | S | Tres políticas, ambos modos, ≥30 campañas; errores separados de derrotas. |
| N06 | [src/core/world.ts:129](https://github.com/tonmaiveD/limargeddon/blob/fb996cddc7c72f5f58d37352eb8a3929bbeccee3/src/core/world.ts#L129) · sonda peaje | Romper barrera suma estrella pero no infracción. La componente de limpieza mantiene 1. | Puntaje con reglas explícitas | Media | Definir si barrera rota cuenta como falta. Si sí, incrementar contador antes de perdones, una vez por barrera, sin crear multa monetaria nueva. | Motor | S | Barrera pagada no penaliza; rota descuenta 1/3 de limpieza si esa es la regla elegida. |
| N07 | [src/core/state.ts:148](https://github.com/tonmaiveD/limargeddon/blob/fb996cddc7c72f5f58d37352eb8a3929bbeccee3/src/core/state.ts#L148) · sonda sobre-daño | El daño derecho usado en puntaje incluye el exceso del golpe final, no solo HP retirado. | Premiar habilidad efectiva | Media | Separar daño mostrado de daño efectivo; sumar min(daño, HP anterior) a estadísticas del ranking. | Motor | S | Con 1 HP restante solo se suma 1 a total/derecho, aunque el golpe muestre 24. |
| N08 | [src/scenes/Results.ts:28](https://github.com/tonmaiveD/limargeddon/blob/fb996cddc7c72f5f58d37352eb8a3929bbeccee3/src/scenes/Results.ts#L28) y [src/core/world.ts:348](https://github.com/tonmaiveD/limargeddon/blob/fb996cddc7c72f5f58d37352eb8a3929bbeccee3/src/core/world.ts#L348) | Ruta muestra derecha y racha sin jefe, limpieza de fase 3 en vez de tramo 4 y no desglosa peajes. | Recompensa y cobro comprensibles | Media | Mostrar intentos, golpes de marea y Peajes −S/X; etiqueta limpieza del último tramo. Registrar tolls en resumen. | UI + motor | S | Resultados concuerdan con cálculo; daño solo en aeropuerto invalida la medalla del último tramo. |
| N09 | [src/core/save.ts:149](https://github.com/tonmaiveD/limargeddon/blob/fb996cddc7c72f5f58d37352eb8a3929bbeccee3/src/core/save.ts#L149) y [src/scenes/Stage.ts:94](https://github.com/tonmaiveD/limargeddon/blob/fb996cddc7c72f5f58d37352eb8a3929bbeccee3/src/scenes/Stage.ts#L94) | Se guardan puntos por nombre/etapa sin modo, versión o componentes; el registro de peleas tampoco guarda puntaje ni último golpe. | Récord interpretable y auditable | Media | Conservar total local acordado, pero guardar metadata por récord, versión de fórmula y puntos por componente; exportar daño por fuente y último golpe. | Motor + UI | M | Un récord puede explicarse tras cambiar balance; no comparar versiones incompatibles silenciosamente. |

**Alcance de las sondas** · Los estados límite se colocan deliberadamente para aislar una regla. N01 también aparece en campañas completas sin manipular estados. N03 tuvo además un evento de daño de cabeza durante exposición en las 90 primeras peleas por toque; no se infiere que ocurra siempre. N04 destruye el cuerpo mediante llamadas al receptor de disparos, sin reproducir una secuencia humana de pulsaciones. El jefe conserva 465 HP: no es un artefacto de haber terminado la pelea. La sonda demuestra que el collider persiste, no estima su frecuencia en partidas normales.

### Qué no debe tratarse como hallazgo nuevo

Tutorial completo, objetivos opcionales, música, animaciones de cierre, semáforos y ranking compartido siguen siendo pendientes conocidos. La tabla local mezclada con mejoras y el uso de tiempo de simulación están aceptados en ADR 0029; no propongo descartarlos unilateralmente. Tampoco interpreto cada salida de la meta 65–80% como un error con solo 30 semillas.

## 4. Resultados y experimentos

### Verificación base

- `npm test` · **140/140 aprobadas**, 24 archivos, incluida paridad.
- `npm run build` · aprobado.
- `CAMPANAS=30 npm run campana` · aprobado, ejecuta solo campaña, con las diez etapas.
- `npm run balance` · ejecutó la matriz y produjo las filas, pero la ejecución larga registró timeout RPC de Vitest. Las 11 ejecuciones por etapa/grupo pasaron, sin ese error, y reprodujeron exactamente las 261 filas de la matriz. Se conservan ambas evidencias.
- El primer experimento completo detectó la excepción real N01. El script final la captura y registra como **error**, no como derrota normal ni timeout; así puede seguir midiendo las otras campañas. La repetición final pasó sin errores del ejecutor y produjo un JSON idéntico al ensayo previo completo.

Semillas base: balance `97*s`, s=1..30. Campaña `1000*c + 37*n + 7*intento`, con seis intentos máximos por etapa. Las variantes de Costa Verde y secreta usan la semilla del primer intento y el equipo de llegada de la campaña estándar. Paso 1/60 s, corte externo 300 s. Los tres intentos internos de la secreta son distintos de los seis reintentos completos permitidos por el simulador.

Las medianas propias promedian los dos centrales; las originales eligen el central superior. Esto explica diferencias pequeñas entre tablas y logs. Una victoria de 30 equivale a 3,3 puntos porcentuales; una de 90, a 1,1. No se estimó retención humana ni significación estadística de cada comparación. Las medianas entre ganadores pueden bajar por selección de supervivientes.

### Campaña estándar actual, n=30 por modo

Todos llegan y completan las diez etapas en esta muestra. Gasto es acumulado al llegar. El dato anterior se conserva solo como contexto: hubo cambios de física, cadencia, jefe y bot, por lo que no es una comparación causal de una sola modificación.

| Etapa | Toque 1.º | s | Intentos | S/ | Acelerar 1.º | s | Intentos | S/ |
|---|---|---|---|---|---|---|---|---|
| miraflores | 29/30 | 78.1 | 1.0 | 0 | 30/30 | 68.0 | 1.0 | 0 |
| san-isidro | 27/30 | 71.0 | 1.1 | 185 | 26/30 | 64.8 | 1.1 | 185 |
| centro | 27/30 | 78.4 | 1.1 | 917 | 24/30 | 71.1 | 1.3 | 857 |
| javier-prado | 20/30 | 61.7 | 1.7 | 1447 | 24/30 | 59.2 | 1.4 | 1485 |
| gamarra | 21/30 | 80.0 | 1.5 | 2595 | 27/30 | 71.7 | 1.1 | 2575 |
| callao | 24/30 | 88.1 | 1.2 | 3547 | 19/30 | 84.4 | 1.6 | 3515 |
| via-expresa | 26/30 | 81.7 | 1.2 | 4583 | 23/30 | 89.4 | 1.3 | 4713 |
| panamericana | 23/30 | 79.7 | 1.3 | 5955 | 22/30 | 68.7 | 1.4 | 5982 |
| costa-verde | 21/30 | 75.2 | 1.4 | 7438 | 17/30 | 79.6 | 1.6 | 7450 |
| linea-amarilla | 30/30 | 83.2 | 1.0 | 9497 | 30/30 | 83.3 | 1.0 | 9708 |

Al ampliar la política estándar a 90 campañas por modo, completan **90/90 por toque y 89/90 acelerando**. La campaña acelerando con semilla de campaña 73 se detiene en Costa Verde después de seis derrotas. La secreta gana su primera pelea completa en todas las campañas estándar que la alcanzan; eso puede incluir un reintento interno del tramo.

La desigualdad entre modos se desplazó. Vía Expresa ya no tiene 97% acelerando como en la primera auditoría; ahora 77% en las primeras 30. Callao acelerando queda en 63%, mientras por toque es 80%. El final acelerando da 57% con n=30, pero 70% con n=90: precisamente por eso no conviene ajustar vida a partir de una sola tanda pequeña.

### E1 · Seguir lo que recomienda el taller

**Hipótesis** · La campaña por precio ya no representa la interfaz nueva. **Variantes** · Después de cada victoria se compra repetidamente, hasta agotar opciones asequibles: (a) lo más barato; (b) recomendación de ataque y, si no hay, aguante; (c) aguante y, si no hay, ataque. Se usa `picks` real, sin cambiar sus pesos. N=30 por modo y política para comparar.

| Modo | Compra | Callao 1.º | s | Costa Verde 1.º | s | Secreta 1.º | s | Errores |
|---|---|---|---|---|---|---|---|---|
| toque | barata | 24/30 | 88.1 | 21/30 | 75.2 | 30/30 | 83.2 | 0 |
| toque | ataque | 16/30 | 57.9 | 25/30 | 87.5 | 30/30 | 83.8 | 0 |
| toque | aguante | 26/30 | 96.2 | 28/30 | 126.6 | 30/30 | 83.5 | 0 |
| acelerar | barata | 19/30 | 84.4 | 17/30 | 79.6 | 30/30 | 83.3 | 0 |
| acelerar | ataque | 21/30 | 57.0 | 25/30 | 68.3 | 27/30 | 83.5 | 3 |
| acelerar | aguante | 26/30 | 94.0 | 26/30 | 108.1 | 30/30 | 84.5 | 0 |

**Resultado decisivo** · Ataque/acelerar produjo tres errores al entrar en la secreta con Socio de la Combi. Ejemplo reproducible: campaña 8, nivel 1 de Socio, excepción a los 12,0 s de la ruta. El fallo aislado se reproduce también sin la campaña, equipando únicamente esa mejora.

**Conclusión** · El taller mejora la elección, pero la validación debe cubrir esas elecciones. Aguante ofrece 28/30 primeras victorias en Costa Verde por toque y una mediana final de 126,6 s; multiplicar por la referencia histórica ×1,6 daría unos 203 s humanos, **solo como extrapolación**, no medición. No penalizar defensas para forzar la política barata. Primero explicar el intercambio supervivencia/duración y repetir con jugadores. Los pesos heredados del antiguo Callao, nivel 1 y n=30, no son un ranking universal de todas las mejoras y niveles.

### E2 · Enrosque, resultado y reacción

**Hipótesis** · El enrosque aporta tensión con una salida legible. **Variantes** · 90 configuraciones de llegada por modo, (a) actual; (b) retirar solo `coil` de las fases; (c) mantener la dirección previa durante 0,5 s al iniciar el aviso antes de permitir la evasión especializada; (d) igual con 1 s. El movimiento previo continúa, no es un bot inmóvil. Equipo de llegada fijo.

| Modo | Variante | Gana | s | Enrosques iniciados | Escapes | Apretones |
|---|---|---|---|---|---|---|
| toque | actual | 62/90 | 77.8 | 62 | 59 | 0 |
| toque | sin-enrosque | 75/90 | 75.2 | 0 | 0 | 0 |
| toque | reaccion-0.5 | 72/90 | 75.2 | 58 | 57 | 0 |
| toque | reaccion-1 | 71/90 | 75.1 | 57 | 56 | 0 |
| acelerar | actual | 63/90 | 81.7 | 83 | 81 | 0 |
| acelerar | sin-enrosque | 73/90 | 76.8 | 0 | 0 | 0 |
| acelerar | reaccion-0.5 | 68/90 | 81.0 | 83 | 81 | 0 |
| acelerar | reaccion-1 | 76/90 | 75.5 | 82 | 79 | 0 |

**Conclusión** · Se reproduce el efecto de dificultad de ADR 0034: actual 62/90 y 63/90 frente a 75/90 y 73/90 sin enrosque. Pero ningún bot recibió apretón en estas variantes. La diferencia no demuestra que acertar el hueco sea el desafío que causa las derrotas: cambia posición, tiempo de exposición y interacción con tráfico. Que una demora mejore resultados muestra que la maniobra inmediata del bot no es necesariamente óptima. No convertir «0,5 s más lento gana más» en una recomendación para personas ni en justificación para acortar el aviso.

Propuesta medida, todavía por validar: conservar aviso Normal 1 s, hold 2,2 s y exposición 3 s mientras se corrigen N03 y N04. Después registrar cuántas personas reconocen la salida, escapan durante aviso, escapan por hueco o reciben apretón. Recién entonces variar tele 1,0/1,2 s en una comparación humana.

### E3 · La marea cuando se suelta el acelerador

**Hipótesis** · El 100% del bot de ruta oculta el coste de soltar. **Variantes** · Desde puente y pista, forzar soltar 0, 0,5, 1 o 2 s de cada bloque de 5 s, manteniendo la dirección que decide el bot. Treinta llegadas por modo, equipo real, mismas semillas. El bot sigue viendo el estado perfecto y no sufre el túnel visual.

| Modo | Suelta s/5 s | Gana | s | Contactos de marea, total | Reintentos internos, total |
|---|---|---|---|---|---|
| toque | 0 | 30/30 | 83.2 | 0 | 1 |
| toque | 0.5 | 30/30 | 81.4 | 0 | 1 |
| toque | 1 | 30/30 | 82.0 | 1 | 3 |
| toque | 2 | 30/30 | 83.0 | 179 | 7 |
| acelerar | 0 | 30/30 | 83.3 | 0 | 0 |
| acelerar | 0.5 | 30/30 | 83.0 | 0 | 0 |
| acelerar | 1 | 30/30 | 83.0 | 1 | 1 |
| acelerar | 2 | 30/30 | 83.8 | 180 | 5 |

**Conclusión** · Incluso soltando 2 de cada 5 s, terminan 30/30 por modo, pero aparecen 179 y 180 contactos de marea y 7/5 reintentos internos. El resultado final por sí solo oculta esfuerzo y errores absorbidos por mejoras y vidas. La secreta puede funcionar como cierre con más margen, no tiene obligación de superar al jefe final en derrotas. No subir daño por esos 100%; corregir primero el contador y probar con manos y visibilidad reales. Estos ensayos no alcanzan el fallo de contador negativo; las sondas de avión sí.

### Matriz completa de balance

El balance incluye experto, medio y casual, Fácil/Normal/Difícil, modos y variantes de mejoras. Los logs completos están adjuntos. En las etapas avanzadas sigue siendo más pertinente la campaña con equipo que el aislamiento sin mejoras. La matriz no valida oscuridad, pulgares ni justicia perceptiva.

## 5. Seis mejoras rápidas

1. **Socio compatible con ruta** · `src/core/world.ts:188`. Proteger el acceso al bonus ausente y definir explícitamente la función del aliado allí. No basta tapar la excepción si la mejora se anuncia con un efecto que no existe en una etapa sin jefe.
2. **Agotamiento único de intentos** · `src/bosses/route-ai.ts:40,78,111`. Compartir lógica entre muerte y avión; contador nunca menor a 0 y derrota al tercer fallo, sin curar después de agotar.
3. **Exposición realmente segura frente al jefe** · `src/bosses/phase-boss.ts:212,222` y `snake-boss.ts:147`. Condicionar claxon y daño a que `coil.exposed<=0`; mantener empuje sin daño. Verificar los 3 s completos.
4. **Resultados de ruta propios** · `src/scenes/Results.ts:28–35`. Cambiar derecha/racha por intentos/marea y «fase 3» por «último tramo»; añadir peajes al resumen y cobro. Textos breves, sin nueva puntuación ajena al estilo.
5. **Campaña con políticas visibles** · `scripts/campana.test.ts:48`. Usar parámetro de política y publicar tres filas por modo; separar excepciones, derrotas y timeouts. Conservar barata como comparación histórica.
6. **Daño efectivo para puntaje** · `src/core/state.ts:148`. Guardar HP anterior y limitar los acumuladores al daño retirado; conservar el número visual y el daño de combate. Prueba de jefe a 1 HP.

La corrección geométrica N04 merece trabajo M y una matriz de posiciones, no un arreglo apresurado de una tarde. No propongo cambiar ahora los multiplicadores de daño o la vida de Costa Verde: su comportamiento acaba de cambiar y hay fallos tácticos que afectan la lectura del balance.

## 6. Tres apuestas de mayor alcance

1. **Contrato reutilizable de estados del jefe** · Declarar por datos qué bloquea un estado: ataques, claxon, contacto, movimiento y peligros compatibles. Así «expuesto» no depende de parches distintos en cabeza, cola y mundo. Riesgo de romper paridad; activarlo solo en configuraciones nuevas y validar las antiguas.
2. **Enrosque con geometría compartida** · Derivar dibujo, segmentos golpeables y colisión del mismo conjunto de posiciones/aberturas. Romper cuerpo debe ampliar una salida real en el mismo cuadro. Riesgo de huecos fuera de pista, colisiones de tráfico o cambios abruptos; probar bordes, menos segmentos, carretilla y derrumbes.
3. **Récord explicable y revancha por dominio** · Guardar componentes y contexto del puntaje, y ofrecer un objetivo permanente elegido por el jugador. El siguiente intento debe buscar dominio concreto, no acumular dinero ni mantener una racha diaria. Riesgo de sobrecargar resultados; mostrar un objetivo y un récord, con detalles desplegables.

## 7. Puntaje y ranking después de implementarse

Se respeta lo decidido: **ranking local, suma de la mejor pelea de cada etapa, 12 jugadores**, nombre y reinicio que conserva récords. No se necesita rehacer la fórmula ni migrar a un servidor para mejorar lo que existe.

- Bien · Repetir la misma marca no suma. Perder da cero. Infracciones se cuentan antes de perdones monetarios. Regenerar no borra daño recibido. El modo prueba no registra puntaje.
- Corregir · Estadística de sobre-daño N07 y definición de barrera rota N06. La sonda con 1 HP restante y un cono derecho acredita 24 de daño; el daño efectivo debería ser 1.
- Explicar · El techo es 7.000 en Fácil, 10.000 en Normal y 12.500 en Difícil, no 10.000 universal. El ranking mezcla modos, dificultades y equipo. La ponderación de dificultad no demuestra equivalencia de habilidad.
- Conservar contexto · `{points, mode, difficulty, upgrades, build, scoreVersion, parts}` por mejor pelea. Se puede mantener el total acordado y permitir ver el detalle, sin imponer un ranking competitivo nuevo.
- No hacer aún · Ranking compartido. Mientras haya estados de ruta y puntaje incoherentes, publicar la tabla amplificaría comparaciones difíciles de explicar. Si después se quiere competencia verificable, hacen falta reglas versionadas, equipo comparable y validación ajena al cliente.

La etapa secreta sustituye derecho por intentos restantes y racha por evitar marea; esa adaptación es razonable. Precisamente por eso el contador negativo importa también para la confianza en el resultado. El código limita la componente a cero, pero no convierte los reintentos ilimitados en una regla correcta.

El tiempo competitivo actual excluye hitstop por decisión documentada. Si se cambia a tiempo activo real, versionar la fórmula y conservar los récords antiguos identificados; no mezclarlos silenciosamente. Tampoco presentar la suma como clasificación de habilidad pura mientras el equipo difiera.

## 8. Qué resolver con partidas reales

1. **Enrosque** · ¿La persona reconoce la flecha en el primer aviso? ¿Escapa durante la formación o espera el cierre? ¿Aprovecha la cabeza expuesta después de corregir N03?
2. **Tráfico sólido** · ¿Los adelantamientos son predecibles o parecen cambios de carril repentinos? Medir choques durante maniobras vecinas, no solo superposición entre autos.
3. **Taller** · ¿Elegir ataque/aguante cambia intencionalmente el estilo? ¿Las peleas defensivas de más de dos minutos de bot se sienten satisfactorias o largas?
4. **Secreta** · ¿Se entiende pagar frente a romper? ¿El eco se atribuye a la pared? ¿Se descubre cuándo soltar sin que alcance la marea?
5. **Reintento** · Tras fallar el avión, ¿se comprende qué tramo se conserva, cuánta vida vuelve y cuántos intentos quedan? Probar después de corregir N02.
6. **Recompensa** · ¿La persona puede explicar por qué mejoró su puntaje y por qué cobró menos tras peajes? ¿Quiere revancha por una meta de dominio, sin presión externa?

Protocolo formativo sugerido: 6–8 personas, orden de modos alternado, guardar equipo y versión, observar Gamarra/Costa Verde/Línea Amarilla. Recoger comprensión y percepción de justicia además de victorias. No convertir esa muestra pequeña en estimación de retención ni extrapolar el ×1,6 como duración humana garantizada.

## Reproducción y evidencia

[Instrucciones](REPRODUCIR.md) · [Experimentos completos](experimentos.test.ts) · [Sondas](sondas.test.ts)

[Tests](evidencia/tests.txt) · [Build](evidencia/build.txt) · [Campaña estándar](evidencia/campana.txt) · [Balance inicial](evidencia/balance.txt) · [Balance consolidado verificado](evidencia/balance-consolidado.txt)

[Datos crudos de experimentos](evidencia/experimentos.json) · [Log de experimentos](evidencia/experimentos.txt) · [Sondas y resultados](evidencia/sondas.json) · [Fallo inicial que reveló Socio](evidencia/experimentos-inicial-error.txt)
