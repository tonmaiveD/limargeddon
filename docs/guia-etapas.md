# Guía para crear una etapa

Para quien construya una etapa nueva. Leer esto, `CLAUDE.md` y `docs/plan-etapas.md` (la fila de la etapa). No hace falta releer el prototipo ni las etapas terminadas.

## Reglas
- Una etapa es **datos más su jefe y su paisaje**. Si algo exige código nuevo en el motor (`src/core/`), va como pieza reutilizable y se documenta en un ADR.
- Español latinoamericano neutro, sin voseo. En los textos del juego (frases, consejos, rótulos, descripciones), sin guiones largos, dos puntos ni punto y coma. Usar comas o puntos. La sátira apunta a la mala conducción, al privilegio, a las autoridades y a la infraestructura, nunca a las personas por su trabajo, origen o clase. Las marcas reales van en parodia.
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
  - `look`: `kind` ("auto", "moto", "bici", "mototaxi" o "triciclo"), `roof`, `panel`, `siren`, `label`, `labelCol`, `labelSize`, `labelY`, `band` (combis), `box` (caja de reparto), `shades`.
  - `move.zigzag`: `{ "amp": 50, "freq": 3 }`. `move.brake`: `{ "chance": 0.25, "dur": 0.8 }`, frenazos en seco al azar.
  - `killBonus`: lo que paga sacarlo de la pista. Si falta, vale `traffic.killBonus`. Ciclistas y Delivery van con 0, para no premiar atropellar a quien trabaja o pedalea.
- **Enjambres** (`swarms`): `type` (un `k` de `traffic.types`), `diffs`, `first`, `every`, `count`, `formation` ("columna", "v" o "diagonal"), `gap` y `label`, un aviso en pantalla.
- **Obstáculos** (`obstacles`):
  - `kind` "bloque": sólido, empuja y desvía al tráfico. Estilo "conos", "barrera" o "caja".
  - `kind` "hueco": se cruza y hace daño; con turbo se vuela. Estilo "crater", "scooter" o "cables". Con `accelOnly` solo daña si se cruza acelerando, y `hitText` cambia el aviso.
  - `kind` "peaje" (estilo "peaje", `gatePeriod`): casetas con una barrera por carril que sube y baja; romper una cerrada daña y suma estrella.
  - `kind` "rampa" (estilo "rampa", `jump` en segundos): acelerando, el Tico salta y en el aire nada lo toca.
  - Bloques también con estilo "peatones" (por ejemplo, turistas: papeleta sin daño).
  - Otros campos: `lanes`, `h`, `w` (si es más angosto que los carriles), `drift` (vaivén lateral: `amp`, `freq`), `col`, `col2`, `label`, `dmg`, `fine` y, opcional, `diffs`.
- **Jefe** (`boss`): fases por porcentaje de vida.
  - `attack` o `attacks` con peso ("brake", "reverse", "ram", "jet") y tiempos de aviso (`tele`).
  - `jet`: chorro que empuja de lado (`tele`, `dur`, `w`, `push`, `dmg`), ver el Rochabús en `src/stages/centro/config.json`.
  - `swing`: coletazo de la mitad trasera hacia el lado del Tico (`tele`, `dur`, `reach`, `dmg`, `push`), ver el bus en `src/stages/via-expresa/config.json`.
  - `throw`: proyectiles en abanico hacia el Tico (`tele`, `count`, `spread`, `speed`, `dmg`, `r`, `col`, `text`, `park`, `from` "atras", `aim` "abajo", `look` "rollo", "contenedor" o "rompellantas", `cols` y `stun`), ver la Combi Asesina en `src/stages/javier-prado/config.json` y el camión en `src/stages/gamarra/config.json`. El renderer del jefe muestra el aviso cuando `b.flash === 'throw'`.
  - `summon`: trae vehículos de un tipo, desde un costado o desde arriba.
  - `escorts`: con `look`, `w` y `h` propios.
  - Claxon (`hornEvery`, `hornSound`, `hornCol`, `hornText`) y valets (solo San Isidro).
  - Frases (`lines`) y réplicas (`quips`).
- **Ayudas** (`hints`): frases cortas sobre el Tico en los primeros segundos, `{ "at": 1.5, "text": "..." }`. Pensadas para el tutorial, máximo unas ocho palabras.
- **Pista:** `road.exclusive` pinta un carril exclusivo (`lane`, `label`, `col`). Para quitar cruces o rompemuelles, poner `first` muy alto.
- **Clima** (`weather.fog`): garúa en oleadas que tapa la parte de arriba.
- **Nivel de búsqueda** (`wanted`): estrellas por faltas, patrulleros que persiguen y bloqueos (ver ADR 0025).
- **Pista curva** (`road.curve`: `amp`, `len`): solo visual.
- **Peligros** (`hazards`): `rockslide` (derrumbes), `birds` (gaviotas que manchan; el claxon las espanta) y `cart` (carretilla protegida con bono). Ver ADR 0026.
- **Jefe serpiente:** registrar la etapa con `ai: SnakeBoss` y declarar `boss.body` (`count`, `spacing`, `hp`, `w`, `h`, `contactDmg`, `cols`, `bodyDmgShare`, `lean`).
- **Dificultades:** vida del jefe, velocidad, frecuencia de ataques y `dmgMult`, el multiplicador del daño que recibe el Tico.
- **Recompensas:** pago, bono sin daño, `item` y `defeatTip` (consejo al perder).
  - `item`: objeto de victoria `{ id, name, desc, effect, icon, col }`. `effect` es "contactFine", "anyFine", "jetHit", "shotHit", "obstacleHit", "ramHit", "swingHit" o "wantedHit" o "birdHit" (ADR 0020 a 0026). `winLine`: remate que se muestra al ganar.. La `desc` va en minúscula, porque se muestra después de "nombre ·".
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
- Revisar también la fila con mejoras típicas (ver `ce-mej-toque` en el script): las mejoras deben ayudar sin trivializar la etapa.
- **Campaña** (`npm run campana`): el bot juega todo en orden comprando en el taller. Desde la Etapa 5 es la referencia de dificultad (ADR 0027): gana al primer intento entre 65 y 80%, con peleas de 60 a 85 s.
- **Metas de balance, bot medio (etapas 1 a 4):** Normal entre 75 y 85 s, ganando 22 a 27 de 30 peleas. Fácil, más corta y casi siempre ganada. Difícil, unos 10 s más larga y con menos de la mitad ganadas. Las personas tardan unas 1.5 veces más que el bot.
- Verificar con tests y simulación. Basta con una o dos capturas en viewport móvil (393×852) para revisar cómo se ve.

## Criterio de cierre
Tests, build y balance dentro de la meta. Textos revisados según las reglas de tono. ADR si se agregó una pieza al motor. PR abierto con lo que falta probar en teléfono.
