# 🏪 Martin POS - Sistema POS Asistido por IA

Sistema completo de Punto de Venta multi-módulo con asistencia de Inteligencia Artificial para:
- 🍽️ **Restaurantes**
- 📚 **Librerías y Bazares**
- 🛒 **Minimarkets**

## 🌟 Características Principales

### Core Features
- ✅ Gestión completa de inventario
- ✅ Sistema de ventas multi-método de pago
- ✅ Flujo de caja y reportes financieros
- ✅ Control de usuarios y roles
- ✅ Multi-sucursal con sincronización
- ✅ Impresión térmica (tickets 80mm)
- ✅ Impresión de etiquetas con precios

### Asistencia por IA
- 🤖 Análisis predictivo de inventario
- 🤖 Alertas inteligentes de restock
- 🤖 Detección de productos por vencimiento
- 🤖 Optimización de mermas
- 🤖 Sugerencias de compra
- 🤖 Reportes automáticos con insights
- 🤖 Asistente por voz para consultas

### Métodos de Entrada
- 🎤 **Voz** - Comandos y consultas por voz
- 📷 **Fotografía** - Reconocimiento de productos
- 📊 **Código de Barras** - Escaneo rápido
- 📱 **QR Code** - Lectura de códigos QR

## 🏗️ Arquitectura

```
martin-pos/
├── packages/
│   ├── backend/       # API NestJS + PostgreSQL
│   ├── web/           # Next.js 14 (Admin/Desktop)
│   ├── mobile/        # React Native + Expo
│   ├── desktop/       # Electron (Estación POS)
│   ├── database/      # Prisma Schema
│   └── shared/        # Types & Utils compartidos
```

## 🚀 Inicio Rápido

### Requisitos Previos
- Node.js >= 18
- pnpm >= 8
- PostgreSQL >= 14
- (Opcional) Docker

### Instalación

1. **Clonar el repositorio**
```bash
git clone <repo-url>
cd martin-pos
```

2. **Instalar dependencias**
```bash
pnpm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

4. **Setup de base de datos**
```bash
pnpm db:generate
pnpm db:migrate
```

5. **Iniciar en modo desarrollo**
```bash
# Todos los servicios
pnpm dev

# O individualmente:
pnpm backend:dev   # API en puerto 3001
pnpm web:dev       # Web en puerto 3000
pnpm mobile:dev    # Expo
pnpm desktop:dev   # Electron
```

## 📦 Módulos Disponibles

### 🍽️ Restaurantes
- Control de mesas y comandas
- Kitchen Display System (KDS)
- Gestión de recetas e ingredientes
- Control de mermas
- Integración con delivery
- Propinas y división de cuentas

### 📚 Librerías/Bazares
- Gestión de proveedores
- Control de consignaciones
- Sistema de apartados
- Órdenes automatizadas

### 🛒 Minimarkets
- Productos perecederos
- Alertas de vencimiento
- Balanzas electrónicas
- Control de temperatura
- Gestión de lotes

## 🛠️ Stack Tecnológico

**Backend:**
- NestJS + TypeScript
- PostgreSQL + Prisma ORM
- Redis (Cache)
- Socket.io (Real-time)

**Frontend Web:**
- Next.js 14 (App Router)
- React 18 + TypeScript
- TailwindCSS + shadcn/ui
- Zustand (State)

**Mobile:**
- React Native + Expo
- TypeScript
- Expo Router

**Desktop:**
- Electron
- React + TypeScript
- node-thermal-printer

**IA:**
- Anthropic Claude API
- OpenAI GPT-4 (opcional)
- LangChain
- Whisper (voz)

## 📱 Deployment

### Local
```bash
pnpm build
pnpm start
```

### Docker
```bash
docker-compose up -d
```

### Cloud (Railway/Vercel)
Ver documentación en `/docs/deployment.md`

## 🔐 Seguridad

- Autenticación JWT
- RBAC (Role-Based Access Control)
- Encriptación de datos sensibles
- Rate limiting
- CORS configurado
- 2FA opcional

## 📄 Licencia

MIT

## 👥 Contribuir

Ver `CONTRIBUTING.md`

## 📞 Soporte

Para issues y sugerencias: [GitHub Issues](https://github.com/tu-repo/issues)
