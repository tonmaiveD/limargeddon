# Limargeddon · Séptima auditoría

26 de octubre de 2026. Versión `364ee7902bd1091515e3727efe3f570ee66a36f1`, PR #42–43. Comparación con la sexta auditoría, `7a749a3`.

## 1. Resumen ejecutivo

- El cambio corrige el problema principal del registro de fluidez: los picos de 40, 120 y 300 ms se conservan, sin cambiar el tiempo de simulación.
- La vista de diagnóstico incorpora los círculos de daño y recogida, y corrige la proyección de la caja del Tico sobre la curva.
- Pasan 192 pruebas y la compilación; las 7.830 peleas de balance y 180 campañas conservan los resultados de la sexta auditoría.
- Queda un límite importante de medición: cualquier intervalo superior a 5 segundos desaparece, aunque no haya una pausa explícita.
- La vista del enrosque dibuja sectores activos también durante aviso y liberación, cuando la regla de bloqueo no se ejecuta.
- La validación en teléfonos y con jugadores continúa pendiente. Ningún resultado sintético demuestra por sí solo fluidez o comprensión humana.
- Recomiendo cerrar estos dos ajustes acotados mientras se prepara la dirección visual del piloto; no cambiar balance ni reiniciar el trabajo gráfico.

### Alcance

Se revisó el diff completo desde `7a749a3`, el estado del proyecto, la ADR 0046 y las reglas utilizadas por la vista de contacto. Se ejecutaron pruebas, compilación, balance completo, campañas y sondas externas. No se modificó código de producción, no se hicieron commits ni PR. El checkout aislado usa un enlace a dependencias existentes de las mismas versiones; ese enlace es el único elemento no seguido por Git.

En el navegador se abrió Costa Verde con `?prueba&colisiones` y se observó la leyenda y las formas del jugador durante una partida de prueba sin conducción activa; luego se pausó. Se guardó una captura. Esto confirma una vista publicada compatible con el cambio, no el SHA exacto del despliegue ni una prueba de usabilidad. No se midieron FPS de teléfonos, latencia táctil, consumo real de memoria ni satisfacción.

### Seguimiento de la sexta auditoría

| Hallazgo | Resultado | Alcance pendiente |
|---|---|---|
| S01 · Tiempos suavizados | Causa principal corregida. `Stage` entrega `rawDelta`; p99, máximo y recuentos conservan los tres picos ensayados. Umbral unificado en 33,3 ms. | T01: censura de intervalos >5 s. No afirmar que se detectan todos los bloqueos. |
| S02 · Formas y proyección | Corregidos los casos anteriores: círculos del Tico de radios 14 y 24; esquinas de caja alineadas en 300 tramos de curva. | T02: actividad de sectores del enrosque. La herramienta no está certificada para toda interacción posible. |
| Q01 · Salida del anillo | Sigue corregido | 9.000 posiciones, error de anclaje <0,000001 px. |
| Q02 · Correas | Sigue corregido en la sonda de capas | Dos correas en profundidad 30,5 frente al Tico en 30. No se capturó el cierre real. |

Los problemas originales de S01/S02 no se repiten como si no se hubieran trabajado. T01 y T02 describen límites concretos de la solución nueva.

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


## 3. Hallazgos residuales

