# Deployment en Vercel

## Variables de Entorno Requeridas

Para que el proyecto funcione correctamente en Vercel, asegúrate de configurar las siguientes variables de entorno en el dashboard de Vercel:

### 🗄️ Base de Datos

```
DATABASE_DATABASE_URL=postgresql://username:password@hostname:port/database
```

### 🔐 Autenticación

```
JWT_SECRET=tu-jwt-secret-muy-seguro-aqui
NEXTAUTH_SECRET=tu-nextauth-secret-muy-seguro-aqui
NEXTAUTH_URL=https://tu-dominio.vercel.app
```

### 🔧 Prisma (Requerido para builds exitosos)

```
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
```

## 🚀 Proceso de Deployment

### 1. Configuración en Vercel

1. Conecta tu repositorio de GitHub con Vercel
2. Configura las variables de entorno listadas arriba
3. Asegúrate de que la branch de deployment sea `main`

### 2. Base de Datos

- El proyecto está configurado para usar PostgreSQL en producción
- Las migraciones se ejecutan automáticamente durante el build
- Asegúrate de que tu base de datos PostgreSQL esté accesible desde Vercel

### 3. Build Process

El proceso de build incluye:

1. `npm ci` - Instalación de dependencias
2. `prisma generate` - Generación del cliente Prisma
3. `prisma migrate deploy` - Aplicación de migraciones
4. `next build` - Build de Next.js

## 🔧 Configuración Especial

### Prisma en Vercel

- Se añadió `PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1` para evitar errores de descarga de motores
- Se configuró `serverComponentsExternalPackages: ["@prisma/client"]` en Next.js

### Next.js Optimizations

- ESLint ignorado durante builds para evitar fallos por warnings
- Configuración específica para server components con Prisma

## 🐛 Solución de Problemas Comunes

### Error: "Failed to fetch sha256 checksum"

- **Causa**: Problema conocido de Prisma con descargas de motores
- **Solución**: Variable `PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1` configurada

### Error: "DATABASE_DATABASE_URL is not defined"

- **Causa**: Variable de entorno de base de datos no configurada
- **Solución**: Configurar en variables de entorno de Vercel

### Error de migraciones

- **Causa**: Base de datos no sincronizada
- **Solución**: Ejecutar migraciones manualmente o verificar conectividad

## 📝 Comandos Útiles

```bash
# Build local (simular Vercel)
npm run build:vercel

# Verificar generación de Prisma
npx prisma generate

# Aplicar migraciones
npx prisma migrate deploy

# Verificar estado de la base de datos
npx prisma db seed
```

## 🔗 Enlaces Importantes

- [Documentación de Vercel](https://vercel.com/docs)
- [Prisma con Vercel](https://www.prisma.io/docs/guides/deployment/deploying-to-vercel)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
