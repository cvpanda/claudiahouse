# Tests y Scripts de Desarrollo

Esta carpeta contiene scripts de desarrollo, pruebas y herramientas de testing utilizadas durante el desarrollo del sistema de gestión.

## 📁 Organización de Archivos

### 🧪 Tests de Funcionalidad

- `test-customer-location-shipping.js` - Test completo de gestión de clientes con ubicación y sucursales de envío
- `test-shipping-branch-model.js` - Verificación del modelo ShippingBranch en Prisma
- `test-product-*.js` - Tests relacionados con productos (SKU, edición, validación)
- `test-purchase-*.js` - Tests de compras y funcionalidades relacionadas
- `test-auth.js` - Tests de autenticación
- `test-api.js` - Tests generales de API

### 🔧 Scripts de Verificación

- `check-*.js` - Scripts para verificar permisos, usuarios y estado del sistema
- `debug-*.js` - Scripts de debugging y diagnóstico
- `get-*.js` - Scripts para obtener información específica del sistema

### 🏗️ Scripts de Creación de Datos de Prueba

- `create-test-*.js` - Scripts para crear datos de prueba (productos, compras, ventas)
- `init-*.js` - Scripts de inicialización

## 🚀 Cómo Usar

Para ejecutar cualquier test desde el directorio raíz del proyecto:

```bash
node tests/nombre-del-archivo.js
```

### Ejemplos:

```bash
# Test completo de clientes y sucursales
node tests/test-customer-location-shipping.js

# Verificar modelo ShippingBranch
node tests/test-shipping-branch-model.js

# Crear producto de prueba
node tests/create-test-product-with-barcode.js
```

## 📝 Notas

- Estos archivos son para desarrollo y testing únicamente
- No deben incluirse en producción
- Algunos tests requieren que el servidor esté ejecutándose
- Los tests pueden crear datos temporales en la base de datos
