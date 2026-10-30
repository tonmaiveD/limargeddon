# 0052. Créditos que no se congelan en iPad

**Estado:** aceptada (30 de octubre de 2026). Corrige la pausa de los créditos de la ADR 0050.

## Contexto
El dueño vio que, después de ganar la Línea Amarilla, los créditos y el poscrédito se quedaban congelados en su iPad, con la música cortada. La ADR 0050 pausaba los créditos al perder el foco y los retomaba al recuperarlo. En iPad, Safari muchas veces avisa la pérdida de foco (una notificación, el dock, el centro de control) y no avisa cuando vuelve. La pausa no se levantaba nunca, no se veía en pantalla y un toque no la retomaba, así que parecía congelado. Se reprodujo en Chrome: con la pérdida de foco simulada, los créditos quedaban detenidos y sin música aunque se tocara la pantalla.

## Decisión
- **Pausar solo al salir de verdad:** cuando la página queda oculta (`visibilitychange`), y seguir al volver. Perder el foco ya no pausa.
- **Si queda en pausa, se ve y se retoma:** se oscurece la escena con "EN PAUSA · Toca para seguir". Cualquier toque o tecla la levanta, sin saltar nada, y la imagen y la música siguen desde el mismo punto.
- **Reloj protegido** (`advance` en `src/core/credits.ts`): si el reloj del audio deja de avanzar más de 0,4 s, la imagen sigue con el tiempo real. Nunca se queda esperando a una música que no suena.
- La música del poscrédito no arranca mientras hay pausa.

## Pruebas
- `tests/creditos.test.ts`: con el reloj del audio trabado durante 2 s, la imagen avanza casi 2 s igual. Se mantienen las pruebas de cadencia, de alineación con la música y de saltos largos.
- Reproducción en tiempo real en Chrome sin ventana: ganar la Línea Amarilla y saltar el cierre.
  - Una pérdida de foco ya no detiene nada.
  - Una pausa forzada se levanta con un toque, con la música de vuelta.
  - El aviso de pausa se ve.
