# Auditoría de Limargeddon

24 de octubre de 2026 · Diseño, acción y recompensa, balance y progresión

## 1. Resumen ejecutivo

- Fortaleza · El punto ciego, el aceite y el claxon conectan posicionamiento, control del jefe y daño con respuestas inmediatas.
- Fortaleza · Nueve distritos, objetos funcionales y taller forman una campaña completa; las 60 campañas con compras terminaron.
- Fortaleza · Los bonus aportan sorpresa sin pagos reales ni presión por volver, y el clima conserva visibles varios avisos críticos.
- Problema · Algunas reglas no coinciden con sus efectos: rompellantas sin aturdimiento, golpes al cuerpo que cortan la racha y salto vulnerable al claxon.
- Problema · La campaña depende mucho del taller, pero «recomendado» significa «lo más barato», no «lo que te ayuda en esta etapa».
- Problema · El final pierde tensión en acelerar: Costa Verde queda en 52,6 s en la muestra de primeras victorias, y falta el enrosque final acordado.
- Prioridad · Corregir contratos de las mecánicas, probar cadencias específicas por modo y hacer visible el beneficio de comprar antes de añadir más premios.

### Alcance y confianza

Código auditado en `fd87432519230cd8770bd1d34d7269e0b1277793`. Node 24.17.0, Vitest 3.2.7. Se clonó el repositorio público y se mantuvieron intactos sus archivos versionados. Los experimentos viven fuera del repositorio y modifican copias en memoria.

Se abrió la versión publicada, se inició San Isidro en Normal, se probaron entradas de teclado y pausa y se volvió al menú. Esto es una comprobación funcional breve, **no una sesión humana de jugabilidad ni una validación táctil**. El menú se observó en una vista angosta de 319 × 724; el recorte del modo prueba es un pendiente ya conocido. No se verificó que el despliegue publicado corresponda exactamente al commit simulado. [Captura del menú](evidencia/menu-publicado.png).

**Medido** significa ejecución del motor o inspección directa de código. **Propuesto** significa hipótesis pendiente de validar. Las tasas son de bots, no probabilidades de victoria humana. La equivalencia de duración ×1,6 procede del encargo y no se revalidó; tampoco incluye necesariamente el tiempo de taller, pausas o intentos fallidos. No se midió dopamina ni se usa como explicación causal.

