# Limargeddon · Auditoría de gráficos, UX, UI y créditos

16 de noviembre de 2026. Revisión `60d64be`, hasta el PR #63. Origen: proyecto advisory de claude.ai. No se editó código de producción ni se hicieron commits, PR o despliegues. Este documento es la propuesta, y cada bloque es un PR que el dueño autoriza por separado.

## 1. Método y límites

- Lectura de `docs/estado.md`, ADR 0032, 0038, 0041 a 0045, 0048 a 0054, la novena auditoría, la auditoría UX en iPhone 15 y el informe de datos del 10 de noviembre (72 peleas).
- Juego publicado con `?prueba`, en vertical a 393×852, con teclado y puntero: menú, taller, Miraflores, Costa Verde y los créditos completos desde "Ver créditos".
- Créditos: lectura de `src/scenes/Credits.ts`, `src/core/credits.ts`, `src/core/audio/sfx.ts` y `src/scenes/Stage.ts`, más dos sondas locales sobre una copia aislada (sección 2).
- No se probó en un teléfono o tablet real. No se vieron victoria, derrota ni `?graficos`. El panel del navegador usado limita los cuadros cuando queda en segundo plano, así que no hay medición de fluidez.
- Queda fuera lo que ya está en plan: introducción de tres pasos, textos más grandes y derrota resumida (iteraciones 2 a 4 de UX15).

## 2. Créditos que se congelan y que no se pueden ver

### 2.1 Qué se descartó

| Hipótesis | Resultado |
|---|---|
| Un error de dibujo que mata el bucle | No se reprodujo. Sonda de la escena real completa (5.017 cuadros, 83,6 s) sin mejoras, con todo al máximo y con cada mejora sola, manejando y tocando claxon: sin excepciones y llega a "CONTINUARÁ". En Chrome real, de punta a punta, sin errores de consola. |
| Phaser deja de actualizar al ocultarse la página | Descartado por lectura de Phaser 3.90: `onHidden` solo anota el instante, no detiene `update`. |
| La pausa por pérdida de foco de la ADR 0050 | Ya corregida en la ADR 0052. `Stage` sigue escuchando `blur`, pero no actúa fuera de `mode === 'play'`. |

### 2.2 Causa confirmada: C01, el reloj espera a la música

`advance` (`src/core/credits.ts`) hace `t = max(t, audio)` cuando el reloj del audio avanza. Si el audio se interrumpe con la página visible, la imagen sigue con el tiempo real (protección de la ADR 0052). Cuando el audio vuelve, retoma desde donde quedó, es decir atrasado, y la imagen se queda quieta hasta que la música la alcanza. El congelamiento dura lo mismo que duró la interrupción.

Sonda con el `advance` real a 60 cuadros por segundo:

| Interrupción del audio | Imagen congelada después | Duración total |
|---|---|---|
| Ninguna | 0 s | 83,6 s |
| 5 s | 5 s | 88,6 s |
| 20 s | 20 s | 103,6 s |
| 60 s | 60 s | 143,6 s |

Pasa igual si el audio queda suspendido (`medleyTime` nulo) o si figura activo pero su reloj no corre. Durante el congelamiento no hay aviso, la primera vez no se puede saltar y no hay pausa ni salida. Para el jugador, se colgó.

Qué lo dispara en la práctica: cualquier corte del audio que el navegador después devuelve, por ejemplo una notificación con sonido, el centro de control, Siri, cambiar de app y volver, bloquear y desbloquear. Al volver, el primer toque en el deck llama a `Sfx.init()`, que reanuda el contexto suspendido, y ahí empieza la espera. Esto no se verificó en un equipo real.

### 2.3 Causa de "no puedo verlos": C02, el acceso

