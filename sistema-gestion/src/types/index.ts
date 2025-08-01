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
  postalCode?: string;
  province?: string;
  city?: string;
  country: string;
  cuit?: string;
  customerType: "retail" | "wholesale";
  isActive: boolean;
  shippingBranches?: ShippingBranch[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ShippingBranch {
  id: string;
  name: string;
  address: string;
  province: string;
  city: string;
  postalCode: string;
  branchCode?: string;
  customerId: string;
  customer?: Customer;
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
  shippingCost: number;
  shippingType?: string;
  paymentMethod: "cash" | "card" | "transfer" | "credit";
  status: "pending" | "completed" | "cancelled";
  notes?: string;
  customerId?: string;
  customer?: Customer;
  shippingBranchId?: string;
  shippingBranch?: ShippingBranch;
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

  // Nuevo: Tipo de item y nombre personalizado
  itemType: "simple" | "combo" | "grouped";
  displayName?: string;

  // Para productos simples
  productId?: string;
  product?: Product;

  // Para combos/agrupaciones
  components?: SaleItemComponent[];
}

export interface SaleItemComponent {
  id: string;
  quantity: number;
  saleItemId: string;
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
  totalPurchases: number;
  pendingPurchases: number;
  monthPurchases: number;
  totalPurchaseAmount: number;
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
  items: SaleItemFormData[];
  paymentMethod: "cash" | "card" | "transfer" | "credit";
  discount?: number;
  notes?: string;
}

export interface SaleItemFormData {
  // Para productos simples
  productId?: string;
  quantity: number;
  unitPrice: number;

  // Para combos/agrupaciones
  itemType: "simple" | "combo" | "grouped";
  displayName?: string;
  components?: SaleItemComponentFormData[];
}

export interface SaleItemComponentFormData {
  productId: string;
  quantity: number;
}
