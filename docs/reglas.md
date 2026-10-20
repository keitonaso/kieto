# Reglas del motor de reparto

Este documento explica cada valor de [`src/domain/reglas.json`](../src/domain/reglas.json). Son los criterios más comunes en educación financiera, no verdades absolutas: si en tu país o tu caso tienen más sentido otros valores, propón el cambio.

| Regla | Valor | Por qué |
|---|---|---|
| `miniFondoMeses` | 1 | Un mes de gastos cubre la mayoría de imprevistos pequeños y evita volver a endeudarse mientras pagas deudas. |
| `fondoMesesIngresoFijo` | 3 | Con salario estable, 3 meses suelen bastar para cubrir una pérdida de empleo corta. |
| `fondoMesesIngresoVariable` | 6 | Si tu ingreso cambia mes a mes, necesitas más colchón. |
| `fondoMesesExtraPorDependiente` | 1 | Cada persona a cargo aumenta el riesgo de un mes malo. |
| `fondoMesesMaximo` | 9 | Más allá de esto, el dinero rinde mejor en metas o inversión. |
| `tasaDeudaCara` | 15 % anual | Por encima de esta tasa casi ninguna inversión segura rinde más de lo que cuesta la deuda, así que pagarla es la mejor "inversión". |
| `gustos.porcentajeNormal` | 20 % de lo disponible | Un presupuesto sin gustos no se sostiene. |
| `gustos.porcentajeAjustado` | 10 % de lo disponible | Se reduce, pero no a cero, mientras armas el mini fondo o pagas deudas caras. |

"Disponible" es lo que queda del ingreso después de gastos esenciales y cuotas mínimas.

## Reparto por etapa (de lo disponible, después de gustos)

| Etapa | Reparto |
|---|---|
| Déficit | Los gastos fijos superan el ingreso: primero recortar o renegociar. |
| Mini fondo | 100 % al fondo de emergencia. |
| Deudas caras | 80 % abono extra a la deuda más cara, 20 % al fondo. |
| Fondo completo | 60 % fondo, 40 % metas (100 % fondo si no hay metas). |
| Metas e inversión | Lo necesario para llegar a tiempo a las metas (máximo 70 %), el resto a inversión. |
