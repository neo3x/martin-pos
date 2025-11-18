# 🚀 Guía de Despliegue en la Nube - Martin POS

Esta guía proporciona instrucciones detalladas para desplegar Martin POS en diferentes plataformas cloud.

---

## 📊 Comparación de Plataformas Cloud

| Plataforma | Nivel | Costo Mensual* | Escalabilidad | Facilidad | Recomendado Para |
|------------|-------|----------------|---------------|-----------|------------------|
| **Railway** | ⭐⭐⭐⭐⭐ | $5-20 | Alta | Muy Fácil | **Startups, DEMO, MVP** |
| **Render** | ⭐⭐⭐⭐ | $0-25 | Media | Fácil | Proyectos pequeños |
| **DigitalOcean** | ⭐⭐⭐⭐ | $12-50 | Alta | Media | Empresas medianas |
| **AWS** | ⭐⭐⭐⭐⭐ | $20-100+ | Muy Alta | Compleja | **Producción Enterprise** |
| **Google Cloud** | ⭐⭐⭐⭐ | $15-80 | Muy Alta | Media | ML/IA intensivo |
| **Azure** | ⭐⭐⭐⭐ | $15-80 | Muy Alta | Media | Integración Microsoft |

*Costos estimados para uso básico/medio

---

## 🎯 Recomendación Principal: Railway

**Railway es la opción más recomendada** para Martin POS porque:

✅ Despliegue en minutos con GitHub
✅ PostgreSQL y Redis incluidos
✅ Escalado automático
✅ SSL gratis
✅ Logs en tiempo real
✅ $5 de crédito gratis mensual
✅ Panel visual intuitivo

---

## 🚂 Opción 1: Railway (Recomendado)

### Paso 1: Preparación

