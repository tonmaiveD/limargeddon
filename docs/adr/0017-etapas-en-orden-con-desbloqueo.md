# 0017. Etapas en orden, con desbloqueo

**Estado:** aceptada por el dueño del producto. Reemplaza el selector de etapa de la ADR 0015.

## Contexto
La ADR 0015 agregó un selector para elegir etapa libremente. El dueño aclaró que las etapas son consecutivas: se desbloquean ganando, y en el modo de juego no se elige.

## Decisión
- **Progreso** en el guardado (`progress.unlocked`, esquema v1 con campo opcional): el número de la etapa más avanzada desbloqueada. Ganar la etapa n desbloquea la n+1. Repetir una etapa anterior nunca hace retroceder el avance.
- Si no hay progreso guardado, se reconstruye con las victorias ya registradas en el dispositivo, así nadie pierde lo jugado antes de este cambio.
- **Menú:** ofrece solo la etapa que toca, la más avanzada desbloqueada que exista. Si se desbloquea una etapa que todavía no está construida, ofrece la última disponible.
- **Resultados:** al ganar aparece **"Siguiente etapa"** como botón principal, con "Revancha" como alternativa. Al perder, se reintenta la misma. Si era la última disponible, se avisa que pronto llegan más distritos.
- **Modo prueba:** con `?prueba` en la dirección aparece el selector de etapas, para probar sin desbloquear. No se muestra en el juego normal.

## Consecuencias
- El orden de juego sale del campo `number` de cada etapa (`STAGE_ORDER` en `src/stages/index.ts`). Una etapa nueva se ubica sola en su lugar.
- El Hito 5 (taller y progresión) parte de este progreso para la economía y las mejoras.
