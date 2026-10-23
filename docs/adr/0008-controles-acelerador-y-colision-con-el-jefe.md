# 0008. Acelerador sin freno y tráfico que se aparta del jefe

**Estado:** aceptada por el dueño del producto, Hito 3.

## Contexto
- El dueño pidió quitar el freno: solo acelerador, siguiendo buenas prácticas de juegos arcade muy jugables. En el prototipo, el freno (▼) servía para bajar en pantalla y esquivar la reversa y la embestida del Q6.
- El dueño vio autos pasando por debajo del Q6. Era así desde el prototipo: el tráfico no chocaba con el jefe y se dibujaba antes que él.

## Decisión
- **Modo `acelerador`** (`player.throttle` en el JSON): mantener el acelerador sube el Tico; al soltar, vuelve solo a su línea de crucero (`player.y`) a `cruiseReturn` px/s. Soltar reemplaza al freno como esquive. Los rompemuelles siguen castigando pasar acelerando, así que soltar a tiempo es una habilidad. Las luces de freno del Tico se encienden al soltar mientras baja.
- **Volante y acelerador en una sola zona para el pulgar izquierdo** (`#stick`): mitad superior acelera, mitad inferior gira, y los bordes de la franja superior aceleran y giran a la vez, para deslizar el pulgar en diagonal sin levantarlo. Las armas quedan para el pulgar derecho. Se descartó poner el acelerador en la mano derecha: un solo pulgar no puede mantenerlo y disparar a la vez.
- Teclado: ← → o A D giran, ↑ o W acelera. ↓ ya no hace nada en este modo.
- **`traffic.yieldToBoss`**: cuando un auto se superpone al jefe, se aparta hacia el lado con espacio con un pequeño coletazo. Si no cabe a ningún lado, queda atascado detrás del jefe (o empujado hacia abajo si el jefe lo embiste). Aplica también al serenazgo y a las escoltas.

## Consecuencias
- Ambos comportamientos son modos del JSON. Con los modos del prototipo (`throttle: "libre"`, `yieldToBoss: false`) el motor sigue reproduciendo el prototipo cuadro a cuadro (ADR 0009).
- `tests/jugabilidad.test.ts` cubre el regreso a la línea de crucero, que ↓ no frena y que ningún auto termina un cuadro superpuesto al jefe.
