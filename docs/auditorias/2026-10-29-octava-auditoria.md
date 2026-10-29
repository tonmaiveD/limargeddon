# Limargeddon · Octava auditoría

29 de octubre de 2026. Código `1121e03b325e66e47380d560092234e952abe21e`, PR hasta #47. Comparación con la séptima auditoría, `364ee79`.

## 1. Resumen ejecutivo

- Los créditos, el reparto y el vuelo de regreso dan un cierre propio a la campaña; el desfile recupera los diez distritos y permite interacción sin daño ni puntaje.
- Los dos hallazgos anteriores están corregidos: los intervalos largos quedan registrados como anomalías y los sectores del anillo se atenúan fuera de la fase activa.
- Pasan 217 pruebas y la compilación. Las 7.830 peleas de balance y las 180 campañas repiten los resultados anteriores.
- En una repetición de créditos, cualquier pulsación táctil puede saltarlos, incluidos los controles del desfile. La barra espaciadora también comparte claxon y salto.
- La imagen y la música usan relojes diferentes: por debajo de 20 FPS, el límite de avance visual alarga la escena y rompe su correspondencia con el popurrí.
- La respuesta a interrupciones, la legibilidad y el rendimiento en teléfonos siguen sin validarse en sesiones físicas. La ausencia de coordinación de pausa en Credits merece incluirse en esa prueba.
- Prioridad: separar el salto de la conducción y usar una línea de tiempo común para música e imagen. No cambiar balance ni economía.

### Alcance y límites

Se revisaron el diff completo desde `364ee79`, estado y ADR 0047–0049, créditos, audio, entrada, guardado y transición de escenas. Se ejecutaron tests, compilación, balance completo, campañas y sondas externas. No se modificó código de producción, no se hicieron commits ni PR. Se usó checkout aislado con enlace a dependencias existentes de las mismas versiones.

Se abrió el sitio público en modo prueba, se entró a «Ver créditos» y se confirmó que Espacio salta al poscrédito. También se inspeccionaron estados congelados del desfile con diálogo y del cierre con agradecimientos, usando las opciones de revisión del propio juego. Se guardaron capturas. No se jugó una campaña humana completa ni se certificó el SHA desplegado por su apariencia.

Las sondas de escena ejecutan el manejador y el reloj reales con Phaser y AudioContext sustituidos y funciones de dibujo desactivadas. No son mediciones de FPS de un teléfono ni una escucha de la música. No se evalúan calidad sonora, latencia táctil o preferencias humanas con esas sondas.

### Seguimiento

| Hallazgo anterior | Estado | Evidencia repetida |
|---|---|---|
| T01 · Se perdían intervalos >5 s | Corregido | 5.001 y 6.000 ms aparecen en `anomalies`. Permanecen fuera de percentiles y deben invalidar una aprobación automática de fluidez. |
| T02 · Sectores siempre activos | Corregido | Alfa 0,3 en aviso/liberación y 0,95 en retención. |
| Lista de bloqueos truncada | Corregido el límite de interpretación | 40 bloqueos producen `stallCount=40`, 30 muestras y `stallsCut=true`. |
| S01 · Suavizado | Corrección conservada | Picos de 40, 120 y 300 ms preservados. |
| S02 · Proyección y formas | Corrección conservada | Caja alineada en 300 scrolls y pruebas del proyecto para círculos. |
| Q01/Q02 · Salida y correas | Corrección conservada | 9.000 estados de flecha y sonda de orden de capas. |

La primera visualización no saltable y el «CONTINUARÁ» figuran como decisiones aprobadas en ADR 0049. No se presentan como errores nuevos ni se reemplazan por los conceptos sugeridos antes en este chat. El conflicto de controles aparece cuando saltar ya está habilitado.

## 2. Circuito de recompensa

| Escala | Estado actual | Evaluación |
|---|---|---|
| Segundo a segundo | Golpes, racha, aceite, claxon, bonus | Sin cambios en los eventos simulados. |
| Pelea | Fases, derrota, cobro y taller | Conserva el balance y las decisiones anteriores. |
| Fin de campaña | Bodega, créditos, reparto y poscrédito | Añade reconocimiento de lo recorrido y un remate narrativo. |
| Créditos interactivos | Conducción libre y respuesta de jefes al claxon | Buena oportunidad de alivio sin castigo; el salto accidental interfiere con esa propuesta. |
| Regreso | Ver créditos y repetir etapas | Permite revisitar el cierre sin otra campaña cuando queda registrado como visto. |

El cobro, puntaje y medallas se procesan antes de mostrar los créditos, por código de Stage. No se vuelven a conceder por mirar el desfile. Esto evita convertir el epílogo en una tarea de acumulación. No se ejecutó una prueba humana de cierre y reanudación tras cerrar el navegador.

