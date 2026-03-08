# Martin POS - Sistema POS Multi-Modulo

Sistema de Punto de Venta multi-modulo con asistencia de Inteligencia Artificial, orientado a:
- Restaurantes
- Librerias y Bazares
- Minimarkets
- Botillerias

## Estado del Proyecto

> **Nota**: Este proyecto esta en desarrollo activo. Consultar [IMPLEMENTATION_MATRIX.md](IMPLEMENTATION_MATRIX.md) para el estado real feature por feature y [AUDIT_REPORT.md](AUDIT_REPORT.md) para el informe de auditoria completo.

### Funcional (MVP)
- Autenticacion JWT con roles (RBAC)
- Gestion de productos con busqueda por nombre, SKU y codigo de barras
- Sistema de ventas con carrito y multiples metodos de pago
- Control de inventario con alertas de stock bajo y vencimiento
- Gestion de clientes
- Reportes de ventas
- Dashboard con metricas del dia
- Asistente IA (requiere API key de Anthropic)
- Configuracion basica de sucursal

### Parcialmente Implementado
- Modulo restaurante (mesas y ordenes basicas)
- Multi-sucursal (estructura de datos lista, sin UI de cambio)
- Caja registradora (backend listo, sin UI)
- Categorias (backend listo, sin UI dedicada)

### Stubs / Mocks (estructura de codigo existe pero funcionalidad limitada)
- Fidelizacion / Puntos de lealtad
- Control de empleados / turnos
- Transferencias de inventario
- Facturacion electronica
- Delivery
- Apartados / Layaway
- Promociones y combos
- Deteccion de fraude
- Modulo botilleria
- Transbank (respuestas simuladas)
- SII (genera XML, sin conexion real al SII)

### No Implementado
- Aplicacion movil funcional (solo skeleton)
- Aplicacion desktop/Electron funcional
- Kitchen Display System (KDS)
- Integraciones reales con plataformas de delivery
- Redis caching
- WebSockets / tiempo real
- 2FA
- OCR real de facturas
- Reconocimiento por voz/imagen real
- Escaneo de codigos de barras en web

## Arquitectura

```
martin-pos/
├── packages/
│   ├── backend/       # API NestJS + PostgreSQL (27 modulos)
│   ├── web/           # Next.js 14 (10 paginas funcionales)
│   ├── mobile/        # React Native + Expo (skeleton)
│   ├── desktop/       # Electron (minimal stub)
│   ├── database/      # Prisma Schema (80+ modelos)
│   └── shared/        # Types, enums, utils compartidos
```

## Inicio Rapido

### Requisitos
- Node.js >= 18
- pnpm >= 8
- PostgreSQL >= 14 (o Docker)

### Instalacion

```bash
# Clonar e instalar
git clone <repo-url>
cd martin-pos
pnpm install

# Configurar entorno
cp .env.example .env
# Editar .env con tu DATABASE_URL

# Preparar base de datos
cd packages/database
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
cd ../..

# Compilar dependencias compartidas
pnpm --filter @martin-pos/shared build
pnpm --filter @martin-pos/database build

# Iniciar desarrollo
pnpm backend:dev   # API en puerto 3001
pnpm web:dev       # Web en puerto 3000
```

### Con Docker

```bash
cp .env.example .env
docker-compose up -d
# Primera vez: ejecutar migraciones y seed
docker-compose exec backend sh -c "npx prisma migrate dev --name init --schema=./prisma/schema.prisma"
docker-compose exec backend sh -c "npx prisma db seed --schema=./prisma/schema.prisma"
```

### Credenciales Demo

| Rol | Email | Contrasena |
|-----|-------|------------|
| Admin | admin@martinpos.com | admin123 |
| Cajero | cajero@martinpos.com | cajero123 |

## Stack Tecnologico

| Capa | Tecnologia | Estado |
|------|------------|--------|
| Backend | NestJS + TypeScript | Funcional |
| Base de Datos | PostgreSQL + Prisma | Funcional |
| Frontend Web | Next.js 14 + Tailwind | Funcional |
| Movil | React Native + Expo | Skeleton |
| Desktop | Electron | Stub |
| IA | Anthropic Claude API | Funcional (requiere API key) |
| Auth | JWT + bcrypt + RBAC | Funcional |
| Deploy | Docker + Docker Compose | Funcional |

## Documentacion

- [AUDIT_REPORT.md](AUDIT_REPORT.md) - Informe de auditoria tecnica completo
- [IMPLEMENTATION_MATRIX.md](IMPLEMENTATION_MATRIX.md) - Matriz de estado feature por feature
- [DEPLOY_READY.md](DEPLOY_READY.md) - Guia de despliegue
- [EXTENDED_FEATURES.md](EXTENDED_FEATURES.md) - Documentacion de features extendidas (aspiracional)
- [.env.example](.env.example) - Variables de entorno

## Licencia

MIT
