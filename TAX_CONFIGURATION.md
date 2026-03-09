# TAX_CONFIGURATION

## Resumen
Se implemento un flujo de impuesto configurable por sucursal, aplicado de forma consistente en ventas y cuentas de restaurante.

Se calcula y muestra:
- Neto
- Impuesto
- Total

## Settings soportados
Persistidos en `Branch.config`:
- `taxName`: nombre visible (`IVA`, `VAT`, `IGV`, `Tax`, etc.)
- `taxRatePercent`: porcentaje de impuesto (`0..100`)
- `taxEnabled`: habilita/deshabilita impuesto
- `pricesIncludeTax`: define si los precios ya incluyen impuesto

Compatibilidad:
- Si existe `taxRate` legado, se normaliza a `taxRatePercent`.

## Reglas de calculo
### Si `taxEnabled = false` o tasa `0`
- `neto = bruto`
- `impuesto = 0`
- `total = bruto`

### Si `pricesIncludeTax = true`
- `neto = bruto / (1 + tasa)`
- `impuesto = bruto - neto`
- `total = bruto`

### Si `pricesIncludeTax = false`
- `neto = bruto`
- `impuesto = neto * tasa`
- `total = neto + impuesto`

## Donde aplica
- Ventas retail (`SalesService`)
- Cuenta restaurante (`RestaurantService.getOrderAccount`)
- Comprobante (`PrinterService`, etiqueta de impuesto dinamica)
- Settings UI (`/dashboard/settings`, tab Impuestos)

## Endpoints
- `GET /settings/current`
- `PUT /settings/tax`

## Notas por modulo
- Restaurante: muestra neto/impuesto/total en cuenta por mesa.
- Retail (minimarket/botilleria/libreria): usa misma logica en ventas y comprobantes.

