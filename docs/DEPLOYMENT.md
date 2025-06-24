# Guía de Configuración y Deployment

Esta guía cubre la configuración avanzada del sistema y las diferentes opciones de deployment disponibles.

## 📋 Tabla de Contenidos

- [Configuración del Entorno](#configuración-del-entorno)
- [Configuración de Base de Datos](#configuración-de-base-de-datos)
- [Deployment en Vercel](#deployment-en-vercel)
- [Deployment con Docker](#deployment-con-docker)
- [Configuración de CI/CD](#configuración-de-cicd)
- [Monitoreo y Logging](#monitoreo-y-logging)
- [Backup y Recuperación](#backup-y-recuperación)
- [Configuración de Seguridad](#configuración-de-seguridad)

## ⚙️ Configuración del Entorno

### Variables de Entorno Completas

```env
# Base de datos
DATABASE_URL="file:./dev.db"                    # SQLite (desarrollo)
# DATABASE_URL="postgresql://user:password@localhost:5432/dbname"  # PostgreSQL (producción)

# Next.js
NEXTAUTH_SECRET="your-super-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"            # Cambiar en producción

# Configuración de la aplicación
NODE_ENV="development"                          # development | production | test
PORT=3000
APP_NAME="Sistema de Gestión Integral"
APP_VERSION="1.0.0"

# Configuración de email (futuro)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
FROM_EMAIL="noreply@yourdomain.com"

# Configuración de archivos (futuro)
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="5242880"                         # 5MB en bytes

# Configuración de logging
LOG_LEVEL="info"                                # error | warn | info | debug
LOG_FILE="./logs/app.log"

# Configuración de cache (futuro)
REDIS_URL="redis://localhost:6379"

# Configuración de seguridad
CORS_ORIGIN="http://localhost:3000"
RATE_LIMIT_WINDOW_MS=900000                     # 15 minutos
RATE_LIMIT_MAX_REQUESTS=100

# Analytics y monitoreo (futuro)
GOOGLE_ANALYTICS_ID=""
SENTRY_DSN=""
```

### Configuración por Entorno

#### Desarrollo (`.env.local`)

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
LOG_LEVEL="debug"
```

#### Testing (`.env.test`)

```env
DATABASE_URL="file:./test.db"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="test"
LOG_LEVEL="error"
```

#### Producción (`.env.production`)

```env
DATABASE_URL="postgresql://user:password@host:5432/prod_db"
NEXTAUTH_URL="https://yourdomain.com"
NODE_ENV="production"
LOG_LEVEL="warn"
```

## 🗄 Configuración de Base de Datos

### SQLite (Desarrollo)

```javascript
// prisma/schema.prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

**Ventajas:**

- Fácil configuración
- No requiere servidor separado
- Ideal para desarrollo y pruebas

**Limitaciones:**

- No soporta conexiones concurrentes pesadas
- No recomendado para producción con alta carga

### PostgreSQL (Producción)

```javascript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Configuración con Docker:**

```yaml
# docker-compose.yml
version: "3.8"
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: gestion_db
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: secure_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups

volumes:
  postgres_data:
```

**String de conexión:**

```env
DATABASE_URL="postgresql://admin:secure_password@localhost:5432/gestion_db"
```

### Migraciones y Schemas

```bash
# Crear migración inicial
npx prisma migrate dev --name init

# Crear migración específica
npx prisma migrate dev --name add_user_roles

# Aplicar migraciones en producción
npx prisma migrate deploy

# Reset de base de datos (solo desarrollo)
npx prisma migrate reset --force

# Generar cliente después de cambios
npx prisma generate
```

### Pool de Conexiones

```typescript
// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Configuración avanzada para producción
export const prismaWithPool = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + "?connection_limit=20&pool_timeout=20",
    },
  },
});
```

## 🚀 Deployment en Vercel

### Configuración Automática

1. **Conectar repositorio:**

   ```bash
   # Instalar Vercel CLI
   npm i -g vercel

   # Login y configurar
   vercel login
   vercel
   ```

2. **Configurar variables de entorno en Vercel:**
   - Ir a Vercel Dashboard > Project Settings > Environment Variables
   - Agregar todas las variables necesarias

### Configuración Manual

```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "regions": ["iad1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "NODE_ENV": "production"
  },
  "build": {
    "env": {
      "NEXT_PUBLIC_APP_URL": "https://yourdomain.vercel.app"
    }
  }
}
```

### Base de Datos en Vercel

**Opción 1: Vercel Postgres**

```bash
# Crear base de datos
vercel postgres create

# Obtener string de conexión
vercel env add DATABASE_URL
```

**Opción 2: PlanetScale**

```env
DATABASE_URL="mysql://username:password@host/database?sslaccept=strict"
```

**Opción 3: Supabase**

```env
DATABASE_URL="postgresql://postgres:password@db.supabase.co:5432/postgres"
```

### Script de Deploy

```bash
#!/bin/bash
# scripts/deploy.sh

echo "🚀 Iniciando deployment..."

# Verificar que estamos en la rama correcta
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
  echo "⚠️  No estás en la rama main. ¿Continuar? (y/n)"
  read -r response
  if [ "$response" != "y" ]; then
    exit 1
  fi
fi

# Ejecutar tests
echo "🧪 Ejecutando tests..."
npm run test
if [ $? -ne 0 ]; then
  echo "❌ Tests fallaron. Deployment cancelado."
  exit 1
fi

# Build del proyecto
echo "📦 Building proyecto..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Build falló. Deployment cancelado."
  exit 1
fi

# Deploy a Vercel
echo "🌐 Deploying a Vercel..."
vercel --prod

echo "✅ Deployment completado!"
```

## 🐳 Deployment con Docker

### Dockerfile Optimizado

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
```

### Docker Compose Completo

```yaml
# docker-compose.yml
version: "3.8"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://admin:password@postgres:5432/gestion_db
      - NEXTAUTH_SECRET=your-secret-key
      - NEXTAUTH_URL=http://localhost:3000
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./uploads:/app/uploads
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: gestion_db
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin -d gestion_db"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Configuración de Nginx

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    server {
        listen 80;
        server_name yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourdomain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        location / {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Static files caching
        location /_next/static {
            proxy_pass http://app;
            expires 365d;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

## 🔄 Configuración de CI/CD

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma client
        run: npx prisma generate
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

      - name: Run database migrations
        run: npx prisma migrate dev
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

      - name: Run tests
        run: npm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

      - name: Run linting
        run: npm run lint

      - name: Build application
        run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: "--prod"
```

### GitLab CI/CD

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

variables:
  NODE_VERSION: "18"
  POSTGRES_DB: test_db
  POSTGRES_USER: postgres
  POSTGRES_PASSWORD: postgres

test:
  stage: test
  image: node:$NODE_VERSION
  services:
    - postgres:15
  variables:
    DATABASE_URL: postgresql://postgres:postgres@postgres:5432/test_db
  before_script:
    - npm ci
    - npx prisma generate
    - npx prisma migrate dev
  script:
    - npm test
    - npm run lint
  artifacts:
    reports:
      coverage: coverage/
    paths:
      - coverage/

build:
  stage: build
  image: node:$NODE_VERSION
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - .next/
      - node_modules/
    expire_in: 1 hour

deploy:
  stage: deploy
  image: docker:latest
  services:
    - docker:dind
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
    - docker tag $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA $CI_REGISTRY_IMAGE:latest
    - docker push $CI_REGISTRY_IMAGE:latest
  only:
    - main
```

## 📊 Monitoreo y Logging

### Configuración de Logging

```typescript
// lib/logger.ts
import winston from "winston";

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "gestion-system" },
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

export default logger;
```

### Middleware de Logging

```typescript
// middleware/logging.ts
import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";

export function withLogging(handler: Function) {
  return async (req: NextRequest, ...args: any[]) => {
    const start = Date.now();
    const { method, url } = req;

    try {
      const response = await handler(req, ...args);
      const duration = Date.now() - start;

      logger.info({
        method,
        url,
        status: response.status,
        duration: `${duration}ms`,
        userAgent: req.headers.get("user-agent"),
        ip: req.ip || req.headers.get("x-forwarded-for"),
      });

      return response;
    } catch (error) {
      const duration = Date.now() - start;

      logger.error({
        method,
        url,
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });

      throw error;
    }
  };
}
```

### Health Check Endpoint

```typescript
// app/api/health/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    const healthCheck = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.APP_VERSION || "1.0.0",
      environment: process.env.NODE_ENV,
      database: "connected",
    };

    return NextResponse.json(healthCheck);
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}
```

## 💾 Backup y Recuperación

### Script de Backup Automático

```bash
#!/bin/bash
# scripts/backup.sh