- Solo se llega a los créditos ganando la Línea Amarilla, la etapa secreta. En los datos hay 3 victorias ahí sobre 72 peleas.
- "Ver créditos" está oculto en el menú hasta `creditsSeen()`, que se marca recién a los 71,6 s (`POST_START`).
- La primera vez no se saltan (84 s) y no hay botón de pausa ni de salida. Quien recarga, cierra o se queda en un congelamiento C01 antes de los 71,6 s pierde el acceso y tiene que volver a ganar la etapa secreta.

### 2.4 Hallazgos menores

- **C03, sin red de seguridad.** Phaser 3.90 no vuelve a pedir el siguiente cuadro si `update` lanza una excepción (`RequestAnimationFrame.step`). Un error en cualquier dibujo de los créditos deja imagen quieta, música cortada a los 0,15 s y toques sin efecto, para siempre. No se encontró ese error, pero nada lo ataja.
- **C04, audio interrumpido en iOS.** `Sfx.init()` solo reanuda si el estado es `suspended`. Safari en iOS usa también `interrupted`. En ese caso la música puede no volver en el resto de la sesión.
- **C05, cobertura.** `npm run escenas` espera `t >= 1` y salta. Nunca recorre los 84 s, ni con mejoras, ni con el audio interrumpido. La sonda D de la novena auditoría corrió con el dibujo apagado.
- **C06, sin datos.** Los créditos no registran fluidez ni envían eventos. Un congelamiento no deja rastro en `npm run datos`.
- **V04** de la novena auditoría (salto de 0,2 a 0,3 s al volver de una pausa) sigue pendiente. Comparte arreglo con C01.

### 2.5 Cambios propuestos

| # | Cambio | Aceptación | Esfuerzo |
|---|---|---|---|
| C01 | La imagen nunca espera. Si al volver el audio queda más de 0,5 s detrás de la imagen, la música salta a la sección y el paso que corresponden a `t` (`Sfx.seek`), o sigue en silencio hasta la próxima sección. Resuelve V04 con el mismo mecanismo. | Con interrupciones de 5, 20 y 60 s en los instantes 10, 35 y 65: imagen detenida 0,25 s como máximo y duración total de hasta 84,5 s. Sin notas duplicadas. | M |
| C02a | Marcar los créditos como vistos al entrar, no a los 71,6 s. "Ver créditos" aparece en el menú desde la primera victoria en la Línea Amarilla. | Ganar, recargar a los 10 s y encontrar "Ver créditos" en el menú. | S |
| C02b | Botón de pausa en los créditos, con "Continuar" y "Ver después". "Ver después" lleva a los resultados. La regla de no saltar la primera vez se mantiene: salir no es saltar. Aprobado por el dueño el 16 de noviembre. | El botón mide 44 px o más y no choca con la ficha de reparto. La pausa detiene imagen y música juntas. | S |
| C03 | `try/catch` alrededor del cuerpo de `update` en `Credits`. Ante un error, termina los créditos, pasa a los resultados y registra el error. | Con un dibujo que lanza a propósito, la escena termina y aparecen los resultados. | S |
| C04 | Reanudar el audio también en `interrupted`, y al volver la página (`visibilitychange`, `pageshow`). | En iPad real, bloquear y desbloquear durante los créditos y recuperar la música. | S |
| C05 | Prueba unitaria del reloj con interrupciones, y un recorrido completo de los créditos en `npm run escenas` con el reloj acelerado, con mejoras al máximo y con una suspensión simulada del audio. | Ambas fallan sin C01 y pasan con C01. | M |
| C06 | Evento anónimo de créditos: entró, hasta qué segundo llegó, mayor intervalo sin avance de `t`, y si terminó, salió o hubo error. Con el contrato de `telemetry.ts` y `server/src/validate.ts`. | Aparece una sección "Créditos" en el informe. | S/M |

Orden: C01 con C05, luego C02a y C03, luego C02b y C04, y C06 al final.

Dos preguntas a quienes lo reportaron distinguen C01 del resto: si la música seguía sonando mientras la imagen estaba quieta, y si después de un rato siguió sola. Dos respuestas afirmativas confirman C01. Si no había música y nunca siguió, hay que buscar un error real con C03 y C06 puestos.

