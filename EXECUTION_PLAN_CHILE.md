# Execution Plan Chile - Martin POS

Fecha: 2026-03-09  
Objetivo: cerrar brechas competitivas por rubro con foco operativo real.

## Fase 1 - Auditoria y Gap (Completada en esta iteracion)

### Entregables
- `CHILE_COMPETITIVE_GAP.md`
- `MODULE_PRIORITY_MATRIX.md`
- `EXECUTION_PLAN_CHILE.md`

### Validacion esperada
- Inventario de capacidades reales vs checklist Chile.
- Priorizacion acordada para ejecucion incremental.

## Fase 2 - Restaurante (Prioridad maxima)

### Objetivo
Consolidar restaurante como vertical competitivo (nivel Fudo-like operacional, sin clon visual).

### Alcance funcional
- Reservas: CRUD, asignacion de mesa, estados, conversion a mesa ocupada.
- KDS basico: cola cocina, estados de items, alertas por espera.
- Salon: enriquecer vista de mesa (tiempo transcurrido, estado operacional).
- Cuenta/cobro: reforzar precuenta y flujo cajero.
- Dashboard restaurante: KPIs de mesa, cocina, ticket, ventas por garzon.
- Demo restaurante: datos de reservas + ordenes activas + cierres recientes por perfil.

### Quick wins
- API de dashboard restaurante.
- Seccion KDS dedicada con filtro por tiempo de espera.
- Reservas con conversion a apertura de mesa.

### Riesgos
- Cambios de esquema prisma requieren migracion consistente.
- Ajuste de permisos por rol puede bloquear flujos no contemplados.
- Riesgo de regresion en flujo de cobro si no se validan pagos parciales.

### Dependencias
- Prisma schema + migracion.
- Restaurant service/controller.
- Restaurant frontend page.
- Seeds (prisma seed + bootstrap demo auth).

### Validacion esperada
- Build backend/web sin errores.
- `prisma validate/generate` exitoso.
- CRUD reservas operativo.
- KDS actualiza estados y tiempos.
- Cobro restaurante sin regresion.

## Fase 3 - Minimarket

### Objetivo
Transformar ventas en flujo retail rapido orientado a cajero.

### Alcance funcional
- Caja rapida con foco SKU/barcode.
- Venta continua con menos pasos.
- Resumen por turno/cajero.
- Reposicion sugerida en inventario.
- Dashboard minimarket propio.

### Quick wins
- Busqueda SKU/barcode prioritaria + shortcuts.
- Tarjetas de turno y cierres en dashboard.

### Riesgos
- Sobrecargar pagina de ventas con logica de todos los modulos.

### Validacion esperada
- Venta rapida minimarket medible en menos clics.
- Apertura/cierre y resumen de turno visibles.

## Fase 4 - Botilleria

### Objetivo
Diferenciar botilleria como retail especializado con compliance.

### Alcance funcional
- Packs/combo y promociones en POS.
- Warning horario de venta alcohol.
- Validacion etaria reforzada en flujo.
- Dashboard botilleria con mix alcoholico/premium/promos.

### Quick wins
- Alertas de horario + promo pack en flujo de venta.

### Riesgos
- Reglas de horarios requieren timezone consistente.

### Validacion esperada
- Venta alcoholica bloquea/advierte correctamente.
- Promociones impactan ticket y se visualizan en dashboard.

## Fase 5 - Libreria / Bazar

### Objetivo
Consolidar identidad de catalogo estructurado y estacionalidad.

### Alcance funcional
- Atributos de catalogo (ISBN/autor/editorial/marca/temporada).
- CampaÃ±as escolares/oficina.
- Promociones de packs estudio/oficina.
- Dashboard libreria por categorias y temporada.

### Quick wins
- Campos extendidos y filtros rapidos de catalogo.
- CampaÃ±a escolar activa en demo.

### Riesgos
- Cambios de modelo de producto afectan formularios existentes.

### Validacion esperada
- Catalogo libreria claramente distinto a minimarket.
- CampaÃ±as afectan ventas y reportes.

## Fase 6 - Capa transversal

### Objetivo
Estandarizar control por rol, caja, reportes y trazabilidad en todos los rubros.

### Alcance funcional
- Permisos por accion en backend (no solo frontend).
- Reportes por modulo.
- Trazabilidad unificada de venta/cobro/apertura/cierre/atencion.
- Demo por perfil con experiencia distinta de acciones.

### Riesgos
- Debt tecnico por permisos dispersos en UI.

### Validacion esperada
- Restricciones por rol auditables.
- Reportes por modulo no redundantes.

## Fase 7 - Validacion integral

### Checklist de cierre tecnico por iteracion
- Build backend
- Build frontend
- Prisma schema / migraciones
- Seeds demo
- Rutas afectadas
- CRUD real de nuevas entidades
- Demo por modulo y perfil
- Caja/pagos por modulo
- Dashboard por modulo

### Criterio de salida
- Cada modulo demuestra identidad operativa diaria y no solo diferencia de catalogo.


