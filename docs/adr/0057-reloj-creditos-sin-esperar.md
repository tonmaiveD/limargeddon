# 0057. El reloj de los créditos no espera a la música

**Estado:** aceptada (16 de noviembre de 2026). Fase 1 de `docs/plan-fases-2026-11-16.md`, hallazgo C01 de `docs/auditorias/2026-11-16-graficos-ux-ui-creditos.md` y V04 de la novena auditoría. Ajusta el reloj de la ADR 0050 y la protección de la ADR 0052.

## Contexto
`advance` hacía `t = max(t, audio)` mientras el reloj del audio avanzaba. Si el audio se cortaba con la página visible (una notificación, Siri, el centro de control) y después volvía desde donde había quedado, la imagen esperaba quieta hasta que la música la alcanzaba. El congelamiento duraba lo mismo que el corte: 5, 20 o 60 s. La primera vez los créditos no se saltan, así que para el jugador el juego se colgaba.

V04: al volver de una pausa, el primer cuadro medía toda la pausa (un cuarto de segundo con el tope), y la música retomaba desde el paso agendado, unos 150 ms adelante. La imagen saltaba entre 0,2 y 0,3 s.

## Decisión
- **La imagen nunca espera** (`advance` en `src/core/credits.ts`). Siempre avanza con el tiempo real del cuadro, con el tope de un cuarto de segundo por salto. Frente a la música:
  - Si va a menos de medio segundo, la imagen se acomoda suavemente, entre la mitad y una vez y media de la velocidad normal. Así las partes siguen cayendo en su sección sin detenerse.
  - Si la música va más de medio segundo adelante (el teléfono dibujó pocos cuadros), la imagen salta hasta ella, como antes.
  - Si va más de medio segundo atrás, la imagen sigue y el reloj pide reubicar la música (`resync`). La escena llama a `Sfx.seek(t)`, como máximo una vez por segundo.
  - Con el reloj del audio quieto o nulo, solo cuenta el tiempo real. Desaparece la espera de 0,4 s de la ADR 0052 al trabarse el audio.
- **`Sfx.seek(segundos)`** reubica el popurrí. `medleyPosition` (en `medley.ts`) da la sección, el primer paso que todavía no empezó y cuánto falta para él. Nunca vuelve a un paso anterior, así no se repite una nota que ya sonó. Pasado el último paso, el popurrí queda terminado.
- **Lo agendado se calla.** Las notas se agendan unos 150 ms antes de sonar. Al pausar y al reubicar, la música cambia de bus (`newBus`): el bus viejo baja a cero y se desconecta, y las notas agendadas que no sonaron no suenan nunca.
- **V04:** al seguir después de una pausa, el reloj queda `resumed`. El primer cuadro, que mide toda la pausa, no cuenta, y la música se reubica en el mismo instante de la imagen.

## Verificación
- `tests/creditos.test.ts`, con el `advance` real a 60 cuadros por segundo:
  - Cortes de audio de 5, 20 y 60 s en los instantes 10, 35 y 65, con el reloj del audio nulo y con el reloj activo pero quieto. La imagen queda detenida 0 s y la duración total es de 83,6 s. Con el reloj anterior la prueba fallaba con 20 s detenida.
  - Pausas de 30 s en 10, 35 y 65: se vuelve sin salto.
  - `medleyPosition` en varios instantes: el paso reubicado cae justo en el instante pedido, nunca antes.
  - Se mantienen las pruebas de cadencia (10 a 60 cuadros por segundo) y de alineación con la música (menos de 150 ms).
- Chrome sin ventana con audio real, suspendiendo el `AudioContext` 5 y 12 s a mitad del desfile:
  - La imagen nunca se detuvo. El mayor tramo quieto fue de 38 ms, un cuadro normal de ese entorno.
  - A los 2 s de volver el audio, la música estaba a 0,1 s o menos de la imagen, y siguió convergiendo.
  - Pausa de 5 s: el primer cuadro al seguir retoma desde el mismo instante (salto de 0 s), con la música alineada.
- **Pendiente en equipo real:** cortar el audio con una notificación o el centro de control en un iPhone o iPad, y escuchar si la música reubicada a mitad de sección suena bien. Si suena mal, la alternativa prevista es seguir en silencio hasta el comienzo de la sección siguiente.
