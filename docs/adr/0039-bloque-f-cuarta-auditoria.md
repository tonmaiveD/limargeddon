# 0039. Bloque F: ayudas que se alcanzan a leer y regreso a etapas ganadas

**Estado:** aceptada (bloque F, agregado antes del bloque E el 25 de octubre de 2026). Decisiones del dueño el mismo día.

## Contexto
La cuarta auditoría (`docs/auditorias/2026-10-25-cuarta-auditoria.md`) confirmó corregidos N01 a N09 y encontró cuatro fricciones nuevas.
- **R01:** terminar cualquier primera pelea marcaba la etapa entera como enseñada, incluso ayudas nunca vistas, el otro modo de disparo y el modo prueba. En la Costa Verde, 25 de 60 primeros intentos no mostraron la ayuda del anillo.
- **R02:** un aviso urgente reemplazaba a la ayuda visible y ambas quedaban gastadas. "Suelta el acelerador" llegó a durar 0,75 s.
- **R03:** las medallas invitan a volver a una etapa, pero el menú siempre ofrecía la más avanzada.
- **R04:** al cambiar de nombre, el menú seguía mostrando las medallas del nombre anterior.

## Decisión
- **Ayudas por ayuda y modo** (reemplaza la regla de la ADR 0037):
  - Una ayuda cuenta como leída recién con 2,4 s en pantalla. Se guarda como "etapa, modo y texto".
  - Las ya leídas en ese modo no vuelven a salir. Las demás siguen saliendo en las peleas siguientes, y al cambiar de modo salen las de ese modo.
  - Una explicación interrumpida antes de leerse vuelve a la cola.
  - Un aviso de peligro interrumpido o que no alcanzó a salir no aparece fuera de contexto: espera a que el peligro vuelva a ocurrir. Los eventos se detectan al empezar, no mientras duran.
  - Un aviso de peligro no reemplaza a otro que lleva menos de 1,2 s.
  - El modo prueba no guarda ayudas. Salir al menú a mitad de pelea guarda lo leído.
  - **"Ver ayudas otra vez"** en el menú vuelve a mostrar todas las de esa etapa, en los dos modos, sin tocar billetera, mejoras ni medallas. Aparece solo si la etapa ya enseñó algo y las ayudas están activadas.
  - Empezar de nuevo también las borra.
- **Interruptor de ayudas** (pedido del dueño):
  - "Ayudas activadas / desactivadas" en el menú, junto a Sonido, guardado en el dispositivo y activado por defecto.
  - Desactivadas no sale ninguna ayuda ni cuenta como leída. Los avisos propios del juego siguen igual, porque son parte de la pista y no del tutorial: el destello del jefe, la flecha del enrosque, el semáforo en rojo.
  - Al reactivarlas vuelven solo las no leídas.
  - Se descartó cerrar una ayuda tocándola. Los pulgares están en los controles de abajo y la ayuda va sobre el Tico, así que cerrarla sin leerla cuesta papeletas o vida en el semáforo o el enrosque.
- **Regreso a etapas ganadas** (cambia la regla de la ADR 0017, que solo permitía elegir con `?prueba`):
  - El menú muestra como números las etapas ya desbloqueadas, y elige por defecto la más avanzada.
  - Al elegir una anterior aparece "Ya la ganaste. Repetirla paga la mitad y no cambia tu avance", con el enlace "Seguir recorrido".
  - Las futuras siguen bloqueadas.
- **Medallas del jugador:** al confirmar un nombre, el menú vuelve a dibujar la etapa con las medallas de ese nombre.
- **Textos:**
  - En la Línea Amarilla, el texto del modo de disparo habla de abrirse paso, la marea y el carguero, sin racha ni punto ciego.
  - La ayuda del semáforo pasa a "Suelta el acelerador y espera el verde".
  - Las cifras del semáforo no cambian hasta medir con personas.

## Consecuencias
- La simulación y la paridad no cambian.
- El guardado reemplaza el campo `tutorial` por `hints`. Los guardados con `tutorial` vuelven a mostrar las ayudas una vez.
- Pruebas:
  - En `tests/tutorial.test.ts`: interrupción, avisos vencidos y memoria por ayuda y modo.
  - El menú se revisó en el navegador a 393×852: selector de 1 a 5, aviso de repetida, "Seguir recorrido" y "Ver ayudas otra vez".
- Sigue el bloque E, con partidas reales.
