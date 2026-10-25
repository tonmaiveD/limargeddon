# 0037. Aprender y volver: tutorial en contexto, medallas y récord con contexto

**Estado:** aceptada (bloque C del orden recalibrado el 25 de octubre de 2026). Decisiones del dueño el mismo día.

## Contexto
- **Ayudas:** solo Miraflores, Gamarra y la Vía Expresa tenían ayudas en pista. Iban por tiempo y salían en cada partida.
- **Objetivos:** no había objetivos opcionales para volver a una etapa ya ganada.
- **Récords (auditoría N09):** se guardaba solo el puntaje del récord, sin modo, dificultad, mejoras ni versión de la fórmula. El registro de peleas tampoco guardaba el puntaje ni el último golpe.

## Decisión
- **Tutorial en contexto** (sin pantallas aparte):
  - Cada ayuda (`hints` en el JSON) se dispara por tiempo (`at`) o por un evento (`on`). Puede esperar unos segundos después del evento (`after`) y puede ser solo para un modo de disparo (`mode`).
  - **Eventos:**
    - El jefe entra o cambia de fase, o empieza el aviso de un ataque (frenazo, reversa, embestida, chorro, lanzamiento o coletazo).
    - Un obstáculo de cierto estilo aparece en pantalla, o cae un bonus.
    - La carretilla, las gaviotas, el derrumbe, el enrosque, la primera estrella, la garúa, la marea, el avión o un tramo de la ruta.
  - **Turnos:** una ayuda dura al menos 2,4 s antes de ceder su lugar. Los avisos de peligro (ataques, enrosque, carretilla, gaviotas y derrumbe) entran al instante.
  - **Miraflores** enseña los controles en su momento:
    - Girar y soltar para esquivar.
    - No tocar a la gente.
    - Los conos según el modo de disparo, y pegar por la derecha.
    - El frenazo, los bonus, el aceite, la embestida y el claxon.
  - **Las demás etapas** enseñan su mecánica cuando aparece. Hay ayudas en las diez.
  - Las ayudas de una etapa salen hasta terminar la primera pelea en ella. Empezar de nuevo las vuelve a mostrar.
- **Medallas** (tres fijas por etapa, solo la medalla, sin dinero ni puntaje):
  - Racha de 8, Punto ciego (80% del daño efectivo por la derecha) y Sin faltas.
  - En la Costa Verde, Don Frío intacto reemplaza a Sin faltas.
  - En la Línea Amarilla, Sin mojarte (la marea no te tocó), Todo pagado (ninguna barrera rota) y A la primera (sin perder intentos).
  - Se ganan al vencer, una vez por jugador y etapa, y quedan.
  - Se ven en el menú, bajo el consejo de la etapa, y en los resultados de una victoria, con "¡Nueva!" la primera vez.
  - El modo prueba no las guarda.
- **Récord con contexto:**
  - Cada récord guarda puntos, versión de la fórmula (`SCORE_VERSION = 2` desde la ADR 0036), modo, dificultad, mejoras, build, fecha y los puntos de cada parte.
  - En los resultados, un desplegable "Detalle del puntaje" muestra cuánto aportó cada parte. Debajo dice si fue récord, o cuál es el récord y con qué se hizo, y si es de una fórmula anterior. Los récords viejos aparecen sin detalle.
  - El ranking sigue igual, con la suma de los mejores por etapa.
- **Registro de peleas:** guarda también el puntaje con su versión, el último golpe y el daño recibido por fuente.

## Consecuencias
- La paridad no cambia: el prototipo no tiene ayudas.
- El guardado suma campos opcionales sin cambiar de versión.
- Pruebas:
  - Nuevo `tests/tutorial.test.ts`.
  - Dos pruebas viejas se adaptaron a las ayudas por evento.
- Pendiente para partidas reales: ver si las ayudas llegan a tiempo y si alguna tapa una amenaza. Están sobre el Tico, como antes.
- Sigue el bloque D, ambiente.
