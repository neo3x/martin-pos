# MODULE_REVIEW

## Objetivo
Revisión funcional real del sistema actual (frontend + backend + datos), identificando brechas operativas por módulo y priorizando ejecución.

## Escala de Estado
- `Operativo`: flujo utilizable de punta a punta.
- `Parcial`: existe lógica, pero incompleta o inconsistente.
- `Simulado`: pantallas o endpoints sin operación real consistente.
- `Roto`: contrato frontend/backend no coincide o falla en ejecución normal.

## Resumen Ejecutivo
- El proyecto tiene **modelado de datos amplio**, pero varios módulos críticos están en estado **Parcial/Simulado**.
- La mayor brecha está en **Restaurante**: no existe operación completa de mesa-cuenta-cobro-cierre.
- Existe brecha alta entre frontend y backend en **Empleados**, **Caja** y **Facturación**.
- Faltan capacidades mínimas de **gestión de trabajadores y perfiles operativos**.
- Demo actual inicia por módulo, pero **no permite navegación por perfil operativo**.

## Revisión por Módulo

### 1) Restaurante
Estado: `Parcial`

Implementado hoy:
- Listado de mesas.
- Cambio manual de estado de mesa.
- Creación básica de orden.
- Listado de órdenes por estado.

Brechas críticas:
- Sin apertura de mesa con flujo operacional.
- Sin control explícito de comensales por mesa.
- Sin gestión robusta de items por pedido (editar/eliminar/cantidades pagadas).
- Cuenta incompleta por mesa (totales/saldos no confiables).
- Sin división de cuenta real.
- Sin cobro por cajero con validación operacional.
- Sin cierre de cuenta + liberación de mesa como flujo completo.
- UI de restaurante muestra `order.total` que no existe en modelo de orden.

Impacto:
- No se puede ejecutar operación real de salón.

### 2) Minimarket
Estado: `Parcial`

Implementado hoy:
- Catálogo y ventas básicas.
- Inventario y alertas base.

Brechas:
- Diferenciación operativa baja versus otros módulos.
- Faltan flujos propios de retail rápido (en la práctica se comparte lógica genérica).

### 3) Botillería
Estado: `Parcial` (backend más avanzado que frontend)

Implementado hoy:
- Backend con endpoints de botillería (verificación de edad, ILA, envases retornables, eventos, wine club).

Brechas:
- Frontend general no explota estos flujos como operación primaria.
- La venta general no integra obligatoriamente validaciones de botillería en el flujo principal de caja.

### 4) Librería / Bazar
Estado: `Parcial`

Implementado hoy:
- Ventas, productos e inventario genéricos.
- Apartados existe como módulo transversal.

Brechas:
- Diferenciación operativa insuficiente (operación similar al minimarket en práctica).
- Faltan flujos visibles específicos del rubro en el circuito principal.

### 5) Empleados / Trabajadores
Estado: `Roto`

Implementado hoy:
- Clock in / clock out por usuario autenticado.
- Consulta de turnos, comisiones, métricas.

Brechas críticas:
- Sin CRUD real de trabajadores (alta/edición/baja/rol).
- Sin gestión por sucursal de personal operativo.
- Contratos frontend/backend inconsistentes (campos de turnos/comisiones no coinciden).
- Sin control robusto por perfil para operación diaria.

### 6) Usuarios, Roles y Perfiles
Estado: `Parcial`

Implementado hoy:
- Roles definidos (SUPER_ADMIN, ADMIN, MANAGER, CASHIER, WAITER, KITCHEN, VIEWER).
- Guard de roles disponible.

Brechas:
- Matriz de permisos operativos incompleta en endpoints/pantallas clave.
- Gestión de roles en UI inexistente.
- Demo no está orientada por perfil operativo.

### 7) Ventas y Pagos
Estado: `Parcial`

Implementado hoy:
- Creación de venta con descuento e impacto de stock.
- Historial y cancelación de ventas.

Brechas:
- Integración incompleta con caja (movimientos de caja no quedan siempre registrados en flujo real).
- UX de cobro insuficiente para restaurante (pagos parciales/división).

### 8) Caja
Estado: `Roto`

Implementado hoy:
- Apertura y cierre de caja.
- Recuperación de caja actual.

Brechas críticas:
- Frontend espera campos que backend no retorna (`cashSales`, `transactionCount`).
- Sin acople consistente entre ventas y transacciones de caja en todos los flujos.

### 9) Facturación / Comprobantes
Estado: `Roto`

Implementado hoy:
- Crear factura desde venta.
- Emitir (cambio de estado).

Brechas críticas:
- No existe endpoint de listado en módulo de facturas que la UI consume.
- UI usa campos no consistentes (`customer.name` en lugar de `customerName`).
- Generación de comprobante demo incompleta (XML/PDF marcado como TODO en flujo principal de invoicing).

### 10) Clientes
Estado: `Parcial`

Implementado hoy:
- Listado y creación.

Brechas:
- Sin update/delete real.
- Inconsistencias de naming (RUT/taxId) entre capas.

### 11) Categorías
Estado: `Parcial`

Implementado hoy:
- Listado y creación.

Brechas:
- Sin update/delete.

### 12) Productos
Estado: `Operativo` (con mejoras necesarias)

Implementado hoy:
- CRUD principal y ajustes de stock.

Brechas:
- Faltan validaciones y flujos avanzados por rubro en la operación principal.

### 13) Demo
Estado: `Parcial`

Implementado hoy:
- Acceso demo por módulo.

Brechas:
- No permite entrar por perfil operativo (garzón/cajero/cocina/encargado).
- Semilla de usuarios demo por rol no está integrada al flujo principal.

## Hallazgos Transversales
- Existen modelos de datos ricos que no están conectados en flujo funcional diario.
- En varias pantallas hay **desacople de contratos** (nombres de campos/estructuras).
- El sistema necesita cerrar el ciclo: `acción UI -> endpoint -> persistencia -> lectura UI` en módulos críticos.

## Prioridad Ejecutiva Recomendada
1. Gestión de trabajadores y roles operativos.
2. CRUD real en entidades clave (trabajadores, clientes, categorías, restaurante).
3. Restaurante end-to-end (mesa/pedido/cuenta/división/cobro/cierre/liberación).
4. Diferenciación operativa de minimarket/botillería/librería.
5. Demo por perfil.
6. Pagos y comprobantes funcionales.
