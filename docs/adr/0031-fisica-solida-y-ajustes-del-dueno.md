# 0031. Física sólida, sticker de los Búfalos Mojados y nombre JUGADOR

**Estado:** aceptada por el dueño del producto (25 de octubre de 2026).

## Contexto
El dueño pidió:
- Auditar la física: autos, motos, carretillas y demás elementos no pueden pasar por debajo de otros ni ocupar el mismo espacio. Lo mismo al final de la Línea Amarilla, donde bajo el avión no puede haber nada chocable, salvo bajo las alas y los bonus.
- Renombrar el sticker de lujo.
- Cambiar el nombre por defecto del jugador.

La auditoría del código encontró que:
- No había ninguna separación entre vehículos. Autos, combis, motos y triciclos se atravesaban al ir a distinta velocidad o al zigzaguear.
- Los vehículos nuevos y los enjambres podían nacer encima de otros, y dos obstáculos podían caer en el mismo lugar.
- El tráfico pasaba por encima de peajes, de la carretilla, del cuerpo de la serpiente y del avión.
- El jefe atravesaba los obstáculos.
- El Tico ya chocaba bien con todo.

## Decisión
- **Física sólida** (`traffic.solid`, módulo `src/core/physics.ts`), activa en todas las etapas:
  - **Entre vehículos:** cuando dos se tocan, el de más arriba espera detrás del de abajo.
  - **Contra lo que no se pisa:** el tráfico se aparta del cuerpo de la serpiente, de la carretilla y del fuselaje del carguero, y espera su turno en los peajes.
  - **Al aparecer:** un vehículo nuevo busca un carril libre, y si no lo hay, no aparece. Un bloque no cae encima de otro ni bajo el fuselaje.
  - **El jefe** se corre de carril cuando un bloque viene por el suyo. Si igual lo alcanza, lo arrolla y el bloque sale volando ("¡CRASH!"), igual que el cuerpo de la serpiente.
  - **Peatones:** a la gente nunca se la atraviesa. Las marchas y los grupos aparecen dejando libre el carril del jefe, y cerca de él dejan de correrse y vuelven a su lugar, así el hueco queda de un carril entero. No se eligió que el jefe empuje a los manifestantes, por la carga de esa imagen.
  - **Peajes:** al jefe se le levanta la barrera y pasa por el medio de su carril.
  - **Carguero:** el fuselaje es sólido para todo y se entra solo por la rampa. Las alas no son sólidas, y los bonus pueden pasar por debajo.
- **Paridad:** la réplica del prototipo no usa `solid`, porque en el prototipo los autos se atravesaban. La prueba cuadro a cuadro sigue igual.
- **Medición:** un test corre las diez etapas en Difícil y exige menos de un cuadro con superposiciones cada mil. Hoy da prácticamente cero: un cuadro en el Centro y otro en Miraflores, sobre más de 22.000.
- **Sticker de lujo:** pasa a llamarse "Club de los Búfalos Mojados", en lugar de "Mi papá es socio del Golf". La Loca del Q8 conserva su frase "Mi papá es socio del Golf" como jactancia propia.
- **Nombre por defecto:** JUGADOR, en lugar de TAXISTA.

## Consecuencias
- El tráfico ahora hace fila en vez de atravesarse, y eso cambió un poco la campaña (20 por modo). Por toque, Javier Prado y Costa Verde quedan cerca del 60% de victorias al primer intento, y la Panamericana en 95%. Se afinará con datos reales.
- Los ADR 0018 y 0020 conservan el nombre anterior del sticker como registro histórico.
