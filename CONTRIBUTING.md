# 🤝 Guía de Contribución

## Stack Tecnológico

### Backend
- **NestJS** - Framework Node.js
- **Prisma** - ORM
- **PostgreSQL** - Base de datos
- **Redis** - Cache
- **Socket.io** - WebSockets
- **Anthropic Claude** - IA

### Frontend
- **Next.js 14** - React framework (App Router)
- **TypeScript** - Tipado estático
- **TailwindCSS** - Estilos
- **Zustand** - State management
- **React Query** - Data fetching

### Mobile
- **React Native** - Framework móvil
- **Expo** - Tooling
- **Expo Router** - Navegación

### Desktop
- **Electron** - Framework desktop
- **node-thermal-printer** - Impresión

## Estructura del Proyecto

```
martin-pos/
├── packages/
│   ├── shared/          # Types, utils, constants compartidos
│   ├── database/        # Prisma schema y migraciones
│   ├── backend/         # API NestJS
│   ├── web/             # Next.js frontend
│   ├── mobile/          # React Native app
│   └── desktop/         # Electron app
├── scripts/             # Scripts de utilidad
├── docker-compose.yml   # Docker setup
└── docs/                # Documentación
```

## Desarrollo

### Setup Inicial

```bash
git clone <repo>
cd martin-pos
pnpm install
cp .env.example .env
# Configurar .env
pnpm db:migrate
pnpm db:seed
```

### Workflow de Desarrollo

1. **Crear una rama**
   ```bash
   git checkout -b feature/mi-feature
   ```

2. **Desarrollar**
   ```bash
   pnpm dev  # Inicia todo
   ```

3. **Testing**
   ```bash
   pnpm test
   ```

4. **Commit**
   ```bash
   git add .
   git commit -m "feat: descripción del feature"
   ```

5. **Push y PR**
   ```bash
   git push origin feature/mi-feature
   ```

## Convenciones de Código

### Commits (Conventional Commits)

- `feat:` - Nueva funcionalidad
- `fix:` - Corrección de bugs
- `docs:` - Documentación
- `style:` - Formato (no afecta código)
- `refactor:` - Refactorización
- `test:` - Tests
- `chore:` - Mantenimiento

### TypeScript

- Usar tipos explícitos
- Evitar `any`
- Preferir interfaces sobre types para objetos

### React/Next.js

- Componentes funcionales con hooks
- Server Components por defecto
- Client Components solo cuando necesario

### NestJS

- Un módulo por feature
- DTOs para validación
- Guards para autorización
- Interceptors para transformación

## Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Coverage
pnpm test:cov
```

## Base de Datos

### Crear una migración

```bash
pnpm --filter @martin-pos/database prisma migrate dev --name descripcion
```

### Actualizar seed

Edita `packages/database/prisma/seed.ts`

## Agregar Dependencias

```bash
# Al workspace root
pnpm add -w <package>

# A un paquete específico
pnpm --filter @martin-pos/backend add <package>
```

## Build para Producción

```bash
# Build todo
pnpm build

# Build específico
pnpm --filter @martin-pos/web build
```

## Despliegue

Ver [DEPLOYMENT.md](./DEPLOYMENT.md)

## Code Review

### Checklist

- [ ] Tests pasan
- [ ] Tipos TypeScript correctos
- [ ] Sin console.logs
- [ ] Documentación actualizada
- [ ] Sin secretos en código
- [ ] Performance considerado

## Recursos

- [NestJS Docs](https://docs.nestjs.com/)
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [React Native Docs](https://reactnative.dev/)
