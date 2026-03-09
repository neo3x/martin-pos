# CASH_TIPS_FLOW

## Objetivo

Separar explícitamente propinas en caja/arqueo para no mezclarlas con ventas.

## Modelo de datos

Se agregó categoría en transacciones de caja:

- Campo: `cash_transactions.category`
- Enum: `SALE | TIP | OTHER`
- Migración: `202603090003_cash_tips_category`

Reglas:

- Venta normal POS: `category = SALE`
- Propina en cobro restaurante: `category = TIP`
- Movimientos manuales caja: `category = OTHER`

## Backend

### Registro de transacciones

- `SalesService.create` crea transacciones de ingreso con `category = SALE`.
- `RestaurantService.payOrder` registra propina con `category = TIP`.
- `CashRegisterService.createMovement` registra movimientos manuales con `category = OTHER`.

### Cálculo de arqueo/cuadratura

`CashRegisterService` ahora calcula:

- `salesIncome` (solo `SALE`)
- `tipsIncome` (solo `TIP`)
- `otherIncome` (solo `OTHER`)
- `incomeTotal = salesIncome + tipsIncome + otherIncome`
- `expectedCash = initialCash + incomeTotal - expenseTotal`

## Frontend (Caja)

En `/dashboard/cash-register`:

- Tarjetas separadas para:
  - Ventas
  - Propinas
  - Otros ingresos
- Resumen por cajero con columnas separadas:
  - Ventas
  - Propinas
  - Otros ingresos
  - Egresos
  - Diferencia
- Historial de turnos con columnas separadas para propinas.

## Consistencia operativa

- Las propinas quedan visibles y auditables como flujo independiente.
- La cuadratura usa ingresos totales reales, pero reporta propinas por separado.
