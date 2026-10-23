# 0013. Dos modos de disparo permanentes

**Estado:** aceptada por el dueño del producto, Hito 3. Cierra la prueba abierta en la ADR 0011.

## Contexto
La ADR 0011 dejó un selector temporal para comparar "por toque" y "acelerar es atacar". Tras probarlos en su teléfono, el dueño decidió mantener ambos.

## Decisión
- El selector del menú pasa a ser una opción permanente, "Disparo": **Por toque** (por defecto) o **Acelerar es atacar**. La elección se guarda en el dispositivo.
- La pantalla de resultados muestra el modo de la pelea, y la mediana de victorias se calcula solo con peleas del mismo modo.
- **Cada modo se balancea por separado.** Por toque usa `ammo`, `reload` y `combo`; acelerar es atacar usa `cd`. Ajustar uno no altera el otro, y `npm run balance` reporta ambos.
- Los futuros puntajes y tablas (Hito 5) se separan por modo.

## Datos de la primera prueba en teléfono (por toque, Normal)
- Una victoria en 2:03 y una derrota en 2:06, con combo máximo x4 y x5.
- Las personas tardan unas 1.5 veces más que el bot medio (~83 s). Con 3 o 4 peleas más por modo se decide si bajar la vida del jefe solo en el modo por toque (unos 10 a 15%, para quedar entre 1:45 y 1:55).