Los principios de autonomía y competencia orientan las propuestas, sin convertirlos en garantía de retención. [Ryan, Rigby y Przybylski, estudio original de 2006](https://selfdeterminationtheory.org/SDT/documents/2006_RyanRigbyPrzybylski_MandE.pdf). Para claridad de objetivos, respuesta y equilibrio entre habilidad y dificultad se usa [GameFlow, Sweetser y Wyeth, 2005](https://www.valuesatplay.org/wp-content/uploads/2007/09/sweetser.pdf), como marco de evaluación.

## 2. Mapa del circuito de recompensa

### Segundo a segundo

| Acción o señal | Frecuencia o duración del código | Intensidad estimada | Evaluación |
|---|---|---|---|
| Cono por toque | Reserva 3; recarga 0,7 s; separación mínima 0,08 s | Baja al lanzar, media al acertar | Techo sostenido teórico 85,7 conos/min, más reserva inicial. El bot pulsa 10 veces/s, no una persona. |
| Cono acelerando | Cadencia base 0,55 s | Baja a media | Techo 109,1/min solo mientras acelera, antes de mejoras. Ambos modos reciben racha. |
| Impacto al jefe | Texto 0,9 s y destello 0,12 s | Media | Números de daño dan respuesta continua; varios pueden coincidir. |
| Racha | Desde segundo acierto derecho, +10%, +20%, +30%; techo en cuarto | Alta | Sonido ascendente y pausa 40 ms. Seguir sumando racha no aumenta el daño sobre +30%. |
| Aceite | Disponible cada 4 s; derrape 2 s | Media a alta | Ventana de ataque ganada. Con derecho ×2 y derrape ×1,5, un cono de racha máxima ronda 47 de daño frente a 12 base. |
| Claxon | Cada 6 s; alcance 210 | Media a alta | Daño 20, interrupción y aparta tráfico; en Costa Verde también espanta aves. Compiten dos usos del mismo recurso. |
| Salto | Rampa inicial a 5 s; luego cada 7–11 s; vuelo 0,9 s | Alta | Texto y sonido claros; solo 30% de giro en el aire. La promesa de inmunidad es demasiado amplia. |
| Esquive limpio | Sin evento propio de recompensa | Baja inmediata | La recompensa es conservar vida y posición. No añadir números a cada esquive; probar solo el primer esquive de una mecánica nueva. |
| Bonus | Primera aparición a 6 s; después cada 9–13 s | Alta | Aparición no equivale a recogida. Los efectos temporales duran 5–8 s según tipo. |
| Dinero por tráfico | Según eliminaciones; no hay monedas físicas recogibles | Baja a media | Texto +S/. Ciclistas y repartidores con pago 0 protegen el tono. |

Frecuencias **medidas** en el primer intento de 30 campañas por modo, con el equipamiento que realmente acumuló cada campaña. Se cuentan nuevos textos numéricos de daño al jefe, textos de racha, textos +S/ y activaciones de bonus. Tasas = eventos totales / minutos simulados, incluyendo derrotas. Daño y racha pueden venir del mismo impacto, por lo que **no deben sumarse como recompensas independientes**.

| Etapa | Modo | Daño/min | Racha/min | +S/min | Bonus/min | Máx. textos simultáneos | Mediana del mayor hueco, s |
|---|---|---|---|---|---|---|---|
| miraflores | toque | 52.5 | 12.0 | 5.5 | 3.9 | 17 | 6.2 |
| via-expresa | toque | 68.9 | 19.4 | 5.8 | 3.5 | 18 | 6.5 |
| panamericana | toque | 52.7 | 20.1 | 5.1 | 3.6 | 18 | 6.0 |
| costa-verde | toque | 72.1 | 24.6 | 3.9 | 3.1 | 20 | 5.6 |
| miraflores | acelerar | 50.4 | 13.8 | 4.8 | 3.7 | 14 | 7.3 |
| via-expresa | acelerar | 64.6 | 22.9 | 7.1 | 3.7 | 18 | 6.5 |
| panamericana | acelerar | 68.8 | 28.0 | 6.0 | 3.5 | 16 | 6.0 |
| costa-verde | acelerar | 74.5 | 34.5 | 4.2 | 3.2 | 17 | 4.8 |

El «hueco» es el mayor intervalo desde el inicio o entre esos eventos positivos, no falta de actividad en pantalla; no incluye el tramo final sin evento. Los máximos de textos incluyen avisos, daño recibido y multas. No se midieron solapamientos geométricos ni comprensión humana. Con hasta 20 textos vivos a la vez, la hipótesis prioritaria es saturación puntual, no escasez general de estímulos. Probar agrupar daño por blanco en ventanas de 120 ms, manteniendo racha, protección y peligro prioritarios.

### Por pelea y por campaña

- Las fases cambian al 66% y 33% de vida. Hay sonido, anuncio y frase, pero no un descanso garantizado; pueden aparecer refuerzos al cambiar de fase. Las ventanas estacionadas tras ataques duran, por ejemplo, 1,6 s en la reversa del Q8 y 1,2 s tras contenedores del Callao. Son oportunidades legibles en el código; falta validar si las personas las reconocen.
- El final paga victoria, limpieza de fase 3, bonus de tráfico y, en Costa Verde, S/800 por Don Frío intacto, menos multas. El logro por derecha y cero papeletas no añade dinero por sí mismo. La derrota paga bonus netos, no un premio por avance del jefe.
- Resultados aparece tras 900 ms. Las medallas y el objeto explican la victoria, y el taller es el siguiente paso principal. Perder muestra vida restante del jefe, pero el consejo es fijo por etapa; no responde a cómo se perdió.
- Los objetos evitan un evento por pelea y anuncian su consumo. Hay un hueco de utilidad: el Poncho se obtiene después del único jefe con chorro; la Tarjeta después del único jefe con coletazo; la Corneta después de la última etapa disponible. Su siguiente uso requiere repetir o contenido futuro. No son falsos premios, pero el avance consecutivo rara vez demuestra esas tres recompensas.
- La campaña abre una novedad por victoria, pero «seguir sin comprar» convive con una segunda mitad calibrada con compras. El cobro no equivale a mejora garantizada: al llegar a San Isidro el gasto promedio es solo S/177–185.

### Enseñanza y cruces de mecánicas

Las reglas nuevas sí aparecen en `tip` del menú. Solo Miraflores tiene `hints` durante la pelea. No presento «falta tutorial» como descubrimiento nuevo; la aportación concreta es dónde insertarlo y qué interacción verificar.

| Etapa | Regla y preparación existente | Riesgo específico y propuesta |
|---|---|---|
| Miraflores | Ayudas a 1,5 y 6 s, derecho y soltar | Enseña posición, pero no a administrar reserva. Observar si el jugador cree que mantener Z dispara. |
| San Isidro | Reversa y punto débil, aviso Normal de 0,8 s | Buena pausa ofensiva de 1,6 s. La reversa casi sin aviso en Difícil ya es pendiente conocido. |
| Centro | Chorro y huecos entre marchas | El chorro se detiene ante peatones. Mostrar un primer ejemplo de cambio de carril sin sumar otro tutorial largo. |
| Javier Prado | Brazo del cobrador avisa 0,75 s | El objetivo de mirar el brazo compite con conos y tránsito. Medir primer proyectil evitado, no solo victoria. |
| Gamarra | Cables desde 11 s; se cruzan soltando | En acelerar, dejar de atacar es parte de la regla. Añadir ayuda a 7 s y medir daño de los dos primeros cables. |
| Callao | Contenedores avisan 0,9 s, luego pausa 1,2 s | Buen patrón de castigo y alivio. El bot no esquiva estos proyectiles expresamente. |
| Vía Expresa | Rampa desde 5 s, coletazo avisa 0,8 s | Añadir ayuda a 2 s y corregir promesa del salto. El giro reducido exige decidir antes de volar. |
| Panamericana | Garúa desde 10 s, peaje desde 14 s | La garúa tapa tráfico y obstáculos, pero se dibujan encima proyectiles y avisos del jefe. No afirmar que todo queda ilegible. Probar peaje inicial a 20 s, tras la primera oleada, para enseñar separado. |
| Costa Verde | Aves 9 s, derrumbe 12 s, niebla 16 s, carretilla 20 s | Entrada densa de novedades. Aviso de derrumbe 1,6 s y vuelo de aves 2,2 s ayudan; las manchas se dibujan sobre el mundo y pueden tapar peligros aunque el HUD quede visible. Probar nunca ocultar totalmente el área inmediata del Tico. |

La curva desplaza el dibujo y no añade fuerza lateral. No hay evidencia de un empujón injusto por curvatura. La serpiente sí tiene segmentos y divisiones, pero su movimiento se basa en historial horizontal y distancias verticales fijas; la fase final usa embestida, frenazo y claxon. No implementa el enrosque con una sola salida previsto en la sección 5b. Eso explica un clímax mecánico menos distinto, más allá del cierre animado ya pendiente.

## 3. Hallazgos priorizados

S = aproximadamente una tarde; M = varias jornadas; L = sistema o mecánica con iteración. Las métricas son criterios propuestos, no resultados garantizados.

| ID | Evidencia | Hallazgo | Principio | Severidad | Propuesta con números | Tipo | Esfuerzo | Cómo medir |
|---|---|---|---|---|---|---|---|---|
| H01 | [src/bosses/phase-boss.ts:145](https://github.com/tonmaiveD/limargeddon/blob/fd87432519230cd8770bd1d34d7269e0b1277793/src/bosses/phase-boss.ts#L145) · sonda rompellantas | Se pierde `throw.stun` al crear el proyectil; 0,6 s declarados producen ningún aturdimiento. | Consistencia entre regla y consecuencia | Alta | Copiar `stun: T.stun`; revalidar Panamericana antes de cambiar su dificultad. | Motor | S | Proyectil real conserva 0,6; impacto aturde 0,6 salvo protección. |
| H02 | [src/core/weapons.ts:89](https://github.com/tonmaiveD/limargeddon/blob/fd87432519230cd8770bd1d34d7269e0b1277793/src/core/weapons.ts#L89) · sonda serpiente | Un cono al segmento hace 12 al jefe y baja racha 3 → 0. Romper el cuerpo es una estrategia ofrecida por el juego. | Respuesta coherente a una acción válida | Alta | Marcar impacto válido en cuerpo, conservar racha sin incrementarla ni darle bonus derecho. | Motor | S | Impacto al cuerpo preserva n; fallo real la corta; cabeza derecha la incrementa. |
| H03 | [src/garage/upgrades.ts:42](https://github.com/tonmaiveD/limargeddon/blob/fd87432519230cd8770bd1d34d7269e0b1277793/src/garage/upgrades.ts#L42) · E1/E3 | Comprar sostiene la campaña, pero la recomendación solo ordena por precio. | Autonomía informada y dificultad explicable | Alta | Mostrar dos opciones por presupuesto, ofensiva y supervivencia; explicar efecto y precio. Tras 2 derrotas ofrecer acceso destacado al taller, sin bloquear revancha. | UI | M | Comprensión del efecto ≥80%; comparar abandonos y victorias, no compras por sí solas. |
| H04 | [src/stages/costa-verde/config.json:23](https://github.com/tonmaiveD/limargeddon/blob/fd87432519230cd8770bd1d34d7269e0b1277793/src/stages/costa-verde/config.json#L23) · E2/E4 | Final demasiado breve en acelerar y multiplicador alto susceptible a errores humanos. | Clímax y tolerancia a errores legibles | Alta | Probar `cone.cd` 0,55 → 0,62 en Costa Verde; mantener ×3,2 inicialmente. No bajar a ×2,4 por intuición. | Datos de etapa | S | Repetir 100 semillas por modo y medir daño por impacto en personas; objetivo bot 60–85 s. |
| H05 | [src/bosses/phase-boss.ts:216](https://github.com/tonmaiveD/limargeddon/blob/fd87432519230cd8770bd1d34d7269e0b1277793/src/bosses/phase-boss.ts#L216) · sonda vuelo | El claxon aturde 0,8 s durante un vuelo de 0,9 s; contradice «en el aire nada te toca». | Confianza y aprendizaje transferible | Media | Cambiar consejo a «Saltando evitas choques y coletazos. El claxon te aturde». Alternativa mayor, inmunidad aérea unificada. | UI | S | Jugadores describen correctamente las excepciones; no prometer inmunidad total. |
| H06 | [src/bosses/phase-boss.ts:199](https://github.com/tonmaiveD/limargeddon/blob/fd87432519230cd8770bd1d34d7269e0b1277793/src/bosses/phase-boss.ts#L199) · sonda hornFirst | `hornFirst: 2` solo se aplica cuando la fase trae escoltas. Vía Expresa conserva casi 4 s. | Datos declarativos deben controlar el ritmo | Media | Inicializar hornT cuando exista hornEvery, haya o no escoltas. | Motor | S | Primer claxon a 2 s ±1 cuadro desde fase, según configuración. |
| H07 | [src/core/state.ts:125](https://github.com/tonmaiveD/limargeddon/blob/fd87432519230cd8770bd1d34d7269e0b1277793/src/core/state.ts#L125) · tasas de textos | Hasta 20 textos simultáneos; racha y daño duplican señales sobre un mismo blanco. | Jerarquía perceptiva | Media | Agrupar números por blanco cada 120 ms; un texto de racha persistente 0,9 s que se actualiza. | UI | M | Menor solapamiento; ≥80% reconoce daño y siguiente amenaza sin aumentar golpes recibidos. |
| H08 | [src/bosses/snake-boss.ts:36](https://github.com/tonmaiveD/limargeddon/blob/fd87432519230cd8770bd1d34d7269e0b1277793/src/bosses/snake-boss.ts#L36) · plan 5b | Falta el enrosque final acordado; no es una petición de cambiar el jefe elegido. | Escalada y dominio de una regla final | Media | Pieza reutilizable de formación al 20% HP, aviso 1,2 s, hueco ≥ancho Tico+24, salida 1,5 s. Valores por validar. | Motor | L | Hueco alcanzable desde cualquier posición válida; ningún daño antes del aviso. |
| H09 | [src/stages/index.ts:70](https://github.com/tonmaiveD/limargeddon/blob/fd87432519230cd8770bd1d34d7269e0b1277793/src/stages/index.ts#L70) · configs posteriores | Poncho y Tarjeta casi no demuestran utilidad en el avance posterior; Corneta llega al terminar. | Recompensa próxima y visible | Media | En taller, indicar peligro que bloquea y próxima etapa aplicable; ofrecer repetición opcional ya desbloqueada para probarlo. | UI | M | Jugador identifica utilidad; registrar consumos por objeto y pelea. |
| H10 | [src/core/world.ts:304](https://github.com/tonmaiveD/limargeddon/blob/fd87432519230cd8770bd1d34d7269e0b1277793/src/core/world.ts#L304) · Results.ts | Un futuro ranking basado en soles o multas cobradas favorecería privilegio, mejoras y repetición. | Comparabilidad y habilidad | Alta para ranking | Puntaje por mejor pelea, equipamiento fijo en clasificación y contar infracciones antes de perdones. | Motor/UI | M | Repetir 100 veces sin mejorar la pelea no aumenta puntaje; sticker no concede conducción perfecta. |
| H11 | [scripts/campana.test.ts:9](https://github.com/tonmaiveD/limargeddon/blob/fd87432519230cd8770bd1d34d7269e0b1277793/scripts/campana.test.ts#L9) · log inicial | Importar evitaCuerpo desde balance registra y ejecuta otro test completo; hubo timeout RPC en la ejecución concurrente. | Reproducibilidad | Media | Mover helper al harness o ejecutar campaña con `-t campaña`; reportar mediana convencional y denominadores. | Motor de simulación | S | Campaña ejecuta solo su prueba; cero errores y mismos conteos por semilla. |

No propongo rehacer controles, eliminar modos ni saltarse la progresión. Tampoco repito como hallazgos nuevos música, ranking aún no construido, reinicio, tutorial completo, botones de 44 px o meta de ahorro.

Observaciones adicionales de código, sin elevarlas a cambios inmediatos: durante el paso de Don Frío la serpiente retorna antes de resolver colisiones de su cuerpo; la sonda superpuesta no recibió daño. Puede ser una pausa benigna, pero conviene decidir si la fila detenida sigue siendo sólida. Los proyectiles ignoran el vuelo en el motor común, pero **Vía Expresa no tiene proyectiles enemigos en su configuración actual**; el ensayo de proyectil en vuelo es sintético, no una derrota reproducida en esa etapa.

## 4. Simulaciones y experimentos

### Método y reproducción

- `npm test` · **100 pruebas aprobadas**, 17 archivos, incluida paridad.
- `npm run build` · aprobado.
- `npm run balance` · matriz completa, tres bots, tres dificultades, dos modos y variantes adicionales, 30 semillas por fila. Semilla `s*97`, s de 1 a 30.
- `CAMPANAS=30 npm run campana` · produjo resultados, pero terminó con error RPC de Vitest mientras corría también el balance importado.
- `CAMPANAS=30 npm run campana -- -t campaña` · repetición aislada aprobada, mismos conteos. Semilla `c*1000 + númeroEtapa*37 + intento*7`, c de 1 a 30, máximo 6 intentos por etapa.
- Experimentos externos · mismo bot medio y evasión del cuerpo, 60 cuadros/s, límite 300 s por pelea. No se instrumenta el azar ni se modifica el motor.

El bot compra lo más barato repetidamente después de ganar. No compra después de perder y no vuelve a farmear etapas; por eso no evalúa todas las estrategias humanas. No hay descuento por repetir victoria en esta ruta: cada etapa se abandona al ganarla por primera vez. Los objetos sí se incluyen en campañas y experimentos; el balance aislado base no los incluye.

El bot observa estado exacto, no sufre la niebla visual y no planifica salto, esquiva de proyectiles o claxon contra aves. Las comparaciones pareadas usan las mismas semillas, pero cambiar daño o cadencia altera eventos y consumo posterior del generador aleatorio. **No es el mismo tráfico inmutable en ambas variantes.** Con n=30, una victoria son 3,3 puntos porcentuales; diferencias de 1–3 victorias no justifican conclusiones fuertes. Por ejemplo, 24/30 tiene un intervalo Wilson aproximado de 63–91%, no una precisión de ±1%.

Las tablas propias calculan la mediana convencional, promediando los dos valores centrales. Los scripts originales toman el central superior y redondean; por eso muestran 60 s donde la mediana convencional de Miraflores es 57,3 s. La duración solo entre ganadores tiene sesgo de supervivencia: hacer una variante más difícil puede bajar su mediana sin hacerla más rápida para la misma persona.

### Base aislada · Bot medio, Normal, sin mejoras ni objetos

| Etapa | Toque gana | s, central superior | Acelerar gana | s, central superior |
|---|---|---|---|---|
| miraflores | 29/30 | 69 | 29/30 | 65 |
| san-isidro | 21/30 | 74 | 26/30 | 76 |
| centro | 21/30 | 78 | 27/30 | 75 |
| javier-prado | 22/30 | 69 | 17/30 | 77 |
| gamarra | 10/30 | 80 | 15/30 | 63 |
| callao | 7/30 | 62 | 5/30 | 66 |
| via-expresa | 7/30 | 88 | 7/30 | 49 |
| panamericana | 3/30 | 78 | 4/30 | 82 |
| costa-verde | 2/30 | 72 | 1/30 | 54 |

Estos datos no son una razón para suavizar toda la segunda mitad: las etapas 5–9 se diseñaron para llegar mejorado. Las diferencias frente a cifras históricas del ADR obligan a fijar commit y semillas, no a asumir regresión.

### Campaña con compras · 30 por modo

Todos llegan a las nueve etapas y los 60 completan antes del límite de seis intentos por etapa. «1.º» usa denominador 30. Gasto es acumulado **al llegar**, no el pago de esa etapa.

| Etapa | Toque 1.º | Intentos | s | Gasto S/ | Acelerar 1.º | Intentos | s | Gasto S/ |
|---|---|---|---|---|---|---|---|---|
| miraflores | 28/30 | 1.1 | 57.3 | 0 | 29/30 | 1.0 | 63.3 | 0 |
| san-isidro | 23/30 | 1.3 | 74.0 | 177 | 27/30 | 1.1 | 69.9 | 185 |
| centro | 27/30 | 1.1 | 80.2 | 762 | 29/30 | 1.0 | 64.2 | 755 |
| javier-prado | 26/30 | 1.2 | 67.4 | 1247 | 25/30 | 1.2 | 64.5 | 1442 |
| gamarra | 23/30 | 1.5 | 66.7 | 2303 | 19/30 | 1.6 | 66.1 | 2450 |
| callao | 21/30 | 1.4 | 72.0 | 3208 | 25/30 | 1.2 | 77.6 | 3455 |
| via-expresa | 24/30 | 1.3 | 69.6 | 4285 | 29/30 | 1.0 | 78.4 | 4605 |
| panamericana | 20/30 | 1.6 | 78.1 | 5570 | 27/30 | 1.1 | 72.8 | 5910 |
| costa-verde | 24/30 | 1.2 | 66.2 | 7073 | 26/30 | 1.2 | 52.6 | 7537 |

La caída más clara en acelerar es Gamarra, 63%, seguida de recuperación a 83–97%. Por toque, Panamericana es 67%, pero Vía Expresa es 80% y Costa Verde 80%. La curva no crece de manera monótona. Eso puede ofrecer alivio, pero el final acelerando resulta más breve que las tres peleas anteriores.

### E1 · ¿Se puede prescindir del taller?

Hipótesis · La dificultad de la segunda mitad depende de comprar. Variante · Las mismas campañas sin ninguna compra, manteniendo objetos ganados y cobros. No se fuerza al bot a alcanzar etapas que no ganó.

| Etapa | Toque llegan | 1.º | Superan | Intentos | Acelerar llegan | 1.º | Superan | Intentos |
|---|---|---|---|---|---|---|---|---|
| miraflores | 30 | 28 | 30 | 1.1 | 30 | 29 | 30 | 1.0 |
| san-isidro | 30 | 24 | 30 | 1.2 | 30 | 28 | 30 | 1.1 |
| centro | 30 | 22 | 30 | 1.4 | 30 | 20 | 30 | 1.4 |
| javier-prado | 30 | 21 | 30 | 1.6 | 30 | 20 | 30 | 1.4 |
| gamarra | 30 | 13 | 29 | 2.6 | 30 | 16 | 30 | 2.0 |
| callao | 29 | 7 | 22 | 3.9 | 30 | 10 | 28 | 2.7 |
| via-expresa | 22 | 10 | 21 | 2.2 | 28 | 10 | 28 | 2.2 |
| panamericana | 21 | 1 | 12 | 4.7 | 28 | 9 | 22 | 3.2 |
| costa-verde | 12 | 1 | 8 | 4.1 | 22 | 2 | 11 | 4.5 |

Resultado · Finalizan 8/30 por toque y 11/30 acelerando frente a 30/30 y 30/30 con compras. Conclusión · El taller es estructural. No conviene anunciar que es indiferente saltárselo. Ofrecer decisiones explicadas y ayuda opcional, sin obligar a farmear ni introducir un bloqueo para comprar. El experimento extremo no prueba que una sola compra sea insuficiente ni que todos los estilos deban seguir la recomendación actual.

### E2 · Sensibilidad de Costa Verde al multiplicador de daño

Hipótesis · Bajar ×3,2 suaviza golpes sin borrar el reto. Variante · Guardar las 30 llegadas reales por modo, con sus mejoras; jugar una pelea por llegada con ×3,2, ×2,8 y ×2,4. Misma semilla del primer intento.

| Modo | Multiplicador | Victorias | Mediana victoriosa, s |
|---|---|---|---|
| toque | 3.2 | 24/30 | 69.5 |
| toque | 2.8 | 23/30 | 71.6 |
| toque | 2.4 | 29/30 | 77.7 |
| acelerar | 3.2 | 26/30 | 52.6 |
| acelerar | 2.8 | 29/30 | 55.1 |
| acelerar | 2.4 | 29/30 | 55.2 |

Conclusión · ×2,4 produce 97% en ambos modos; no sirve como ajuste global hacia la meta actual. ×2,8 tampoco mejora de forma monotónica el resultado por toque, por trayectorias divergentes y muestra pequeña. Mantener ×3,2 hasta observar daño humano por fuente. Un golpe base 6 pasa a 19 antes de armadura y a 17 con 13% de armadura; base 4 pasa a 13 y luego 11. Es una pérdida relevante por error aunque el bot sobreviva. No confundir frecuencia baja de choques del bot con seguridad para humanos.

### E3 · Valor aislado de cada mejora del taller

Hipótesis · Precio mínimo no equivale a beneficio máximo, y los modos valoran distinto la misma compra. Variante · Callao Normal, objetos de etapas previas, 30 semillas `97*c`, sin otras mejoras; comprar solo nivel 1 del artículo indicado. Los lujos se prueban también, disponibles por progreso. No es una estimación del beneficio marginal sobre un vehículo ya mejorado.

| Mejora nivel 1 | S/ | Toque gana | s | Acelerar gana | s |
|---|---|---|---|---|---|
| ninguna | 0 | 7/30 | 69.0 | 8/30 | 64.1 |
| motor | 300 | 8/30 | 63.7 | 11/30 | 61.9 |
| llantas | 250 | 8/30 | 75.7 | 11/30 | 67.4 |
| turbo | 400 | 6/30 | 63.0 | 6/30 | 57.6 |
| conos | 350 | 7/30 | 69.0 | 12/30 | 67.5 |
| aceite | 300 | 11/30 | 71.5 | 11/30 | 58.3 |
| claxon | 300 | 7/30 | 78.4 | 12/30 | 73.9 |
| parachoques | 400 | 7/30 | 68.3 | 9/30 | 67.9 |
| blindaje | 450 | 11/30 | 71.6 | 11/30 | 67.9 |
| reparacion | 500 | 10/30 | 72.3 | 16/30 | 84.4 |
| soat | 1500 | 9/30 | 69.4 | 15/30 | 70.6 |
| sticker | 3000 | 7/30 | 67.7 | 8/30 | 67.1 |
| socio-combi | 3500 | 11/30 | 64.6 | 14/30 | 62.8 |

Conclusión · Reparación mejora la supervivencia en el modo acelerar (8 → 16 victorias), no la eliminación del jefe; sobreviven más peleas largas. Aceite y blindaje mejoran toque de 7 → 11. «Más conos» nivel 1 deja toque en 7/30 y la misma mediana, mientras acelerar pasa 8 → 12. Su reserva extra puede ser útil a una persona que dosifica; el bot la vacía continuamente. No rebajar el precio ni declarar inútil la mejora solo por esto. Probar primero explicar «reserva para ráfagas» frente a «cadencia sostenida» y ofrecer comparación numérica antes/después.

### E4 · Cadencia específica de acelerar

Hipótesis · Aumentar `weapons.cone.cd` en etapas tardías reduce la ventaja sin tocar la recarga por toque. Variante · Primer intento con equipamiento de llegada original, 30 semillas por etapa. Se cambia el cooldown base **antes** de aplicar mejoras.

| Etapa | cd base, s | Victorias | Mediana victoriosa, s |
|---|---|---|---|
| via-expresa | 0.55 | 29/30 | 79.4 |
| via-expresa | 0.62 | 25/30 | 75.7 |
| via-expresa | 0.68 | 21/30 | 79.5 |
| panamericana | 0.55 | 27/30 | 71.9 |
| panamericana | 0.62 | 27/30 | 75.0 |
| panamericana | 0.68 | 21/30 | 85.7 |
| costa-verde | 0.55 | 26/30 | 52.6 |
| costa-verde | 0.62 | 26/30 | 62.4 |
| costa-verde | 0.68 | 18/30 | 67.6 |

Conclusión · Candidatos para otra pasada: Vía Expresa 0,68 (70%, 79,5 s), Costa Verde 0,62 (87%, 62,4 s). Panamericana 0,68 baja a 70% pero estira a 85,7 s; **no adoptarlo antes de corregir rompellantas**, porque recuperar 0,6 s de aturdimiento puede cambiar esa dificultad. Estas variantes fijan las mejoras de llegada; una campaña completa con los ajustes combinados puede cambiar ingresos, compras y resultados. Son candidatos medidos, no un balance final aprobado.

### Sondas funcionales

| Sonda | Resultado observado | Alcance |
|---|---|---|
| Rompellantas emitido | stun declarado 0,6; proyectil sin stun | Configuración real de Panamericana |
| Primer claxon de fase | config 2 s; quedan 3,983 s tras un cuadro | Configuración real de Vía Expresa, estado dirigido |
| Claxon durante salto | air 0,9; stun 0,8 | Estado dirigido compatible con Vía Expresa |
| Cono a segmento | 12 de daño al jefe; racha 3 → 0 | Serpiente real, posición dirigida |
| Proyectil en vuelo | 100 → 83 de vida, 1 s de aturdimiento | Sintético, Vía Expresa actual no emite proyectiles |
| Fila cediendo paso | Cuerpo superpuesto no causa daño | Estado dirigido; posible elección de diseño |

## 5. Hasta seis mejoras rápidas

1. **Restaurar rompellantas** · `src/bosses/phase-boss.ts:145`, añadir `stun: T.stun` al proyectil. Valor efectivo esperado en Panamericana 0,6 s. Prioridad antes de rebalancear esa etapa.
2. **Impacto válido al cuerpo** · `src/core/weapons.ts:89`, cuando `hitShot` acepte un cono, marcarlo como impacto al jefe para no cortar racha. No incrementar n ni aplicar daño derecho al cuerpo.
3. **Respetar el primer claxon** · `src/bosses/phase-boss.ts:199`, separar inicialización de `hornT` de `escorts`; aplicar `P.hornFirst ?? 2` cuando exista `P.hornEvery`.
4. **Consejo veraz del salto** · `src/stages/via-expresa/config.json`, `rewards.defeatTip`, reemplazar la promesa total por «Saltando evitas choques y coletazos. El claxon te aturde». Conserva el resto del consejo útil.
5. **Ensayo de cadencia final** · `src/stages/costa-verde/config.json`, `weapons.cone.cd`, 0,55 → 0,62. Mantener recarga 0,7 y daño ×3,2. Antes de publicar, nueva campaña y prueba humana.
6. **Ayudas situadas aprovechando el motor existente** · añadir `hints` a Gamarra `{at:7,text:"Pasa los cables sin acelerar"}` y Vía Expresa `{at:2,text:"Acelera sobre la rampa para saltar"}`. Duran 3,2 s por el motor. Es una ejecución concreta del tutorial pendiente, no un hallazgo nuevo.

Estos cambios se proponen al equipo; no se aplicaron al repositorio. Tras H01, H02 y H06 hay que volver a medir: corregir comportamientos cambia el balance incluso cuando no se toca un JSON.

## 6. Hasta tres apuestas grandes

1. **Clímax del jefe acordado** · Implementar el enrosque como pieza reutilizable de formación, con datos por etapa. Empezar al 20% de vida y validar un hueco accesible antes de añadir daño. Riesgo alto de geometrías sin salida con piedras y carretilla; el director debe reservar el corredor y posponer peligros incompatibles. No sustituir el jefe ni añadir una mecánica ajena a la decisión del dueño.
2. **Taller que explique decisiones** · Comparar dos compras adecuadas al modo y a las derrotas recientes, con efecto concreto, coste y una demostración breve opcional. Mantener todas las compras accesibles. Riesgo de convertir una recomendación en obligación o de sobreajustar al bot; no autoequipar ni penalizar ahorrar. La meta de ahorro elegida ya es pendiente, esta propuesta añade beneficio contextual.
3. **Revancha por dominio** · Récord personal y tres objetivos permanentes opcionales por etapa, por ejemplo racha 8, victoria con ≥80% de daño derecho y cero infracciones. Recompensa cosmética o medalla, sin multiplicar dinero. En Costa Verde añadir Don Frío intacto como objetivo explícito. Riesgo de saturar resultados; mostrar como máximo un objetivo elegido y el récord. Sin rachas diarias, caducidad, presión de cuasi-victoria ni premio por volver a una hora concreta.

La variación actual de bonus ya genera sorpresa: seis tipos, dos con probabilidad reducida. Con elección uniforme inicial y una segunda elección entre cuatro comunes, combi y metro salen aproximadamente 10,8% cada uno y los otros 19,6% cada uno. Eso describe la distribución del código, no garantía de aparición durante una pelea. No añadir cajas, escasez temporal ni recompensa aleatoria comprable. Para quien quiera practicar, una semilla fija opcional permite repetir un reto estable.

## 7. Puntaje y ranking propuestos

**Recomiendo primero ranking local por dispositivo**, separado por etapa, dificultad, modo y versión de reglas. Un mejor resultado por perfil y tabla de 12. Nombre de hasta 12 caracteres, letras y números, normalizado; permitir letras acentuadas si se entiende «letras» en español. El alias no autentica una persona.

Para comparar habilidad, añadir una clasificación opcional con **equipamiento fijo por etapa**, distinto de las compras de campaña. La campaña conserva su progreso y puede mostrar récords con la configuración guardada, pero no mezclar en una tabla justa un Tico básico y uno con regeneración y SOAT. Los objetos también deben ser idénticos para todos en esa prueba. El modo prueba no publica resultados competitivos.

Fórmula inicial, por victoria y etapa, máximo 10.000 puntos:

`P = redondear(4000 + 2000*T + 1500*D + 1000*R + 1000*L + 500*E)`

| Componente | Definición | Protección contra abuso |
|---|---|---|
| T, tiempo | `clamp((2*Tref - t)/Tref, 0, 1)` | Tiempo solo decrece puntos, nunca farmearlos. Probar Tref = 90 s Miraflores y 120 s restantes como hipótesis humana inicial, no calibración concluida. |
| D, derecho | Daño efectivo derecho / daño efectivo total al jefe, entre 0 y 1 | Contar HP realmente retirado, sin exceso del último golpe. Cuerpo de serpiente es válido pero no derecho. |
| R, racha | `min(mejorRacha,8)/8` | Techo impide acumular indefinidamente. Cuerpo conserva racha, no la incrementa. |
| L, limpieza | `max(0,1-infracciones/3)` | Contar la infracción antes de Silbato, Bolso o sticker; cero multas cobradas no equivale a cero faltas. |
| E, objetivo | Costa Verde, 1 si carretilla intacta y 0 si fue tocada. Otras etapas, `clamp(1-dañoRecibido/HPInicial,0,1)` | Reparación no borra daño recibido. Nunca premiar golpear más tráfico ni duración. |

Derrotas muestran avance y estadísticas, pero no entran en la tabla de victorias. Desempate por menor tiempo real de juego activo, después menos infracciones y luego conservar el resultado anterior. El tiempo competitivo debe incluir congelamientos de impacto y excluir pausas; hoy `G.t` omite el hitstop. Mantener tiempo de simulación separado para reproducir balance.

Ejemplo ilustrativo · Victoria en 130 s con Tref 120, D=0,8, racha 6, cero infracciones y Don Frío intacto: T=0,9167 y P≈9.283. Volver a cobrar esa misma pelea 20 veces mantiene 9.283, no suma a una cuenta de puntos. La fórmula y los pesos son una propuesta, no un resultado validado.

Para un indicador de campaña, promediar el mejor puntaje de cada una de las nueve etapas, con etapas pendientes como 0; no sumar todos los intentos ni dinero. El ranking principal debería seguir siendo por etapa para que una persona pueda competir sin terminar toda la campaña.

| Opción | Qué ofrece | Implicaciones |
|---|---|---|
| Local, recomendada inicialmente | Récord personal y hasta 12 perfiles en ese navegador | Sin servidor ni publicación de nombres. Se puede editar o perder al borrar almacenamiento; no es clasificación global confiable. |
| Compartida, posterior | Comparación entre dispositivos | Servicio de recepción, almacenamiento, límites de envío, versión de reglas, moderación y eliminación de alias. El puntaje enviado por cliente es manipulable. |

Para compartido, validar configuración y entradas mediante reproducción determinista en servidor o equivalente; el cliente por sí solo no demuestra un récord legítimo. No publicar registros personales por defecto. Definir semilla, reloj y versión de simulación; las partículas y la presentación consumen azar, por lo que haría falta separar RNG de juego y de efectos antes de prometer reproducción fiable entre navegador y servidor. Una simple tabla pública que acepte `{nombre,puntos}` puede servir como juego entre amigos, pero debe presentarse como no verificada. No es necesario elegir proveedor ni crear cuentas para esta fase.

## 8. Preguntas que requieren partidas reales

1. Después de perder, ¿puede la persona explicar qué la golpeó y qué intentará distinto? Pedir explicación antes de mostrar más ayudas.
2. ¿Una persona de toque administra la reserva o pulsa con ella vacía? ¿Identifica alguna ventaja del nivel 1 de conos?
3. ¿Soltar para cables se siente como maniobra deliberada en acelerar o como interrupción molesta? Medir los dos primeros encuentros.
4. ¿Reconoce el intervalo de ataque tras aceite, reversa y contenedores? Medir cuántas ventanas aprovecha, no solo DPS.
5. ¿El golpe de Costa Verde con ×3,2 se siente previsible? Registrar fuente, vida anterior, visibilidad y tiempo desde el aviso, especialmente bajo manchas.
6. ¿La persona percibe que el Poncho o la Tarjeta le han servido al avanzar? ¿Entiende dónde probarlos después?
7. ¿Eligió una compra por su efecto, por «recomendado» o solo por precio? ¿Ahorrar fue una decisión consciente?
8. ¿Quiere una revancha para mejorar una habilidad concreta, o siente que debe repetir para pagar mejoras?

Protocolo propuesto · 6–8 personas, orden de modos alternado, San Isidro/Gamarra/Vía Expresa/Costa Verde con perfiles de llegada fijados y registrados. Es una primera prueba formativa, no una estimación estadística de retención. Dejar que abandonen cuando quieran; contar comprensión, carga de pulgares, injusticia percibida y deseo de volver sin incentivos. Las pruebas humanas ya estaban pendientes; estas preguntas concretan qué resolver antes de ajustar valores definitivos.

## Archivos de evidencia

- [Pruebas automáticas](evidencia/tests.txt) y [build](evidencia/build.txt).
- [Balance completo](evidencia/balance.txt).
- [Campaña inicial con incidencia](evidencia/campana.txt) y [campaña aislada aprobada](evidencia/campana-verificada.txt).
- [Datos crudos E1–E3 y ritmo](evidencia/experimentos.json), [log](evidencia/experimentos.txt).
- [Cadencia E4](evidencia/cadencia.json), [sondas dirigidas](evidencia/sondas.json).
- [Instrucciones de reproducción](REPRODUCIR.md), [experimentos](experimentos.test.ts), [cadencia](cadencia.test.ts), [sondas](sondas.test.ts).
