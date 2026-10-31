# Limargeddon · Novena auditoría del desarrollo

30 de octubre de 2026. Revisión `e8391154686a02bc93fd13daca62b781d2c55df1`, hasta el PR #51. Base comparada: `1121e03b325e66e47380d560092234e952abe21e`, octava auditoría, PR #47.

## 1. Resumen ejecutivo

- El combate conserva su comportamiento: 243 pruebas y compilación aprobadas, 7.830 peleas de balance y 180 campañas con los mismos resultados que r8.
- Los créditos corrigen el salto accidental con controles y el retraso visual a baja frecuencia de cuadros; la indicación de claxon mejora su descubrimiento.
- El desarrollo incorpora una vía para recoger resultados, derrotas, compras y abandonos explícitos, con cola, versión de juego y exclusión del modo prueba.
- La salida de peleas omite el modo de disparo y la mejor racha: los informes no podrán comparar correctamente los dos modos mientras falten esos campos.
- Desactivar el envío no frena los manejadores de salida ya instalados ni las siguientes tandas de un envío en curso.
- El receptor filtra nombres de campos externos, pero no valida todo su contenido: acepta objetos arbitrarios dentro de `frames`, `fireMode` y `lastHit`.
- Recomendación: corregir primero este circuito y después producir el informe de datos. Mantener el balance; el piloto gráfico sigue en pausa por decisión del dueño.

### Alcance y método

Se obtuvo la rama pública `main`, se fijó el SHA indicado y se revisaron los 29 archivos cambiados, las decisiones ADR 0050/0051 y su relación con el estado del proyecto. La copia auditada está aislada; no se editaron archivos de producción, no se hicieron commits, PR ni despliegues. El lockfile de la aplicación no cambió y se reutilizaron sus dependencias existentes. El receptor añade dependencias propias; no se ejecutó un despliegue ni una verificación de tipos con su entorno Cloudflare instalado.

Se ejecutaron pruebas oficiales, compilación, balance de las once configuraciones del reporte, campañas, sondas históricas y nuevas pruebas locales del envío, receptor y créditos. Los resultados reales de las carpetas se analizaron aparte: **35 PNG, 25 únicos y 10 copias exactas**. No son otras 25 campañas ni 25 jugadores identificados.

Se revisó el menú publicado en `?prueba`, una escena congelada de créditos con respuesta al claxon y la página pública de privacidad. La captura congelada sirve para inspección visual, no prueba la sincronización ni la permanencia temporal. La URL publicada no certifica por sí misma el SHA desplegado. No se jugó una campaña humana completa en esta auditoría.

**Todos los experimentos de datos usaron almacenamiento, transporte y base de datos sustituidos en local.** Se ejecutó el manejador real del receptor con una base simulada en una prueba. No se enviaron registros sintéticos a la base publicada, no se accedió a claves ni se descargaron partidas privadas. La retención y la configuración de producción se revisaron por código, sin certificar su ejecución remota.

### Avance desde r8 y seguimiento

| Cambio | Evaluación |
|---|---|
| PR #48 · Entrada y reloj de créditos | Cierra U01 y el retraso principal de U02; queda un pequeño salto al reanudar, V04. |
| PR #49 · Priorización | Indexación en pausa. No se recomienda reabrirla aquí. |
| PR #50 · Envío de datos | Funcionalidad nueva con dos fallos confirmados, V01 y V02. |
| PR #51 · Receptor | Validación parcial, V03. Informe y documentación final siguen pendientes declarados. |
| T01/T02, S01/S02, Q01/Q02 | Sondas históricas idénticas a r8; se conservan las correcciones de anomalías, sectores, intervalos crudos, proyección y capas. |

La regla de no saltar la primera visualización y permitir saltar al repetir está aprobada. La recogida automática con aviso e interruptor también es una decisión explícita del proyecto. Los hallazgos exigen que esa decisión funcione como se describe; no proponen sustituirla por otro diseño ni emiten una evaluación jurídica.

