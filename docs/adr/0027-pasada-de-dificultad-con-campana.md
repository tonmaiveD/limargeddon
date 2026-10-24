# 0027. Pasada de dificultad con simulador de campaña

**Estado:** aceptada (el dueño pidió avanzar con simulaciones y ajustar con el juego completo), pendiente de confirmar con partidas reales.

## Contexto
Cada etapa se balanceó sola, con el bot sin mejoras. Pero un jugador llega a cada etapa con lo que compró en el taller. Con blindaje y reparación, desde la Etapa 5 el bot no moría nunca: ganaba todo al primer intento en unos 70 s, justo cuando el juego debería ponerse más difícil.

## Decisión
- **Simulador de campaña** (`npm run campana`, `scripts/campana.test.ts`):
  - El bot medio juega las nueve etapas en orden.
  - Cobra como el juego (la derrota también, y la etapa repetida paga la mitad) y, después de cada victoria, compra la mejora recomendada hasta quedarse sin plata.
  - Reporta, por etapa, cuántas campañas llegan, cuántas ganan al primer intento, los intentos promedio, la duración y lo gastado. `CAMPANAS=n` cambia la cantidad (20 por defecto).
- **Curva objetivo** (bot medio, Normal, gana al primer intento):

  | Etapas | Victorias al primer intento |
  |---|---|
  | 1 | ~95% |
  | 2 y 3 | ~80% |
  | 4 a 6 | 70 a 75% |
  | 7 y 8 | 65 a 70% |
  | 9 | ~60 a 75% |

  Peleas de 60 a 85 s para el bot, que son unos 1:40 a 2:20 para una persona.
- **Ajuste en Normal** (vida del jefe y multiplicador del daño que recibe el Tico, `dmgMult`):

  | Etapa | Vida | Daño |
  |---|---|---|
  | Gamarra | 2300 | ×1.3 |
  | Callao | 2300 | ×1.75 |
  | Vía Expresa | 2340 | ×1.7 |
  | Panamericana | 2520 | ×1.5 |
  | Costa Verde | 2500 | ×3.2 |

  - Fácil usa 75% de la vida y 55% del multiplicador (mínimo ×0.75). Difícil usa 120% de la vida y 130% del multiplicador.
  - Las etapas 1 a 4 no cambian: ya estaban en la curva.
  - Los cables de Gamarra pasan de 4 a 3 de daño, porque en el modo "acelerar" castigaban de más.
- **Resultado** (30 campañas, gana al primer intento):

  | Modo | Miraflores | San Isidro | Centro | Javier Prado | Gamarra | Callao | Vía Expresa | Panamericana | Costa Verde |
  |---|---|---|---|---|---|---|---|---|---|
  | Por toque | 93% | 77% | 90% | 87% | 77% | 67% | 79% | 66% | 76% |
  | Acelerando | 97% | 90% | 97% | 83% | 63% | 87% | 97% | 97% | 83% |

  Casi todas las campañas terminan el juego.
- **Economía:** sin cambios. Al llegar a la Costa Verde, la campaña típica gastó unos S/ 7.000 de los S/ 12.700 del catálogo normal. Siempre queda algo que comprar, y las mejoras de lujo siguen siendo una meta a largo plazo.
- **Metas de balance:**
  - Desde la Etapa 5 la referencia es la campaña, no el bot sin mejoras de `npm run balance`. Sin mejoras, esas etapas son duras a propósito: se espera haber pasado por el taller.
  - `npm run balance` ahora corre solo `scripts/balance.test.ts`.

## Consecuencias
- Comprar en el taller pasa a importar de verdad en la segunda mitad del juego. Quien no compra puede repetir etapas para juntar plata, a mitad de pago.
- El modo "acelerar" queda más fácil que "por toque" en las etapas 7 y 8. Se puede afinar con el registro de partidas reales.
- La Costa Verde necesitó un multiplicador alto porque el bot casi no recibe golpes ahí. Hay que vigilar en partidas reales que no se sienta injusta.
