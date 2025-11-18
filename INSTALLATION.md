# 📦 Guía de Instalación - Martin POS

## Requisitos Previos

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **PostgreSQL** >= 14 (o Docker)
- **Git**

## Instalación Rápida

### 1. Clonar el repositorio

```bash
git clone <repo-url>
cd martin-pos
```

### 2. Ejecutar el instalador

```bash
chmod +x scripts/install.sh
./scripts/install.sh
```

El instalador te guiará para:
- Seleccionar el módulo (Restaurante, Librería, Minimarket, o Todos)
- Configurar la base de datos (Docker o local)
- Crear archivos de configuración
- Inicializar la base de datos con datos de ejemplo

### 3. Configurar API Keys (Opcional pero recomendado)

Edita el archivo `.env` y agrega tus API keys:

```env
ANTHROPIC_API_KEY="tu-api-key-de-claude"
OPENAI_API_KEY="tu-api-key-de-openai"
```

Para obtener las API keys:
- **Anthropic Claude**: https://console.anthropic.com/
- **OpenAI**: https://platform.openai.com/api-keys

### 4. Iniciar la aplicación

```bash
# Iniciar todos los servicios
pnpm dev

# O individualmente:
pnpm backend:dev   # API: http://localhost:3001
pnpm web:dev       # Web: http://localhost:3000
pnpm mobile:dev    # Mobile (Expo)
pnpm desktop:dev   # Desktop (Electron)
```

### 5. Acceder a la aplicación

Abre tu navegador en: http://localhost:3000

**Credenciales por defecto:**
- Email: `admin@martinpos.com`
- Password: `admin123`

## Instalación con Docker (Recomendado para Producción)

```bash
# 1. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# 2. Iniciar todos los servicios
docker-compose up -d

# 3. Ejecutar migraciones
docker-compose exec backend npx prisma migrate deploy

# 4. Acceder
# Web: http://localhost:3000
# API: http://localhost:3001
```

## Instalación Manual (Sin Docker)

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Configurar PostgreSQL

Crea una base de datos:

```sql
CREATE DATABASE martin_pos;
CREATE USER martinpos WITH PASSWORD 'martinpos123';
GRANT ALL PRIVILEGES ON DATABASE martin_pos TO martinpos;
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env`:

```env
DATABASE_URL="postgresql://martinpos:martinpos123@localhost:5432/martin_pos?schema=public"
JWT_SECRET="tu-secreto-aleatorio-muy-seguro"
ANTHROPIC_API_KEY="tu-api-key"
# ... etc
```

### 4. Inicializar base de datos

```bash
pnpm db:generate
pnpm db:migrate
pnpm --filter @martin-pos/database prisma:seed
```

### 5. Iniciar servicios

```bash
pnpm dev
```

## Verificación de la Instalación

### Backend (API)

```bash
curl http://localhost:3001/api/v1/
```

Debería retornar un mensaje del API.

### Frontend (Web)

Abre: http://localhost:3000

Deberías ver la página de login.

### Base de Datos

```bash
pnpm db:studio
```

Abre Prisma Studio para visualizar los datos.

## Configuración por Módulo

### Restaurante

Características habilitadas:
- Gestión de mesas
- Comandas y órdenes
- Kitchen Display System
- Control de recetas

### Librería/Bazar

Características habilitadas:
- Gestión de proveedores
- Sistema de apartados
- Catálogos por categoría

### Minimarket

Características habilitadas:
- Productos perecederos
- Control de vencimientos
- Balanzas electrónicas
- Gestión de lotes

### Todos (ALL)

Todas las características habilitadas.

## Solución de Problemas

### Error: "Cannot connect to database"

- Verifica que PostgreSQL esté corriendo
- Verifica las credenciales en `.env`
- Si usas Docker: `docker-compose up -d postgres`

### Error: "Port 3000 already in use"

```bash
# Cambiar puerto en .env
WEB_PORT=3002
```

### Error: "pnpm: command not found"

```bash
npm install -g pnpm
```

### Error de permisos en scripts

```bash
chmod +x scripts/*.sh
```

## Próximos Pasos

1. **Configurar impresora térmica** (Desktop): Settings → Printer
2. **Agregar productos**: Dashboard → Productos → Nuevo
3. **Configurar AI**: Agrega tus API keys en `.env`
4. **Crear usuarios**: Dashboard → Configuración → Usuarios
5. **Realizar primera venta**: Dashboard → Ventas

## Recursos Adicionales

- [Documentación completa](./docs/)
- [API Reference](./docs/api.md)
- [Guía de Desarrollo](./CONTRIBUTING.md)

## Soporte

Para reportar problemas: [GitHub Issues](https://github.com/tu-repo/issues)