## 2. Circuito de acción y recompensa

| Escala | Recompensa o respuesta | Estado y hueco relevante |
|---|---|---|
| Acción | Daño, racha, dinero y recogidas | Sin variación en simulación. No hay evidencia nueva para aumentar su frecuencia. |
| Pelea | Puntaje, cobro, medallas y accesorio | Las capturas muestran estos premios. La telemetría debe conservar el modo y racha para explicar sus diferencias. |
| Taller | Compra y progreso | Se añade registro de compras. Sin identificador común no se puede reconstruir una secuencia individual de compras y peleas; la mejora instalada en cada pelea sí permite segmentar. |
| Campaña | Diez etapas, cierre y créditos | Simulación estable. Desfile más fácil de manejar sin saltarlo. No requiere añadir monedas por verlo. |
| Repetición | Récord y medallas persistentes | IMG_0838 muestra medalla «Racha de 8» obtenida con racha actual 6: representa un logro persistente, no demuestra un error de cálculo. |
| Aprendizaje del desarrollo | Datos reales para ajustar reglas | V01–V03 impiden tratar el circuito como una fuente plenamente fiable. La integridad de la medición pasa a ser la prioridad. |

Tasas repetidas para primeros intentos de 30 campañas con compra barata, incluidas derrotas. Daño son textos agrupados al jefe, racha son anuncios destacados, dinero son textos +S/ y bonus son recogidas. Son eventos por minuto simulado, no medidas de placer o atención.

| Etapa | Modo | Daño/min | Racha/min | Dinero/min | Bonus/min | Máx. textos simultáneos |
|---|---|---:|---:|---:|---:|---:|
| miraflores | toque | 42.9 | 4.2 | 4.9 | 3.7 | 13 |
| costa-verde | toque | 63.7 | 5.2 | 2.7 | 3.1 | 10 |
| linea-amarilla | toque | 0.0 | 0.0 | 10.5 | 5.5 | 4 |
| miraflores | acelerar | 44.1 | 5.5 | 4.6 | 3.8 | 12 |
| costa-verde | acelerar | 54.8 | 4.3 | 3.2 | 3.0 | 14 |
| linea-amarilla | acelerar | 0.0 | 0.0 | 11.0 | 5.4 | 4 |

No se midió el mayor intervalo sin estímulo. Las capturas tampoco permiten medirlo. No se infiere una respuesta de dopamina, disfrute o frustración a partir de estas tasas. En créditos, cada distrito ocupa unos 5,81 segundos; comprobar lectura de ficha y réplica al claxon con personas sigue siendo pertinente.

## 3. Hallazgos priorizados

S = cambio localizado; M = cambio de varios componentes con pruebas de integración; L = trabajo amplio. No son compromisos de calendario.

