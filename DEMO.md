# 🎯 DEMO - Martin POS

Guía rápida para ejecutar una demostración completa del sistema Martin POS con todas las funcionalidades.

---

## 🚀 Quick Start (5 minutos)

### Opción 1: Docker Compose (Recomendado para Demo)

```bash
# 1. Clonar y preparar
git clone <tu-repo>
cd martin-pos
cp .env.example .env

# 2. Configurar variables (mínimo necesario)
# Edita .env y agrega tus API keys:
# ANTHROPIC_API_KEY=tu-key (opcional para IA)
# OPENAI_API_KEY=tu-key (opcional para IA)

# 3. Iniciar con Docker
docker-compose up -d

# 4. Esperar a que los servicios estén listos (30-60 segundos)
docker-compose logs -f

# 5. Ejecutar migraciones y seed
docker-compose exec backend sh -c "npx prisma migrate deploy && npx prisma db seed"

# 6. Abrir en el navegador
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
# API Docs: http://localhost:3001/api/v1/docs (si configurado)
```

**Credenciales de acceso:**
- Admin: `admin@martinpos.com` / `admin123`
- Cajero: `cajero@martinpos.com` / `admin123`

### Opción 2: Desarrollo Local (Sin Docker)

```bash
# 1. Prerequisitos
node --version  # debe ser >= 18
pnpm --version  # si no lo tienes: npm install -g pnpm

# 2. Instalar PostgreSQL y Redis localmente
# macOS:
brew install postgresql@15 redis
brew services start postgresql
brew services start redis

# Ubuntu/Debian:
sudo apt install postgresql-15 redis-server
sudo systemctl start postgresql redis

# 3. Crear base de datos
createdb martin_pos

# 4. Instalar dependencias
pnpm install

# 5. Configurar .env
cp .env.example .env
# Editar .env con tus configuraciones

# 6. Generar Prisma Client
pnpm db:generate

# 7. Ejecutar migraciones
pnpm db:migrate

# 8. Cargar datos de demo
pnpm --filter @martin-pos/database prisma db seed

# 9. Iniciar servicios (en terminales separadas)
pnpm backend:dev  # Terminal 1
pnpm web:dev      # Terminal 2

# 10. Abrir navegador
# http://localhost:3000
```

---

## 📊 Datos de Demo Incluidos

Al ejecutar el seed, se crean automáticamente:

### 👥 Usuarios
- **Admin**: `admin@martinpos.com` (acceso total)
- **Cajero**: `cajero@martinpos.com` (acceso limitado)

### 🏢 Sucursales
- Sucursal Principal
- Sucursal Norte

### 📦 Productos (4 productos de ejemplo)
- Arroz Grado 1 - 1kg
- Manzanas Rojas (perecedero)
- Coca Cola 1.5L
- Leche Entera 1L (perecedero)

### 🎁 Datos Extendidos
- ✅ 1 Programa de Lealtad activo
- ✅ Cliente con 500 puntos de lealtad
- ✅ Turno de empleado registrado
- ✅ 1 Transferencia entre sucursales
- ✅ 2 Promociones activas (2x1 + Combo)
- ✅ 1 Venta con factura electrónica
- ✅ 1 Apartado activo
- ✅ 1 Orden de delivery
- ✅ Alertas de fraude
- ✅ Registros de IA (OCR, Voz, Reconocimiento)
- ✅ Consignación activa
- ✅ Transacción de pasarela de pago
- ✅ Registros de hardware (balanza, temperatura)

---

## 🎬 Script de Demostración (30 minutos)

### Parte 1: Funcionalidades Básicas (10 min)

#### 1.1 Login y Dashboard
```
1. Abrir http://localhost:3000
2. Login como Admin (admin@martinpos.com / admin123)
3. Mostrar dashboard con métricas del día
4. Revisar gráficos de ventas
```

#### 1.2 Gestión de Productos
```
1. Ir a Productos
2. Ver lista de productos con stock
3. Mostrar alertas de stock mínimo
4. Crear nuevo producto:
   - Nombre: "Pan Integral"
   - SKU: PAN-000001
   - Precio: $800
   - Stock: 50
5. Escanear código de barras (simular)
```

