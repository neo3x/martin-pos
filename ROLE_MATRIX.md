# ROLE_MATRIX

## Objetivo
Definir perfiles operativos útiles por módulo y permisos accionables para operación diaria.

## Roles Base
- `SUPER_ADMIN`
- `ADMIN`
- `MANAGER`
- `CASHIER`
- `WAITER`
- `KITCHEN`
- `VIEWER`

## Matriz Global de Capacidades

| Capacidad | SUPER_ADMIN | ADMIN | MANAGER | CASHIER | WAITER | KITCHEN | VIEWER |
|---|---|---|---|---|---|---|---|
| Gestionar sucursal/configuración | Sí | Sí | Parcial | No | No | No | No |
| Gestionar trabajadores/roles | Sí | Sí | Sí | No | No | No | No |
| Crear/editar/eliminar productos/categorías | Sí | Sí | Sí | No | No | No | No |
| Ajustes de inventario | Sí | Sí | Sí | No | No | No | No |
| Crear ventas | Sí | Sí | Sí | Sí | Parcial | No | No |
| Abrir/cerrar caja | Sí | Sí | Sí | Sí | No | No | No |
| Cobrar cuentas restaurante | Sí | Sí | Sí | Sí | No | No | No |
| Operar mesas y pedidos restaurante | Sí | Sí | Sí | No | Sí | Parcial | No |
| Gestionar cocina (estado preparación) | Sí | Sí | Sí | No | Parcial | Sí | No |
| Emitir comprobantes/facturas | Sí | Sí | Sí | Sí | No | No | No |
| Ver reportes | Sí | Sí | Sí | Parcial | No | No | Sí |

## Matriz Operativa Restaurante

| Acción Restaurante | SUPER_ADMIN | ADMIN | MANAGER | CASHIER | WAITER | KITCHEN | VIEWER |
|---|---|---|---|---|---|---|---|
| Crear/editar/eliminar mesa | Sí | Sí | Sí | No | No | No | No |
| Abrir mesa (comensales + garzón) | Sí | Sí | Sí | No | Sí | No | No |
| Agregar/quitar items del pedido | Sí | Sí | Sí | No | Sí | No | No |
| Cambiar estado item (PENDING/PREPARING/READY/SERVED) | Sí | Sí | Sí | No | Parcial | Sí | No |
| Ver cuenta y saldo por mesa | Sí | Sí | Sí | Sí | Sí | No | Sí |
| Dividir cuenta | Sí | Sí | Sí | Sí | No | No | No |
| Registrar cobro | Sí | Sí | Sí | Sí | No | No | No |
| Cerrar cuenta | Sí | Sí | Sí | Sí | No | No | No |
| Liberar mesa | Sí | Sí | Sí | Sí | Sí | No | No |

## Perfiles Demo Recomendados por Módulo

### Restaurante
- `ADMIN`: visión integral.
- `WAITER`: operación de mesas/pedidos.
- `KITCHEN`: gestión de preparación.
- `CASHIER`: cobro, cierre de cuenta, caja.

### Minimarket
- `ADMIN`: control total.
- `MANAGER`: inventario y reposición.
- `CASHIER`: venta rápida y caja.

### Botillería
- `ADMIN`: control total.
- `MANAGER`: catálogo/stock/promociones.
- `CASHIER`: cobro con validaciones de alcohol.

### Librería / Bazar
- `ADMIN`: control total.
- `MANAGER`: catálogo y campañas.
- `CASHIER`: venta/boleta.

## Criterios de Seguridad Mínimos
- Operaciones de dinero (`open/close cash`, `restaurant pay`, `invoice issue`) restringidas a `CASHIER` o superiores.
- Gestión de personal restringida a `MANAGER` o superiores.
- Operaciones de cocina restringidas a `KITCHEN` y `MANAGER`.
- `VIEWER` solo lectura.
