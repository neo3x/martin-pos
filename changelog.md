# Changelog

Registro de commits de los ultimos 3 dias del repositorio.

Periodo considerado: **2026-03-06** a **2026-03-09** (zona horaria segun metadata de cada commit).

## 2026-03-09

| Hash corto | Fecha | Autor | Mensaje |
|---|---|---|---|
| `3d8b41e` | 2026-03-09 16:04:22 -0300 | Francisco | creacion de changelog.md |
| `47eedc0` | 2026-03-09 15:40:22 -0300 | Francisco | mejores mayores en modulos de restaurant |
| `0e86bda` | 2026-03-09 12:31:11 -0300 | Francisco | cambios mayores en toda la app |
| `f89d414` | 2026-03-09 07:23:19 -0300 | Francisco | mejoras en setup.sh |

## 2026-03-08

| Hash corto | Fecha | Autor | Mensaje |
|---|---|---|---|
| `bfa05de` | 2026-03-08 23:37:06 -0300 | Francisco | mejoras funcionales de la app |
| `0e9768a` | 2026-03-08 22:28:19 -0300 | Francisco | se agregan nuevas funcionalidades al frontend |
| `f225fd4` | 2026-03-08 19:16:56 -0300 | Francisco | version 1.1 reconstruida completa |
| `700d0e6` | 2026-03-08 17:41:34 -0300 | Francisco | mejoras en deploy de aplicacion |
| `6c50872` | 2026-03-08 15:37:17 -0300 | Francisco | Merge pull request #2 from neo3x/claude/audit-monorepo-stability-RB5XD |
| `9c2a713` | 2026-03-08 18:23:52 +0000 | Claude | feat: productionize monorepo - DTOs, security, race condition fixes, baseline migration |
| `2e40664` | 2026-03-08 10:32:03 -0300 | Francisco | Merge pull request #1 from neo3x/claude/audit-monorepo-stability-RB5XD |
| `218a9d7` | 2026-03-08 13:02:17 +0000 | Claude | chore: add Next.js generated type declaration file |
| `ecf12cb` | 2026-03-08 13:01:28 +0000 | Claude | fix: Complete monorepo audit - fix builds, add missing pages, honest docs |

## Notas

- Este archivo documenta los commits existentes en el historial Git local para el rango solicitado.
- Adicionalmente se incluye una bitacora de cambios en curso (working tree) aun no confirmados en Git.

## Cambios en curso (sin commit)

Fecha de actualizacion manual: **2026-03-09**

- Roles y permisos operativos:
  - Redireccion por perfil en login/register/demo.
  - Dashboard ejecutivo solo para `SUPER_ADMIN` y `ADMIN`.
  - Sidebar ajustado por rol (sin dashboard/reportes para no administrativos).
- Restaurante:
  - Ownership por garzon en consultas de pedidos/ventas/solicitudes.
  - Restricciones de cierre/cancelacion por rol.
  - KDS en modo embebido + ruta standalone `/kds` + apertura pop-out.
- Cliente QR:
  - Estado de pedido con ciclo completo y estado final visible.
  - Solicitudes recientes mantienen trazabilidad (`PENDING`, `ACKNOWLEDGED`, `RESOLVED`, `CANCELLED`).
- Caja y arqueo:
  - Separacion explicita de ingresos por `VENTAS`, `PROPINAS` y `OTROS`.
  - Nueva categoria en transaccion de caja (`SALE`, `TIP`, `OTHER`) con migracion Prisma.
  - Tablas de resumen/historial actualizadas con columnas separadas.
- Documentacion agregada:
  - `ROLE_ACCESS_MATRIX.md`
  - `KDS_STANDALONE.md`
  - `CASH_TIPS_FLOW.md`
