# IMPLEMENTATION_PLAN

## Objetivo
Ejecución incremental para pasar de un estado parcial/simulado a operación real, priorizando restaurante.

## Principios
- Cerrar ciclo completo: `UI -> API -> DB -> UI`.
- Priorizar coherencia de contratos frontend/backend.
- Aplicar permisos por rol en acciones operativas críticas.
- Favorecer cambios compatibles con datos demo existentes.

## Fase 1: Base Operativa (Alta Prioridad)

### 1. Gestión de trabajadores y roles
Alcance:
- Backend: CRUD de trabajadores por sucursal en `employees`.
- Backend: asignación/edición de rol, activación/desactivación.
- Frontend: pantalla de empleados con listado, alta, edición y baja lógica.
- Demo: creación de perfiles operativos por módulo.

Aceptación:
- Se puede crear un trabajador con rol y usar credenciales para operar.
- Se puede cambiar rol/estado y el cambio impacta acceso operativo.

### 2. CRUD real en acciones clave
Alcance:
- Clientes: `GET/POST/PUT/DELETE`.
- Categorías: `GET/POST/PUT/DELETE`.
- Restaurante: CRUD de mesas + edición de pedido.

Aceptación:
- Operaciones visibles inmediatamente en UI tras persistencia real.

## Fase 2: Restaurante End-to-End (Prioridad Máxima Absoluta)

### 3. Flujo completo de mesa
Alcance DB:
- Extender entidades de restaurante para comensales, precios por item, saldos pagados y cierre.

Alcance Backend:
- Abrir mesa con comensales y garzón.
- Agregar/editar/quitar items de pedido.
- Cuenta por mesa con subtotal/impuestos/total/saldo.
- División de cuenta (preview por partes + pago parcial por items/cantidades).
- Cobro por cajero (creación de venta real + movimiento de caja).
- Cierre de cuenta y liberación de mesa.

Alcance Frontend:
- Mapa de mesas con estado y comensales.
- Panel de pedido y cuenta viva.
- Acciones de dividir, cobrar, cerrar y liberar.
- Distinción de acciones según rol (garzón/cocina/cajero).

Aceptación:
- Se puede ejecutar el flujo real completo desde una mesa libre hasta su liberación post-cobro.

## Fase 3: Diferenciación Operativa de Módulos

### 4. Minimarket vs Botillería vs Librería
Alcance:
- Botillería: integración real de verificación de edad/condiciones al flujo de venta cuando aplique.
- Minimarket: enfoque retail rápido (flujo rápido de venta e inventario de rotación).
- Librería: operación orientada a estacionalidad y apartados en flujo principal.
- Dashboard/widgets y acciones concretas por módulo.

Aceptación:
- Cada módulo presenta al menos un flujo principal diferencial no cosmético.

## Fase 4: Demo por Perfil + Pagos y Comprobantes

### 5. Demo navegable por perfil
Alcance:
- `auth/demo-access` con selección de módulo + rol.
- UI demo con selector de perfil.

Aceptación:
- Usuario puede entrar a demo como cajero/garzón/cocina/manager y ver operación coherente.

### 6. Pagos y comprobantes funcionales
Alcance:
- Unificar contrato de caja entre backend/frontend.
- Registrar ingresos de ventas en caja activa.
- Facturación: listar, generar y emitir comprobantes demo (boleta/factura) sin romper UI.

Aceptación:
- Venta/cobro impacta caja.
- Comprobante se genera y se puede consultar desde la UI.

## Cambios Técnicos por Capa

### Frontend
- `dashboard/restaurant`: rediseño funcional completo.
- `dashboard/employees`: gestión de trabajadores + roles + turnos.
- `demo/page`: selector módulo + perfil.
- `cash-register` e `invoices`: ajuste de contratos y acciones reales.

### Backend
- `restaurant`: nuevos endpoints de operación de mesa/pedido/cuenta/cobro/cierre/liberación.
- `employees`: CRUD de trabajadores y turnos administrables.
- `customers` y `categories`: update/delete.
- `sales`: integración consistente con caja y restaurante.
- `invoicing`: endpoints de consulta + emisión real de comprobantes demo.

### Database
- Extensión de tablas de restaurante para soportar cuenta/división/pago parcial/cierre.
- Ajustes de campos para mejor trazabilidad de venta asociada a orden.

### Seeds
- Usuarios demo por rol por módulo.
- Escenarios de restaurante con mesas activas, pedidos y pagos parciales.
- Datos diferenciados entre minimarket/botillería/librería.

## Riesgos y Mitigaciones
- Riesgo: breaking change en contratos UI/API.
  - Mitigación: mantener compatibilidad en campos actuales o adaptar pantallas en la misma iteración.
- Riesgo: incoherencia de stock en pagos parciales.
  - Mitigación: centralizar cobro en `salesService` y validar cantidades remanentes por item.
- Riesgo: sobrecarga de alcance.
  - Mitigación: cerrar primero restaurante + empleados + caja/facturas, luego diferenciación fina.

## Criterio de Cierre
Se considera completo cuando:
1. Restaurante funciona de extremo a extremo con mesas, pedidos, comensales, garzón, cuenta, división, cobro por cajero, cierre y liberación.
2. Existe gestión real de trabajadores y roles operativos.
3. CRUD clave (clientes/categorías/mesas/pedidos) es funcional.
4. Demo permite entrar por perfil operativo.
5. Pagos y comprobantes funcionan en flujo demo sin inconsistencias de datos.
