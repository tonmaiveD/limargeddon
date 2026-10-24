# 0023. Contenedores, Llanta de remolcador y Etapa 6 Callao

**Estado:** aceptada, pendiente de prueba del dueño en el teléfono.

## Contexto
El plan pone al Callao (Av. Colonial) como sexta etapa, con contenedores mal amarrados, grúas, camiones de obra, cráteres con agua, desvíos de saneamiento, mototaxis, carcochas y combis asesinas. El jefe es el tráiler portacontenedores. Casi todo ya existía en el motor.

## Decisión
- **Proyectil `contenedor`** (`throw.look`): caja larga con nervaduras que cae desde atrás del tráiler. Reutiliza `from: "atras"` y `aim: "abajo"` (ADR 0022).
- **Efecto de objeto `ramHit`:** la primera embestida o reversa del jefe en cada pelea no hace daño. Es la **Llanta de remolcador**, premio del Callao.
- **Etapa 6, Callao** (datos, paisaje y dibujo del jefe):
  - Jefe: El Tráiler del Puerto.
    - Fase 1: frenazo y contenedores sueltos ("¡SE SOLTÓ!").
    - Fase 2: más contenedores, embestida y una combi que le abre paso.
    - Fase 3: embestida, contenedores en abanico y sirena del puerto.
  - Ruta: charcos ("¡CHARCO!"), camiones de obra y desvíos de saneamiento.
  - Tráfico: mototaxis (no pagan), combis, carcochas, taxis y policía. En Difícil, combis asesinas en grupo.
  - Paisaje: patios de contenedores, grúas pórtico y, a la derecha, el mar con un barco de carga.
- **Balance** (bot medio, Normal, 30 semillas):
  - Por toque gana 21 de 30, con mediana de 83 s.
  - Acelerando gana 20 de 30, con mediana de 69 s.
  - Con las mejoras típicas gana 28 de 30.
  - Hubo que acortar el tráiler (de 118 a 104) y suavizar el contacto y los contenedores. La cola quedaba tan cerca del Tico que los frenazos castigaban demasiado.

## Consecuencias
- Con esta etapa se completan las etapas medianas del plan. Las siguientes (Vía Expresa y Panamericana) necesitan piezas grandes de motor: saltos, clima y nivel de búsqueda.
- Igual que en Gamarra, con las mejoras típicas Difícil se vuelve fácil. Queda para la pasada de dificultad final.
