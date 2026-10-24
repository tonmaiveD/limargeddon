# 0021. Proyectiles del jefe y Etapa 4 Javier Prado

**Estado:** aceptada, pendiente de prueba del dueño en el teléfono.

## Contexto
El plan de etapas pone a la Javier Prado como cuarta etapa, con la Combi Asesina y su cobrador, obras eternas, cráteres y combis en manada. El concepto dice que el cobrador lanza monedas. El motor no tenía ataques a distancia del jefe.

## Decisión
- **Ataque `throw`** (pieza nueva del motor, `boss.phases[].throw`):
  - Aviso de `tele` segundos. Durante el aviso, el renderer del jefe muestra el gesto y el motor dibuja una línea punteada hacia el Tico.
  - Después lanza `count` proyectiles en abanico (`spread`) hacia el Tico, a la velocidad y con el daño del JSON.
  - Al terminar, se queda detenido `park` segundos, la ventana para castigarlo.
  - El claxon corta el aviso. En Difícil sin aviso (`tele: false`), el aviso dura un 70%.
  - Los proyectiles viven en `Game.foes`. El SOAT los bloquea.
- **Objeto de victoria con efecto nuevo `shotHit`:** el **Casco de obra** hace que el primer proyectil de cada pelea no haga daño.
- **Etapa 4, Javier Prado** (solo datos, paisaje y dibujo del jefe):
  - Jefe: La Combi Asesina. Frenazo para recoger pasajeros, monedas ("¡SU VUELTO!") y embestida. En la fase 2 invoca a la combi de la competencia, y en la fase 3 toca la bocina.
  - Obstáculos: cráteres, camiones de obra y el by-pass ("PRONTO, PARA TU COMODIDAD").
  - Tráfico: combis de ruta, camionetas, taxis, Delivery (paga 0) y serenazgo. En Difícil, combis en manada.
  - Paisaje: torres de oficinas, el cerco de la obra, paraderos y semáforos que nunca coinciden.
- **Balance** (bot medio, Normal, 30 semillas):
  - Por toque, gana 22 de 30 con mediana de 69 s.
  - Acelerando, gana 17 de 30 con mediana de 77 s.
  - Con las mejoras típicas de la etapa 4, gana 25 de 30.
  - Hizo falta bajar la vida del jefe a 2000. El bot recibe más daño por segundo que en el Centro y le pega menos a una combi que se mueve mucho.

## Consecuencias
- Gamarra (rollos de tela) y el Callao (contenedores) pueden reutilizar `throw` con otro dibujo y otros números.
- El bot de balance no esquiva proyectiles. Las personas sí pueden, así que la etapa debería sentirse algo más fácil de lo que dice el bot. Hay que confirmarlo con el registro.
- Los semáforos en ola quedaron como paisaje. Si se quieren como mecánica (tráfico que frena en rojo), hace falta una pieza nueva.