1. Crea cuenta en [Railway.app](https://railway.app)
2. Conecta tu repositorio de GitHub
3. Instala Railway CLI (opcional):

```bash
npm i -g @railway/cli
railway login
```

### Paso 2: Crear Proyecto

```bash
# Desde tu directorio del proyecto
railway init

# O desde la web: New Project → Deploy from GitHub
```

### Paso 3: Agregar Servicios

En Railway dashboard:

1. **PostgreSQL**: Add Service → Database → PostgreSQL
2. **Redis**: Add Service → Database → Redis
3. **Backend**: Add Service → GitHub Repo → selecciona tu repo
4. **Web**: Add Service → GitHub Repo → selecciona tu repo

### Paso 4: Configurar Backend

En el servicio Backend:

**Settings → Environment Variables:**

```bash
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=tu-secret-super-seguro-aqui-cambiar
ANTHROPIC_API_KEY=tu-anthropic-api-key
OPENAI_API_KEY=tu-openai-api-key
APP_PORT=3001
```

**Settings → Build:**
- Root Directory: `/`
- Build Command: `pnpm install && pnpm --filter @martin-pos/database prisma generate && pnpm --filter @martin-pos/backend build`
- Start Command: `cd packages/backend && pnpm start:prod`

**Settings → Deploy:**
- Dockerfile Path: `Dockerfile.backend`
- O usa Nixpacks (automático)

### Paso 5: Configurar Web Frontend

En el servicio Web:

**Settings → Environment Variables:**

```bash
NEXT_PUBLIC_API_URL=${{Backend.RAILWAY_PUBLIC_DOMAIN}}/api/v1
```

**Settings → Build:**
- Build Command: `pnpm install && pnpm --filter @martin-pos/web build`
- Start Command: `cd packages/web && pnpm start`

**Settings → Deploy:**
- Dockerfile Path: `Dockerfile.web`

### Paso 6: Migrar Base de Datos

```bash
# Opción 1: Desde Railway CLI
railway run pnpm --filter @martin-pos/database prisma migrate deploy
railway run pnpm --filter @martin-pos/database prisma db seed

# Opción 2: Desde tu máquina local
DATABASE_URL="postgresql://..." pnpm db:migrate
DATABASE_URL="postgresql://..." pnpm --filter @martin-pos/database prisma db seed
```

### Paso 7: Verificar Deployment

1. Railway te dará URLs públicas automáticamente
2. Visita: `https://tu-backend.railway.app/health`
3. Abre: `https://tu-web.railway.app`
4. Login con: `admin@martinpos.com` / `admin123`

**Listo! 🎉**

---

## 🎨 Opción 2: Render

### Ventajas
- Tier gratuito generoso
- SSL automático
- Deploy desde GitHub

### Paso 1: Crear Servicios

En [Render.com](https://render.com):

1. **PostgreSQL**:
   - New → PostgreSQL
   - Name: `martin-pos-db`
   - Plan: Free / Starter

2. **Redis**:
   - New → Redis
   - Name: `martin-pos-redis`
   - Plan: Free (25MB)

3. **Backend**:
   - New → Web Service
   - Connect GitHub repo
   - Name: `martin-pos-api`
   - Environment: Docker
   - Dockerfile path: `./Dockerfile.backend`
   - Plan: Starter ($7/mo)

4. **Web**:
   - New → Web Service
   - Name: `martin-pos-web`
   - Dockerfile path: `./Dockerfile.web`
   - Plan: Starter ($7/mo)

### Paso 2: Variables de Entorno

**Backend:**
```bash
NODE_ENV=production
DATABASE_URL=[Copiar de PostgreSQL Internal URL]
REDIS_URL=[Copiar de Redis Internal URL]
JWT_SECRET=tu-secret-super-seguro
ANTHROPIC_API_KEY=tu-key
OPENAI_API_KEY=tu-key
```

**Web:**
```bash
NEXT_PUBLIC_API_URL=https://martin-pos-api.onrender.com/api/v1
```

### Paso 3: Deploy

Render detecta automáticamente Dockerfiles y hace deploy.

⚠️ **Nota**: El tier gratuito de Render hiberna después de 15 minutos de inactividad.

---

## ☁️ Opción 3: AWS (Producción Enterprise)

### Arquitectura Recomendada

```
┌─────────────────────────────────────────────┐
│          CloudFront (CDN)                    │
├─────────────────────────────────────────────┤
│  Route 53 (DNS) + ACM (SSL Certificates)    │
├─────────────────────────────────────────────┤
│          Application Load Balancer          │
├──────────────────┬──────────────────────────┤
│   ECS Fargate    │   ECS Fargate           │
│   (Backend)      │   (Frontend)            │
├──────────────────┴──────────────────────────┤
│  RDS PostgreSQL  │  ElastiCache Redis      │
└──────────────────┴──────────────────────────┘
```

### Servicios AWS Necesarios

1. **ECS (Elastic Container Service)**: Para correr contenedores Docker
2. **RDS**: PostgreSQL managed database
3. **ElastiCache**: Redis managed
4. **ECR**: Docker image registry
5. **ALB**: Application Load Balancer
6. **S3**: Para archivos estáticos y uploads
7. **CloudFront**: CDN para rendimiento global
8. **Route 53**: DNS management
9. **ACM**: SSL/TLS certificates

### Paso 1: Setup Inicial

```bash
# Instalar AWS CLI
brew install awscli  # macOS
# o
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configurar credenciales
aws configure
```

### Paso 2: Crear RDS PostgreSQL

```bash
aws rds create-db-instance \
  --db-instance-identifier martin-pos-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.3 \
  --master-username martinpos \
  --master-user-password TU_PASSWORD_AQUI \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name default \
  --backup-retention-period 7 \
  --publicly-accessible
```

### Paso 3: Crear ElastiCache Redis

```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id martin-pos-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1
```

### Paso 4: Crear ECR Repositories

```bash
# Backend
aws ecr create-repository --repository-name martin-pos/backend

# Frontend
aws ecr create-repository --repository-name martin-pos/web
```

### Paso 5: Build y Push Docker Images

```bash
# Login a ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com

# Build y push backend
docker build -f Dockerfile.backend -t martin-pos/backend .
docker tag martin-pos/backend:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/martin-pos/backend:latest
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/martin-pos/backend:latest

# Build y push web
docker build -f Dockerfile.web -t martin-pos/web .
docker tag martin-pos/web:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/martin-pos/web:latest
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/martin-pos/web:latest
```

### Paso 6: Crear ECS Cluster

```bash
aws ecs create-cluster --cluster-name martin-pos-cluster
```

### Paso 7: Crear Task Definitions

Crea `ecs-backend-task.json`:

```json
{
  "family": "martin-pos-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/martin-pos/backend:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "APP_PORT",
          "value": "3001"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:martin-pos/database-url"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:martin-pos/jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/martin-pos-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

```bash
aws ecs register-task-definition --cli-input-json file://ecs-backend-task.json
```

### Paso 8: Crear Services

```bash
aws ecs create-service \
  --cluster martin-pos-cluster \
  --service-name backend-service \
  --task-definition martin-pos-backend \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

### Paso 9: Configurar Load Balancer

1. Crear Application Load Balancer en EC2 console
2. Crear Target Groups para backend y frontend
3. Configurar health checks en `/health`
4. Asociar servicios ECS con target groups

### Paso 10: Setup CloudFront + S3 (Opcional)

Para mejor rendimiento global:

1. Crear bucket S3 para assets estáticos
2. Crear distribución CloudFront
3. Configurar caching policies

### Costos Estimados AWS

- RDS db.t3.micro: ~$15/mes
- ElastiCache t3.micro: ~$12/mes
- ECS Fargate (2 tasks): ~$30/mes
- ALB: ~$16/mes
- Data transfer: ~$10/mes
- **Total: ~$83/mes**

---

## 🌊 Opción 4: DigitalOcean App Platform

### Ventajas
- Pricing predecible
- Interface simple
- Managed PostgreSQL incluido

### Deployment Rápido

1. Conecta GitHub en [DigitalOcean Apps](https://cloud.digitalocean.com/apps)
2. Selecciona tu repo
3. DigitalOcean auto-detecta Dockerfiles
4. Agrega PostgreSQL managed database
5. Configura environment variables
6. Deploy!

**Costo**: ~$12/mes (Basic plan)

---

## 📋 Checklist Pre-Deployment

Antes de hacer deploy a producción:

- [ ] Cambiar `JWT_SECRET` a un valor seguro
- [ ] Configurar passwords fuertes para PostgreSQL
- [ ] Obtener API keys de Anthropic/OpenAI
- [ ] Configurar dominio personalizado
- [ ] Habilitar SSL/HTTPS
- [ ] Configurar backups automáticos de base de datos
- [ ] Setup monitoring (Sentry, DataDog, etc.)
- [ ] Configurar logs centralizados
- [ ] Revisar límites de rate limiting
- [ ] Setup CI/CD pipeline
- [ ] Documentar proceso de rollback

---

## 🔒 Seguridad en Producción

### Variables de Entorno Sensibles

**NUNCA** commitear al repositorio:
- `JWT_SECRET`
- Passwords de base de datos
- API keys
- Tokens de autenticación

Usa servicios de secrets:
- AWS Secrets Manager
- Railway Variables
- Render Environment Variables
- HashiCorp Vault (enterprise)

### SSL/TLS

Todas las plataformas recomendadas proveen SSL gratis:
- Railway: Automático
- Render: Automático con Let's Encrypt
- AWS: AWS Certificate Manager (ACM)

### CORS

Configura CORS en el backend para permitir solo tu dominio:

```typescript
// packages/backend/src/main.ts
app.enableCors({
  origin: process.env.FRONTEND_URL || 'https://tu-dominio.com',
  credentials: true,
});
```

---

## 📊 Monitoreo Post-Deployment

### Health Checks

Todas las plataformas deben configurar health check en:
```
GET /health
```

### Logs

- Railway: Dashboard → Service → Logs
- Render: Dashboard → Service → Logs
- AWS: CloudWatch Logs

### Métricas

Integrar con:
- **Sentry**: Error tracking
- **DataDog**: APM y métricas
- **New Relic**: Performance monitoring
- **Prometheus + Grafana**: Open source

---

## 🔄 CI/CD Automation

### GitHub Actions (Recomendado)

Crea `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install Railway
        run: npm i -g @railway/cli

      - name: Deploy
        run: railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

---

## 🆘 Troubleshooting

### Base de datos no conecta

```bash
# Verificar conectividad
psql $DATABASE_URL

# Verificar migraciones
pnpm --filter @martin-pos/database prisma migrate status
```

### Backend no inicia

```bash
# Verificar logs
railway logs

# Verificar variables de entorno
railway vars
```

### Web no carga

- Verificar `NEXT_PUBLIC_API_URL` apunta al backend correcto
- Revisar CORS settings
- Verificar SSL certificates

---

## 🎯 Recomendación Final

### Para DEMO / Startup:
→ **Railway** (deploy en 10 minutos)

### Para Producción Pequeña:
→ **Render** o **DigitalOcean** ($12-25/mes)

### Para Producción Enterprise:
→ **AWS** con arquitectura completa ($80-200/mes)

---

## 📞 Soporte

Si encuentras problemas durante el deployment:

1. Revisa los logs de la plataforma
2. Verifica variables de entorno
3. Consulta la documentación oficial de cada plataforma:
   - [Railway Docs](https://docs.railway.app)
   - [Render Docs](https://render.com/docs)
   - [AWS ECS Docs](https://docs.aws.amazon.com/ecs)

---

**¡Tu sistema Martin POS está listo para la nube! 🚀**