| ID | Evidencia | Hallazgo | Principio | Severidad | Propuesta concreta | Tipo | Esfuerzo | Cómo verificar |
|---|---|---|---|---|---|---|---|---|
| V01 | [src/core/share.ts:28](https://github.com/tonmaiveD/limargeddon/blob/e8391154686a02bc93fd13daca62b781d2c55df1/src/core/share.ts#L28), [src/core/telemetry.ts:98](https://github.com/tonmaiveD/limargeddon/blob/e8391154686a02bc93fd13daca62b781d2c55df1/src/core/telemetry.ts#L98); sonda `optOut` | Apagar datos después del arranque deja activos los envíos al ocultar/cerrar. Una tanda ya iniciada continúa con la siguiente aunque la preferencia cambie. | La preferencia vigente debe gobernar cada nuevo envío | Alta | Consultar `sharing(test)` dentro de cada manejador y antes de cada tanda; detener nuevas tandas al desactivar. Definir qué ocurre con la cola pendiente y explicarlo. Un envío que ya salió no se puede retirar retroactivamente. | Motor / UI | M | Con cola pendiente y preferencia apagada: cero nuevas solicitudes y cero beacons. Probar arranque encendido→apagado y apagado→encendido, ocultar, cerrar y cambiar durante la primera tanda. |
| V02 | [src/core/telemetry.ts:71](https://github.com/tonmaiveD/limargeddon/blob/e8391154686a02bc93fd13daca62b781d2c55df1/src/core/telemetry.ts#L71); sonda `fields` | `fireMode` y `bestCombo` quedaron dentro del comentario de la línea de tiempo. No aparecen en el JSON de pelea ni en el guardado del receptor. | Medir las variables que sustentan la decisión | Alta para el balance basado en datos | Restaurar ambos campos fuera del comentario y probar el contrato de extremo a extremo para los dos modos y rachas 0/26. Marcar históricos sin modo como desconocidos, sin atribuirlos a toque. | Motor / datos | S | Un registro de entrada con modo y racha conserva exactamente ambos valores al llegar a la fila del receptor. |
| V03 | [server/src/validate.ts:35](https://github.com/tonmaiveD/limargeddon/blob/e8391154686a02bc93fd13daca62b781d2c55df1/server/src/validate.ts#L35), [server/src/validate.ts:46](https://github.com/tonmaiveD/limargeddon/blob/e8391154686a02bc93fd13daca62b781d2c55df1/server/src/validate.ts#L46); sonda `validation` | Se admiten campos internos ajenos al contrato y tipos inválidos. La lista externa de campos no protege los objetos anidados. | Recoger y guardar solo el esquema permitido | Media | Validar y reconstruir `frames` con sus campos numéricos/listas permitidos; validar modo como enum, `replay` como booleano y `lastHit` como cadena acotada. Rechazar o eliminar campos desconocidos también dentro de objetos. | Receptor / datos | M | El payload sintético de la sonda se rechaza o queda saneado; no se conserva `frames.playerName`, `frames.device` ni objetos en modo/último golpe. Los tres eventos legítimos siguen aceptándose. |
| V04 | [src/core/audio/sfx.ts:123](https://github.com/tonmaiveD/limargeddon/blob/e8391154686a02bc93fd13daca62b781d2c55df1/src/core/audio/sfx.ts#L123), [src/scenes/Credits.ts:82](https://github.com/tonmaiveD/limargeddon/blob/e8391154686a02bc93fd13daca62b781d2c55df1/src/scenes/Credits.ts#L82); sonda `pause` | Al reanudar, el secuenciador usa el paso ya adelantado por la programación del audio. En tres pausas el reloj visual salta 178–339 ms en el primer cuadro. | Continuidad temporal al retomar | Baja | Guardar el instante narrativo efectivo al pausar y reanudar desde él, manteniendo el avance ya reproducido separado del que solo estaba programado. | Motor audiovisual | M | Pausar en 10/35/65 s durante 30 s, a 60 FPS: pausa sin avance y reanudación con salto ≤150 ms, sin duplicar notas. Validar también en navegador real. |

**V01** contradice la promesa publicada de que al desactivar ya no se envía nada. El caso requiere datos en cola o un envío en curso; no significa que cada jugador que apaga la opción necesariamente envíe nuevos registros. La construcción de eventos nuevos mediante `track` sí respeta la preferencia. La prueba aísla los otros caminos.

**V02** no afecta el modo de juego ni borra la racha del registro local. Afecta la copia enviada al servidor. El campo es opcional en los tipos y las pruebas existentes no comprueban su presencia; por eso pasan. No se sabe cuántos registros de producción están afectados porque no se accedió a la base.

**V03** se demostró con datos deliberadamente mal formados y ficticios. El emisor normal sí elimina la descripción completa del equipo antes de enviar `frames`. No se afirma que se haya producido una filtración real ni que usuarios externos hayan atacado el servicio. Se confirma que la promesa del receptor de guardar únicamente el contrato no se cumple para datos anidados. La comprobación de `Origin` tampoco identifica a una persona ni sustituye la validación del contenido.

**V04** no reabre el retraso de decenas de segundos de U02: ese fallo está resuelto. Es una discontinuidad pequeña y separada. Las sondas no producen sonido; falta comprobar si el salto se percibe al escuchar.

### Precisiones para el informe y documentación pendientes

- La página pública afirma que no se pueden vincular dos partidas. Para el público general no se incorpora un identificador estable; la etiqueta voluntaria `tester` sí permite agrupar registros del equipo de pruebas. Documentar esta excepción y su consentimiento, sin convertirla en identificación del público general.
- `abandono` significa volver al menú con una pelea en curso. Cerrar una pestaña o dejarla suspendida no crea por sí solo ese evento. El futuro informe debe llamarlo «salidas al menú», o declarar expresamente el límite, no presentarlo como todo abandono.
- Un lote con un evento válido y otro inválido recibe 204, guarda uno y el cliente elimina ambos. Es coherente con descartar inválidos, pero el contador del cliente significa enviados/procesados, no insertados. Añadir conteos o estados por registro si se necesita reconciliación; no reintentar inválidos indefinidamente.
- `text.length` mide unidades de cadena, no bytes UTF-8; los límites anunciados de 64 KB y 8 KB necesitan comprobación en bytes. La cola se divide por cantidad, no por bytes. El lote legítimo ensayado de 50 eventos y 45.168 bytes pasó: no se ha demostrado aquí un atasco con eventos reales.
- `docs/estado.md` aún encabeza fecha 26 de octubre y PR #48, aunque enumera avances posteriores. Actualizarlo al cerrar la documentación prevista. No confundir documentación pendiente con funcionalidad del informe ya entregada: `npm run datos` todavía no existe en este SHA.

## 4. Resultados y experimentos

### 4.1 Base de simulación

- **243 pruebas** del proyecto aprobadas, en 33 archivos. Compilación de la aplicación aprobada.
- **261 filas × 30 semillas = 7.830 peleas** de balance. Las once configuraciones incluyen prototipo y variantes adicionales de los scripts. Todas las filas coinciden con r8.
- **180 campañas**: 30 semillas × 2 modos × 3 políticas, con las diez etapas completadas dentro del límite de seis intentos por etapa. Las 60 filas del reporte oficial coinciden con r8.
- **1.800 registros de etapa y 2.134 peleas instrumentadas**. Sus JSON, los de variantes/enseñanza, las sondas de reglas y los diagnósticos coinciden íntegramente con r8. Las campañas instrumentadas repiten combinaciones oficiales, no constituyen otra muestra independiente.

Semillas: balance `s*97`, s=1..30; campaña `c*1000 + etapa*37 + intento*7`, c=1..30. Paso 1/60 s; máximo 300 s por pelea. Los scripts no simulan percepción ni destreza humana, y la suite de combate no ejercita envío, privacidad o sincronización de escenas.

Cada celda indica victorias al primer intento /30 y mediana del intento ganador según el comando oficial.

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

No se propone cambiar multiplicadores ni vida de jefes. En Costa Verde, compra barata conserva 23/30 victorias iniciales por toque frente a 15/30 acelerando; con aguante por toque son 26/30 y 126 s. Las compras importan tanto como el modo, por lo que las futuras comparaciones deben separarlas.

### 4.2 Experimento propio A · Integridad del dato de pelea

**Hipótesis:** el evento enviado conserva modo y mejor racha del registro de pelea. **Variante:** registro con `fireMode=toque`, `bestCombo=26`, puntaje 9822 y mejoras; se pasa por `fightEvent` y `toRow` reales.

**Resultado:** faltan los dos campos tanto en el envío como en la fila. Puntaje y mejoras sí se conservan. **Conclusión:** V02 confirmado; corregir antes de interpretar diferencias entre modos. El historial ya recibido sin esos campos no se debe completar suponiendo un modo.

### 4.3 Experimento propio B · Desactivación con trabajo pendiente

**Hipótesis:** después de apagar la preferencia, ningún camino inicia otro envío. **Variantes:** instalar los manejadores con la opción encendida, agregar una pelea a la cola, apagar y simular `pagehide`/`visibilitychange`; por separado, apagar tras la primera tanda de una cola de 60.

**Resultado:** los dos manejadores llaman a `sendBeacon` después de apagar. La cola de 60 se envía como 50 y 10, aun cuando la preferencia cambia tras la primera llamada. **Conclusión:** V01 confirmado. Son llamadas capturadas localmente, no entregas a un servidor real. La deduplicación por ID evita contar dos veces el mismo evento si ambos beacons llegan, pero no resuelve la preferencia ignorada.

### 4.4 Experimento propio C · Contrato del receptor

**Hipótesis:** solo se almacena la estructura prevista. **Variante:** evento con `frames.playerName`, `frames.device`, objeto en `fireMode`, objeto en `lastHit` y cadena en `replay`, usando valores ficticios.

**Resultado:** `toRow` lo acepta y conserva todos esos contenidos. **Conclusión:** V03 confirmado. La prueba no usa datos privados ni prueba acceso a la base remota.

**Control adicional:** un lote de 50 registros creados con `FrameMeter`, incluyendo 30 bloqueos y 30 anomalías por registro, mide 45.168 bytes; se acepta y vacía la cola. No se convierte una posibilidad de exceso de tamaño en un fallo reproducido. En otra prueba, el manejador HTTP real con base simulada responde 204 a un lote mixto: se registra una inserción mientras el cliente informa dos enviados. Esta prueba no verifica SQL o deduplicación en D1 real.

### 4.5 Experimento propio D · Créditos corregidos y pausa

Se ejecutaron el manejador de entrada, actualización de escena y secuenciador reales con sustitutos de Phaser y AudioContext. El dibujo está desactivado, incluida la música de tensión que nace al dibujar el poscrédito. El reloj del audio se hace avanzar de manera controlada; `rawDelta` se entrega explícitamente. No son mediciones de FPS de un teléfono.

| Entrada al repetir, t=10 s | Resultado |
|---|---|
| Toque de pantalla | Salta al poscrédito, 71,6129 s |
| Toque cuyo destino pertenece a deck o botón | Permanece en 10 s |
| Espacio, C o flecha izquierda | Permanece en 10 s |
| Enter | Salta al poscrédito |
| Cualquiera de las anteriores con salto deshabilitado | Permanece en 10 s |

| FPS sintéticos | Fin con popurrí | Fin sin popurrí | Reloj visual a los 72 s con popurrí |
|---:|---:|---:|---:|
| 60 | 83,667 s | 83,617 s | 71,950 s |
| 30 | 83,667 s | 83,633 s | 71,950 s |
| 20 | 83,700 s | 83,650 s | 71,950 s |
| 15 | 83,667 s | 83,667 s | 71,950 s |
| 10 | 83,700 s | 83,700 s | 71,950 s |

La duración nominal es 83,6129 s. Con popurrí hay una programación inicial de 50 ms; el final queda dentro de ese desplazamiento más un cuadro. A 15 FPS antes eran 111,53 s y ahora 83,67 s; a 10 FPS antes 167,30 s y ahora 83,70 s. **U01 y el defecto principal U02 quedan cerrados.**

| Pausa a tiempo transcurrido | Visual antes | Visual tras 30 s pausado | Visual al primer cuadro de regreso | Salto |
|---:|---:|---:|---:|---:|
| 10 s | 9,950 s | 9,950 s | 10,128 s | 178 ms |
| 35 s | 34,950 s | 34,950 s | 35,289 s | 339 ms |
| 65 s | 64,950 s | 64,950 s | 65,168 s | 218 ms |

La pausa detiene la imagen; el pequeño adelanto al volver es V04. Quedan pendientes escucha, suspensión del audio por el navegador y ciclo completo Stage → Credits → Results en un teléfono real.

### 4.6 Lo que aportan las capturas reales

Todas son victorias por toque: 19 en Normal, 4 en Fácil y 2 en Difícil. No hay registros completos de derrota, mejoras instaladas, semilla, versión ni fluidez. No se conoce qué capturas pertenecen a una misma persona o campaña. Las medianas siguientes se calculan entre capturas únicas de **Normal**; no sustituyen la mediana local impresa en cada pantalla.

| Etapa | Capturas Normal | Duración mínima–máxima | Mediana entre capturas |
|---|---:|---|---|
| 1 | 5 | 69–152 s | 83 s |
| 2 | 4 | 50–102 s | 75.5 s |
| 3 | 1 | 86–86 s | 86 s |
| 4 | 1 | 70–70 s | 70 s |
| 5 | 1 | 73–73 s | 73 s |
| 6 | 1 | 29–29 s | 29 s |
| 7 | 2 | 56–94 s | 75 s |
| 8 | 1 | 85–85 s | 85 s |
| 9 | 1 | 148–148 s | 148 s |
| 10 | 2 | 78–82 s | 80 s |

Lecturas útiles:

- Miraflores va de 69 a 152 s en Normal y San Isidro de 50 a 102 s. Existe dispersión real entre capturas, pero no se atribuye exclusivamente a dificultad o habilidad sin mejoras y contexto.
- Costa Verde tiene una victoria Normal de 148 s. Es una señal para investigar duración y comprensión, no una tasa de éxito ni evidencia suficiente para bajar vida.
- Callao tiene una victoria de 29 s. Revisar mejoras y estilo de juego antes de concluir que es demasiado fácil. No se usa el factor «humanos tardan 1,6 veces más» como ley validada para estas personas.
- Línea Amarilla muestra 82 y 78 s, ambas con 3 intentos restantes y 4 toques de marea. La segunda paga la mitad por repetición. No se endurece la etapa solo por estas dos victorias.
- Las pantallas con 1 de 3 o 1 de 2 victorias indican intentos previos, pero sumar denominadores de historiales mezclados duplicaría o mezclaría sesiones. No se calcula una tasa global.
- Los puntajes 10.079 y 10.109 corresponden a Difícil. Son compatibles con el multiplicador ×1,25 y no contradicen el máximo de 10.000 definido para Normal.

La transcripción completa se incluye en `Resultados-de-juego-consolidados-2026-10-30.md`. Las imágenes originales siguen en sus carpetas; no se duplican dentro del paquete.

## 5. Mejoras rápidas y orden recomendado

1. **Restaurar modo y racha**, `src/core/telemetry.ts:71`. Sacar las dos asignaciones del comentario; añadir comprobaciones de conservación para toque/acelerar y racha 0/26. Cambio localizado, primera corrección del contrato.
2. **Bloquear envíos al desactivar**, `src/core/share.ts:32` y el bucle de `flush`. El parche de manejadores es pequeño; completar también el control por tanda y las pruebas de transición antes de dar V01 por cerrado.
3. **Completar el validador**, `server/src/validate.ts:35`. Primero los campos omitidos de validación; el saneamiento completo de `frames` puede requerir más de una tarde. No basta con una prueba que solo agregue `playerName` al nivel superior.
4. **Ajustar texto de privacidad**, `public/privacidad.html`: explicar la etiqueta voluntaria del equipo de pruebas y describir la desactivación conforme al comportamiento corregido. No cambiar la política aprobada de recogida automática.
5. **Actualizar el estado**, `docs/estado.md` y ADR 0051: fecha, PR #51, fases entregadas y pendientes; evitar presentar el informe futuro como disponible.
6. **Definir calidad mínima para el informe**, antes de PR C: separar por build/etapa/dificultad/modo, marcar modo desconocido y registrar rechazados. Mantener compras y salidas al menú como eventos independientes, sin inventar una trayectoria individual.

Prioridad de entrega: **V01 y V02 → V03 → informe PR C y documentación PR D → V04**. No abrir en paralelo el piloto gráfico ni la indexación pausados para resolver estos hallazgos.

## 6. Apuestas de mayor alcance

1. **Contrato verificable entre juego y receptor.** Una misma definición de campos y pruebas de integración que recorran registro local → evento → cola → receptor → exportación. Riesgo: confundir aceptación HTTP con persistencia de cada evento. Criterio: pruebas con cola pendiente, opciones cambiantes, fallos de red, campos desconocidos y lotes mixtos.
2. **Informe que explicite los límites de los datos.** Mostrar cantidad de eventos, fechas/builds, victorias y derrotas, duración condicionada a resultado y equipo, daño por fuente y fluidez. Con el esquema actual no prometer retención de jugadores, conversión entre etapas, número de jugadores únicos o embudos individuales. Riesgo: un reporte muy preciso en apariencia con denominadores incorrectos. Definir primero las preguntas que el esquema sí responde.
3. **Sesiones humanas dirigidas.** Con 6–8 personas, comparar ambos modos y recoger registros completos, además de observar salida del enrosque, peajes, taller y lectura del desfile. Separar al equipo etiquetado del público general. Riesgo: atribuir diferencias de mejoras o experiencia al modo de disparo. Cambiar balance solo después de este contraste y del saneamiento de V02.

## 7. Puntaje, ranking y recompensa sana

Mantener fórmula v2 y ranking local. Normal suma hasta 10.000 puntos: victoria 4.000, tiempo 2.000, daño por la derecha 1.500, racha 1.000, limpieza 1.000 y objetivo 500. Ruta sustituye derecha/racha por intentos y marea. Fácil ×0,7 y Difícil ×1,25. Las capturas de Difícil por encima de 10.000 no requieren un parche.

Conservar los premios narrativos, medallas persistentes y objetos de victoria. No añadir recompensas por consentir datos ni castigos por apagar la recopilación. La ausencia de un identificador de jugador limita ciertas preguntas analíticas por diseño; no se recomienda introducirlo para fabricar métricas de retorno. El informe debe versionar el contexto: `scoreV` existe en el registro local pero no se envía en este contrato; para cambios futuros conviene incluir esa versión o documentar su correspondencia con `build`.

El ranking compartido continúa siendo opcional y distinto del receptor de datos. La recogida actual no constituye un sistema de validación de récords públicos.

## 8. Preguntas que necesitan partidas reales

- En Costa Verde, ¿los 148 s se sienten tensos o repetitivos y qué mejoras estaban instaladas?
- ¿Las personas distinguen una medalla obtenida antes de una condición cumplida en esta partida?
- ¿Qué provoca salir al menú: dificultad, prueba de controles, cambio de etapa o interrupción externa?
- ¿Se entiende qué se recopila y se encuentra con facilidad el interruptor?
- ¿Se descubre el claxon del desfile y alcanza el tiempo para leer la respuesta y los créditos?
- ¿El pequeño salto tras una llamada o cambio de app se escucha o percibe visualmente?

### Entregables y límites finales

`REPRODUCIR.md` reúne los comandos. `evidencia/` conserva logs, JSON de sondas, comparación con r8 y captura pública. `SHA256SUMS.txt` permite comprobar el paquete. Las sondas de hallazgos están diseñadas para registrar y confirmar el comportamiento actual, por lo que terminar en verde no significa que el comportamiento sea correcto.

El próximo hito útil es disponer de datos completos y respetar su desactivación en todos los caminos. El combate no muestra regresiones en las pruebas ejecutadas; eso no certifica rendimiento, disfrute, retención o privacidad de toda la infraestructura publicada.
