# Guía para crear una etapa

Para quien construya una etapa nueva. Leer esto, `CLAUDE.md` y `docs/plan-etapas.md` (la fila de la etapa). No hace falta releer el prototipo ni las etapas terminadas.

## Reglas
- Una etapa es **datos más su jefe y su paisaje**. Si algo exige código nuevo en el motor (`src/core/`), va como pieza reutilizable y se documenta en un ADR.
- Español latinoamericano neutro, sin voseo, sin guiones largos en los textos. La sátira apunta a la mala conducción, al privilegio, a las autoridades y a la infraestructura, nunca a las personas por su trabajo, origen o clase. Las marcas reales van en parodia.
- Rama por etapa (`etapa-<n>-<distrito>`), commits en español, PR a `main` con la atribución de Claude Code.
- No modificar `prototipo/` ni `tests/fixtures/`.

## Archivos de una etapa
```
src/stages/<distrito>/config.json   # todo lo ajustable (tipos StageConfig en src/core/config.ts)
src/stages/<distrito>/scenery.ts    # drawWorld: drawSides(..., drawSide) + drawRoad (src/core/road.ts)
src/bosses/<jefe>-render.ts         # dibujo del jefe con drawCar y su `extra`; la IA es PhaseBoss (phase-boss.ts)
src/stages/index.ts                 # registrar la etapa en STAGES
```
Para empezar, copiar `src/stages/miraflores/config.json` (el ejemplo más completo) y cambiar lo que corresponda. El jefe no necesita código propio: es `PhaseBoss` con otro JSON.

## Lo que se declara en el JSON (sin código)
- **Tráfico** (`traffic.types`): tamaño, velocidad, vida, colores, peso de aparición, daño de contacto, si es invulnerable y genera papeleta (serenazgo).
  - `look`: `kind` ("auto", "moto" o "bici"), `roof`, `panel`, `siren`, `label`, `labelCol`, `labelSize`, `labelY`, `band` (combis), `box` (caja de reparto), `shades`.
  - `move.zigzag`: `{ "amp": 50, "freq": 3 }`.
- **Enjambres** (`swarms`): `type` (un `k` de `traffic.types`), `diffs`, `first`, `every`, `count`, `formation` ("columna", "v" o "diagonal"), `gap` y `label`, un aviso en pantalla.
- **Obstáculos** (`obstacles`):
  - `kind` "bloque": sólido, empuja y desvía al tráfico. Estilo "conos", "barrera" o "caja".
  - `kind` "hueco": se cruza y hace daño; con turbo se vuela. Estilo "crater" o "scooter".
  - Bloques también con estilo "peatones" (por ejemplo, turistas: papeleta sin daño).
  - Otros campos: `lanes`, `h`, `w` (si es más angosto que los carriles), `col`, `col2`, `label`, `dmg`, `fine` y, opcional, `diffs`.
- **Jefe** (`boss`): fases por porcentaje de vida.
  - `attack` o `attacks` con peso ("brake", "reverse", "ram") y tiempos de aviso (`tele`).
  - `summon`: trae vehículos de un tipo, desde un costado o desde arriba.
  - `escorts`: con `look`, `w` y `h` propios.
  - Claxon (`hornEvery`, `hornSound`, `hornCol`, `hornText`) y valets (solo San Isidro).
  - Frases (`lines`) y réplicas (`quips`).
- **Dificultades:** vida del jefe, velocidad, frecuencia de ataques y `dmgMult`, el multiplicador del daño que recibe el Tico.
- **Recompensas:** pago, bono sin daño, `item` (premio que se muestra al ganar) y `defeatTip` (consejo al perder).
- **Armas, bonus, papeletas, rompemuelles, cruces, calles y recompensas.**

## Paisaje
- `drawWorld` debe cubrir `-view.extra .. 360 + view.extra` en x (ADR 0012): las pantallas anchas muestran más ciudad a los costados. Ver el bucle de columnas extra en `san-isidro/scenery.ts`.
- Usar `drawSides` y `drawRoad` de `src/core/road.ts`; la etapa solo escribe su `drawSide(g, x0, y, w, seg, idx, side)`. Lados: 0 izquierda junto a la pista, 1 derecha, 2c y 2c+1 columnas extra.
- Dibujar con la API tipo canvas de `Gfx` (ADR 0003). Sin imágenes.

## Cómo probar
```
npm test            # tests; la paridad con el prototipo debe seguir en verde
npm run balance     # duración y victorias con bots, por modo de disparo
npm run build
```
- Agregar la etapa a `scripts/balance.test.ts`. Con `ETAPA=<distrito> npm run balance` se corre solo esa etapa.
- **Metas de balance, bot medio:** Normal entre 75 y 85 s, ganando 22 a 27 de 30 peleas. Fácil, más corta y casi siempre ganada. Difícil, unos 10 s más larga y con menos de la mitad ganadas. Las personas tardan unas 1.5 veces más que el bot.
- Verificar con tests y simulación. Basta con una o dos capturas en viewport móvil (393×852) para revisar cómo se ve.

## Criterio de cierre
Tests, build y balance dentro de la meta. Textos revisados según las reglas de tono. ADR si se agregó una pieza al motor. PR abierto con lo que falta probar en teléfono.
