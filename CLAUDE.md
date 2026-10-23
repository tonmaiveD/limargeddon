# Limargeddon

Arcade de acción vehicular browser based, vista cenital con scroll vertical. Un taxista informal con un Tico mejorable atraviesa distritos emblemáticos de Lima enfrentando combis, micros, policías, repartidores y jefes satíricos.

## Roles
- **Claude Code (esta carpeta):** desarrollo, build, tests, commits y deploy. Es la fuente de verdad del código.
- **Proyecto "Limargeddon" en claude.ai:** advisory, auditoría e innovación. Revisa diseño, balance y código, propone mecánicas. No edita este repositorio; sus decisiones llegan como cambios en `docs/`.

## Idioma y estilo
- Español latinoamericano neutro en código comentado, docs, commits y textos del juego. Nada de voseo ni rioplatense.
- Sin guiones largos en textos; usar comas.
- Diálogos del juego: sátira al privilegio y a la mala conducción, nunca a rasgos raciales o de clase de terceros.
- Marcas reales siempre como parodia ficticia (ej. el SUV del jefe de San Isidro es un "Q6" con cuatro anillos, uno deformado).

## Stack
- Phaser 3 + Vite + TypeScript, salida estática.
- Audio 100% sintetizado con WebAudio (sin archivos), portado desde `prototipo/san-isidro-v3.html`.
- Gráficos procedurales en canvas mientras no existan sprites; la deformación por daño es procedural.
- Deploy: GitHub Pages desde `main` (repo privado; Pages requiere plan que lo permita, si no, Netlify o Vercel).
- Guardado: localStorage con try/catch y versión de esquema.

## Estructura objetivo
```
src/
  main.ts                 # config Phaser, escalado FIT 360x640
  core/                   # motor común: vehículo, daño, armas, bonus, audio, input táctil
  scenes/                 # Boot, Menu, Garage (taller), Stage, Results
  stages/<distrito>/      # datos por etapa: config.json, spawns, paisaje, jefe
  bosses/                 # IA de jefes por fases, parametrizada por JSON
docs/                     # concepto, handoff, decisiones (ADR)
prototipo/                # referencia jugable original, no se modifica
```

## Reglas de trabajo
- El prototipo es la especificación viva de feeling: tiempos, daño, cooldowns y fases se portan tal cual y luego se balancean.
- Cada etapa es datos, no código nuevo: si una etapa exige código, va al motor común.
- Ramas por funcionalidad, PR a `main`, commits en español.
- Probar en móvil (controles táctiles) antes de cerrar cada hito.
