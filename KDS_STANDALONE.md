# KDS_STANDALONE

## Objetivo

Permitir operación de cocina en dos modos:

- Modo embebido: dentro de `/dashboard/restaurant` (tab KDS).
- Modo standalone: ruta dedicada `/kds` para pantalla secundaria.

## Ruta dedicada

- URL: `/kds`
- Layout: minimal (sin navegación administrativa).
- Datos: consulta `GET /restaurant/kds` con polling.
- Actualización de ítems: `PUT /restaurant/orders/:id/items/:itemId` (estado).

## Flujo de apertura en ventana separada

Desde restaurante (tab KDS):

- Botón `Abrir KDS en ventana` usa `window.open('/kds', ...)`.
- Fallback por bloqueo de popup:
  - Se muestra mensaje claro para habilitar popups.
- Botón `Modo pantalla cocina` abre la ruta dedicada en pestaña normal.

## Comportamiento por rol

- Roles permitidos en `/kds`: `SUPER_ADMIN`, `ADMIN`, `MANAGER`, `KITCHEN`.
- `KITCHEN` aterriza por defecto en `/kds`.
- `KITCHEN` no accede a dashboard ejecutivo.

## Estabilidad operativa

- Refresco automático periódico (polling).
- Acción manual `Refrescar`.
- Opción `Pantalla completa` para uso continuo en monitor de cocina.
