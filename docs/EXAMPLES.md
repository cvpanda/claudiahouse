# Ejemplos de Uso y Datos de Prueba

Este documento contiene ejemplos prácticos de uso del sistema, datos de prueba y casos de uso comunes.

## 📋 Tabla de Contenidos

- [Datos de Ejemplo](#datos-de-ejemplo)
- [Ejemplos de API](#ejemplos-de-api)
- [Casos de Uso Comunes](#casos-de-uso-comunes)
- [Scripts de Testing](#scripts-de-testing)
- [Integración con Frontend](#integración-con-frontend)

## 🎯 Datos de Ejemplo

### Categorías de Productos

```json
[
  {
    "name": "Electrónicos",
    "description": "Dispositivos electrónicos y tecnología"
  },
  {
    "name": "Hogar y Cocina",
    "description": "Artículos para el hogar y cocina"
  },
  {
    "name": "Ropa y Accesorios",
    "description": "Prendas de vestir y accesorios"
  },
  {
    "name": "Deportes",
    "description": "Artículos deportivos y fitness"
  },
  {
    "name": "Libros y Papelería",
    "description": "Libros, cuadernos y artículos de oficina"
  }
]
```

### Proveedores

```json
[
  {
    "name": "TechCorp",
    "contact": "Juan Pérez",
    "phone": "+54 11 1234-5678",
    "email": "ventas@techcorp.com.ar",
    "address": "Av. Corrientes 1234, CABA",
    "cuit": "20-12345678-9"
  },
  {
    "name": "Distribuidora Central",
    "contact": "María González",
    "phone": "+54 11 8765-4321",
    "email": "pedidos@distcentral.com",
    "address": "San Martín 567, Buenos Aires",
    "cuit": "30-87654321-0"
  },
  {
    "name": "Importadora Global",
    "contact": "Carlos Rodríguez",
    "phone": "+54 11 5555-0000",
    "email": "importaciones@global.com",
    "address": "Rivadavia 890, Rosario",
    "cuit": "27-55555555-5"
  }
]
```

### Productos de Ejemplo

```json
[
  {
    "name": "iPhone 15 Pro 128GB",
    "description": "Smartphone Apple iPhone 15 Pro con 128GB de almacenamiento",
    "sku": "IPHONE-15-PRO-128",
    "barcode": "1234567890123",
    "cost": 800000,
    "wholesalePrice": 1100000,
    "retailPrice": 1300000,
    "stock": 15,
    "minStock": 3,
    "maxStock": 50,
    "unit": "unidad"
  },
  {
    "name": "Samsung Galaxy S24 256GB",
    "description": "Smartphone Samsung Galaxy S24 con 256GB",
    "sku": "SAMSUNG-S24-256",
    "barcode": "2345678901234",
    "cost": 700000,
    "wholesalePrice": 950000,
    "retailPrice": 1150000,
    "stock": 20,
    "minStock": 5,
    "unit": "unidad"
  },
  {
    "name": "Notebook Lenovo ThinkPad E14",
    "description": "Notebook Lenovo ThinkPad E14, Intel i5, 8GB RAM, 512GB SSD",
    "sku": "LENOVO-E14-I5",
    "barcode": "3456789012345",
    "cost": 450000,
    "wholesalePrice": 620000,
    "retailPrice": 750000,
    "stock": 8,
    "minStock": 2,
    "unit": "unidad"
  },
  {
    "name": "Cafetera Nespresso Essenza Mini",
    "description": "Cafetera de cápsulas Nespresso modelo Essenza Mini",
    "sku": "NESPRESSO-MINI",
    "barcode": "4567890123456",
    "cost": 25000,
    "wholesalePrice": 35000,
    "retailPrice": 45000,
    "stock": 30,
    "minStock": 10,
    "unit": "unidad"
  },
  {
    "name": "Zapatillas Nike Air Max 90",
    "description": "Zapatillas deportivas Nike Air Max 90, varios talles",
    "sku": "NIKE-AIRMAX-90",
    "barcode": "5678901234567",
    "cost": 45000,
    "wholesalePrice": 65000,
    "retailPrice": 85000,
    "stock": 50,
    "minStock": 15,
    "unit": "par"
  }
]
```

### Clientes

```json
[
  {
    "name": "Ana María López",
    "email": "ana.lopez@email.com",
    "phone": "+54 9 11 1111-1111",
    "address": "Belgrano 123, CABA",
    "cuit": "27-11111111-1",
    "customerType": "retail"
  },
  {
    "name": "Comercial San Martín SRL",
    "email": "ventas@comercialsanmartin.com",
    "phone": "+54 9 11 2222-2222",
    "address": "San Martín 456, La Plata",
    "cuit": "30-22222222-2",
    "customerType": "wholesale"
  },
  {
    "name": "Pedro Fernández",
    "email": "pedro.fernandez@gmail.com",
    "phone": "+54 9 11 3333-3333",
    "address": "Mitre 789, Quilmes",
    "customerType": "retail"
  }
]
```

## 🔌 Ejemplos de API

### Crear un Producto

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Producto de Prueba",
    "description": "Descripción del producto de prueba",
    "sku": "TEST-001",
    "cost": 100.00,
    "wholesalePrice": 150.00,
    "retailPrice": 200.00,
    "stock": 50,
    "minStock": 10,
    "unit": "unidad",
    "supplierId": "supplier-id-here",
    "categoryId": "category-id-here"
  }'
```

### Obtener Estadísticas del Dashboard

```bash
curl -X GET http://localhost:3000/api/dashboard/stats
```

Respuesta esperada:

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

### Listar Productos con Filtros

```bash
# Buscar productos por nombre
curl "http://localhost:3000/api/products?search=iphone&page=1&limit=10"

# Filtrar por categoría
curl "http://localhost:3000/api/products?category=electronicos&page=1&limit=5"
```

### Actualizar un Producto

```bash
curl -X PUT http://localhost:3000/api/products/[product-id] \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Producto Actualizado",
    "retailPrice": 250.00,
    "stock": 75
  }'
```

### Crear una Venta

```bash
curl -X POST http://localhost:3000/api/sales \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "customer-id-here",
    "items": [
      {
        "productId": "product-id-1",
        "quantity": 2,
        "unitPrice": 200.00
      },
      {
        "productId": "product-id-2",
        "quantity": 1,
        "unitPrice": 150.00
      }
    ],
    "paymentMethod": "cash",
    "discount": 10.00
  }'
```

## 📝 Casos de Uso Comunes

### 1. Gestión de Inventario

#### Agregar Stock

```typescript
// Función para agregar stock a un producto
async function addStock(productId: string, quantity: number, reason?: string) {
  // Crear movimiento de stock
  await prisma.stockMovement.create({
    data: {
      productId,
      type: "in",
      quantity,
      reason: reason || "Stock added",
      reference: `STOCK-${Date.now()}`,
    },
  });

  // Actualizar stock del producto
  await prisma.product.update({
    where: { id: productId },
    data: {
      stock: {
        increment: quantity,
      },
    },
  });
}
```

#### Verificar Stock Bajo

```typescript
async function getProductsWithLowStock() {
  return await prisma.product.findMany({
    where: {
      stock: {
        lte: prisma.product.fields.minStock,
      },
    },
    include: {
      category: true,
      supplier: true,
    },
  });
}
```

### 2. Sistema de Ventas

#### Procesar Venta Completa

```typescript
async function processSale(saleData: {
  customerId?: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
  paymentMethod: string;
  discount?: number;
}) {
  return await prisma.$transaction(async (tx) => {
    // Calcular totales
    const subtotal = saleData.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const discount = saleData.discount || 0;
    const total = subtotal - discount;

    // Crear la venta
    const sale = await tx.sale.create({
      data: {
        saleNumber: `SALE-${Date.now()}`,
        customerId: saleData.customerId,
        subtotal,
        total,
        discount,
        paymentMethod: saleData.paymentMethod,
        status: "completed",
      },
    });

    // Crear items de venta y actualizar stock
    for (const item of saleData.items) {
      // Crear item de venta
      await tx.saleItem.create({
        data: {
          saleId: sale.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
        },
      });

      // Reducir stock
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });

      // Crear movimiento de stock
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          type: "out",
          quantity: item.quantity,
          reason: "Sale",
          reference: sale.saleNumber,
        },
      });
    }

    return sale;
  });
}
```

### 3. Reportes y Analytics

#### Reporte de Ventas por Período

```typescript
async function getSalesReport(startDate: Date, endDate: Date) {
  const sales = await prisma.sale.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      customer: true,
      saleItems: {
        include: {
          product: true,
        },
      },
    },
  });

  return {
    totalSales: sales.length,
    totalRevenue: sales.reduce((sum, sale) => sum + sale.total, 0),
    averageTicket:
      sales.length > 0
        ? sales.reduce((sum, sale) => sum + sale.total, 0) / sales.length
        : 0,
    topProducts: getTopSellingProducts(sales),
    salesByDay: groupSalesByDay(sales),
  };
}
```

#### Productos Más Vendidos

```typescript
async function getTopSellingProducts(limit: number = 10) {
  const topProducts = await prisma.saleItem.groupBy({
    by: ["productId"],
    _sum: {
      quantity: true,
      totalPrice: true,
    },
    orderBy: {
      _sum: {
        quantity: "desc",
      },
    },
    take: limit,
  });

  // Obtener detalles de productos
  const productDetails = await Promise.all(
    topProducts.map(async (item) => {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { category: true },
      });

      return {
        product,
        totalQuantitySold: item._sum.quantity,
        totalRevenue: item._sum.totalPrice,
      };
    })
  );

  return productDetails;
}
```

## 🧪 Scripts de Testing

### Script de Prueba de API

```typescript
// scripts/test-api.ts
async function testAPI() {
  const baseURL = "http://localhost:3000/api";

  // Test Dashboard Stats
  try {
    const statsResponse = await fetch(`${baseURL}/dashboard/stats`);
    const stats = await statsResponse.json();
    console.log("✅ Dashboard Stats:", stats);
  } catch (error) {
    console.error("❌ Dashboard Stats failed:", error);
  }

  // Test Products List
  try {
    const productsResponse = await fetch(`${baseURL}/products`);
    const products = await productsResponse.json();
    console.log("✅ Products List:", products.data?.length || 0, "products");
  } catch (error) {
    console.error("❌ Products List failed:", error);
  }

  // Test Create Product
  try {
    const newProduct = {
      name: "Test Product API",
      sku: `TEST-${Date.now()}`,
      cost: 50,
      wholesalePrice: 75,
      retailPrice: 100,
      stock: 10,
      minStock: 2,
      unit: "unidad",
      supplierId: "some-supplier-id",
      categoryId: "some-category-id",
    };

    const createResponse = await fetch(`${baseURL}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newProduct),
    });

    if (createResponse.ok) {
      const created = await createResponse.json();
      console.log("✅ Product Created:", created.id);
    } else {
      console.error("❌ Product Creation failed:", await createResponse.text());
    }
  } catch (error) {
    console.error("❌ Product Creation error:", error);
  }
}

// Ejecutar tests
testAPI();
```

### Datos de Prueba para Seed

```typescript
// lib/test-data.ts
export const testCategories = [
  { name: "Electrónicos", description: "Dispositivos electrónicos" },
  { name: "Hogar", description: "Artículos para el hogar" },
  { name: "Ropa", description: "Prendas de vestir" },
];

export const testSuppliers = [
  {
    name: "Proveedor Test 1",
    contact: "Juan Test",
    phone: "+54 11 1111-1111",
    email: "test1@example.com",
  },
  {
    name: "Proveedor Test 2",
    contact: "María Test",
    phone: "+54 11 2222-2222",
    email: "test2@example.com",
  },
];

export const testProducts = [
  {
    name: "Producto Test 1",
    description: "Descripción del producto test 1",
    sku: "TEST-001",
    cost: 100,
    wholesalePrice: 150,
    retailPrice: 200,
    stock: 50,
    minStock: 10,
    unit: "unidad",
  },
  {
    name: "Producto Test 2",
    description: "Descripción del producto test 2",
    sku: "TEST-002",
    cost: 75,
    wholesalePrice: 100,
    retailPrice: 135,
    stock: 25,
    minStock: 5,
    unit: "unidad",
  },
];
```

## 🎨 Integración con Frontend

### Hook para Gestión de Productos

```typescript
// hooks/useProductManagement.ts
import { useState } from "react";
import { Product, CreateProductData } from "@/types";

export function useProductManagement() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProduct = async (data: CreateProductData): Promise<Product> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error creating product");
      }

      const product = await response.json();
      return product;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async (productId: string, newStock: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: newStock }),
      });

      if (!response.ok) {
        throw new Error("Error updating stock");
      }

      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createProduct,
    updateStock,
    loading,
    error,
    clearError: () => setError(null),
  };
}
```

### Componente de Formulario de Producto

```typescript
// components/ProductForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  sku: z.string().optional(),
  cost: z.number().min(0, "El costo debe ser mayor o igual a 0"),
  retailPrice: z.number().min(0, "El precio debe ser mayor o igual a 0"),
  stock: z.number().int().min(0, "El stock debe ser mayor o igual a 0"),
  minStock: z
    .number()
    .int()
    .min(0, "El stock mínimo debe ser mayor o igual a 0"),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  onSubmit: (data: ProductFormData) => void;
  loading?: boolean;
  initialData?: Partial<ProductFormData>;
}

export default function ProductForm({
  onSubmit,
  loading,
  initialData,
}: ProductFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Nombre del Producto
        </label>
        <input
          {...register("name")}
          type="text"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">SKU</label>
        <input
          {...register("sku")}
          type="text"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Costo
          </label>
          <input
            {...register("cost", { valueAsNumber: true })}
            type="number"
            step="0.01"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
          {errors.cost && (
            <p className="mt-1 text-sm text-red-600">{errors.cost.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Precio de Venta
          </label>
          <input
            {...register("retailPrice", { valueAsNumber: true })}
            type="number"
            step="0.01"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
          {errors.retailPrice && (
            <p className="mt-1 text-sm text-red-600">
              {errors.retailPrice.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Stock Actual
          </label>
          <input
            {...register("stock", { valueAsNumber: true })}
            type="number"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
          {errors.stock && (
            <p className="mt-1 text-sm text-red-600">{errors.stock.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Stock Mínimo
          </label>
          <input
            {...register("minStock", { valueAsNumber: true })}
            type="number"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
          {errors.minStock && (
            <p className="mt-1 text-sm text-red-600">
              {errors.minStock.message}
            </p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Guardando..." : "Guardar Producto"}
      </button>
    </form>
  );
}
```

---

Estos ejemplos proporcionan una base sólida para trabajar con el sistema. Puedes adaptarlos según las necesidades específicas de tu emprendimiento.
