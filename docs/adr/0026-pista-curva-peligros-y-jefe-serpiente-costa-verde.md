# 0026. Pista curva, peligros del malecón, jefe serpiente y Etapa 9 Costa Verde

**Estado:** aceptada por el dueño del producto (ideas y mecánicas decididas el 24 de octubre de 2026), pendiente de prueba en el teléfono.

## Contexto
La Costa Verde es la etapa final del recorrido. El dueño pidió:
- Que no fuera recta.
- Deslizamientos del acantilado, aves que ensucian y tapan la vista, y autos en doble fila a la altura de Agua Dulce.
- Como jefe, la doble fila convertida en serpiente que se parte en dos al romperla.
- Una carretilla de helados ("Don Frío", parodia con los colores clásicos) que cruza imprudente y no se toca.

## Decisión
- **Pista curva** (`road.curve`: `amp`, `len`):
  - `Gfx` aplica un corrimiento horizontal según la altura en pantalla (`warp`) a todo menos al HUD. Los rectángulos altos se cortan en franjas para seguir la curva.
  - La simulación no cambia. Todo vive en coordenadas de la pista y solo se dibuja curvo, así que el control, las colisiones y la paridad quedan iguales.
- **Derrumbes** (`hazards.rockslide`): polvo y piedritas sobre uno o dos carriles del lado del acantilado como aviso, y después piedras que ruedan un rato (proyectiles `piedra`). El Casco de obra también las perdona.
- **Gaviotas** (`hazards.birds`):
  - Una bandada baja con su sombra hacia el carril del Tico. Si lo alcanza, mancha la pantalla unos segundos, sobre el juego y bajo el HUD.
  - El claxon la espanta.
  - La **Corneta de heladero** (efecto `birdHit`) perdona la primera.
- **Carretilla protegida** (`hazards.cart`):
  - Cruza la pista. Tocarla con el Tico o con un cono quita vida y es papeleta "¡AL HELADERO NO!", que suma estrella de búsqueda.
  - Si nunca se toca en la pelea, paga `bonus` al ganar, con el logro "Don Frío intacto".
  - Siempre se ve, aunque haya neblina.
- **Jefe serpiente** (`SnakeBoss` y `boss.body`):
  - La cabeza es un `PhaseBoss` normal. Detrás cuelga un cuerpo de autos con balizas que repite la posición de la cabeza con retraso y se inclina hacia la izquierda (`lean`).
  - El cuerpo protege el lado izquierdo y deja el punto ciego derecho accesible.
  - Cada segmento tiene vida, y el daño al cuerpo cuenta para la barra del jefe. Al romper un segmento, la cola se suelta como otra serpiente que deambula hasta salir por abajo.
  - Mientras la carretilla cruza a la altura de la cabeza o del cuerpo, toda la fila se detiene con balizas a cederle el paso: la ventana para atacar.
  - Los disparos al cuerpo entran por `BossAI.hitShot`, un gancho genérico.
- **Cierre:** al ganar, resultados muestra el remate (`rewards.winLine`): "La carretilla Don Frío cruza primero la meta. En Lima, el único que nunca choca es el heladero."
- **Etapa 9, Costa Verde:**
  - De noche, con neblina en oleadas y nivel de búsqueda.
  - Tráfico de todas las etapas.
  - Sin cruces ni rompemuelles.
  - Paisaje: el acantilado con malla a la izquierda y el mar con la playa a la derecha.
- **Balance** (bot medio, Normal, 30 semillas):
  - Por toque gana 22 de 30, con mediana de 86 s.
  - Acelerando gana 24 de 30.
  - Con las mejoras típicas gana 30 de 30.
  - Al bot de balance se le agregó `evitaCuerpo`, que suelta el acelerador si un segmento le queda cerca por delante. Sin eso se quedaba pegado a la cabeza y el cuerpo le pasaba por encima. En las otras etapas no cambia nada.
  - El cuerpo se inclinó a la izquierda porque, colgando derecho, tapaba la columna natural de ataque y la pelea duraba el doble.

## Consecuencias
- La curva y los peligros se pueden reutilizar en la Línea Amarilla del Terror (el túnel y la pista del aeropuerto).
- El remate de la carretilla es texto en resultados. Una animación de la carretilla cruzando la meta queda como pulido posible.