## 3. Gráficos

| # | Hallazgo | Mejora | Aceptación | Esfuerzo |
|---|---|---|---|---|
| G1 | El asfalto ocupa cerca de dos tercios del cuadro y es el mismo gris en todos los distritos. | Paleta de pista por distrito en el JSON: tono, desgaste y color de línea. | Dos capturas de distritos distintos se distinguen sin mirar los costados. | S |
| G2 | Costa Verde "de noche" tiene la misma luz que Miraflores. | Capa de oscuridad con conos de faros y halos de postes. Los avisos del jefe van por encima. | Las amenazas se leen igual o mejor que hoy. p95 de hasta 20 ms. | M |
| G3 | Estilos mezclados en Costa Verde: vehículos suaves, mar con borde en escalones y acantilado con trama ruidosa. | Rehornear los costados con el acabado de los vehículos. Sirve de piloto de arte interno. | Sin escalones visibles en el borde del mar a 393 de ancho. | M |
| G4 | Edificios de Miraflores: el mismo módulo cinco veces seguidas. | Tres o cuatro variantes por distrito, por semilla, y un hito reconocible por tramo. | Ningún módulo se repite dos veces seguidas. | M |
| G5 | Poca sensación de velocidad y de contacto con el piso. | Humo de escape, marcas de frenada, chispas en roces y líneas de velocidad con Turbo. Respetar `reduceMotion`. | No tapan avisos ni proyectiles. | S/M |

## 4. UI

| # | Hallazgo | Mejora | Esfuerzo |
|---|---|---|---|
| U1 | En el menú, el contenido que se desplaza se ve por debajo y alrededor de la tarjeta fija de "Jugar". | Fondo opaco con degradado sobre la tarjeta y margen inferior al contenido. | S |
| U2 | Diez enlaces subrayados en cuatro filas, con "Empezar de nuevo" al nivel de "Ranking". | Taller y Ranking como botones, el resto en una hoja de ajustes, y la acción destructiva al fondo. | S |
| U3 | "PUNTO CIEGO" en verde oscuro y 7 px sobre asfalto oscuro. | Banda luminosa pegada al costado derecho del jefe. | S |
| U4 | Las papeletas son un texto de 9 px junto a la pausa. | Contador fijo en el HUD que late con cada multa y nombra la causa. | S |
| U5 | Taller: la quinta categoría queda cortada, sobra espacio bajo las tarjetas y el precio inalcanzable no dice cuánto falta. | Pestañas que entren en el ancho y "te faltan S/ X" por tarjeta. | S |
| U6 | "¡AHÍ VIENE!" se mantuvo más de 15 s en el centro de la pista en las dos etapas, casi sin acelerar. | Cerrado sin cambios. Decisión del dueño del 16 de noviembre: se queda en el centro. | · |

## 5. UX

- **Embestida.** Es el 42 % del daño en San Isidro y el último golpe en 8 de 10 derrotas. Aviso en la pista: carril del jefe en rojo antes de la carga, sonido propio y vibración en Android (hoy no se usa `navigator.vibrate`).
- **Papeletas.** Se llevan el 47 % del cobro en Miraflores normal y 250 % en difícil. Hacer U4 antes de tocar el balance, para separar lo que es lectura de lo que es castigo.
- **Modo "Acelerar es atacar".** Las 72 peleas fueron "por toque". Decisión del dueño del 16 de noviembre: se retira.

## 6. Orden sugerido

1. Créditos: C01 a C06.
2. Lectura de amenaza y costo: embestida, U3 y U4.
3. Menú y taller: U1, U2 y U5.
4. Luz y pista: G1, G2 y G5.
5. Costa Verde como piloto interno: G3 y G4.

Centro de Lima sigue con su plan del 17 de noviembre y no depende de esto. El plan ejecutable por fases, con las decisiones del dueño, está en `docs/plan-fases-2026-11-16.md`.
