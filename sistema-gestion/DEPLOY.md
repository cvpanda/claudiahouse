# 🚀 Deploy en Vercel - Claudia House

## Pasos para hacer deploy:

### 1. **Crear cuenta en Vercel**

- Ve a [vercel.com](https://vercel.com)
- Conecta con tu cuenta de GitHub

### 2. **Crear base de datos PostgreSQL**

- En el dashboard de Vercel, ve a Storage
- Crea un nuevo "Postgres" database
- Vercel te dará automáticamente la `DATABASE_URL`

### 3. **Variables de entorno en Vercel**

Configura estas variables en tu proyecto de Vercel (Settings > Environment Variables):

```
DATABASE_URL=postgresql://...  (proporcionada automáticamente por Vercel)
JWT_SECRET=tu-jwt-secret-super-seguro-aqui-minimo-32-caracteres
NEXTAUTH_URL=https://tu-app.vercel.app
NEXTAUTH_SECRET=otro-secret-super-seguro-para-nextauth-minimo-32-caracteres
```

### 4. **Deploy desde GitHub**

- Conecta tu repositorio en Vercel
- El deploy se hará automáticamente
- Después del primer deploy, ejecuta: `npm run db:init` para inicializar la DB

### 5. **Acceso inicial**

```
Usuario: admin@claudiahouse.com
Contraseña: admin123
```

## ⚠️ Importante después del deploy:

1. Cambia la contraseña del administrador
2. Crea usuarios adicionales según necesites
3. Revisa la configuración de permisos

## 🔧 Variables de entorno explicadas:

- **DATABASE_URL**: URL de conexión a PostgreSQL (automática con Vercel Postgres)
- **JWT_SECRET**: Clave secreta para firmar tokens JWT (mínimo 32 caracteres)
- **NEXTAUTH_URL**: URL de tu aplicación en producción
- **NEXTAUTH_SECRET**: Clave secreta para NextAuth (mínimo 32 caracteres)

## 📝 Para generar secretos seguros:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
