# 0065. Noche en la Costa Verde

**Estado:** aceptada (19 de noviembre de 2026). Fase 9 de `docs/plan-fases-2026-11-16.md`, hallazgo G2 de `docs/auditorias/2026-11-16-graficos-ux-ui-creditos.md`. Usa la idea del túnel (ADR 0030), donde solo se ve lo que iluminan los faros, pero sin taparle nada al jugador.

## Contexto
- **G2:** la Costa Verde se anuncia "de noche", pero solo el paisaje era oscuro. La pista y el tráfico se veían igual que de día.

## Decisión
- **Noche declarable por etapa (`night`)** en el JSON:
  - `dark`: la opacidad de la oscuridad, de 0 a 1.
  - `posts`: la distancia entre postes de luz, en unidades de pista. Sin este campo no hay postes.
  - Sin `night` la etapa se dibuja igual que antes. Por ahora solo la declara la Costa Verde, con `{ "dark": 0.62, "posts": 240 }`.
- **Qué ilumina** (`nightGlows` en `src/core/night.ts`):
  - el Tico, con un halo y el cono de sus faros hacia adelante;
  - cada auto del tráfico y cada combi aliada, con un halo y un cono corto;
  - cada obstáculo de la pista y cada bonus, con un halo;
  - los postes de luz, alternados a cada lado de la pista, que bajan con ella.
- **Cómo se dibuja:**
  - `Phaser.Graphics` no puede restar figuras, así que la oscuridad es una textura dinámica a media resolución.
  - Cada cuadro se llena de azul noche y se le borran las luces con dos pinceles suaves, un halo y un cono, horneados una vez. La escala suaviza los bordes.
  - Las posiciones pasan por la curva de la pista, y los conos giran con ella.
  - Encima van las cabezas de los postes y una luz tibia en los faros del Tico.
- **Qué queda por encima de la oscuridad:**
  - el jefe y sus autos, sus avisos y sus proyectiles;
  - la carretilla, las aves, el derrumbe y la garúa;
  - el Tico, sus conos, los números y el HUD.
  - **El aviso de embestida (ADR 0061)** sube en las etapas de noche a la capa del jefe. En la capa del asfalto quedaba atenuado. En las etapas de día no cambia de capa.
- **Debajo de la oscuridad** quedan el paisaje, el asfalto, los efectos de contacto (ADR 0064), los bonus y el tráfico. Cada uno lleva su propia luz, así que se siguen leyendo.
- **Solo dibujo:** las luces leen el estado y nunca lo cambian. No usan azar.
- **El túnel de la Línea Amarilla** se queda con su oscuridad de siempre (`drawDark`). Es más cerrada a propósito, porque ahí el chiste es no ver.

## Verificación
- **`tests/noche.test.ts`** comprueba que:
  - solo la Costa Verde declara la noche;
  - los postes van alternados y bajan con la pista;
  - el Tico, cada auto, cada obstáculo y cada bonus tienen su luz;
  - una pelea en la que se calculan las luces cada cuadro queda igual que sin ellas, con la misma semilla.
- **`npm run campana`** da exactamente lo mismo que en `main`.
- **Capturas antes y después** en las tres fases del jefe, a 393 × 852, con el juego detenido en el aviso de cada ataque:
  - El jefe, sus autos, los avisos, el derrumbe, la carretilla y las aves se ven igual que antes.
  - El aviso de embestida se lee mejor, rojo sobre la pista oscura.
  - El tráfico y los bonus se distinguen por su halo.
- **Fluidez** en Chrome con tarjeta de video, a 393 × 852, en 8 s de pelea en la Costa Verde, la etapa más pesada:
  - sin noche, p95 de 16,7 ms;
  - con noche, p95 de 16,8 ms.
  - Es lo mismo que en la Fase 8, y la meta es de hasta 20 ms.
- **Pendiente en equipo real:** medir la fluidez en un teléfono, sobre todo en la Costa Verde.
