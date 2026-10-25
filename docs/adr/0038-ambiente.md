# 0038. Ambiente: música por distrito, cierres y semáforos en ola

**Estado:** aceptada (bloque D del orden recalibrado el 25 de octubre de 2026). Decisiones del dueño el mismo día.

## Contexto
- Todas las etapas sonaban con la misma cumbia chicha del prototipo.
- Los cierres del plan de etapas (sección 5b y nivel secreto) no existían: Don Frío cruzando la meta y el Tico dentro del carguero.
- Los semáforos en ola de la Javier Prado estaban en el plan desde el principio, sin mecánica.

## Decisión
- **Música por distrito** (un género por distrito, melodías originales sintetizadas):
  - El secuenciador toca canciones declaradas como datos en `src/core/audio/songs.ts`: tempo, pasos por pulso, bajo, melodía, acordes opcionales y patrones de percusión.
  - La percusión es bombo, caja, hi-hat, güiro, clave, campana, cajón, shaker, bombo andino y quijada.
  - Cada etapa elige su canción con `music` en el JSON:
    - Miraflores, lounge playero.
    - San Isidro, la cumbia chicha del prototipo, igual que antes.
    - Centro, vals criollo en 3/4.
    - Javier Prado, tecnocumbia.
    - Gamarra, huayno cumbia.
    - Callao, salsa chalaca con clave 2-3.
    - Vía Expresa, electrónica rápida.
    - Panamericana, andina.
    - Costa Verde, festejo de noche en 12/8.
    - Línea Amarilla, sintetizador tenso.
- **Cierres** (`ending` en el JSON, unos 4 a 5 s, un toque o una tecla los salta):
  - **Costa Verde:** la pista queda libre y baja la meta "AGUA DULCE". La carretilla Don Frío sube y la cruza antes que el Tico, con papel picado y "¡DON FRÍO LLEGA PRIMERO!". Cierra con el texto "Don Frío llega primero, como siempre".
  - **Línea Amarilla:** el Tico amarrado en la bodega del carguero, con Lima de noche en las ventanillas, cada vez más chica y más lejos, y "Deuda saldada... por ahora".
  - Mientras dura el cierre, el mundo no se simula, y los carteles de fase, los globos y las ayudas se apagan. Después aparecen los resultados.
- **Semáforos en ola** (`lights` en el JSON, Javier Prado):
  - Cada 14 a 20 s llega una ola de tres semáforos separados 200 px que bajan con la pista.
  - Cada uno está en rojo y se pone en verde al llegar a la altura 470, así que se van poniendo en verde uno tras otro.
  - Quien va en su línea de crucero (530) pasa en verde. Quien se adelanta acelerando cruza en rojo: papeleta de S/ 50 con su falta.
  - La combi se pasa los rojos, dice "¡El rojo es referencial, causa!" y aparece "SE PASÓ LA ROJA".
  - El consejo de la etapa y una ayuda en pista ("Pasa en verde, si te adelantas es rojo") lo enseñan.
  - El bot de prueba suelta el acelerador cuando viene un rojo, como quien ya aprendió la regla. Sin eso se pasaba unas 10 luces rojas por pelea.

## Medición
Campaña de 30 por modo, compra barata. En la Javier Prado se gana al primer intento en el 73% de las campañas por toque (81 s de mediana) y en el 70% acelerando (71 s). Antes era 67% y 80%. Las peleas duran unos 7 a 10 s más, porque toca quedarse atrás en cada ola. Las demás etapas no cambian.

## Consecuencias
- La paridad no cambia: el prototipo no tiene semáforos ni cierres, y el audio no entra en la simulación.
- Pruebas nuevas en `tests/ambiente.test.ts`: canciones, semáforos y cierres.
- Pendiente para partidas reales: el volumen de cada canción y si las personas se adelantan en la ola sin querer.