#### 1.3 Venta Simple
```
1. Ir a POS / Punto de Venta
2. Agregar productos:
   - 2x Coca Cola
   - 1x Arroz
3. Seleccionar cliente (Cliente Genérico)
4. Aplicar descuento (10%)
5. Procesar pago (Efectivo)
6. Generar ticket (imprimir/preview)
7. Ver venta en historial
```

### Parte 2: Módulo Restaurante (5 min)

```
1. Ir a Módulo Restaurante
2. Ver mesas disponibles
3. Crear orden en Mesa 5:
   - Agregar items
   - Notas especiales
4. Marcar mesa como ocupada
5. Generar cuenta
6. División de cuenta (si implementado)
7. Procesar pago y liberar mesa
```

### Parte 3: Funcionalidades Extendidas (15 min)

#### 3.1 Sistema de Lealtad
```
1. Ir a Lealtad / Clientes
2. Ver programa de puntos activo
3. Buscar cliente: "Cliente Genérico"
4. Ver saldo: 500 puntos
5. Historial de transacciones
6. Canjear 100 puntos por descuento
7. Ver descuentos personalizados por IA
```

#### 3.2 Empleados y Turnos
```
1. Ir a Empleados
2. Ver lista de empleados
3. Marcar inicio de turno (Clock In)
4. Ver turno activo de Juan Pérez (8 horas)
5. Ver comisiones generadas ($117.81)
6. Reportes de desempeño:
   - Ventas totales
   - Promedio por venta
   - Ventas por hora
```

#### 3.3 Multi-Sucursal
```
1. Ir a Transferencias
2. Ver transferencia pendiente (TRF-000001)
3. Enviar transferencia (marca como "En Tránsito")
4. Simular recepción en sucursal destino
5. Ver sincronización de stock automática
```

#### 3.4 Facturación Electrónica
```
1. Ir a Facturas
2. Ver factura generada (FAC-000001)
3. Descargar PDF (si configurado)
4. Ver XML fiscal (preparado)
5. Crear Nota de Crédito
```

#### 3.5 Promociones y Combos
```
1. Ir a Promociones
2. Ver promociones activas:
   - "2x1 en Bebidas" (30 días restantes)
   - "Combo Desayuno" (60 días restantes)
3. Aplicar promoción en venta:
   - Agregar 2 Coca Colas
   - Descuento automático del 50%
```

#### 3.6 Apartados (Layaway)
```
1. Ir a Apartados
2. Ver apartado activo (APT-000001)
3. Ver detalles:
   - Total: $5,000
   - Pagado: $2,000
   - Restante: $3,000
4. Registrar nuevo pago ($1,000)
5. Ver historial de pagos
```

#### 3.7 Delivery
```
1. Ir a Delivery
2. Ver orden pendiente
3. Ver detalles:
   - Proveedor: Uber Eats
   - Estado: Pendiente
   - Dirección de entrega
   - Tiempo estimado: 45 min
4. Actualizar estado (Asignado → En Tránsito → Entregado)
```

#### 3.8 IA Avanzada
```
1. Ir a IA / Asistente IA
2. Ver registro OCR:
   - Factura de proveedor procesada
   - Datos extraídos automáticamente
   - Confianza: 95%
3. Ver comandos de voz ejecutados:
   - "Agregar dos coca colas a la venta"
   - Intent: ADD_TO_SALE
4. Ver productos reconocidos por imagen
```

#### 3.9 Detección de Fraudes
```
1. Ir a Seguridad / Alertas
2. Ver alerta de fraude:
   - Tipo: Monto inusual
   - Severidad: Media
   - Venta: VTA-000001
3. Revisar detalles
4. Marcar como revisado / Falso positivo
```

