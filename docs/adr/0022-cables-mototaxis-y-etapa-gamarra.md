# 0022. Cables, mototaxis y Etapa 5 Gamarra

**Estado:** aceptada, pendiente de prueba del dueño en el teléfono.

## Contexto
El plan pone a Gamarra como quinta etapa, con triciclos con fardos, carretillas saliendo de galerías, rumas de cajas y cables bajos que castigan acelerar. El jefe es el camión de mercadería con rollos de tela rodando. Hacían falta cuatro piezas en el motor.

## Decisión
- **Huecos que castigan acelerar** (`accelOnly` en un obstáculo `hueco`): solo hacen daño si se cruzan con el acelerador apretado. `hitText` cambia el aviso (por ejemplo, "¡CABLES!"). El estilo nuevo `cables` dibuja postes y cables colgando.
  - Juega con la regla de oro del control: soltar es esquivar.
  - En el modo "acelerar es atacar" obliga a dejar de disparar un momento.
- **Vehículos `mototaxi` y `triciclo`** en `look.kind`: tres ruedas con toldo, y triciclo de carga con fardos. Ninguno paga al eliminarlo (`killBonus: 0`), igual que ciclistas y Delivery.
- **Variantes del lanzamiento** (`throw`):
  - `from: "atras"`: sale de la parte de atrás del jefe.
  - `aim: "abajo"`: cae recto hacia abajo en abanico, en vez de apuntar al Tico.
  - `look: "rollo"` con `cols` de colores.
  - El aviso dibuja una línea por cada trayectoria, así se ve el hueco entre los rollos.
- **Efecto de objeto `obstacleHit`:** el primer obstáculo de cada pelea no hace daño. Es el **Rollo de tela**, premio de Gamarra.
- **Etapa 5, Gamarra:**
  - Jefe: el Camión de Gamarra.
    - Fase 1: frenazo para descargar y rollos.
    - Fase 2: reversa en doble fila, rollos y un mototaxi que llega a llevarse la carga.
    - Fase 3: embestida, rollos en abanico ancho y bocina.
  - Ruta: rumas, cables y carretillas que se mueven de lado.
  - Tráfico: mototaxis, triciclos, combis, taxis y policía. En Difícil, enjambre de mototaxis.
- **Balance** (bot medio, Normal, 30 semillas):
  - Por toque gana 22 de 30, con mediana de 74 s.
  - Acelerando gana 21 de 30, con mediana de 66 s.
  - No hizo falta ajustar.

## Consecuencias
- El Callao puede usar `throw` con `from: "atras"` para los contenedores que caen.
- Con las mejoras típicas a esta altura, Difícil se vuelve fácil para el bot (29 de 30). Queda para la pasada de dificultad final, con el juego completo.
