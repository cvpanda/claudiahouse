# 📋 Guía de Desarrollo - Sistema de Gestión

## 🎯 Estado Actual del Proyecto

### ✅ **Completado y Funcionando**

- **Dashboard Principal** - http://localhost:3000
- **Base de Datos SQLite** con datos de ejemplo
- **API Backend** para productos y estadísticas
- **Interfaz Responsive** con Tailwind CSS
- **Navegación** con sidebar
- **Componentes Reutilizables**

### 🚧 **En Desarrollo**

- Páginas de gestión (productos, ventas, clientes)
- Sistema completo de ventas
- Reportes avanzados

## 📊 **Datos de Ejemplo Cargados**

### 📦 **Productos (4 items)**

1. **Smartphone Galaxy A54** - SKU: PHONE001

   - Costo: $120,000 | Mayorista: $150,000 | Minorista: $180,000
   - Stock: 15 unidades | Proveedor: Tech Solutions SA

2. **Camisa Formal Blanca** - SKU: SHIRT001

   - Costo: $2,500 | Mayorista: $3,500 | Minorista: $4,500
   - Stock: 25 unidades | Proveedor: Textiles del Sur

3. **Café Premium 500g** - SKU: COFFEE001

   - Costo: $1,200 | Mayorista: $1,800 | Minorista: $2,200
   - Stock: 50 unidades | Proveedor: Distribuidora Central

4. **Lámpara LED Escritorio** - SKU: LAMP001 ⚠️ **STOCK BAJO**
   - Costo: $3,500 | Mayorista: $5,000 | Minorista: $6,500
   - Stock: 8 unidades (mínimo: 5) | Proveedor: Tech Solutions SA

### 🏢 **Proveedores (3 items)**

1. **Tech Solutions SA** - Electrónicos
2. **Textiles del Sur** - Ropa
3. **Distribuidora Central** - General

### 👥 **Clientes (2 items)**

1. **Ana Rodríguez** - Cliente minorista
2. **Negocio Los Andes** - Cliente mayorista

### 📚 **Categorías (4 items)**

- Electrónicos, Ropa, Hogar, Alimentos

## 🔧 **APIs Disponibles**

### 📊 **Dashboard**

```
GET /api/dashboard/stats
```

**Respuesta:**

```json
{
  "totalProducts": 4,
  "lowStockProducts": 1,
  "totalCustomers": 2,
  "todaySales": 0,
  "monthSales": 0,
  "totalRevenue": 0
}
```

### 📦 **Productos**

```
GET /api/products                    # Lista con filtros
GET /api/products?lowStock=true      # Productos con stock bajo
GET /api/products?search=telefono    # Búsqueda
GET /api/products?categoryId=...     # Por categoría
POST /api/products                   # Crear producto
GET /api/products/[id]               # Producto específico
PUT /api/products/[id]               # Actualizar
DELETE /api/products/[id]            # Eliminar (soft delete)
```

## 🎨 **Componentes Principales**

### `Dashboard.tsx` - Panel Principal ✅

- Tarjetas de estadísticas
- Lista de productos con stock bajo
- Ventas recientes
- Actualización en tiempo real

### `Layout.tsx` - Navegación ✅

- Sidebar responsive
- Navegación principal
- Header con fecha actual
- Menu mobile

### `StatsCard.tsx` - Tarjetas de Métricas ✅

- Iconos personalizados
- Colores temáticos
- Formato de moneda argentino

## 🗄️ **Esquema de Base de Datos**

### Tablas Principales:

- `suppliers` - Proveedores
- `categories` - Categorías
- `products` - Productos (con precios y stock)
- `customers` - Clientes
- `sales` - Ventas
- `sale_items` - Items de venta
- `stock_movements` - Movimientos de stock

### Relaciones:

- Product → Supplier (muchos a uno)
- Product → Category (muchos a uno)
- Sale → Customer (muchos a uno, opcional)
- Sale → SaleItems (uno a muchos)
- Product → StockMovements (uno a muchos)

## 🛠️ **Herramientas de Desarrollo**

### Ver Base de Datos:

```bash
npx prisma studio
```

Abre interfaz web en http://localhost:5555

### Resetear y Recargar Datos:

```bash
npx prisma db push --force-reset
npm run db:seed
```

### Verificar API:

```bash
# Estadísticas
curl http://localhost:3000/api/dashboard/stats

# Productos
curl http://localhost:3000/api/products

# Productos con stock bajo
curl http://localhost:3000/api/products?lowStock=true
```

## 🚀 **Próximos Pasos de Desarrollo**

### 1. **Página de Productos** (`/products`)

```typescript
// Funcionalidades necesarias:
- Lista de productos con tabla
- Búsqueda y filtros
- Botón "Agregar Producto"
- Modal/formulario para crear/editar
- Acciones: ver, editar, eliminar
- Paginación
```

### 2. **Página de Ventas** (`/sales`)

```typescript
// Funcionalidades necesarias:
- Lista de ventas realizadas
- Botón "Nueva Venta"
- Carrito de compras
- Selección de cliente
- Cálculo automático de totales
- Métodos de pago
```

### 3. **Página de Clientes** (`/customers`)

```typescript
// Funcionalidades necesarias:
- Lista de clientes
- Formulario agregar/editar cliente
- Historial de compras por cliente
- Filtro mayorista/minorista
```

## 📝 **Convenciones de Código**

### Estructura de Archivos:

```
src/app/products/page.tsx          # Página principal
src/app/products/new/page.tsx      # Crear producto
src/app/products/[id]/page.tsx     # Ver/editar producto
src/components/products/           # Componentes específicos
src/components/forms/              # Formularios reutilizables
```

### Naming:

- Componentes: PascalCase (`ProductForm.tsx`)
- Hooks: camelCase con prefijo use (`useProducts.ts`)
- API routes: REST convencional (`/api/products`)
- Variables: camelCase (`totalProducts`)

### TypeScript:

- Usar interfaces definidas en `src/types/index.ts`
- Validación con Zod en APIs
- Props tipadas en componentes

## 🎉 **Tu Sistema Está Listo Para Crecer**

El foundation está sólido. Puedes:

1. **Agregar nuevas páginas** usando la estructura existente
2. **Extender la API** siguiendo los patrones implementados
3. **Personalizar el diseño** modificando Tailwind CSS
4. **Integrar nuevas funcionalidades** paso a paso

¡El sistema está preparado para escalar con tu emprendimiento! 🚀
