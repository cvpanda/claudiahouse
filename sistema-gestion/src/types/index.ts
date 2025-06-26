export interface Product {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  cost: number;
  wholesalePrice: number;
  retailPrice: number;
  stock: number;
  minStock: number;
  maxStock?: number;
  unit: string;
  imageUrl?: string;
  isActive: boolean;
  supplierId: string;
  categoryId: string;
  supplier: Supplier;
  category: Category;
  createdAt: Date;
  updatedAt: Date;
}

export interface Supplier {
  id: string;
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
  cuit?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  cuit?: string;
  customerType: "retail" | "wholesale";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Sale {
  id: string;
  saleNumber: string;
  total: number;
  subtotal: number;
  tax: number;
  discount: number;
  paymentMethod: "cash" | "card" | "transfer" | "credit";
  status: "pending" | "completed" | "cancelled";
  notes?: string;
  customerId?: string;
  customer?: Customer;
  saleItems: SaleItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SaleItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  saleId: string;
  productId: string;
  product: Product;
}

export interface StockMovement {
  id: string;
  type: "in" | "out" | "adjustment";
  quantity: number;
  reason?: string;
  reference?: string;
  productId: string;
  product: Product;
  createdAt: Date;
}

export interface DashboardStats {
  totalProducts: number;
  lowStockProducts: number;
  totalCustomers: number;
  todaySales: number;
  monthSales: number;
  totalRevenue: number;
}

export interface ProductFormData {
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  cost: number;
  wholesalePrice: number;
  retailPrice: number;
  stock: number;
  minStock: number;
  maxStock?: number;
  unit: string;
  supplierId: string;
  categoryId: string;
}

export interface SaleFormData {
  customerId?: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
  }[];
  paymentMethod: "cash" | "card" | "transfer" | "credit";
  discount?: number;
  notes?: string;
}
