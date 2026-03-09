# CHILE Competitive Gap Assessment - Martin POS

Fecha de revision: 2026-03-09  
Alcance revisado: backend (NestJS), frontend (Next.js), prisma schema, seeds/demo, rutas actuales.

## 1) Resumen Ejecutivo

El producto ya tiene una base operativa funcional en ventas, caja, inventario, empleados, demo por perfil y un modulo restaurante bastante mas maduro que en iteraciones previas.  
La brecha principal para competir en Chile ya no es "agregar modulos", sino cerrar la distancia entre:

- `features existentes` vs `flujo diario real por rubro`
- `capacidad tecnica` vs `experiencia operativa por rol`
- `datos demo` vs `escenarios comerciales reales`

## 2) Brecha por Modulo

## Restaurante (Prioridad 1)

### Ya existe
- Gestion de mesas con estados (`AVAILABLE`, `OCCUPIED`, `RESERVED`, `CLEANING`).
- Apertura de mesa con comensales y garzon.
- Pedido por mesa (agregar, editar estado, eliminar item no cobrado).
- Cuenta por mesa, cobro total/parcial por items, split preview por partes.
- Validacion de caja abierta para cobrar.
- Cierre de cuenta y liberacion de mesa (flujo de limpieza -> disponible).
- Demo con perfiles `ADMIN`, `MANAGER`, `CASHIER`, `WAITER`, `KITCHEN`, `VIEWER`.

### Brechas competitivas Chile
- No hay entidad de `reservas` operativa (crear/editar/cambiar estado/convertir a mesa ocupada).
- No existe `vista KDS dedicada` con cola de cocina y alertas por tiempo de espera.
- No hay estado de mesa explicitamente visible para `pendiente de pago` (hoy es inferido).
- Falta dashboard restaurante con KPIs propios (tiempo promedio por mesa, ventas por garzon, estado cocina, ticket promedio restaurante).
- Falta reforzar `precuenta` y propina sugerida/configurable en flujo de cobro.
- Falta filtro por sector/salon (si se habilita en datos de mesa).

### Diferencia real que debe agregarse
- Pasar de "POS con mesas" a "orquestacion de salon-cocina-caja" con trazabilidad por rol en tiempo real.

## Minimarket (Prioridad 2)

### Ya existe
- Venta funcional con carrito.
- Caja abierta/cierre por usuario.
- Inventario con stock bajo y vencimientos.
- Reportes de venta generales.

### Brechas competitivas Chile
- Caja rapida aun no es `retail-first` (faltan shortcuts de teclado, escaneo SKU/barcode prioritario, flujo de venta continua).
- Falta reposicion sugerida accionable (no solo alerta de stock bajo).
- Falta vista operacional por turno (resumen por cajero/turno integrado al flujo de venta).
- Dashboard minimarket sigue muy cercano al dashboard general.

### Diferencia real que debe agregarse
- Priorizar velocidad de caja + control de reposicion por turno/cajero.

## Botilleria (Prioridad 3)

### Ya existe
- Validacion etaria en ventas con alcohol.
- Modelos y endpoints especializados (alcohol, ILA, horarios, eventos, etc.).
- Catalogo base por categorias alcoholicas.

### Brechas competitivas Chile
- UI de operacion botilleria no aprovecha los endpoints especializados.
- Falta warning operacional por horario de venta en flujo de caja.
- Packs/combos/promos no estan integrados al punto de venta botilleria.
- Dashboard botilleria sin KPIs propios (premium mix, categoria alcoholica top, promo performance).

### Diferencia real que debe agregarse
- Operacion especializada de alta rotacion nocturna con compliance + comercializacion por packs.

## Libreria / Bazar (Prioridad 4)

### Ya existe
- Catalogo base libreria/bazar.
- Descuento automatico por volumen (5+ unidades).

### Brechas competitivas Chile
- Faltan atributos comerciales enriquecidos para libros y bazar (ISBN, autor, editorial, temporada, marca/tipo).
- Falta motor de campaÃ±as estacionales (escolar, oficina, regreso a clases) visible en flujo de venta.
- Dashboard libreria sigue demasiado generico.

### Diferencia real que debe agregarse
- Gestion por catalogo estructurado + estacionalidad comercial real.

## Capa Transversal (Prioridad 5)

### Ya existe
- CRUD trabajadores + desactivacion logica.
- Turnos (clock-in/out), rendimiento, comisiones.
- Caja con apertura/cierre y diferencia esperada.
- Demo por perfil y modulo.
- Trazabilidad base en ventas y caja por usuario.

### Brechas competitivas Chile
- Reporteria aun concentrada en un solo reporte de ventas general.
- Permisos por accion no estan completamente explicitados por modulo en backend (predomina gating en frontend).
- Falta un set uniforme de reportes por modulo/rol (restaurante, minimarket, botilleria, libreria).

### Diferencia real que debe agregarse
- Plataforma SaaS multi-rubro con identidad operativa por modulo y visibilidad por rol.

## 3) Checklist Chile - Estado Actual

- [ ] Restaurante tiene reservas
- [ ] Restaurante tiene cocina/KDS o cola de preparacion dedicada
- [x] Restaurante tiene separacion clara de roles: garzon/cajero/cocina/admin (parcialmente operativa)
- [x] Restaurante tiene cuenta, division y cierre funcional (falta propina/precuenta robusta)
- [ ] Minimarket tiene caja rapida real
- [x] Minimarket tiene apertura/cierre por turno (base funcional)
- [x] Minimarket tiene stock critico visible (falta reposicion sugerida accionable)
- [ ] Botilleria tiene packs/promociones integradas + validacion etaria (validacion etaria si, packs integrados no)
- [ ] Botilleria tiene metricas propias
- [ ] Libreria tiene catalogo enriquecido y campaÃ±as/temporadas
- [x] Modulos tienen demo por perfil (cobertura base)
- [ ] Dashboards realmente distintos por modulo (diferencia parcial)
- [ ] Reportes y flujos coherentes por modulo (predomina reporte general)
- [x] CRUD real funcionando (productos, clientes, empleados, etc.)
- [x] Caja y pagos dejan trazabilidad por empleado

## 4) Recomendacion de enfoque inmediato

1. Cerrar brecha restaurante end-to-end (reservas + KDS + dashboard restaurante + role experience).
2. Consolidar minimarket en modo caja rapida y reposicion.
3. Activar verticalizacion real de botilleria y libreria sobre promociones/reportes/catalogo.
4. Estandarizar reportes por modulo y permisos por accion en toda la plataforma.