Tasas repetidas en los primeros intentos de 30 campañas con compra barata, incluyendo derrotas. Son eventos por minuto simulado, no estímulos percibidos. Daño = textos agrupados al jefe; racha = anuncios destacados; dinero = textos +S/; bonus = recogidas.

| Etapa | Modo | Daño/min | Racha/min | Dinero/min | Bonus/min | Máx. textos simultáneos |
|---|---|---:|---:|---:|---:|---:|
| miraflores | toque | 42.9 | 4.2 | 4.9 | 3.7 | 13 |
| costa-verde | toque | 63.7 | 5.2 | 2.7 | 3.1 | 10 |
| linea-amarilla | toque | 0.0 | 0.0 | 10.5 | 5.5 | 4 |
| miraflores | acelerar | 44.1 | 5.5 | 4.6 | 3.8 | 12 |
| costa-verde | acelerar | 54.8 | 4.3 | 3.2 | 3.0 | 14 |
| linea-amarilla | acelerar | 0.0 | 0.0 | 11.0 | 5.4 | 4 |



No se midió el máximo intervalo sin estímulo. Estas tasas son idénticas a r7. En los créditos no se necesita mantenerlas: la recompensa pasa a ser narrativa, musical e interactiva. Cada distrito ocupa aproximadamente 5,81 s; comprobar con personas si alcanza para leer ficha, nombre del equipo y respuesta al claxon sin competir entre sí.

## 3. Hallazgos nuevos