set -e

# Configuración
DB_URL="${DATABASE_URL}"
BACKUP_DIR="./backups"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="backup_${DATE}.sql"

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR"

# Realizar backup según el tipo de base de datos
if [[ $DB_URL == *"postgresql"* ]]; then
    echo "📦 Creando backup de PostgreSQL..."
    pg_dump "$DB_URL" > "$BACKUP_DIR/$BACKUP_FILE"
elif [[ $DB_URL == *"sqlite"* ]]; then
    echo "📦 Creando backup de SQLite..."
    DB_FILE=$(echo $DB_URL | sed 's/file://')
    cp "$DB_FILE" "$BACKUP_DIR/backup_${DATE}.db"
fi

# Comprimir backup
gzip "$BACKUP_DIR/$BACKUP_FILE"

# Limpiar backups antiguos (mantener últimos 7 días)
find "$BACKUP_DIR" -name "backup_*.gz" -mtime +7 -delete

echo "✅ Backup completado: $BACKUP_FILE.gz"

# Opcional: Subir a cloud storage
# aws s3 cp "$BACKUP_DIR/$BACKUP_FILE.gz" s3://your-backup-bucket/
```

### Cron Job para Backups

```bash
# Agregar al crontab (crontab -e)
# Backup diario a las 2:00 AM
0 2 * * * /path/to/your/project/scripts/backup.sh >> /var/log/backup.log 2>&1
```

### Script de Restauración

```bash
#!/bin/bash
# scripts/restore.sh

