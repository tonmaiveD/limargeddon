# 0048. Popurrí de los créditos

**Estado:** aceptada (plan de créditos aprobado por el dueño, 27 de octubre de 2026). Primera entrega del plan: la música. La escena de créditos, el poscrédito del vuelo de regreso y el botón del menú van en la segunda.

## Contexto
El dueño pidió créditos de 60 a 90 segundos al ganar la Línea Amarilla, con una música de popurrí "muy pegajosa según la neurociencia y la musicología". Hasta ahora el secuenciador tocaba una canción en bucle con tempo fijo.

## Decisión
- **Base en dos estudios:**
  - Jakubowski, Finkel, Stewart y Müllensiefen (2017), *Psychology of Aesthetics, Creativity, and the Arts* 11(2): las melodías que se quedan pegadas son más rápidas, tienen un contorno común y algún intervalo poco común, como saltos o notas repetidas.
  - Witek y otros (2014), *PLoS ONE* 9(4): la síncopa media es la que más ganas de moverse y más placer produce (U invertida).
- **Un gancho original de dos compases:**
  - Sube en arco hasta el Do agudo, con notas repetidas y una entrada a contratiempo.
  - Cae de golpe una sexta y termina más abajo de donde empezó.
- **Tema con variaciones:**
  - Cada distrito toca el mismo gancho con su género y su percusión, más una respuesta de un compás.
  - Van en el orden del juego: lounge, cumbia chicha, vals criollo en tres por cuatro, tecnocumbia, huayno con el largo corto, salsa con montuno y tumbao, electrónica con arpegio, andina con quena, festejo en seis por ocho y el pulso tenso de la Línea Amarilla.
  - La Línea Amarilla termina en un acorde de Mi que pide volver a La.
- **Mismo pulso para todo:** 124 por minuto, así los cambios son limpios. El vals dura cuatro compases de tres para durar lo mismo que los demás (unos 5,8 s por distrito).
- **Final:** todos juntos, con la chicha sobre bombo electrónico. La segunda vuelta sube un tono y el cierre queda arriba.
- **Duración:** 37 compases, unos 72 s.
- **Datos:** el popurrí está en `src/core/audio/medley.ts`. Cada sección es una canción normal con su largo en compases y su transposición.
- **Secuenciador** (`sfx.ts`):
  - `Sfx.music(true, 'creditos')` toca las secciones una vez y se detiene.
  - `Sfx.section()` dice qué sección suena, para sincronizar la escena.
- **Para escuchar antes de la escena:** con `?popurri` en la dirección, el menú muestra "Escuchar popurrí".

## Pruebas
`tests/popurri.test.ts`:
- Dura entre 60 y 90 s.
- Recorre los diez distritos en orden.
- Todas las secciones van al mismo pulso y llenan su largo justo.
- El gancho completo está en cada distrito y en el final.
- El final sube un tono.
- El gancho tiene arco, notas repetidas, un salto de al menos una sexta menor y entrada a contratiempo.
- El contratiempo cae recto, con swing o con puntillo según el género.

## Límites
Los estudios describen tendencias en canciones populares. No garantizan que esta melodía se quede pegada. Lo decide el oído del dueño y del tester.
