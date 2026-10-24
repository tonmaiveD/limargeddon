# 0024. Saltos, frenazos, coletazo y Etapa 7 Vía Expresa

**Estado:** aceptada por el dueño del producto (mecánicas elegidas el 24 de octubre de 2026), pendiente de prueba en el teléfono.

## Contexto
La Vía Expresa (el Zanjón) pide rampas, autos de aplicación que frenan en seco, un carril exclusivo que nadie respeta y el bus articulado como jefe. El dueño eligió cada mecánica entre opciones:
- Las rampas hacen saltar solo si se pasan acelerando.
- El bus ataca con un coletazo del acordeón.
- El carril exclusivo es sátira visual, sin regla para el Tico.

## Decisión
- **Rampas** (`kind: "rampa"`, `jump` en segundos):
  - Pasarla acelerando, o con turbo, lanza al Tico (`p.air`). En el aire no lo tocan el tráfico, el jefe, los bloques, los huecos ni los rompemuelles. Casi no gira, puede disparar y aterriza con sacudida.
  - Sin acelerar es solo un saltito. Es lo contrario de los cables de Gamarra: aquí acelerar es pasar.
  - Se dibuja con sombra en el piso y el Tico más grande en el aire.
- **Frenazo de tráfico** (`move.brake: { chance, dur }`): el vehículo se detiene al azar con luces de freno y baja en pantalla a la velocidad de la vía. Solo sortea si el tipo lo declara, así que la paridad no cambia.
- **Coletazo** (ataque `swing`: `tele`, `dur`, `reach`, `dmg`, `push`):
  - La mitad trasera del jefe tiembla y una franja naranja marca el costado. Después barre hacia el lado donde estaba el Tico y llega un poco más abajo que la cola.
  - Golpea una vez y empuja de lado. El claxon lo corta.
  - El bus se dibuja en dos cuerpos con fuelle, y el de atrás gira (`b.swing`).
- **Carril exclusivo** (`road.exclusive`): carril teñido con "SOLO BUS", solo visual.
- **Efecto de objeto `swingHit`:** la **Tarjeta del Expreso** hace que el primer coletazo de cada pelea no haga daño.
- **Etapa 7, Vía Expresa:**
  - La pista va más rápido (340, turbo 480).
  - Sin pasos de cebra ni rompemuelles. Los cruces son puentes que pasan por encima, dibujados en el paisaje.
  - Ruta: rampas, cráteres y "PUENTE EN OBRA".
  - Tráfico: autos de aplicación que frenan en seco, taxis, camionetas, Delivery y policía. En Difícil, hora punta.
  - Jefe: El Expreso Articulado.
    - Fase 1: frenazo y coletazo.
    - Fase 2: coletazo, embestida y autos de aplicación.
    - Fase 3: suma la bocina.
- **Balance** (bot medio, Normal, 30 semillas):
  - Por toque gana 22 de 30, con mediana de 71 s.
  - Acelerando gana 26 de 30, con mediana de 72 s.
  - Con las mejoras típicas gana 30 de 30.
  - La vida del jefe quedó en 1800.

## Consecuencias
- Los saltos sirven para la Línea Amarilla del Terror (la rampa del avión) y para la Costa Verde.
- El bot de balance no salta a propósito ni esquiva el coletazo. Se queda más abajo que la cola del bus, así que el coletazo castiga sobre todo a quien sube por el costado.
- Con las mejoras típicas, Normal y Difícil se vuelven fáciles desde la Etapa 4. Queda para la pasada de dificultad final.