#### 3.10 Hardware Integration
```
1. Ir a Configuración / Hardware
2. Ver balanza configurada:
   - Marca: Systel Croma
   - Puerto: /dev/ttyUSB0
3. Ver logs de temperatura:
   - Producto: Manzanas Rojas
   - Temperatura: 4.5°C
   - Ubicación: Cámara frigorífica
```

---

## 🎨 Endpoints API para Testing

### Autenticación

```bash
# Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@martinpos.com",
    "password": "admin123"
  }'

# Guardar el token recibido
export TOKEN="tu-token-aqui"
```

### Productos

```bash
# Listar productos
curl http://localhost:3001/api/v1/products \
  -H "Authorization: Bearer $TOKEN"

# Crear producto
curl -X POST http://localhost:3001/api/v1/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "DEMO-001",
    "name": "Producto Demo",
    "price": 1000,
    "stock": 100,
    "categoryId": "...",
    "branchId": "default-branch"
  }'
```

### Ventas

```bash
# Crear venta
curl -X POST http://localhost:3001/api/v1/sales \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "productId": "...",
        "quantity": 2,
        "price": 1800
      }
    ],
    "paymentMethod": "CASH",
    "branchId": "default-branch"
  }'

# Listar ventas
curl http://localhost:3001/api/v1/sales \
  -H "Authorization: Bearer $TOKEN"
```

### Lealtad

```bash
# Ver puntos de cliente
curl http://localhost:3001/api/v1/loyalty/customer/{customerId}/points \
  -H "Authorization: Bearer $TOKEN"

# Otorgar puntos
curl -X POST http://localhost:3001/api/v1/loyalty/award \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "...",
    "saleAmount": 5000,
    "branchId": "default-branch"
  }'
```

### Empleados

```bash
# Clock in
curl -X POST http://localhost:3001/api/v1/employees/clock-in \
  -H "Authorization: Bearer $TOKEN"

# Ver métricas de desempeño
curl http://localhost:3001/api/v1/employees/{userId}/performance?startDate=2024-01-01&endDate=2024-12-31 \
  -H "Authorization: Bearer $TOKEN"
```

### Transferencias

```bash
# Crear transferencia
curl -X POST http://localhost:3001/api/v1/transfers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fromBranchId": "default-branch",
    "toBranchId": "...",
    "items": [
      {
        "productId": "...",
        "quantity": 10
      }
    ]
  }'

# Enviar transferencia
curl -X PUT http://localhost:3001/api/v1/transfers/{id}/send \
  -H "Authorization: Bearer $TOKEN"
```

### Promociones

```bash
# Ver promociones activas
curl http://localhost:3001/api/v1/promotions/active?branchId=default-branch \
  -H "Authorization: Bearer $TOKEN"
```

### IA Avanzada

```bash
# OCR de factura
curl -X POST http://localhost:3001/api/v1/ai/advanced/ocr/invoice \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/invoice.jpg"
  }'

# Comando de voz
curl -X POST http://localhost:3001/api/v1/ai/advanced/voice/command \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Agregar tres leches a la venta"
  }'

# Reconocimiento de producto
curl -X POST http://localhost:3001/api/v1/ai/advanced/recognize/product \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/product.jpg"
  }'
```

---

## 📱 Apps Móvil y Desktop

### App Móvil (React Native + Expo)

```bash
# Iniciar
cd packages/mobile
pnpm start

# Escanear QR con Expo Go app
# - iOS: Expo Go desde App Store
# - Android: Expo Go desde Play Store
```

**Funcionalidades móviles:**
- Escaneo de códigos de barras
- Cámara para reconocimiento de productos
- Ventas rápidas en terreno
- Inventario móvil

### App Desktop (Electron)

```bash
# Iniciar
cd packages/desktop
pnpm dev
```

**Funcionalidades desktop:**
- Integración con impresoras térmicas
- Integración con balanzas por puerto serial
- Modo offline
- Sincronización automática

---

## 🎤 Presentación Comercial

### Elevator Pitch (30 segundos)

> "Martin POS es un sistema punto de venta completo asistido por IA, diseñado específicamente para restaurantes, librerías y minimarkets en Chile. Con funcionalidades desde facturación electrónica hasta detección de fraudes con IA, y despliegue en la nube en minutos. Todo en un solo sistema."