| ID | Evidencia | Hallazgo | Principio | Severidad | Propuesta concreta | Tipo | Esfuerzo | Cómo medir |
|---|---|---|---|---|---|---|---|---|
| U01 | [src/scenes/Credits.ts:75](https://github.com/tonmaiveD/limargeddon/blob/1121e03b325e66e47380d560092234e952abe21e/src/scenes/Credits.ts#L75), [src/core/input.ts:9](https://github.com/tonmaiveD/limargeddon/blob/1121e03b325e66e47380d560092234e952abe21e/src/core/input.ts#L9), `creditos-sondas.json` y navegador público | Una vez habilitado saltar, el listener global acepta todos los pointerdown. Los botones y volante táctiles propagan ese evento. Espacio además está asignado a claxon y salto. Intentar jugar el desfile puede llevar al poscrédito. | Una acción debe expresar una intención inequívoca | Media | Añadir un control explícito «Ir al poscrédito» y luego «Terminar»; excluir el deck y volante del salto. Mantener C/Espacio para claxon; usar Enter para salto deliberado. Conservar la regla acordada de primera visualización. | UI / entrada | S–M | Ningún toque de volante, acelerador o claxon cambia de parte; el control de salto sí. Probar primera vez, repetición, teclado y táctil. |
| U02 | [src/scenes/Credits.ts:97](https://github.com/tonmaiveD/limargeddon/blob/1121e03b325e66e47380d560092234e952abe21e/src/scenes/Credits.ts#L97), [src/core/audio/sfx.ts:107](https://github.com/tonmaiveD/limargeddon/blob/1121e03b325e66e47380d560092234e952abe21e/src/core/audio/sfx.ts#L107) y `creditos-sondas.json` | El reloj visual acumula como máximo 50 ms por actualización y el audio avanza según AudioContext. A 15 FPS constantes, la secuencia termina en 111,53 s en lugar de 83,61; a los 72 s el popurrí ya terminó y la imagen sigue en Costa Verde. | Correspondencia temporal entre música y narrativa | Media | Separar tiempo narrativo de paso de movimiento. Usar un reloj común no truncado para partes y música, con pausa/reanudación coordinadas y alternativa cuando no hay audio. Mantener límite de paso solo donde se necesite para conducción. | Motor de presentación / audio | M | A 10/15/20/30/60 FPS sintéticos, duración dentro de un cuadro del objetivo y secciones alineadas con tolerancia documentada, por ejemplo ≤150 ms. Probar pausa, silencio y audio no disponible. |


No hay un bloqueo nuevo de severidad alta confirmado. U01 se verificó con el manejador real y con Espacio en el sitio; la consecuencia sobre el deck táctil se deriva del flujo de eventos del código, sin prueba en teléfono físico. U02 es una condición reproducible bajo cadencia simulada; no afirma que los teléfonos reales estén funcionando a 15 FPS.

La escena Credits no registra su propia pausa por foco/visibilidad. Stage conserva sus manejadores cuando lanza los créditos, pero su pausa lógica no actúa cuando la partida ya terminó. Conviene cubrir ese ciclo al resolver U02. No se cuantificó aquí qué hace cada navegador al suspender audio y cuadros, por lo que no se declara un tercer fallo medido de interrupción.

## 4. Simulaciones y experimentos

### Base y comparación

- 217 pruebas del proyecto aprobadas, 31 archivos; compilación aprobada.
- 261 filas de balance × 30 semillas = 7.830 peleas. Todas coinciden con r7.
- 180 campañas oficiales: 30 semillas × dos modos × tres políticas; todas completan las diez etapas dentro del límite de seis intentos.
- 1.800 registros instrumentados de etapa y 2.134 peleas, idénticos a r7. Repiten combinaciones oficiales; no se cuentan como otra muestra independiente.

Balance usa semillas `s*97`, s=1..30. Campañas `c*1000 + etapa*37 + intento*7`, c=1..30. Paso 1/60 s y máximo 300 s por pelea. Cada celda siguiente indica victorias al primer intento /30 y mediana del intento victorioso según el comando oficial.

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



No ajustar Costa Verde por esta actualización: con compra barata siguen 23/30 victorias iniciales por toque y 15/30 acelerando. Con aguante por toque, 26/30 y 126 s frente a 23/30 y 75 s comprando barato. El cierre no cambia estas relaciones.

### Experimento 1 · Separación entre conducir y saltar

**Hipótesis:** los controles de interacción no deben adelantar los créditos. Se llamó al manejador real `onSkip` de CreditsScene a t=10 s, con salto deshabilitado y habilitado, para cinco tipos de entrada. La bandera se fija directamente; no se falsifica una campaña completada.

| Entrada | Salto deshabilitado | Salto habilitado |
|---|---|---|
| Pointerdown | Permanece en 10 s | Pasa a 71,6129 s, poscrédito |
| Espacio | Permanece en 10 s | Pasa a 71,6129 s |
| C | Permanece en 10 s | Permanece en 10 s |
| Flecha izquierda | Permanece en 10 s | Permanece en 10 s |
| Enter | Permanece en 10 s | Pasa a 71,6129 s |

**Resultado:** el manejador no distingue un toque sobre controles de un toque para saltar. La reproducción pública con Espacio confirmó el paso a «Más tarde...». Corregir el destino y filtrado del evento; no eliminar la interacción del desfile.

### Experimento 2 · Reloj visual y musical

**Hipótesis:** imagen y popurrí mantienen su secuencia aunque varíe la frecuencia de actualización. Se ejecutó `CreditsScene.update` real con dibujo sustituido por funciones vacías y AudioContext falso cuyo reloj avanza por tiempo transcurrido. El secuenciador Sfx es el real; sus nodos no producen sonido. No se simula la suavización de Phaser en esta prueba: se entregan intervalos constantes directamente a la escena.

| Cadencia de entrada | Fin de la escena, tiempo transcurrido | Reloj visual a los 72 s | Parte visual a los 72 s | Popurrí a los 72 s |
|---:|---:|---:|---|---|
| 60 FPS | 83,62 s | 72 s | Poscrédito | Terminado |
| 30 FPS | 83,63 s | 72 s | Poscrédito | Terminado |
| 20 FPS | 83,65 s | 72 s | Poscrédito | Terminado |
| 15 FPS | 111,53 s | 54 s | Costa Verde | Terminado |
| 10 FPS | 167,30 s | 36 s | Callao | Terminado |

**Resultado:** el límite de 50 ms ralentiza el reloj narrativo cuando cada cuadro tarda más. El objetivo está definido en 83,6129 s, con poscrédito de 12 s. El movimiento puede conservar su límite, pero la narrativa no debería alargarse automáticamente por la cadencia de dibujo. La prueba omite el dibujo del poscrédito, incluida su música de tensión; la columna musical se refiere solo al popurrí de créditos.

### Experimento 3 · Cierre de los hallazgos anteriores

**Hipótesis:** no desaparecen intervalos largos y la actividad del anillo se representa correctamente. Se repitieron los casos de r7 con el código nuevo.

| Caso | Resultado actual |
|---|---|
| Intervalo de 4.999 / 5.000 ms | Conservado en estadísticas y bloqueos |
| Intervalo de 5.001 / 6.000 ms | Conservado como anomalía separada |
| 40 bloqueos de 120 ms | Contador 40, lista 30, truncamiento explícito |
| Anillo en aviso / retención / liberación | Alfa 0,3 / 0,95 / 0,3 |
| Flecha en 9.000 estados | Error de anclaje <0,000001 px |
| Caja en 300 scrolls | Error de esquina <0,000001 px |
| Correas del avión | Ambas por encima de la imagen del Tico |

**Conclusión:** cerrar T01 y T02. Una muestra con anomalías no debe aprobarse solo porque sus percentiles restantes son buenos; el registro conserva la evidencia necesaria para tomar esa decisión.

### Experimento 4 · Continuidad de acción y enseñanza

Se repitieron campañas instrumentadas, 240 variantes del enrosque, 240 de ruta, 600 primeros intentos de enseñanza y 180 variantes de semáforos. Los dos JSON de campañas/variantes y enseñanza/semáforos son idénticos a r7. Las sondas aisladas de reglas anteriores terminaron sin excepciones.

**Conclusión:** continuidad respaldada en la simulación sin dibujo. No certifica el flujo completo de Stage → Credits → Results; ese flujo fue revisado por código, y la entrada desde menú fue observada en navegador. Queda pendiente probarlo tras una victoria humana en teléfono.

## 5. Mejoras rápidas

1. **Separar salto e interacción**, `src/scenes/Credits.ts`. Evitar que un toque en el deck salte y retirar Espacio de las teclas de salto. Añadir un control visible con la acción exacta de destino.
2. **Explicar controles del desfile**, en la propia escena. Una indicación breve como «Maneja y toca el claxon» durante el primer distrito, sin tapar la ficha. Es una mejora propuesta, no una causa de derrota medida.
3. **Prueba de entrada de escena**, `tests/creditos.test.ts` o un archivo de integración. Cubrir bubbling de controles y el manejador de la escena; las pruebas de `canSkip` y `skipTo` por sí solas no detectan U01.
4. **Prueba de cadencia**, ampliando pruebas de créditos. Mantener las secuencias de 15 y 60 FPS y validar la correspondencia de partes. La solución completa de U02 puede requerir más de una tarde.

No cambiar nombres del equipo, textos aprobados, música por distrito ni regla de primera visualización para resolver estos fallos.

## 6. Apuestas grandes y siguiente paso

1. **Ciclo audiovisual completo.** Una línea de tiempo compartida con pausa, reanudación, salto, modo silencioso y audio suspendido. Riesgo: reiniciar canciones o duplicar reproducción al volver del fondo. Verificar desde menú y tras victoria, no solo con capturas congeladas.
2. **Sesiones del cierre en teléfono.** Probar lectura de ficha, nombre y réplica al claxon, disfrute de la música y claridad del poscrédito con 6–8 personas. No afirmar que un patrón musical resulta placentero o memorable porque pase pruebas estructurales de notas.
3. **Retomar el piloto gráfico con diagnóstico cerrado.** Las correcciones de T01/T02 permiten avanzar sin reabrir indefinidamente las herramientas. Este diff aporta créditos y audio, no demuestra que el piloto de arte de Costa Verde esté producido o validado.

La duración nominal del cierre está dentro de los 60–90 s documentados. Su carácter no saltable en primera visualización es una decisión de diseño que se conserva; observar si genera abandono y llevar cualquier cambio de política como decisión separada, con lo que se ganaría o perdería.

## 7. Puntaje, ranking y recompensa sana

Mantener la fórmula v2 y el ranking local. En Normal, hasta 10.000 puntos: victoria 4.000, tiempo 2.000, daño efectivo derecho 1.500, racha 1.000, limpieza 1.000 y objetivo 500. La ruta usa intentos y marea en lugar de derecha y racha. Multiplicadores Fácil ×0,7, Normal ×1 y Difícil ×1,25.

El desfile no suma daño, monedas ni puntos. No necesita premios por permanecer hasta el final ni una recompensa oculta por tocar el claxon repetidamente. El valor del epílogo puede ser humor, reconocimiento y sorpresa. El retorno narrativo a Lima no reinicia la campaña ni desbloquea otra etapa según la implementación revisada; conservar esa distinción al presentar «CONTINUARÁ».

## 8. Preguntas para partidas reales

- ¿Se comprende que el desfile se puede manejar y que el claxon obtiene una respuesta?
- ¿Se alcanza a leer ficha, crédito y réplica durante los 5,81 s de un distrito?
- ¿La primera visualización mantiene interés hasta el final o se siente larga después de la pelea?
- ¿El remate se entiende como broma y promesa narrativa, sin hacer creer que se perdió el progreso?
- ¿Imagen y música siguen alineadas después de una llamada, cambio de aplicación o tirón?
- ¿La música resulta agradable con parlantes de teléfono, a volumen bajo y durante toda la secuencia?

### Entrega

`REPRODUCIR.md` documenta versión, comandos y limitaciones. El paquete contiene evidencia original, scripts externos y capturas públicas. Que una sonda termine significa que produjo sus mediciones; no que todos los comportamientos medidos sean correctos. Las 217 pruebas del proyecto se ejecutaron por separado.
