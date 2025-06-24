# Guía Técnica - Sistema de Gestión Integral

Esta guía proporciona información técnica detallada para desarrolladores que trabajen en el sistema de gestión.

## 📋 Tabla de Contenidos

- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Configuración del Entorno](#configuración-del-entorno)
- [Base de Datos](#base-de-datos)
- [API Design](#api-design)
- [Frontend Architecture](#frontend-architecture)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## 🏗 Arquitectura del Sistema

### Stack Tecnológico

```
┌─────────────────┐
│   Frontend      │  Next.js 14 + TypeScript + Tailwind
├─────────────────┤
│   API Layer     │  Next.js API Routes + Zod Validation
├─────────────────┤
│   ORM Layer     │  Prisma ORM
├─────────────────┤
│   Database      │  SQLite (dev) / PostgreSQL (prod)
└─────────────────┘
```

### Patrones de Diseño Implementados

- **Repository Pattern**: Abstracción de acceso a datos con Prisma
- **API-First Design**: APIs RESTful bien estructuradas
- **Component Composition**: Componentes React reutilizables
- **Type-Safe Development**: TypeScript en todo el stack

## ⚙️ Configuración del Entorno

### Variables de Entorno Requeridas

```env
# Base de datos
DATABASE_URL="file:./dev.db"

# NextAuth (para futuras implementaciones)
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Configuraciones opcionales
NODE_ENV="development"
PORT=3000
```

### Estructura de Configuración

```typescript
// next.config.js
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"],
  },
  images: {
    domains: ["localhost"],
  },
};
```

## 🗄 Base de Datos

### Esquema Detallado

#### Tabla: Products

```sql
CREATE TABLE products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT UNIQUE,
    barcode TEXT UNIQUE,
    cost REAL DEFAULT 0,
    wholesalePrice REAL DEFAULT 0,
    retailPrice REAL DEFAULT 0,
    stock INTEGER DEFAULT 0,
    minStock INTEGER DEFAULT 0,
    maxStock INTEGER,
    unit TEXT DEFAULT 'unit',
    isActive BOOLEAN DEFAULT true,
    supplierId TEXT NOT NULL,
    categoryId TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplierId) REFERENCES suppliers(id),
    FOREIGN KEY (categoryId) REFERENCES categories(id)
);
```

### Migraciones

```bash
# Crear nueva migración
npx prisma migrate dev --name add_new_field

# Aplicar migraciones en producción
npx prisma migrate deploy

# Reset de base de datos (desarrollo únicamente)
npx prisma migrate reset
```

### Seeders

El archivo `src/lib/seed.ts` contiene datos de ejemplo:

```typescript
async function seedDatabase() {
  // Crear categorías
  const categories = await Promise.all([
    prisma.category.create({
      data: { name: "Electrónicos", description: "Dispositivos electrónicos" },
    }),
    // ... más categorías
  ]);

  // Crear proveedores
  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        name: "TechCorp",
        email: "contact@techcorp.com",
        phone: "+54 11 1234-5678",
      },
    }),
    // ... más proveedores
  ]);

  // Crear productos
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: "Smartphone XY",
        sku: "PHONE-001",
        cost: 300.0,
        wholesalePrice: 450.0,
        retailPrice: 600.0,
        stock: 25,
        minStock: 5,
        unit: "unidad",
        supplierId: suppliers[0].id,
        categoryId: categories[0].id,
      },
    }),
    // ... más productos
  ]);
}
```

## 🔌 API Design

### Convenciones REST

```typescript
// GET /api/products - Listar productos
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const search = searchParams.get("search") || "";

  try {
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { sku: { contains: search, mode: "insensitive" } },
        ],
      },
      include: {
        supplier: true,
        category: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      data: products,
      pagination: {
        page,
        limit,
        total: await prisma.product.count(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching products" },
      { status: 500 }
    );
  }
}
```

### Validación con Zod

```typescript
import { z } from "zod";

const ProductSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  sku: z.string().optional(),
  cost: z.number().min(0, "El costo debe ser mayor o igual a 0"),
  wholesalePrice: z
    .number()
    .min(0, "El precio mayorista debe ser mayor o igual a 0"),
  retailPrice: z
    .number()
    .min(0, "El precio minorista debe ser mayor o igual a 0"),
  stock: z.number().int().min(0, "El stock debe ser mayor o igual a 0"),
  minStock: z
    .number()
    .int()
    .min(0, "El stock mínimo debe ser mayor o igual a 0"),
  supplierId: z.string().min(1, "El proveedor es requerido"),
  categoryId: z.string().min(1, "La categoría es requerida"),
});

// POST /api/products
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = ProductSchema.parse(body);

    const product = await prisma.product.create({
      data: validatedData,
      include: {
        supplier: true,
        category: true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Error creating product" },
      { status: 500 }
    );
  }
}
```

### Manejo de Errores

```typescript
// lib/api-error.ts
export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: "Validation failed", details: error.errors },
      { status: 400 }
    );
  }

  console.error("Unexpected error:", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
```

## 🎨 Frontend Architecture

### Estructura de Componentes

```typescript
// components/ui/Button.tsx
interface ButtonProps {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export default function Button({
  variant = "primary",
  size = "md",
  children,
  onClick,
  disabled = false,
  type = "button",
}: ButtonProps) {
  const baseClasses =
    "font-medium rounded-lg transition-colors focus:outline-none focus:ring-2";

  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary:
      "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${
        sizeClasses[size]
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {children}
    </button>
  );
}
```

### Hooks Personalizados

```typescript
// hooks/useProducts.ts
import { useState, useEffect } from "react";
import { Product } from "@/types";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/products");
      if (!response.ok) {
        throw new Error("Error fetching products");
      }
      const data = await response.json();
      setProducts(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (
    productData: Omit<Product, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        throw new Error("Error creating product");
      }

      const newProduct = await response.json();
      setProducts((prev) => [newProduct, ...prev]);
      return newProduct;
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
    createProduct,
  };
}
```

### Context y State Management

```typescript
// context/AppContext.tsx
import { createContext, useContext, useReducer, ReactNode } from "react";

interface AppState {
  user: User | null;
  theme: "light" | "dark";
  sidebarOpen: boolean;
}

type AppAction =
  | { type: "SET_USER"; payload: User | null }
  | { type: "TOGGLE_THEME" }
  | { type: "TOGGLE_SIDEBAR" };

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_USER":
      return { ...state, user: action.payload };
    case "TOGGLE_THEME":
      return { ...state, theme: state.theme === "light" ? "dark" : "light" };
    case "TOGGLE_SIDEBAR":
      return { ...state, sidebarOpen: !state.sidebarOpen };
    default:
      return state;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, {
    user: null,
    theme: "light",
    sidebarOpen: true,
  });

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
```

## 🧪 Testing

### Setup de Testing

```json
// package.json (devDependencies)
{
  "@testing-library/jest-dom": "^6.1.0",
  "@testing-library/react": "^13.4.0",
  "@testing-library/user-event": "^14.5.0",
  "jest": "^29.7.0",
  "jest-environment-jsdom": "^29.7.0"
}
```

### Ejemplo de Test de Componente

```typescript
// __tests__/components/StatsCard.test.tsx
import { render, screen } from "@testing-library/react";
import { Package } from "lucide-react";
import StatsCard from "@/components/StatsCard";

describe("StatsCard", () => {
  it("renders with correct props", () => {
    render(
      <StatsCard
        title="Total Products"
        value="150"
        icon={Package}
        color="blue"
        change="+5%"
        changeType="positive"
      />
    );

    expect(screen.getByText("Total Products")).toBeInTheDocument();
    expect(screen.getByText("150")).toBeInTheDocument();
    expect(screen.getByText("+5%")).toBeInTheDocument();
  });

  it("applies correct color classes", () => {
    render(<StatsCard title="Test" value="100" icon={Package} color="red" />);

    const card = screen.getByRole("article");
    expect(card).toHaveClass("border-red-200");
  });
});
```

### Test de API Route

```typescript
// __tests__/api/products.test.ts
import { GET, POST } from "@/app/api/products/route";
import { prismaMock } from "@/lib/__mocks__/prisma";

jest.mock("@/lib/prisma");

describe("/api/products", () => {
  describe("GET", () => {
    it("returns products list", async () => {
      const mockProducts = [
        {
          id: "1",
          name: "Test Product",
          cost: 100,
          retailPrice: 150,
          stock: 10,
          // ... other fields
        },
      ];

      prismaMock.product.findMany.mockResolvedValue(mockProducts);
      prismaMock.product.count.mockResolvedValue(1);

      const request = new Request("http://localhost:3000/api/products");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toEqual(mockProducts);
    });
  });
});
```

## 🚀 Deployment

### Vercel Deployment

```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 10
    }
  }
}
```

### Environment Variables para Producción

```bash
# Production .env
DATABASE_URL="postgresql://user:password@host:port/database"
NEXTAUTH_SECRET="production-secret-key"
NEXTAUTH_URL="https://yourdomain.com"
NODE_ENV="production"
```

### Docker Setup

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

## 🔧 Troubleshooting

### Problemas Comunes

#### Error: Prisma Client not generated

```bash
# Solución
npm run db:generate
```

#### Error: Database connection failed

```bash
# Verificar DATABASE_URL en .env
# Para SQLite, asegurar que el directorio existe
mkdir -p prisma
npm run db:push
```

#### Error: Module not found

```bash
# Limpiar cache y reinstalar
rm -rf node_modules package-lock.json
npm install
```

#### Error de TypeScript en build

```bash
# Verificar tipos y reinstalar @types
npm install --save-dev @types/node @types/react @types/react-dom
```

### Debugging

#### Prisma Queries

```typescript
// Habilitar logging de queries
const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});
```

#### Next.js Debug Mode

```bash
# Ejecutar con debug
DEBUG=* npm run dev
```

### Performance Monitoring

```typescript
// lib/monitoring.ts
export function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const start = performance.now();
    try {
      const result = await fn();
      const end = performance.now();
      console.log(`${name} took ${end - start} milliseconds`);
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
}

// Uso
const products = await measurePerformance("Fetch Products", () =>
  prisma.product.findMany()
);
```

## 📝 Convenciones de Código

### Nomenclatura

- **Archivos**: kebab-case (`product-list.tsx`)
- **Componentes**: PascalCase (`ProductList`)
- **Variables/Funciones**: camelCase (`fetchProducts`)
- **Constantes**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Tipos**: PascalCase (`ProductType`)

### Estructura de Archivos

```
src/
├── app/
│   ├── (dashboard)/        # Route groups
│   └── api/
├── components/
│   ├── ui/                 # Componentes básicos reutilizables
│   ├── forms/              # Componentes de formularios
│   └── layout/             # Componentes de layout
├── hooks/                  # Custom hooks
├── lib/                    # Utilidades y configuraciones
├── types/                  # Definiciones de tipos
└── utils/                  # Funciones utilitarias
```

### Git Conventions

```bash
feat: add new product creation form
fix: resolve stock calculation bug
docs: update API documentation
style: format code with prettier
refactor: restructure product service
test: add unit tests for product API
chore: update dependencies
```

---

Esta guía técnica se actualiza continuamente con el desarrollo del proyecto. Para contribuir o sugerir mejoras, crear un issue en el repositorio.