### Características Destacadas

1. **3 Módulos Especializados**: Restaurante, Librería/Bazar, Minimarket
2. **IA Integrada**: OCR facturas, comandos por voz, reconocimiento de productos
3. **Multi-Sucursal Real**: Transferencias con tracking completo
4. **Facturación Electrónica**: Lista para integración SII Chile
5. **Multi-Plataforma**: Web, Mobile (iOS/Android), Desktop (Windows/Mac/Linux)
6. **Sistema de Lealtad**: Con descuentos personalizados por IA
7. **Control de Empleados**: Turnos, comisiones, métricas
8. **Detección de Fraudes**: Alertas automáticas en tiempo real

### Ventajas Competitivas

✅ **Todo en uno**: No necesitas múltiples sistemas
✅ **IA Real**: No es marketing, usa Anthropic Claude API
✅ **Código Abierto**: Personalizable al 100%
✅ **Deploy Rápido**: Cloud-ready, instala en 10 minutos
✅ **Costo-Efectivo**: Sin licencias mensuales abusivas
✅ **Hecho para Chile**: IVA 19%, SII, moneda CLP

---

## 🎯 Casos de Uso por Industria

### Restaurantes
- Gestión de mesas
- Comandas a cocina
- División de cuentas
- Delivery integrado (Uber Eats, Rappi)
- Control de propinas

### Librerías / Bazares
- Consignaciones
- Control de productos variados
- Apartados/layaway
- Categorización flexible

### Minimarkets
- Productos perecederos
- Alertas de vencimiento
- Balanzas electrónicas
- Control de temperatura
- Gestión de lotes

---

## 🔍 Métricas de Demo

Al finalizar el seed, puedes mostrar:

- **45+ modelos** de base de datos
- **21 módulos** backend
- **120+ endpoints** API
- **12 categorías** de funcionalidades extendidas
- **Multi-plataforma** (Web + Mobile + Desktop)
- **Multi-tenant** (múltiples sucursales)
- **IA real** con Anthropic Claude y OpenAI

---

## 🐛 Troubleshooting

### Error: No puede conectar a la base de datos

```bash
# Verificar que PostgreSQL esté corriendo
docker-compose ps postgres

# O localmente:
pg_isready

# Verificar DATABASE_URL en .env
echo $DATABASE_URL
```

### Error: Module not found

```bash
# Limpiar y reinstalar
pnpm clean
rm -rf node_modules
rm -rf packages/*/node_modules
pnpm install
```

### Error: Prisma Client no generado

```bash
pnpm db:generate
```

### Error: Puerto ya en uso

```bash
# Cambiar puertos en .env
APP_PORT=3002
WEB_PORT=3001

# O matar procesos:
lsof -ti:3001 | xargs kill
lsof -ti:3000 | xargs kill
```

---

## 📞 Soporte Durante Demo

Si algo falla durante la demo:

1. **Revisar logs**: `docker-compose logs -f`
2. **Reiniciar servicios**: `docker-compose restart`
3. **Reset completo**: `docker-compose down -v && docker-compose up -d`
4. **Re-seed**: `docker-compose exec backend npx prisma db seed`

---

## ✅ Checklist Pre-Demo

- [ ] Servicios Docker corriendo
- [ ] Base de datos migrada y con seed
- [ ] Frontend accesible en http://localhost:3000
- [ ] Backend health check: http://localhost:3001/health
- [ ] Credenciales de admin funcionando
- [ ] Al menos 1 venta de prueba realizada
- [ ] API keys de IA configuradas (opcional pero recomendado)
- [ ] Navegador en pantalla completa
- [ ] Conexión a internet estable (para IA features)

---

**¡Tu demo de Martin POS está lista! 🎉**

**Duración total de setup**: 5-10 minutos
**Duración de demo completa**: 30-45 minutos
**Audiencia recomendada**: Dueños de negocios, inversores, equipos técnicos
