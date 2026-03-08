# Martin POS - Deploy Ready Guide

## What's Actually Working

After the audit, the following is functional and deployable:

### Backend API (NestJS)
- Authentication (login, register, JWT refresh, logout)
- Products CRUD with barcode/SKU lookup
- Sales creation with stock management
- Daily sales summaries
- Cash register open/close
- Inventory movements and alerts
- Customer management
- Categories management
- Branch management
- Reports (sales)
- AI assistant (requires Anthropic API key)
- Health check endpoint

### Web Frontend (Next.js 14)
- Login page
- Dashboard with stats
- Products page with search
- Sales/POS page with cart
- Inventory page (stock levels, alerts, movements)
- Customers page (CRUD)
- Reports page (date filtering)
- Restaurant page (table map, orders)
- AI assistant chat
- Settings page

### Database
- PostgreSQL with Prisma ORM
- 80+ models defined
- Comprehensive seed data

---

## Local Development Setup

### Prerequisites
- Node.js >= 18
- pnpm >= 8
- PostgreSQL >= 14 (or use Docker)

### Option 1: Local PostgreSQL

```bash
# 1. Clone and install
git clone <repo-url>
cd martin-pos
pnpm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL connection string

# 3. Generate Prisma client and create database
cd packages/database
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
cd ../..

# 4. Build shared packages
pnpm --filter @martin-pos/shared build
pnpm --filter @martin-pos/database build

# 5. Start development
pnpm backend:dev   # API on port 3001
pnpm web:dev       # Web on port 3000
```

### Option 2: Docker (Recommended for Demo)

```bash
# 1. Clone and configure
git clone <repo-url>
cd martin-pos
cp .env.example .env

# 2. Start all services
docker-compose up -d

# 3. Run migrations and seed (first time only)
docker-compose exec backend sh -c "npx prisma migrate dev --name init --schema=./prisma/schema.prisma"
docker-compose exec backend sh -c "npx prisma db seed --schema=./prisma/schema.prisma"

# 4. Access
# Web: http://localhost:3000
# API: http://localhost:3001/api/v1
# API Health: http://localhost:3001/health
```

### Demo Credentials (from seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@martinpos.com | admin123 |
| Cashier | cajero@martinpos.com | cajero123 |

---

## Environment Variables

### Required

| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | `postgresql://martinpos:martinpos123@localhost:5432/martin_pos?schema=public` |
| JWT_SECRET | JWT signing secret | `your-super-secret-jwt-key-change-in-production` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| APP_PORT | Backend API port | 3001 |
| CORS_ORIGIN | Allowed CORS origin | `*` |
| JWT_EXPIRES_IN | Token expiration | `7d` |
| NEXT_PUBLIC_API_URL | Frontend API URL | `http://localhost:3001/api/v1` |
| ANTHROPIC_API_KEY | For AI features | (none, AI features disabled without it) |
| OPENAI_API_KEY | For OCR/Vision features | (none, features return mock data) |
| INSTALLED_MODULE | Module type | `ALL` |
| NODE_ENV | Environment | `development` |

---

## Modules Status for Deployment

### Enabled and Working
- Auth
- Users
- Products
- Categories
- Sales
- Inventory
- Customers
- Cash Register
- Reports
- Branches
- AI (needs API key)

### Enabled but Stub/Mock (will respond but with limited functionality)
- Restaurant (basic table/order management)
- Loyalty
- Employees
- Transfers
- Invoicing
- Delivery
- Layaway
- Promotions
- Fraud Detection
- Botillería
- Transbank (returns simulated responses)
- SII (generates XML structure, no real SII connection)
- Advanced AI (needs API keys)

### Disabled / Not Available in MVP
- Mobile app (skeleton only)
- Desktop/Electron app (not functional)
- Redis caching (not integrated)
- WebSocket real-time (not implemented)
- 2FA authentication
- Real Transbank integration
- Real SII integration
- Real delivery platform integrations

---

## Cloud Deployment

### Railway

```bash
# Backend
railway init
railway link
railway add --database postgresql
railway variables set JWT_SECRET=your-secret
railway up

# Web (separate service)
railway init
railway up
```

### Docker Production

```bash
# Build and run with production compose
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## Troubleshooting

### "Cannot find module '@martin-pos/database'"
```bash
cd packages/database && npx prisma generate && pnpm build && cd ../..
pnpm --filter @martin-pos/shared build
```

### "Font fetch failed" during web build
This was fixed in the audit. The web now uses system fonts instead of Google Fonts.

### Desktop package fails to install
Desktop is excluded from the pnpm workspace by default because `@electron-forge` requires git SSH. To include it, add `'packages/desktop'` back to `pnpm-workspace.yaml`.

### Prisma migration issues
```bash
cd packages/database
DATABASE_URL="your-connection-string" npx prisma migrate dev --name init
```
