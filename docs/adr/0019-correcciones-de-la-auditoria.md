# 0019. Correcciones de la auditoría de octubre de 2026

**Estado:** aceptada por el dueño del producto.

## Contexto
Una auditoría externa (comportamiento, UX/UI y diseño de juego) contrastó el juego con el código del commit `15c3e5d`. Encontró textos que prometían efectos inexistentes, un combo que se leía como multiplicador, una pantalla de derrota sin datos de progreso y un registro de peleas sin contexto para comparar. El dueño decidió los puntos abiertos.

## Decisión
- **Recompensa por tipo de vehículo:** `traffic.types[].killBonus`, opcional. Ciclistas y Delivery pagan S/ 0, por coherencia con el tono. El resto sigue con `traffic.killBonus`.
- **Ayudas del tutorial** (`hints` en la config de la etapa): píldoras breves sobre el Tico. Miraflores enseña a soltar el acelerador para esquivar y a pegar por la derecha.
- **Racha y daño por separado:** el texto en pista pasa a "RACHA n · DAÑO +x%", y resultados muestra "Mejor racha". El daño extra sigue con techo de +30%.
- **Derrota:** el título pasa a "Te ganó ...", sin atribuir el golpe final, y se muestra la vida que le quedó al jefe.
- **Registro de peleas:** guarda el commit del build, si fue en modo prueba, las mejoras compradas, la vida que le quedó al jefe, el cobro bruto, las multas, lo cobrado y si fue repetida. La mediana trunca el tiempo igual que la pantalla y promedia las dos del medio cuando hay un número par.
- **Textos:** "Más conos" explica su efecto en cada modo. El consejo de Miraflores ya no dice que el claxon tiene multa. El logro "Vecino ejemplar" dice "cero papeletas", sin nombrar al serenazgo. `docs/concepto.md` pasa al Q8 y a la vida vigente.
- **Sin cambios por ahora:** la vida del jefe en el modo por toque y la economía. Primero se juntan peleas con el registro nuevo.
- Los efectos de Silbato, Bolso y Poncho van en una decisión aparte.

## Consecuencias
- Ningún cambio toca la simulación del prototipo: la prueba de paridad sigue igual.
- Ganar dinero en Miraflores depende un poco menos de eliminar tráfico, porque allí hay muchos ciclistas.
- El registro viejo sigue siendo válido, porque los campos nuevos son opcionales.
