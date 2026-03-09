# ROLE_ACCESS_MATRIX

## Vistas por rol

| Rol | Landing interna | Vistas principales | No visible |
|---|---|---|---|
| `SUPER_ADMIN` / `ADMIN` | `/dashboard` | Dashboard ejecutivo, reportes, caja, ventas, restaurante, KDS, configuración | - |
| `MANAGER` | `/dashboard/sales` (o restaurante según módulo activo) | Operación comercial, caja, restaurante, KDS | Dashboard ejecutivo global |
| `WAITER` | `/dashboard/restaurant` | Mesas, pedidos propios, cuenta de sus mesas, solicitudes de cliente de sus mesas | Dashboard ejecutivo, reportes globales, ventas ajenas, caja global |
| `KITCHEN` | `/kds` | KDS embebido y standalone, estados de ítems, tiempos de espera | Dashboard ejecutivo, caja, métricas financieras, reservas/gestión administrativa |
| `CASHIER` | `/dashboard/cash-register` | Caja, cobros, cierre, arqueo, comprobantes, cierre de cuenta/mesa | Dashboard ejecutivo, KPIs globales no operativos |
| `SELLER` | `/dashboard/sales` | Ventas propias, clientes, operación comercial | Dashboard ejecutivo, ventas ajenas |
| `STOCKER` | `/dashboard/inventory` | Inventario operativo, reposición | Dashboard ejecutivo, caja, métricas globales |
| `VIEWER` | `/dashboard/sales` (lectura operativa) | Consulta operativa limitada | Dashboard ejecutivo, acciones críticas |

## Reglas de permisos implementadas

- Dashboard ejecutivo:
  - Solo `SUPER_ADMIN` y `ADMIN` (frontend y backend).
- Restaurante:
  - `KITCHEN` no accede a dashboard restaurante ni acciones administrativas.
  - `WAITER` opera solo pedidos/mesas propios mediante filtros por `waiterId`.
  - `WAITER` no puede cerrar/cancelar pedidos ni cerrar cuenta.
  - `CASHIER`/`ADMIN`/`MANAGER` pueden cerrar cuenta; requiere caja abierta para cobro.
- Ventas (`/sales`):
  - Roles operativos (`CASHIER`, `SELLER`, `WAITER`, `STOCKER`, `KITCHEN`, `VIEWER`) quedan en alcance propio (`userId`).
  - Consulta por ID, receipt e impresión también respetan alcance propio.
- Solicitudes de mesa:
  - `WAITER` solo ve y gestiona solicitudes asociadas a sus mesas/pedidos.

## Sidebar y navegación

- `Dashboard` y `Reportes` se ocultan para perfiles no administrativos.
- `KDS Cocina` aparece como entrada dedicada para roles autorizados.
- Login/Register/Demo redirigen automáticamente al flujo operativo por rol.
