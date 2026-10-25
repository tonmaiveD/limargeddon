# 0036. Puntaje y resultados honestos

**Estado:** aceptada (bloque B del orden recalibrado el 25 de octubre de 2026, `docs/estado.md`).

## Contexto
La tercera auditoría (N05 a N08) encontró que el balance, el puntaje y los resultados no contaban lo que pasa de verdad.
- **N05:** la campaña compraba siempre lo más barato, mientras el taller ya recomendaba por rol (ataque y aguante).
- **N06:** romper una barrera de peaje sumaba estrella pero no contaba como falta.
- **N07:** el daño por la derecha del puntaje incluía el exceso del golpe final. Con 1 de vida, un cono de 24 sumaba 24.
- **N08:** los resultados de la ruta mostraban punto ciego y racha, que no existen ahí, y prometían "cero daño en la fase 3", aunque se evalúa el último tramo, que es el cuarto. Tampoco mostraban los peajes, que sí se descuentan del cobro.

## Decisión
- **Campaña con tres políticas** (`npm run campana`):
  - **Barata:** lo más barato, la comparación histórica.
  - **Ataque:** la recomendación de ataque del taller y, si no hay, la de aguante.
  - **Aguante:** la recomendación de aguante y, si no hay, la de ataque.
  - Por defecto corre las tres. `POLITICA=<nombre>` corre una sola.
  - Un error del motor se informa aparte ("ERRORES") y detiene esa campaña, sin contarse como derrota.
- **Daño efectivo:**
  - `dmgBoss` acumula aparte el daño que de verdad quitó, el mínimo entre el golpe y la vida que quedaba (`effTotal`, `effRight`).
  - El puntaje y el porcentaje por la derecha de los resultados usan esa cuenta.
  - El número en pantalla y `stats.right` no cambian: este último lo compara la prueba de paridad con el prototipo.
- **Peaje roto** (decisión del dueño): cada barrera rota cuenta una falta para la limpieza del puntaje. Resta un tercio, sin multa en soles. Pagar no es falta.
- **Resultados de la ruta:**
  - En lugar de "Daño por la derecha" y "Mejor racha" muestran "Intentos que sobraron" y "Toques de la marea".
  - Si hubo peajes, aparece la fila "Peajes" con lo descontado.
  - La medalla de limpieza dice "cero daño en el último tramo". En las peleas con jefe nombra la última fase según su JSON.
  - El resumen (`Summary`) y el registro de peleas guardan los peajes.

## Medición
Campaña de 30 por modo y política. Gana al primer intento, con la mediana de las victorias entre paréntesis.

| Compra | Modo | Callao | Costa Verde | Línea Amarilla |
|---|---|---|---|---|
| Barata | Por toque | 80% (88 s) | 70% (76 s) | 100% |
| Barata | Acelerando | 63% (87 s) | 53% (79 s) | 100% |
| Ataque | Por toque | 53% (58 s) | 83% (86 s) | 100% |
| Ataque | Acelerando | 70% (60 s) | 87% (73 s) | 100% |
| Aguante | Por toque | 87% (98 s) | 90% (125 s) | 100% |
| Aguante | Acelerando | 87% (98 s) | 90% (111 s) | 100% |

No hubo errores en ninguna política. Antes del bloque A, comprar Socio de la Combi rompía la ruta.

Lectura, sin cambios de balance todavía:
- Comprar para atacar acorta las peleas y las hace más arriesgadas.
- Comprar para aguantar sube las victorias, pero alarga la pelea final a unos dos minutos de bot. Con el factor 1,6, una persona tardaría más de tres minutos.
- Se decide con partidas reales (bloque E). Una opción es que el taller explique ese intercambio.

## Consecuencias
- El puntaje de las peleas ganadas con golpe final excesivo baja un poco. Los récords guardados no se recalculan.
- La paridad no cambia.
- Pruebas nuevas:
  - Nuevo `tests/puntaje-honesto.test.ts`.
  - El peaje en `tests/linea-amarilla.test.ts`.
- Sigue el bloque C: aprender y volver.
