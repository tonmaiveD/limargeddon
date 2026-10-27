# 0047. Límites de los instrumentos: intervalos largos, sectores del anillo y conteo de bloqueos

**Estado:** aceptada (26 de octubre de 2026). Ajustes T01 y T02 de la séptima auditoría (`docs/auditorias/2026-10-26-septima-auditoria.md`) sobre las herramientas de la ADR 0046.

## Contexto
- **T01:** el medidor descartaba todo intervalo de más de 5 s como si el equipo se hubiera suspendido, sin evidencia de pausa. Un bloqueo de 5,001 s desaparecía.
- **T02:** la vista de colisiones mostraba los sectores del anillo activos en el aviso, al sostener y al soltarse, pero el bloqueo solo corre al sostener.
- La lista de bloqueos se corta en 30, y nada lo decía.

## Decisión
- Solo se descarta el cuadro que sigue a una pausa explícita. El juego se pausa al ocultarse o perder el foco.
- Un intervalo de más de 5 s sin pausa queda en `anomalies`, de causa desconocida y fuera de los percentiles. Una muestra con anomalías no sirve para aprobar fluidez.
- `stallCount` cuenta todos los bloqueos y `stallsCut` avisa cuando la lista quedó corta.
- Los sectores del anillo se ven activos solo con el anillo sostenido (`hold`). En el aviso y al soltarse se ven tenues.
- No cambia ninguna regla del juego.

## Pruebas
- Intervalos de 4.999, 5.000, 5.001 y 6.000 ms sin pausa: ninguno desaparece.
- El regreso de una pausa sí se descarta.
- 40 bloqueos: la lista guarda 30, el conteo dice 40.
- El mismo anillo en las tres fases: activo solo al sostener.
