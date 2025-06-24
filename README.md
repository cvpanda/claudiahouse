# Sistema de Gestión Integral - Claudia House

Sistema de gestión completo para emprendimientos desarrollado con Next.js, TypeScript y Prisma. Incluye control de stock, ventas, clientes, proveedores, precios mayorista/minorista, dashboard de visualización y generación de remitos.

## 📋 Tabla de Contenidos

- [Características Principales](#características-principales)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Instalación y Configuración](#instalación-y-configuración)
- [Modelo de Datos](#modelo-de-datos)
- [API Endpoints](#api-endpoints)
- [Componentes Principales](#componentes-principales)
- [Scripts Disponibles](#scripts-disponibles)
- [Guía de Uso](#guía-de-uso)
- [Roadmap](#roadmap)
- [Contribuir](#contribuir)

## ✨ Características Principales

### 🎯 Funcionalidades Implementadas

- **Dashboard Interactivo**: Visualización de estadísticas clave del negocio
- **Gestión de Productos**: CRUD completo con control de stock
- **Sistema de Inventario**: Seguimiento de movimientos de stock
- **Precios Diferenciados**: Precio mayorista y minorista
- **Gestión de Proveedores**: Control de proveedores y sus productos
- **Categorización**: Organización de productos por categorías
- **Base de Datos Relacional**: Esquema optimizado con SQLite/Prisma

### 🚀 Funcionalidades Planificadas

- Sistema completo de ventas con remitos
- Gestión de clientes con historial
- Reportes avanzados y analytics
- Sistema de alertas de stock bajo
- Autenticación y autorización
- Backup automático de datos
- API REST completa
- Integración con sistemas de pago

## 🛠 Tecnologías Utilizadas

### Frontend

- **Next.js 14**: Framework React con App Router
- **TypeScript**: Tipado estático para mejor desarrollo
- **Tailwind CSS**: Framework CSS para diseño moderno
- **React Hook Form**: Manejo eficiente de formularios
- **Lucide React**: Iconos modernos y consistentes
- **React Query**: Gestión de estado del servidor
- **Recharts**: Gráficos y visualizaciones

### Backend

- **Next.js API Routes**: API RESTful integrada
- **Prisma ORM**: Object-Relational Mapping con TypeScript
- **SQLite**: Base de datos ligera y eficiente
- **Zod**: Validación de esquemas y datos

### Herramientas de Desarrollo

- **ESLint**: Linting para código consistente
- **Prettier**: Formateo automático de código
- **tsx**: Ejecución de TypeScript en Node.js

## 📁 Estructura del Proyecto

```
claudiahouse/
├── sistema-gestion/
│   ├── prisma/
│   │   ├── schema.prisma        # Esquema de base de datos
│   │   └── dev.db              # Base de datos SQLite
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx      # Layout principal
│   │   │   ├── page.tsx        # Página principal (Dashboard)
│   │   │   ├── globals.css     # Estilos globales
│   │   │   └── api/            # API Routes
│   │   │       ├── dashboard/
│   │   │       │   └── stats/
│   │   │       │       └── route.ts
│   │   │       ├── products/
│   │   │       │   ├── route.ts
│   │   │       │   └── [id]/
│   │   │       │       └── route.ts
│   │   │       └── sales/
│   │   │           └── route.ts
│   │   ├── components/
│   │   │   ├── Dashboard.tsx   # Componente principal del dashboard
│   │   │   ├── Layout.tsx      # Layout con navegación
│   │   │   └── StatsCard.tsx   # Tarjetas de estadísticas
│   │   ├── lib/
│   │   │   ├── prisma.ts       # Cliente de Prisma
│   │   │   ├── utils.ts        # Utilidades generales
│   │   │   └── seed.ts         # Script de semillas
│   │   └── types/
│   │       └── index.ts        # Tipos TypeScript
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── README.md
├── docs/                       # Documentación adicional
└── README.md                   # Este archivo
```

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js 18 o superior
- npm o yarn
- Git

### Instalación

1. **Clonar el repositorio**

```bash
git clone https://github.com/tu-usuario/claudiahouse.git
cd claudiahouse/sistema-gestion
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar variables de entorno**

```bash
# Crear archivo .env
cp .env.example .env
```

Archivo `.env`:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="tu-secret-key-aqui"
NEXTAUTH_URL="http://localhost:3000"
```

4. **Configurar la base de datos**

```bash
# Generar el cliente de Prisma
npm run db:generate

# Aplicar migraciones
npm run db:push

# Poblar con datos de ejemplo (opcional)
npm run db:seed
```

5. **Iniciar el servidor de desarrollo**

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🗄 Modelo de Datos

### Entidades Principales

#### Productos (Products)

```sql
- id: String (PK)
- name: String
- description: String?
- sku: String? (Unique)
- barcode: String? (Unique)
- cost: Float (Precio de costo)
- wholesalePrice: Float (Precio mayorista)
- retailPrice: Float (Precio minorista)
- stock: Int (Stock actual)
- minStock: Int (Stock mínimo)
- maxStock: Int? (Stock máximo)
- unit: String (Unidad de medida)
- isActive: Boolean
- supplierId: String (FK)
- categoryId: String (FK)
```

#### Proveedores (Suppliers)

```sql
- id: String (PK)
- name: String
- contact: String?
- phone: String?
- email: String?
- address: String?
- cuit: String?
```

#### Categorías (Categories)

```sql
- id: String (PK)
- name: String (Unique)
- description: String?
```

#### Clientes (Customers)

```sql
- id: String (PK)
- name: String
- email: String?
- phone: String?
- address: String?
- cuit: String?
- customerType: String (retail/wholesale)
- isActive: Boolean
```

#### Ventas (Sales)

```sql
- id: String (PK)
- saleNumber: String (Unique)
- total: Float
- subtotal: Float
- tax: Float
- discount: Float
- paymentMethod: String
- status: String
- customerId: String? (FK)
```

#### Items de Venta (SaleItems)

```sql
- id: String (PK)
- quantity: Int
- unitPrice: Float
- totalPrice: Float
- saleId: String (FK)
- productId: String (FK)
```

#### Movimientos de Stock (StockMovements)

```sql
- id: String (PK)
- type: String (in/out/adjustment)
- quantity: Int
- reason: String?
- reference: String?
- productId: String (FK)
```

### Relaciones

- **Supplier** → **Products** (1:N)
- **Category** → **Products** (1:N)
- **Customer** → **Sales** (1:N)
- **Sale** → **SaleItems** (1:N)
- **Product** → **SaleItems** (1:N)
- **Product** → **StockMovements** (1:N)

## 🔌 API Endpoints

### Dashboard

```http
GET /api/dashboard/stats
```

Retorna estadísticas generales del sistema.

**Respuesta:**

```json
{
  "totalProducts": 150,
  "lowStockProducts": 12,
  "totalCustomers": 85,
  "todaySales": 25,
  "monthSales": 542,
  "totalRevenue": 125000.5
}
```

### Productos

```http
GET    /api/products          # Listar productos
POST   /api/products          # Crear producto
GET    /api/products/[id]     # Obtener producto
PUT    /api/products/[id]     # Actualizar producto
DELETE /api/products/[id]     # Eliminar producto
```

**Ejemplo POST /api/products:**

```json
{
  "name": "Producto Ejemplo",
  "description": "Descripción del producto",
  "sku": "PROD-001",
  "cost": 100.0,
  "wholesalePrice": 150.0,
  "retailPrice": 200.0,
  "stock": 50,
  "minStock": 10,
  "unit": "unidad",
  "supplierId": "supplier-id",
  "categoryId": "category-id"
}
```

### Ventas

```http
GET  /api/sales              # Listar ventas
POST /api/sales              # Crear venta
```

## 🧩 Componentes Principales

### Dashboard

Componente principal que muestra:

- Estadísticas generales del negocio
- Tarjetas con métricas clave
- Gráficos de rendimiento
- Alertas de stock bajo

### Layout

Componente de layout que incluye:

- Barra de navegación
- Menú lateral
- Contenedor principal
- Footer

### StatsCard

Componente reutilizable para mostrar estadísticas con:

- Icono representativo
- Título y valor
- Indicador de cambio
- Colores temáticos

## 📜 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Iniciar servidor de desarrollo
npm run build           # Construir para producción
npm run start           # Iniciar servidor de producción
npm run lint            # Ejecutar linting

# Base de datos
npm run db:generate     # Generar cliente de Prisma
npm run db:push         # Aplicar cambios al esquema
npm run db:migrate      # Crear y aplicar migraciones
npm run db:studio       # Abrir Prisma Studio
npm run db:seed         # Poblar base de datos con datos de ejemplo
```

## 📖 Guía de Uso

### 1. Configuración Inicial

1. Ejecutar el seed para poblar datos de ejemplo
2. Acceder al dashboard en `http://localhost:3000`
3. Revisar las estadísticas generales

### 2. Gestión de Productos

1. Navegar a la sección de productos
2. Crear categorías y proveedores
3. Agregar productos con precios diferenciados
4. Configurar niveles de stock mínimo

### 3. Control de Inventario

1. Revisar alertas de stock bajo
2. Registrar movimientos de entrada/salida
3. Realizar ajustes de inventario

### 4. Análisis de Datos

1. Monitorear métricas en el dashboard
2. Revisar tendencias de ventas
3. Analizar productos más/menos vendidos

## 🗺 Roadmap

### Versión 1.1 (Próxima)

- [ ] Sistema completo de ventas
- [ ] Gestión de clientes con CRUD
- [ ] Generación de remitos/facturas
- [ ] Reportes básicos

### Versión 1.2

- [ ] Autenticación y autorización
- [ ] Roles de usuario (admin, vendedor, etc.)
- [ ] Historial de cambios
- [ ] Backup automático

### Versión 1.3

- [ ] Reportes avanzados con gráficos
- [ ] Integración con sistemas de pago
- [ ] Notificaciones por email/SMS
- [ ] API REST pública

### Versión 2.0

- [ ] Aplicación móvil
- [ ] Multi-tienda
- [ ] Integración con e-commerce
- [ ] BI y analytics avanzados

## 🤝 Contribuir

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear un Pull Request

### Convenciones de Código

- Usar TypeScript para tipado estático
- Seguir las reglas de ESLint configuradas
- Comentar funciones complejas
- Escribir tests para nuevas funcionalidades

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 📞 Soporte

Si tienes preguntas o encuentras problemas:

1. Revisa la documentación
2. Busca en los issues existentes
3. Crea un nuevo issue con detalles del problema

---

**Desarrollado con ❤️ para emprendedores que buscan optimizar su gestión empresarial.**
