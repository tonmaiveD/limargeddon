# 0064. Pista por distrito y efectos de contacto

**Estado:** aceptada (18 de noviembre de 2026). Fase 8 de `docs/plan-fases-2026-11-16.md`, hallazgos G1 y G5 de `docs/auditorias/2026-11-16-graficos-ux-ui-creditos.md`. Amplía el asfalto del nivel B (ADR 0044).

## Contexto
- **G1:** el asfalto ocupa cerca de dos tercios del cuadro y era el mismo gris en las diez etapas.
- **G5:** había poca sensación de velocidad y de contacto con el piso.

## Decisión
- **Paleta de la pista (`road.paint`)**, declarable en el JSON de cada etapa. Tiene cuatro campos:
  - `asphalt`: el tono del asfalto.
  - `wear`: el desgaste, de 0 a 1,5. Escala las huellas de llantas, las grietas, las manchas de aceite y lo borroso de las líneas.
  - `line`: el color de las líneas entre carriles.
  - `edge`: el color de los bordes.
  - Sin `paint` la pista queda exactamente como antes (`ROAD_PAINT`, con `wear` 1). Los tramos de una ruta la heredan.
- **Valores de las diez etapas:**
  - Miraflores, azulado y poco gastado.
  - San Isidro, carbón liso con bordes blancos.
  - Centro, pardo, muy gastado, con líneas crema.
  - Javier Prado, gris de avenida.
  - Gamarra, polvoriento.
  - Callao, gris verdoso de puerto.
  - Vía Expresa, concreto claro.
  - Panamericana, tostado de desierto.
  - Costa Verde, azul noche.
  - Línea Amarilla, vía nueva casi negra.

  Todos son oscuros (luminancia menor a 70 de 255) para que el tráfico, el jefe y los avisos se lean encima.
- **Efectos de contacto y velocidad (`src/core/fx.ts`):**
  - humo de escape, más seguido al acelerar o con Turbo;
  - marcas de frenada de las llantas traseras al girar en el piso;
  - chispas cuando el Tico pierde vida por un golpe o un roce;
  - líneas de velocidad con Turbo, a los costados del asfalto.
- **Solo dibujo:**
  - Los efectos leen el estado y nunca lo cambian.
  - Sus partículas viven aparte, en un `WeakMap` por pelea, y avanzan con el tiempo de la pelea, así en pausa o en el congelamiento de impacto no se mueven.
  - Tienen su propio azar. Usar `Math.random`, que es el de la simulación, cambiaba la pelea, y la prueba lo detectó.
  - Van en la capa del asfalto, debajo del aviso de embestida, del tráfico, del jefe y de los proyectiles. Así no tapan avisos ni proyectiles.
  - Tienen tope de partículas.
  - Con movimiento reducido no hay líneas de velocidad y hay menos humo y chispas.

## Verificación
- `tests/pista.test.ts` comprueba que:
  - sin paleta la pista es la de antes;
  - las diez etapas tienen paleta, con tonos distintos y oscuros;
  - una pelea con efectos dibujados en cada cuadro queda igual que sin ellos, con la misma semilla.
- La prueba de paridad pasa.
- **Capturas** de las diez etapas antes y después, a 393 × 852: los distritos se distinguen por la pista sin mirar los costados.
- **Fluidez** en Chrome con tarjeta de video, a 393 × 852, en 10 s de pelea en San Isidro con Turbo, giros y golpes:
  - El p95 da 16,7 ms, igual que antes, y la meta es de hasta 20 ms.
  - El costo de un cuadro, simulación y dibujo, sube de 0,7 a 1,6 ms.
  - En Chrome con dibujo por software la máquina de prueba da 66,7 ms antes y después, así que esa medición no sirve para aprobar.
- **Pendiente en equipo real:** medir la fluidez en un teléfono.
