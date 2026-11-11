# 0055. Pruebas de escenas en Chrome sin ventana

**Estado:** aceptada (10 de noviembre de 2026, paso 4 del plan).

## Contexto
Las pruebas de `tests/` cubren la lógica pura. Las uniones entre escenas se revisaban a mano, en el simulador de iOS o con un script suelto, y son justamente lo que tocan los pasos que siguen: el arreglo de Centro de Lima en resultados y taller, y las iteraciones de UX.
- Pelea, resultados, taller y menú.
- Créditos tras la Línea Amarilla.
- Los controles táctiles solo en combate y créditos.

## Decisión
- `scripts/escenas.mjs`, sin dependencias nuevas: levanta el servidor de desarrollo y un Chrome sin ventana, y lo maneja con el protocolo de DevTools.
  - Emula un teléfono en vertical y táctil (393 × 852, pointer coarse).
  - Cada recorrido parte de un almacenamiento limpio o de una partida guardada armada para el caso.
  - Fuerza el final de la pelea (vida del jefe o del Tico en cero) y adelanta el juego con pasos extra para no esperar en tiempo real.
  - Bloquea el receptor de datos, así las pruebas nunca envían nada.
- **Recorridos:**
  1. Primera partida: nombre, aviso de datos, pelea, victoria, resultados con "Al taller", compra de una mejora y menú con la etapa 2. Revisa la billetera inicial guardada, el cobro y el desbloqueo.
  2. Derrota: quién ganó, revancha como opción principal, nada desbloqueado, revancha y salida al menú desde la pausa.
  3. Línea Amarilla: aparecen los créditos y la primera vez no se saltan.
  4. Créditos ya vistos: se saltan y llevan a los resultados.
  5. "Ver créditos" desde el menú vuelve al menú.
  - En todos, los controles táctiles se ven en la pelea y los créditos, y no en el menú ni en el taller.
- **Dónde corre:** `npm run escenas` en la computadora (alrededor de un minuto) y en cada PR con `.github/workflows/pruebas.yml`, junto con `npm test`. El deploy de `main` no depende de este flujo.
- Corre sobre el servidor de desarrollo porque es el único que expone `game` para manejarlo. El juego publicado no cambia.

## Consecuencias
- Un cambio que rompa el paso entre escenas falla antes de fusionar. Se comprobó rompiendo a propósito el menú para que mostrara los controles: fallaron los tres recorridos que pasan por él, con el motivo.
- No reemplaza probar en un teléfono real antes de cerrar un hito (sonido, toques reales, rendimiento).
