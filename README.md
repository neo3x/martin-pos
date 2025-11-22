# 🏪 Martin POS - Sistema POS Asistido por IA

Sistema completo de Punto de Venta multi-módulo con asistencia de Inteligencia Artificial para:
- 🍽️ **Restaurantes**
- 📚 **Librerías y Bazares**
- 🛒 **Minimarkets**
- 🍷 **Botillerías** (NEW!)

## 🌟 Características Principales

### Core Features
- ✅ Gestión completa de inventario
- ✅ Sistema de ventas multi-método de pago
- ✅ Flujo de caja y reportes financieros
- ✅ Control de usuarios y roles
- ✅ Multi-sucursal con sincronización
- ✅ Impresión térmica (tickets 80mm)
- ✅ Impresión de etiquetas con precios

### 🚀 Extended Features (NEW!)
- 🎁 **Sistema de Fidelización** - Puntos de lealtad y descuentos personalizados por IA
- 👥 **Control de Empleados** - Turnos, comisiones, métricas de desempeño
- 🏢 **Multi-Sucursal Avanzado** - Transferencias de inventario con tracking completo
- 📄 **Facturación Electrónica** - Facturas, notas de crédito/débito
- 🚚 **Sistema de Delivery** - Integración Uber Eats, Rappi, Pedidos Ya
- 💰 **Apartados/Layaway** - Sistema de pagos parciales
- 🎉 **Promociones y Combos** - 2x1, descuentos, combos configurables
- 🧠 **IA Avanzada** - OCR facturas, comandos de voz, reconocimiento de productos
- 🔒 **Detección de Fraudes** - Alertas automáticas de transacciones sospechosas
- 📦 **Consignaciones** - Control de productos en consignación
- 💳 **Pasarelas de Pago** - Mercado Pago, Stripe, PayPal, Transbank
- ⚙️ **Hardware Integration** - Balanzas electrónicas, sensores de temperatura
- 🍷 **Módulo Botillería** - Control de alcoholes, verificación de edad, ILA, catas, club de vinos
- 💳 **Transbank Webpay** - Integración completa con pagos Transbank Chile
- 📄 **SII Facturación Electrónica** - Boletas, facturas, notas de crédito con integración SII

> **Ver todas las funcionalidades extendidas en [EXTENDED_FEATURES.md](EXTENDED_FEATURES.md)**

### Asistencia por IA
- 🤖 Análisis predictivo de inventario
- 🤖 Alertas inteligentes de restock
- 🤖 Detección de productos por vencimiento
- 🤖 Optimización de mermas
- 🤖 Sugerencias de compra
- 🤖 Reportes automáticos con insights
- 🤖 Asistente por voz para consultas
- 🤖 **OCR** - Lectura automática de facturas de proveedores
- 🤖 **Visión** - Reconocimiento de productos por imagen
- 🤖 **Voz** - Procesamiento de comandos de voz

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
- 21 módulos backend
- 120+ endpoints API

**Frontend Web:**
- Next.js 14 (App Router)
- React 18 + TypeScript
- TailwindCSS + shadcn/ui
- Zustand (State)
- React Query

**Mobile:**
- React Native + Expo
- TypeScript
- Expo Router
- Expo Camera/Barcode Scanner

**Desktop:**
- Electron
- React + TypeScript
- node-thermal-printer

**IA:**
- Anthropic Claude API (Sonnet 4.5)
- OpenAI GPT-4 Vision (OCR)
- Whisper (Speech-to-Text)

**Base de Datos:**
- 45+ modelos Prisma
- PostgreSQL 15
- Redis para cache

## 📱 Deployment

### Quick Start con Docker (Recomendado para Demo)
```bash
docker-compose up -d
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npx prisma db seed
```

**Ver [DEMO.md](DEMO.md) para guía completa de demostración.**

### Deployment en Cloud

**Plataformas Soportadas:**
- ✅ **Railway** (Recomendado) - Deploy en 10 minutos
- ✅ **Render** - Tier gratuito disponible
- ✅ **AWS** - Producción enterprise
- ✅ **Google Cloud** - IA/ML optimizado
- ✅ **DigitalOcean** - Costo predecible

**Ver [DEPLOYMENT.md](DEPLOYMENT.md) para instrucciones detalladas de cada plataforma.**

## 🔐 Seguridad

- Autenticación JWT
- RBAC (Role-Based Access Control)
- Encriptación de datos sensibles
- Rate limiting
- CORS configurado
- 2FA opcional

## 📚 Documentación

- **[DEMO.md](DEMO.md)** - Guía completa para ejecutar demo (5-30 minutos)
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Instrucciones de despliegue en cloud
- **[EXTENDED_FEATURES.md](EXTENDED_FEATURES.md)** - Documentación de todas las funcionalidades extendidas
- **[.env.example](.env.example)** - Ejemplo de variables de entorno

## 📊 Métricas del Proyecto

- **65+ modelos** de base de datos
- **24 módulos** backend completos
- **150+ endpoints** API REST
- **15 categorías** de funcionalidades extendidas
- **4 módulos** especializados (Restaurante, Librería, Minimarket, Botillería)
- **4 plataformas** (Web, Mobile, Desktop, API)
- **Transbank** integrado para pagos en Chile
- **SII** integrado para facturación electrónica

## 🎯 Casos de Uso

### Restaurantes
- Control de mesas y comandas
- Integración con delivery (Uber Eats, Rappi)
- División de cuentas
- Propinas

### Librerías/Bazares
- Consignaciones
- Apartados/Layaway
- Productos variados

### Minimarkets
- Productos perecederos con alertas
- Balanzas electrónicas
- Control de temperatura
- Gestión de lotes y vencimientos

### Botillerías
- Gestión de vinos, cervezas y licores
- Verificación de edad obligatoria
- Cálculo automático de ILA (Impuesto al Alcohol)
- Control de horarios de venta
- Eventos de cata
- Club de vinos con suscripciones

### Pagos y Facturación (Chile)
- **Transbank Webpay Plus** - Pagos con tarjetas
- **SII Boleta Electrónica** - Tipo 39
- **SII Factura Electrónica** - Tipo 33
- **Notas de Crédito** - Tipo 61
- Validación de RUT
- Generación de XML según normativa SII

## 📄 Licencia

MIT

## 👥 Contribuir

Ver `CONTRIBUTING.md`

## 📞 Soporte

Para issues y sugerencias: [GitHub Issues](https://github.com/tu-repo/issues)

---

**Desarrollado con ❤️ para transformar la gestión de negocios en Chile**
