# TIPS_MODULE_RULES

## Regla principal
La propina aplica solo al modulo `RESTAURANT`.

No aplica en:
- Minimarket
- Botilleria
- Libreria/Bazar

## Backend
Validacion en `RestaurantService.payOrder`:
- verifica modulo de sucursal y `tipsEnabled`
- si llega `tipAmount > 0` en modulo no permitido, rechaza la operacion

Registro contable:
- propina se registra como `CashTransaction.category = TIP`
- venta normal usa `CashTransaction.category = SALE`

## Caja / arqueo
Se mantienen montos separados:
- ingresos por venta
- propinas
- otros ingresos
- egresos

En UI de caja:
- columnas y tarjetas de propina se muestran solo si modulo activo es `RESTAURANT` o `ALL`.

## Tickets y flujo de pago
- En restaurante, puede incluirse propina en el cobro.
- En retail, no se expone flujo de propina ni se registra transaccion TIP.

## Configuracion
`Branch.config.tipsEnabled` queda alineado por modulo:
- `true` para `RESTAURANT` / `ALL`
- `false` para modulos retail