set -e

if [ $# -eq 0 ]; then
    echo "❌ Uso: $0 <archivo_backup>"
    exit 1
fi

BACKUP_FILE="$1"
DB_URL="${DATABASE_URL}"

if [[ ! -f "$BACKUP_FILE" ]]; then
    echo "❌ Archivo no encontrado: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  ATENCIÓN: Esta operación sobrescribirá la base de datos actual."
echo "¿Deseas continuar? (y/N)"
read -r response

if [[ "$response" != "y" && "$response" != "Y" ]]; then
    echo "❌ Operación cancelada"
    exit 1
fi

# Descomprimir si es necesario
if [[ $BACKUP_FILE == *.gz ]]; then
    echo "📦 Descomprimiendo backup..."
    gunzip -c "$BACKUP_FILE" > temp_restore.sql
    BACKUP_FILE="temp_restore.sql"
fi

# Restaurar según el tipo de base de datos
if [[ $DB_URL == *"postgresql"* ]]; then
    echo "🔄 Restaurando PostgreSQL..."
    psql "$DB_URL" < "$BACKUP_FILE"
elif [[ $DB_URL == *"sqlite"* ]]; then
    echo "🔄 Restaurando SQLite..."
    DB_FILE=$(echo $DB_URL | sed 's/file://')
    cp "$BACKUP_FILE" "$DB_FILE"
fi

# Limpiar archivos temporales
[[ -f "temp_restore.sql" ]] && rm temp_restore.sql

echo "✅ Restauración completada"
```

## 🔒 Configuración de Seguridad

### Variables de Seguridad

```env
# Seguridad
NEXTAUTH_SECRET="your-super-secret-key-minimum-32-characters"
JWT_SECRET="another-secret-key-for-jwt-tokens"
ENCRYPTION_KEY="32-character-encryption-key-here"

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000    # 15 minutos
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN="https://yourdomain.com,https://admin.yourdomain.com"

# Archivo uploads
MAX_FILE_SIZE=5242880          # 5MB
ALLOWED_FILE_TYPES="image/jpeg,image/png,application/pdf"

# Base de datos
DB_CONNECTION_TIMEOUT=30000
DB_POOL_SIZE=20
```

### Middleware de Seguridad

```typescript
// middleware/security.ts
import { NextRequest, NextResponse } from "next/server";
import rateLimit from "express-rate-limit";

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"),
  message: "Demasiadas peticiones, intenta de nuevo más tarde.",
});

// CORS configuration
export function withCORS(response: NextResponse) {
  const origins = (process.env.CORS_ORIGIN || "").split(",");

  response.headers.set("Access-Control-Allow-Origin", origins[0] || "*");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  return response;
}

// Security headers
export function withSecurityHeaders(response: NextResponse) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  return response;
}

// Input validation
export function validateInput(data: any, schema: any) {
  try {
    return schema.parse(data);
  } catch (error) {
    throw new Error("Datos de entrada inválidos");
  }
}
```

### Configuración SSL/TLS

```bash
# Generar certificados SSL para desarrollo
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Para producción, usar Let's Encrypt
certbot --nginx -d yourdomain.com
```

### Configuración de Firewall

```bash
# UFW (Ubuntu)
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw deny 3000/tcp    # Bloquear acceso directo a la app
ufw enable

# iptables
iptables -A INPUT -p tcp --dport 22 -j ACCEPT
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
iptables -A INPUT -p tcp --dport 3000 -s 127.0.0.1 -j ACCEPT
iptables -A INPUT -p tcp --dport 3000 -j DROP
```

---

Esta guía proporciona una base sólida para configurar y deployar el sistema de gestión en diferentes entornos. Adapta las configuraciones según tus necesidades específicas y requisitos de seguridad.