| ID | Evidencia | Hallazgo | Principio | Severidad | Propuesta concreta | Tipo | Esfuerzo | Cómo comprobar |
|---|---|---|---|---|---|---|---|---|
| T01 | [src/core/frames.ts:13](https://github.com/tonmaiveD/limargeddon/blob/364ee7902bd1091515e3727efe3f570ee66a36f1/src/core/frames.ts#L13), [src/core/frames.ts:37](https://github.com/tonmaiveD/limargeddon/blob/364ee7902bd1091515e3727efe3f570ee66a36f1/src/core/frames.ts#L37) y `diagnosticos.json` | Se clasifica todo intervalo >5.000 ms como suspensión y se descarta sin evidencia de cambio de foco. Un bloqueo de 5.001 ms puede dejar máximo 16 ms y cero bloqueos. | La medición debe conservar anomalías, no inferir su causa solo por duración | Media para aprobar rendimiento | Excluir por pausa/visibilidad explícita. Si no puede distinguirse suspensión del equipo, conservar el intervalo como anomalía de causa desconocida y evitar certificar fluidez con esa muestra. | Motor / diagnóstico | S | Probar 4.999, 5.000, 5.001 y 6.000 ms con foco activo, y aparte retorno de pausa. Los intervalos activos no deben desaparecer. |
| T02 | [src/core/hitboxes.ts:73](https://github.com/tonmaiveD/limargeddon/blob/364ee7902bd1091515e3727efe3f570ee66a36f1/src/core/hitboxes.ts#L73), [src/bosses/snake-boss.ts:177](https://github.com/tonmaiveD/limargeddon/blob/364ee7902bd1091515e3727efe3f570ee66a36f1/src/bosses/snake-boss.ts#L177) y `diagnosticos.json` | Los sectores se dibujan con alfa 0,95 en `tele`, `hold` y `release`. El bloqueo radial solo corre en `hold`; el contacto ordinario del cuerpo se omite mientras el anillo no está apagado. | Diferenciar amenaza futura de interacción activa | Baja, solo vista de diagnóstico | Sectores activos en `hold`; en `tele` y `release`, atenuar a 0,3 o etiquetar como referencia anticipada. Separar bloqueo, daño al apretar y daño por contacto si se pretende explicar los tres. | UI de diagnóstico | S | Mismo estado dirigido en las tres fases: mostrar activo solo cuando se evalúa la regla correspondiente. |


T01 no demuestra que el juego se bloquee durante seis segundos. Demuestra que el instrumento no puede revelar ese caso tal como está escrito. T02 no altera las colisiones ni perjudica la partida normal; puede confundir a quien verifica el arte con la herramienta activada.

Observación no bloqueante: la lista `stalls` conserva solo los primeros 30 eventos. En una sonda con 40 bloqueos de 120 ms, los percentiles y recuentos conservan las 40 muestras, pero la lista contiene 30. No es pérdida de esos eventos en los agregados. Conviene añadir `stallCount` y una señal de truncamiento para no interpretar la lista como exhaustiva. Los registros incluyen el build, que permite separar versiones de medición.

## 4. Simulaciones y experimentos

### Base

192 tests aprobados y compilación aprobada. Balance: 261 filas × 30 semillas = 7.830 peleas; todas las filas coinciden con r6. Campañas: 30 semillas × dos modos × tres políticas = 180, todas completan las diez etapas dentro del límite de seis intentos. La instrumentación repite esas combinaciones, con 1.800 registros de etapa y 2.134 peleas; no son muestras independientes adicionales.

Balance usa semillas `s*97`, s=1..30. Campañas usan `c*1000 + etapa*37 + intento*7`, c=1..30. Paso 1/60 s, máximo 300 s por pelea. Las celdas siguientes muestran victorias al primer intento /30 y mediana del intento victorioso según el comando oficial.

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


Costa Verde sigue en 23/30 victorias iniciales con compra barata por toque y 15/30 acelerando. Con aguante por toque conserva 26/30 y 126 s de mediana, frente a 23/30 y 75 s comprando barato. Esta asimetría ya estaba presente; los PR auditados no introducen un rebalanceo.

### Experimento 1 · Picos de fluidez y límite de suspensión

**Hipótesis:** la fuente corregida conserva picos que antes ocultaba el suavizado. Se repitieron tres secuencias de 600 intervalos, con diez picos por secuencia, a 16,67 ms entre picos. Se ejecutaron la función real de suavizado de Phaser 3.90.0 como comparación y `frameMs`/`FrameMeter` de la versión auditada. Hay calentamiento previo; la sección sostenida del medidor incluye también 60 intervalos normales previos.

| Pico | p99 con fuente anterior | p99 con fuente corregida | Máximo corregido | Recuento corregido >33,3 ms |
|---:|---:|---:|---:|---:|
| 40 ms | 19 ms | 40 ms | 40 ms | 10 |
| 120 ms | 27 ms | 120 ms | 120 ms | 10 |
| 300 ms | 16,7 ms | 300 ms | 300 ms | 10 |

**Resultado:** S01 corregido para los casos originales. Además se ensayó un intervalo largo después de 200 muestras de 16 ms, sin llamar a `resume` ni indicar pérdida de foco.

| Intervalo inyectado | Máximo registrado en juego sostenido | Lista de bloqueos |
|---:|---:|---|
| 4.999 ms | 4.999 ms | [4999] |
| 5.000 ms | 5.000 ms | [5000] |
| 5.001 ms | 16 ms | [] |
| 6.000 ms | 16 ms | [] |

**Conclusión:** el corte de cinco segundos sigue pudiendo producir una lectura engañosa. Conservar como anomalía un intervalo incierto es más informativo que borrarlo. Los tests del proyecto cubren retorno de pausa; no debe perderse esa exclusión legítima al corregir T01.

### Experimento 2 · Proyección y formas de contacto

**Hipótesis:** la nueva caja coincide con el área lógica proyectada. Se recorrieron 300 valores de scroll, 0–5.980 en pasos de 20, con Tico en `(180,500)`. Se comparó cada esquina lógica proyectada con el punto correspondiente presente en el contorno dibujado real.

- Máximo anterior: 6,94 px lógicos.
- Máximo nuevo: <0,000001 px lógicos.
- Las pruebas del proyecto verifican además círculos de daño de radio `p.w/2` y recogida `p.h/2`, los dos casos a distancia 30 de la auditoría anterior y la atenuación de la caja del jugador en el aire.

**Conclusión:** se cierran las discrepancias geométricas concretas de S02. Esta sonda verifica esquinas, no una certificación exhaustiva de todas las reglas de contacto.

### Experimento 3 · Actividad de los sectores del anillo

**Hipótesis:** un sector activo de la vista representa un bloqueo activo. Se preparó un anillo de cinco sectores, radio 54 y centro `(180,470)`, y se dibujó sucesivamente en tres fases con la escena sustituta del proyecto.

| Fase | Sectores dibujados | Alfa | `ringBlock` se ejecuta según código |
|---|---:|---:|---|
| Aviso, `tele` | 5 | 0,95 | No |
| Retención, `hold` | 5 | 0,95 | Sí |
| Liberación, `release` | 5 | 0,95 | No |

**Conclusión:** la vista no distingue actividad de referencia futura/pasada. El dibujo se midió; la condición de ejecución de la regla se comprobó por código, no por una prueba humana ni un conteo de choques. Aplicar T02 sin cambiar la física.

### Experimento 4 · Continuidad de combate, tutorial y correcciones

Se repitieron las campañas instrumentadas, 240 variantes del anillo, 240 de ruta, 600 primeros intentos de enseñanza y 180 variantes de semáforos. Los JSON de campañas/variantes y de enseñanza/semáforos coinciden íntegramente con r6. Las sondas de reglas anteriores terminaron sin excepciones.

En el barrido de 9.000 estados del enrosque, la flecha mantiene error de anclaje y orientación local inferiores a 0,000001. Las dos correas siguen por encima de la imagen del Tico. Esto respalda continuidad del motor y de las correcciones geométricas, no igualdad de rendimiento ni de percepción visual.

## 5. Mejoras rápidas

1. **Conservar intervalos largos**, `src/core/frames.ts:37`. Sustituir la eliminación basada solo en duración por clasificación de pausa explícita o anomalía no explicada. Mantener separados los agregados si la causa es incierta.
2. **Atenuar sectores inactivos**, `src/core/hitboxes.ts:73`. Usar `hold` como condición de bloqueo activo; mantener el aviso con tratamiento distinto.
3. **Explicar el límite de eventos**, `src/core/frames.ts`. Añadir contador total de bloqueos y marca de truncamiento cuando `stalls` llegue a 30. Los agregados ya conservan las muestras en el intervalo ensayado.

No recomiendo ajustes de daño, vida, cobro, frecuencia de premios o puntaje. Estas mejoras afectan instrumentos, no el balance.

## 6. Apuestas y efecto sobre el plan del piloto

1. **Continuar inventario y dirección visual.** Los PR #42–43 no producen el piloto artístico. Actualizar la base de referencia del plan a esta versión y conservar los criterios visuales acordados. No reiniciar las fases ya resueltas de diagnóstico.
2. **Cerrar T01/T02 antes de aprobar mediciones finales.** Son ajustes acotados que pueden convivir con la preparación de la muestra. La etapa de diagnóstico está sustancialmente avanzada, pero aún no conviene declararla íntegramente cerrada.
3. **Mantener validación externa.** Dos teléfonos representativos, al menos diez minutos por versión y dispositivo, y 6–8 participantes para claridad. Los objetivos p95 ≤20 ms y p99 ≤33,3 ms siguen siendo criterios propuestos, no resultados medidos. El riesgo principal es confundir instrumentos corregidos con experiencia ya validada.

No se recalcula automáticamente el rango anterior de 5–9 jornadas: primero se debe inventariar trabajo restante y decidir qué arte se conserva. Tampoco se necesita extender herramientas de diagnóstico indefinidamente antes de mostrar una primera composición jugable.

## 7. Puntaje y ranking

Mantener fórmula versión 2 y ranking local. En Normal: 4.000 por victoria, hasta 2.000 por tiempo, 1.500 por daño efectivo derecho, 1.000 por racha, 1.000 por limpieza y 500 por objetivo. La ruta sustituye derecha por intentos y racha por marea. Fácil ×0,7, Normal ×1 y Difícil ×1,25.

Los PR de esta revisión no cambian esas reglas. Los resultados de simulación no justifican abrir un rediseño. Mantener medallas sin dinero extra y mejores resultados por etapa, sin incentivar acumulación de partidas, asistencia diaria o presión por volver. El ranking compartido sigue siendo una decisión separada.

## 8. Preguntas para partidas reales

- ¿Se reconoce la salida antes de cerrarse el anillo, con garúa y tráfico?
- ¿Las zonas de contacto del anillo explican los choques que los jugadores consideran injustos?
- ¿Qué teléfonos registran tirones y en qué primera aparición o estado concreto?
- ¿El nuevo arte ayuda a leer daño, mejoras y amenazas a tamaño real?
- ¿La preferencia por el piloto se mantiene al jugar, además de mirar capturas?

### Entrega y reproducción

El paquete contiene scripts externos, comandos, resultados completos, comparación con r6 y una captura del sitio público. Las sondas registran mediciones; que terminen sin error no convierte todos los comportamientos medidos en correctos. Las 192 pruebas del proyecto sí son pruebas de aserción independientes.
