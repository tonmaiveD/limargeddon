# 0025. Garúa, nivel de búsqueda, peajes y Etapa 8 Panamericana

**Estado:** aceptada por el dueño del producto (mecánicas elegidas el 24 de octubre de 2026), pendiente de prueba en el teléfono.

## Contexto
La Panamericana Norte pide clima, un nivel de búsqueda policial, peajes abandonados con barreras que bajan solas, buses interprovinciales y un escuadrón policial como jefe. El dueño eligió:
- Garúa en oleadas.
- Estrellas que suben por tus faltas.
- Un comandante con rompellantas que llama patrulleros.
- Peajes con barreras a destiempo, donde romper una cerrada suma una estrella.

## Decisión
- **Garúa** (`weather.fog`: `first`, `every`, `dur`, `depth`):
  - Cada cierto tiempo entra una oleada que tapa desde arriba hasta `depth` del alto, con llovizna.
  - Tapa el tráfico, los obstáculos y los bonus, pero no al jefe, sus avisos ni sus proyectiles.
  - Solo es visual: no cambia la simulación.
- **Nivel de búsqueda** (`wanted`: `max`, `decay`, `chaser`, `chaseLife`, `blockAt`, `blockEvery`, `block`):
  - Cada papeleta suma una estrella: roce o disparo a un intocable, o romper una barrera de peaje. Las estrellas bajan de a una cada `decay` segundos sin faltas.
  - Cada estrella nueva trae un patrullero de persecución. Entra por abajo en el carril de al lado y se pone delante del Tico unos segundos.
  - Desde `blockAt` estrellas aparece un bloqueo policial en la pista cada `blockEvery` segundos.
  - Las estrellas se ven bajo la barra del jefe. El sticker de lujo, que anula las papeletas, también evita las estrellas.
- **Peajes** (`kind: "peaje"`, `gatePeriod`):
  - Casetas entre carriles y una barrera por carril que sube y baja, cada una con su desfase, así que siempre hay alguna abierta.
  - Pasar por una cerrada la rompe, hace daño y suma una estrella. En el aire (rampa) se pasa por encima.
- **Rompellantas** (`throw.look: "rompellantas"`, `throw.stun`): una tira de clavos que cae desde atrás del jefe, hace daño y deja aturdido al Tico.
- **Efecto de objeto `wantedHit`:** el **Brevete vigente** hace que la primera estrella de cada pelea no cuente.
- **Etapa 8, Panamericana Norte:**
  - Jefe: El Comandante.
    - Fase 1: frenazo y rompellantas.
    - Fase 2: rompellantas, embestida y patrulleros que cierran carriles.
    - Fase 3: suma la sirena.
  - Tráfico: buses interprovinciales que zigzaguean, camiones, taxis, autos y algún patrullero. En Difícil, buses adelantando en curva.
  - Paisaje: arenales y dunas, el mar a la derecha, paradas de chicharrón y carteles de kilómetro.
- **Balance** (bot medio, 30 semillas):
  - En Normal, por toque gana 17 de 30, con mediana de 68 s.
  - En Normal, acelerando gana 25 de 30.
  - Con las mejoras típicas gana 29 de 30.
  - En Fácil gana 27 de 30.
  - La primera versión era muy letal (10 de 30): los patrulleros de persecución atravesaban al Tico al entrar, y el bot, que dispara sin parar, sumaba estrellas pegándoles a los patrulleros. Ahora entran por el carril de al lado, persiguen menos tiempo y pegan menos, hay menos patrulleros en la ruta y las estrellas bajan más rápido.

## Consecuencias
- La garúa y el nivel de búsqueda sirven para la Costa Verde (neblina) y la Línea Amarilla del Terror (peajes y estrellas).
- Por toque queda algo bajo de la meta para el bot. Las personas ven venir los peajes y dejan de disparar cerca de los patrulleros, y con las mejoras la etapa es fácil. Queda para la pasada de dificultad final.
