# KDS_CONFIGURATION

## Alcance implementado
Se mejoro el KDS en modo embebido (`/dashboard/restaurant`, tab KDS) y modo standalone (`/kds`).

## Tema claro/oscuro
- Toggle de tema en ambas vistas.
- Preferencia persistida en `localStorage` (`omnipunto.kds.theme`).
- Si no hay preferencia local, usa la configuracion de sucursal (`kdsTheme`).

## Estados por botones
Se reemplazo el `select` por botones operativos:
- Pendiente
- Preparando
- Listo
- Entregado

Comportamiento:
- estado actual resaltado
- cambio directo de estado por click
- sincronizacion por API `PUT /restaurant/orders/:id/items/:itemId`

## Tiempos estimados con keypad numerico
- Campo `estimatedPrepMinutes` en `OrderItem`.
- Edicion de ETA via panel numerico (no texto libre).
- Minutos enteros, minimo `1`.
- Se muestra:
  - tiempo estimado (ETA)
  - tiempo transcurrido
  - alerta de atraso (`isOverdue`)

## Configuracion KDS por sucursal
Persistida en `Branch.config`:
- `kdsTheme`
- `kdsDefaultPrepMinutes`
- `kdsWarningMinutes`
- `kdsCriticalMinutes`

Endpoints:
- `GET /settings/current`
- `PUT /settings/kds`
- `GET /restaurant/kds`

## Modo standalone
Ruta dedicada:
- `/kds`

Uso:
- boton “Abrir KDS en ventana”
- boton “Modo pantalla cocina”
- fallback con mensaje si popup es bloqueado por navegador

## Datos y backend
- `getKitchenQueue` entrega `settings`, tiempos y estado de atraso por item.
- Al agregar items a pedido, se asigna ETA por defecto segun configuracion KDS.

